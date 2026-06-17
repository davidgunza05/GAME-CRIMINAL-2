import { env } from '../config/env'
import { updatePaymentStatus } from './order.service'
import { PaymentStatus } from '@prisma/client'

// ─── PayPal OAuth ─────────────────────────────────────────────────────────────

const PAYPAL_BASE = env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

const getAccessToken = async (): Promise<string> => {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PAYPAL_NOT_CONFIGURED')
  }

  const credentials = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error('PAYPAL_AUTH_FAILED')
  const data = await res.json()
  return data.access_token
}

// ─── Create PayPal Order ──────────────────────────────────────────────────────

export const createPaypalOrder = async (
  orderId: string,
  paymentId: string,
  amount: number,
  currency: string
) => {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          custom_id: paymentId,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
        },
      ],
      application_context: {
        return_url: `${env.FRONTEND_URL}/checkout/paypal/success`,
        cancel_url: `${env.FRONTEND_URL}/checkout/paypal/cancel`,
        brand_name: 'Crime Game',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
      },
    }),
  })

  if (!res.ok) throw new Error('PAYPAL_ORDER_CREATION_FAILED')
  const data = await res.json()

  await updatePaymentStatus(paymentId, PaymentStatus.processing, {
    externalId: data.id,
    externalStatus: data.status,
  })

  const approvalLink = data.links.find((l: any) => l.rel === 'approve')?.href
  return { paypalOrderId: data.id, approvalUrl: approvalLink }
}

// ─── Capture PayPal Order ─────────────────────────────────────────────────────

export const capturePaypalOrder = async (paypalOrderId: string, paymentId: string) => {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error('PAYPAL_CAPTURE_FAILED')
  const data = await res.json()

  if (data.status === 'COMPLETED') {
    await updatePaymentStatus(paymentId, PaymentStatus.paid, {
      externalId: paypalOrderId,
      externalStatus: data.status,
      paidAt: new Date(),
      providerResponse: data,
    })
  }

  return data
}

// ─── Handle PayPal Webhook ────────────────────────────────────────────────────

export const handlePaypalWebhook = async (event: any) => {
  const paymentId = event.resource?.custom_id

  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      if (paymentId) {
        await updatePaymentStatus(paymentId, PaymentStatus.paid, {
          externalId: event.resource.id,
          externalStatus: event.resource.status,
          paidAt: new Date(),
          providerResponse: event.resource,
        })
      }
      break

    case 'PAYMENT.CAPTURE.DENIED':
      if (paymentId) {
        await updatePaymentStatus(paymentId, PaymentStatus.failed, {
          externalId: event.resource.id,
          externalStatus: event.resource.status,
        })
      }
      break
  }

  return { received: true }
}
