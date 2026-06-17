import { Request, Response } from 'express'
import * as orderService from '../services/order.service'
import * as couponService from '../services/coupon.service'
import * as stripeService from '../services/stripe.service'
import * as paypalService from '../services/paypal.service'
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../utils/response'
import { AuthenticatedRequest } from '../types'
import { prisma } from '../config/prisma'

// ─── Coupon ───────────────────────────────────────────────────────────────────

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body
    const result = await couponService.validateCoupon(code, orderAmount)
    sendSuccess(res, {
      coupon: { code: result.coupon.code, description: result.coupon.description },
      discountAmount: result.discountAmount,
    }, 'Cupão válido!')
  } catch (err: any) {
    const messages: Record<string, string> = {
      COUPON_NOT_FOUND: 'Cupão não encontrado',
      COUPON_INACTIVE: 'Cupão inativo',
      COUPON_EXPIRED: 'Cupão expirado',
      COUPON_EXHAUSTED: 'Cupão sem utilizações disponíveis',
      COUPON_MIN_ORDER: 'Valor mínimo de encomenda não atingido',
    }
    sendError(res, messages[err.message] ?? 'Cupão inválido', 400)
  }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const order = await orderService.createOrder(userId, req.body)
    sendCreated(res, { order }, 'Encomenda criada com sucesso')
  } catch (err: any) {
    const messages: Record<string, string> = {
      CASE_NOT_FOUND: 'Caso não encontrado ou indisponível',
      PRICE_NOT_AVAILABLE: 'Preço não disponível para o tipo selecionado',
      COUPON_NOT_FOUND: 'Cupão inválido',
      COUPON_EXPIRED: 'Cupão expirado',
    }
    sendError(res, messages[err.message] ?? 'Erro ao criar encomenda', 400)
  }
}

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const { page = 1, limit = 10 } = req.query as any
  const result = await orderService.getUserOrders(userId, Number(page), Number(limit))
  sendSuccess(res, result)
}

export const getMyOrder = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthenticatedRequest).user.id
  const order = await orderService.getOrderById(req.params.id)
  if (!order || order.userId !== userId) { sendNotFound(res, 'Encomenda não encontrada'); return }
  sendSuccess(res, { order })
}

// ─── Stripe ───────────────────────────────────────────────────────────────────

export const createStripePaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const { orderId } = req.body

    const order = await orderService.getOrderById(orderId)
    if (!order || order.userId !== userId) { sendNotFound(res, 'Encomenda não encontrada'); return }

    const payment = await orderService.createPaymentRecord(orderId, 'stripe', Number(order.total), order.currency)
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })

    const result = await stripeService.createStripePaymentIntent(
      orderId, payment.id, Number(order.total), order.currency, user?.email
    )

    sendSuccess(res, { ...result, paymentId: payment.id })
  } catch (err: any) {
    if (err.message === 'STRIPE_NOT_CONFIGURED') sendError(res, 'Stripe não configurado', 503)
    else throw err
  }
}

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string
    await stripeService.handleStripeWebhook(req.body as Buffer, sig)
    res.json({ received: true })
  } catch (err: any) {
    sendError(res, err.message, 400)
  }
}

// ─── PayPal ───────────────────────────────────────────────────────────────────

export const createPaypalOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthenticatedRequest).user.id
    const { orderId } = req.body

    const order = await orderService.getOrderById(orderId)
    if (!order || order.userId !== userId) { sendNotFound(res, 'Encomenda não encontrada'); return }

    const payment = await orderService.createPaymentRecord(orderId, 'paypal', Number(order.total), order.currency)
    const result = await paypalService.createPaypalOrder(orderId, payment.id, Number(order.total), order.currency)

    sendSuccess(res, { ...result, paymentId: payment.id })
  } catch (err: any) {
    if (err.message === 'PAYPAL_NOT_CONFIGURED') sendError(res, 'PayPal não configurado', 503)
    else throw err
  }
}

export const capturePaypalOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paypalOrderId, paymentId } = req.body
    const result = await paypalService.capturePaypalOrder(paypalOrderId, paymentId)
    sendSuccess(res, result, 'Pagamento concluído com sucesso!')
  } catch (err: any) {
    sendError(res, 'Erro ao capturar pagamento PayPal', 400)
  }
}

export const paypalWebhook = async (req: Request, res: Response): Promise<void> => {
  await paypalService.handlePaypalWebhook(req.body)
  res.json({ received: true })
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListOrders = async (req: Request, res: Response): Promise<void> => {
  const result = await orderService.adminListOrders(req.query as any)
  sendSuccess(res, result)
}

export const adminGetOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(req.params.id)
  if (!order) { sendNotFound(res, 'Encomenda não encontrada'); return }
  sendSuccess(res, { order })
}

export const adminUpdateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { status, notes } = req.body
  const order = await orderService.updateOrderStatus(req.params.id, status, notes)
  sendSuccess(res, { order }, 'Estado atualizado')
}

export const adminUpdateShipping = async (req: Request, res: Response): Promise<void> => {
  const info = await orderService.updateShipping(req.params.id, req.body)
  sendSuccess(res, { shipping: info }, 'Envio atualizado')
}

export const adminConfirmManualPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as AuthenticatedRequest).user.id
    const { orderId, amount } = req.body
    const payment = await orderService.confirmManualPayment(orderId, adminId, amount)
    sendSuccess(res, { payment }, 'Pagamento manual confirmado')
  } catch (err: any) {
    if (err.message === 'ORDER_NOT_FOUND') sendNotFound(res, 'Encomenda não encontrada')
    else if (err.message === 'ALREADY_PAID') sendError(res, 'Encomenda já paga', 400)
    else throw err
  }
}

export const adminProcessRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    await orderService.processRefund(req.params.paymentId, req.body.refundAmount)
    sendSuccess(res, null, 'Reembolso processado')
  } catch (err: any) {
    const messages: Record<string, string> = {
      PAYMENT_NOT_FOUND: 'Pagamento não encontrado',
      PAYMENT_NOT_PAID: 'Pagamento não está no estado pago',
    }
    sendError(res, messages[err.message] ?? 'Erro ao processar reembolso', 400)
  }
}

// ─── Coupon admin ─────────────────────────────────────────────────────────────

export const adminListCoupons = async (_req: Request, res: Response): Promise<void> => {
  const coupons = await couponService.listCoupons()
  sendSuccess(res, { coupons })
}

export const adminCreateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const coupon = await couponService.createCoupon(req.body)
    sendCreated(res, { coupon }, 'Cupão criado')
  } catch (err: any) {
    if (err.message === 'CODE_TAKEN') sendError(res, 'Este código já existe', 409)
    else throw err
  }
}

export const adminToggleCoupon = async (req: Request, res: Response): Promise<void> => {
  const coupon = await couponService.toggleCoupon(req.params.id, req.body.isActive)
  sendSuccess(res, { coupon })
}

export const adminDeleteCoupon = async (req: Request, res: Response): Promise<void> => {
  await couponService.deleteCoupon(req.params.id)
  sendSuccess(res, null, 'Cupão eliminado')
}
