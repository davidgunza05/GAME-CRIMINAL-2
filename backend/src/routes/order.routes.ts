import { Router } from 'express'
import express from 'express'
import * as orderController from '../controllers/order.controller'
import { authenticate, isAdmin } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  createOrderSchema, validateCouponSchema, createCouponSchema,
  manualPaymentSchema, updateOrderStatusSchema, updateShippingSchema,
} from '../models/order.schema'
import { z } from 'zod'

const router = Router()

// ─── Coupons (public validation) ──────────────────────────────────────────────

router.post('/coupons/validate', authenticate,
  validate(validateCouponSchema), orderController.validateCoupon)

// ─── Orders ───────────────────────────────────────────────────────────────────

router.post('/', authenticate, validate(createOrderSchema), orderController.createOrder)
router.get('/my', authenticate, orderController.getMyOrders)
router.get('/my/:id', authenticate, orderController.getMyOrder)

// ─── Stripe ───────────────────────────────────────────────────────────────────

router.post('/payments/stripe/create-intent', authenticate,
  validate(z.object({ orderId: z.string().uuid() })),
  orderController.createStripePaymentIntent)

// Stripe webhook needs raw body
router.post('/payments/stripe/confirm', authenticate,
  validate(z.object({ paymentIntentId: z.string(), paymentId: z.string().uuid() })),
  orderController.confirmStripePayment)

router.post('/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  orderController.stripeWebhook)

// ─── PayPal ───────────────────────────────────────────────────────────────────

router.post('/payments/paypal/create-order', authenticate,
  validate(z.object({ orderId: z.string().uuid() })),
  orderController.createPaypalOrder)

router.post('/payments/paypal/capture', authenticate,
  validate(z.object({ paypalOrderId: z.string(), paymentId: z.string().uuid() })),
  orderController.capturePaypalOrder)

router.post('/payments/paypal/webhook', orderController.paypalWebhook)

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get('/admin/all', authenticate, isAdmin, orderController.adminListOrders)
router.get('/admin/:id', authenticate, isAdmin, orderController.adminGetOrder)
router.patch('/admin/:id/status', authenticate, isAdmin,
  validate(updateOrderStatusSchema), orderController.adminUpdateOrderStatus)
router.patch('/admin/:id/shipping', authenticate, isAdmin,
  validate(updateShippingSchema), orderController.adminUpdateShipping)

router.post('/admin/payments/manual', authenticate, isAdmin,
  validate(manualPaymentSchema), orderController.adminConfirmManualPayment)
router.post('/admin/payments/:paymentId/refund', authenticate, isAdmin,
  validate(z.object({ refundAmount: z.coerce.number().positive() })),
  orderController.adminProcessRefund)

// ─── Admin Coupons ────────────────────────────────────────────────────────────

router.get('/admin/coupons/all', authenticate, isAdmin, orderController.adminListCoupons)
router.post('/admin/coupons', authenticate, isAdmin,
  validate(createCouponSchema), orderController.adminCreateCoupon)
router.patch('/admin/coupons/:id/toggle', authenticate, isAdmin,
  validate(z.object({ isActive: z.boolean() })), orderController.adminToggleCoupon)
router.delete('/admin/coupons/:id', authenticate, isAdmin, orderController.adminDeleteCoupon)

export default router
