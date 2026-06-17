import { prisma } from '../config/prisma'
import { z } from 'zod'
import { createCouponSchema } from '../models/order.schema'

type CreateCouponInput = z.infer<typeof createCouponSchema>

export const validateCoupon = async (code: string, orderAmount: number) => {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })

  if (!coupon) throw new Error('COUPON_NOT_FOUND')
  if (!coupon.isActive) throw new Error('COUPON_INACTIVE')
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('COUPON_EXPIRED')
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('COUPON_EXHAUSTED')
  if (coupon.minOrderAmount && orderAmount < Number(coupon.minOrderAmount)) {
    throw new Error('COUPON_MIN_ORDER')
  }

  let discountAmount = 0
  if (coupon.discountPercent) {
    discountAmount = (orderAmount * Number(coupon.discountPercent)) / 100
  } else if (coupon.discountFixed) {
    discountAmount = Math.min(Number(coupon.discountFixed), orderAmount)
  }

  return { coupon, discountAmount: Math.round(discountAmount * 100) / 100 }
}

export const createCoupon = async (input: CreateCouponInput) => {
  const existing = await prisma.coupon.findUnique({ where: { code: input.code } })
  if (existing) throw new Error('CODE_TAKEN')
  return prisma.coupon.create({ data: input })
}

export const listCoupons = async () => {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
}

export const toggleCoupon = async (id: string, isActive: boolean) => {
  return prisma.coupon.update({ where: { id }, data: { isActive } })
}

export const deleteCoupon = async (id: string) => {
  return prisma.coupon.delete({ where: { id } })
}
