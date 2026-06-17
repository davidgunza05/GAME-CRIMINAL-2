import Stripe from 'stripe'
import { env } from '../config/env'
import { updatePaymentStatus } from './order.service'
import { PaymentStatus } from '@prisma/client'

let stripe: Stripe | null = null

const getStripe = (): Stripe => {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_NOT_CONFIGURED')
    stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
  }
  return stripe
}

// ─── Create Payment Intent ────────────────────────────────────────────────────

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
    receipt_email: customerEmail,
    metadata: { orderId, paymentId },
    automatic_payment_methods: { enabled: true },
  })

  await updatePaymentStatus(paymentId, PaymentStatus.processing, {
    externalId: intent.id,
    externalStatus: intent.status,
  })

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id }
}

// ─── Handle Stripe Webhook ────────────────────────────────────────────────────

export const handleStripeWebhook = async (body: Buffer, signature: string) => {
  const s = getStripe()

  let event: Stripe.Event
  try {
    event = s.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    throw new Error('WEBHOOK_SIGNATURE_INVALID')
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent
      const { paymentId } = intent.metadata

      if (paymentId) {
        await updatePaymentStatus(paymentId, PaymentStatus.paid, {
          externalId: intent.id,
          externalStatus: intent.status,
          paidAt: new Date(),
          providerResponse: { intent_id: intent.id, amount: intent.amount },
        })
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
