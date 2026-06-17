import { prisma } from '../config/prisma'
import { OrderStatus, PaymentProvider, PaymentStatus } from '@prisma/client'
import { CreateOrderInput } from '../models/order.schema'
import { getCasePrice } from './case.service'
import { validateCoupon } from './coupon.service'

// ─── Order number generator ───────────────────────────────────────────────────

const generateOrderNumber = (): string => {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CG-${ts}-${rand}`
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export const createOrder = async (userId: string, input: CreateOrderInput) => {
  const { items, couponCode, shippingAddress, notes, currency } = input

  // ── 1. Calculate line items
  const resolvedItems = await Promise.all(
    items.map(async (item) => {
      const unitPrice = await getCasePrice(item.caseId, item.type)
      return { ...item, unitPrice, total: unitPrice * item.quantity }
    })
  )

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0)

  // ── 2. Apply coupon
  let discountAmount = 0
  let couponId: string | undefined

  if (couponCode) {
    const { coupon, discountAmount: discount } = await validateCoupon(couponCode, subtotal)
    discountAmount = discount
    couponId = coupon.id
  }

  // ── 3. Shipping cost (flat rate if physical items)
  const hasPhysical = items.some((i) => i.type === 'physical')
  const shippingAmount = hasPhysical ? 4.99 : 0

  const total = Math.max(0, subtotal - discountAmount + shippingAmount)

  // ── 4. Create order in transaction
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        currency,
        subtotal,
        discountAmount,
        shippingAmount,
        total,
        couponId: couponId ?? null,
        notes: notes ?? null,
        items: {
          create: resolvedItems.map((i) => ({
            caseId: i.caseId,
            type: i.type,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.total,
          })),
        },
      },
      include: { items: { include: { case: true } }, shipping: true },
    })

    // Create shipping info if needed
    if (hasPhysical && shippingAddress) {
      await tx.shippingInfo.create({
        data: { orderId: order.id, ...shippingAddress },
      })
    }

    // Increment coupon usage
    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    }

    return order
  })

  return getOrderById(order.id)
}

// ─── Get Orders ───────────────────────────────────────────────────────────────

export const getOrderById = async (id: string) => {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { case: { select: { id: true, title: true, slug: true, coverImageUrl: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      shipping: true,
      coupon: { select: { code: true, discountPercent: true, discountFixed: true } },
    },
  })
}

export const getOrderByNumber = async (orderNumber: string) => {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { case: { select: { id: true, title: true, slug: true, coverImageUrl: true } } } },
      payments: true,
      shipping: true,
    },
  })
}

export const getUserOrders = async (userId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { case: { select: { id: true, title: true, coverImageUrl: true } } } },
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
        shipping: { select: { status: true, trackingNumber: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
  ])
  return { orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListOrders = async (opts: {
  page: number; limit: number; status?: string; userId?: string; search?: string
}) => {
  const { page, limit, status, userId, search } = opts
  const skip = (page - 1) * limit
  const where: any = {}

  if (status) where.status = status
  if (userId) where.userId = userId
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true } },
        items: { include: { case: { select: { title: true } } } },
        payments: { take: 1, orderBy: { createdAt: 'desc' } },
        shipping: { select: { status: true, trackingNumber: true, country: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return { orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

export const updateOrderStatus = async (id: string, status: OrderStatus, notes?: string) => {
  return prisma.order.update({
    where: { id },
    data: { status, ...(notes && { notes }) },
  })
}

export const updateShipping = async (orderId: string, data: any) => {
  return prisma.shippingInfo.update({
    where: { orderId },
    data: {
      ...data,
      ...(data.status === 'shipped' && !data.shippedAt ? { shippedAt: new Date() } : {}),
      ...(data.status === 'delivered' && !data.deliveredAt ? { deliveredAt: new Date() } : {}),
    },
  })
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export const createPaymentRecord = async (
  orderId: string,
  provider: PaymentProvider,
  amount: number,
  currency = 'EUR'
) => {
  return prisma.payment.create({
    data: { orderId, provider, amount, currency },
  })
}

export const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus,
  data?: { externalId?: string; externalStatus?: string; providerResponse?: any; paidAt?: Date }
) => {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status, ...data },
  })

  // Auto-update order status when paid
  if (status === PaymentStatus.paid) {
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.paid },
    })
  }

  return payment
}

export const confirmManualPayment = async (orderId: string, adminUserId: string, amount: number) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error('ORDER_NOT_FOUND')
  if (order.status === OrderStatus.paid) throw new Error('ALREADY_PAID')

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        provider: PaymentProvider.manual,
        status: PaymentStatus.paid,
        amount,
        currency: order.currency,
        paidAt: new Date(),
        providerResponse: { confirmedBy: adminUserId },
      },
    })

    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.paid },
    })

    return payment
  })
}

export const processRefund = async (paymentId: string, refundAmount: number) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  })
  if (!payment) throw new Error('PAYMENT_NOT_FOUND')
  if (payment.status !== PaymentStatus.paid) throw new Error('PAYMENT_NOT_PAID')

  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.refunded,
        refundedAmount: refundAmount,
        refundedAt: new Date(),
      },
    })

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.refunded },
    })
  })
}
