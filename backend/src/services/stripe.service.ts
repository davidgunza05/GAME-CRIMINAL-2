import Stripe from 'stripe'
import { env } from '../config/env'
import { updatePaymentStatus, promoteToOrganizer } from './order.service'
import { grantAccessFromOrder } from './case-access.service'
import { PaymentStatus } from '@prisma/client'
import { prisma } from '../config/prisma'

let _stripe: Stripe | null = null

const getStripe = (): Stripe => {
  if (!_stripe) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_NOT_CONFIGURED')
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  }
  return _stripe
}

// ─── Criar Payment Intent ─────────────────────────────────────────────────────

export const createStripePaymentIntent = async (
  orderId: string,
  paymentId: string,
  amount: number,
  currency: string,
  customerEmail?: string
) => {
  const s = getStripe()
  const amountInCents = Math.round(amount * 100)

  const intent = await s.paymentIntents.create({
    amount: amountInCents,
    currency: currency.toLowerCase(),
    receipt_email: customerEmail ?? undefined,
    metadata: { orderId, paymentId },
    automatic_payment_methods: { enabled: true },
  })

  await updatePaymentStatus(paymentId, PaymentStatus.processing, {
    externalId: intent.id,
    externalStatus: intent.status,
  })

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
}

// ─── Recuperar PaymentIntent existente ───────────────────────────────────────

export const retrievePaymentIntent = async (paymentIntentId: string) => {
  try {
    const s = getStripe()
    return await s.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return null
  }
}

// ─── Confirmar pagamento via PaymentIntent (sandbox + produção sem webhook) ───
// Chamado pelo frontend após stripe.confirmPayment() ter sucesso.
// Verifica o estado real no Stripe antes de conceder acesso — seguro e sem webhook.

export const confirmStripePayment = async (
  paymentIntentId: string,
  paymentId: string
) => {
  const s = getStripe()

  // Buscar estado real do PaymentIntent diretamente ao Stripe
  const intent = await s.paymentIntents.retrieve(paymentIntentId)

  if (intent.status !== 'succeeded') {
    throw new Error(`PAYMENT_NOT_SUCCEEDED:${intent.status}`)
  }

  const { orderId } = intent.metadata

  // Atualizar payment record
  await updatePaymentStatus(paymentId, PaymentStatus.paid, {
    externalId: intent.id,
    externalStatus: intent.status,
    paidAt: new Date(),
    providerResponse: { intent_id: intent.id, amount: intent.amount },
  })

  // Conceder acesso + promover utilizador
  if (orderId) {
    await grantAccessFromOrder(orderId)
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    })
    if (order) await promoteToOrganizer(order.userId)
  }

  return { orderId, intentId: intent.id }
}

// ─── Webhook (produção com STRIPE_WEBHOOK_SECRET configurado) ─────────────────

export const handleStripeWebhook = async (body: Buffer, signature: string) => {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    // Sem webhook secret configurado — ignorar silenciosamente (sandbox)
    return { received: true }
  }

  const s = getStripe()
  let event: Stripe.Event

  try {
    event = s.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    throw new Error('WEBHOOK_SIGNATURE_INVALID')
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const { paymentId, orderId } = intent.metadata

      if (!paymentId) break

      // Verificar se já foi processado (pode ter sido via confirmStripePayment)
      const existing = await prisma.payment.findUnique({ where: { id: paymentId } })
      if (existing?.status === PaymentStatus.paid) break

      await updatePaymentStatus(paymentId, PaymentStatus.paid, {
        externalId: intent.id,
        externalStatus: intent.status,
        paidAt: new Date(),
        providerResponse: { intent_id: intent.id, amount: intent.amount },
      })

      if (orderId) {
        await grantAccessFromOrder(orderId)
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { userId: true },
        })
        if (order) await promoteToOrganizer(order.userId)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object as Stripe.PaymentIntent
      const { paymentId } = intent.metadata
      if (paymentId) {
        await updatePaymentStatus(paymentId, PaymentStatus.failed, {
          externalId: intent.id,
          externalStatus: intent.status,
        })
      }
      break
    }
  }

  return { received: true }
}
