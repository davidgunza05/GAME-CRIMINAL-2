import { z } from 'zod'
import { PaymentProvider, OrderItemType } from '@prisma/client'

// ─── Shipping Address ─────────────────────────────────────────────────────────

export const shippingAddressSchema = z.object({
  recipientName: z.string().min(2).max(100).trim(),
  phone: z.string().max(30).trim().optional(),
  addressLine1: z.string().min(5).max(200).trim(),
  addressLine2: z.string().max(200).trim().optional(),
  city: z.string().min(2).max(100).trim(),
  state: z.string().max(100).trim().optional(),
  postalCode: z.string().min(3).max(20).trim(),
  country: z.string().length(2).toUpperCase().default('PT'),
  notes: z.string().max(500).optional(),
})

// ─── Cart Item ────────────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  caseId: z.string().uuid(),
  type: z.nativeEnum(OrderItemType),
  quantity: z.coerce.number().int().min(1).max(10).default(1),
})

// ─── Create Order ─────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Adiciona pelo menos um item'),
  couponCode: z.string().trim().optional(),
  shippingAddress: shippingAddressSchema.optional(),
  notes: z.string().max(500).optional(),
  currency: z.string().length(3).toUpperCase().default('EUR'),
}).refine(
  (data) => {
    const hasPhysical = data.items.some((i) => i.type === 'physical')
    if (hasPhysical && !data.shippingAddress) return false
    return true
  },
  { message: 'Morada de envio obrigatória para itens físicos', path: ['shippingAddress'] }
)

// ─── Payment ──────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.nativeEnum(PaymentProvider),
})

export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({ object: z.any() }),
})

export const paypalWebhookSchema = z.object({
  event_type: z.string(),
  resource: z.any(),
})

// ─── Coupon ───────────────────────────────────────────────────────────────────

export const validateCouponSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
  orderAmount: z.coerce.number().min(0),
})

export const createCouponSchema = z.object({
  code: z.string().min(2).max(30).trim().toUpperCase(),
  description: z.string().max(200).optional(),
  discountPercent: z.coerce.number().min(1).max(100).optional(),
  discountFixed: z.coerce.number().min(0.01).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (d) => d.discountPercent !== undefined || d.discountFixed !== undefined,
  { message: 'Define discountPercent ou discountFixed' }
)

// ─── Admin ────────────────────────────────────────────────────────────────────

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  notes: z.string().optional(),
})

export const updateShippingSchema = z.object({
  status: z.enum(['pending', 'preparing', 'shipped', 'delivered', 'returned']).optional(),
  carrier: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().optional().transform(v => v || undefined).pipe(z.string().url().optional()),
  estimatedDelivery: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
})

export const manualPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.coerce.number().min(0.01),
  notes: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>
