export type CaseDifficulty = 'one' | 'two' | 'three' | 'four' | 'five'
export type CaseType = 'digital' | 'physical' | 'hybrid'
export type OrderItemType = 'digital' | 'physical' | 'event'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded'
export type PaymentProvider = 'stripe' | 'paypal' | 'manual'
export type ShippingStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'returned'

export interface Case {
  id: string
  slug: string
  title: string
  description: string
  shortDescription?: string
  difficulty: CaseDifficulty
  type: CaseType
  minPlayers: number
  maxPlayers: number
  estimatedMinutes: number
  priceDigital?: number | string | null
  pricePhysical?: number | string | null
  coverImageUrl?: string | null
  previewImages: string[]
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  createdAt: string
}

export interface CartItem {
  caseId: string
  type: OrderItemType
  quantity: number
  // denormalized for display
  caseTitle?: string
  coverImageUrl?: string | null
  unitPrice?: number
}

export interface ShippingAddress {
  recipientName: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode: string
  country: string
  notes?: string
}

export interface OrderItem {
  id: string
  caseId: string
  type: OrderItemType
  quantity: number
  unitPrice: string | number
  total: string | number
  case: { id: string; title: string; slug: string; coverImageUrl?: string | null }
}

export interface Payment {
  id: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: string | number
  currency: string
  externalId?: string
  paidAt?: string | null
  refundedAmount?: string | null
  refundedAt?: string | null
  createdAt: string
}

export interface ShippingInfo {
  id: string
  recipientName: string
  addressLine1: string
  addressLine2?: string
  city: string
  postalCode: string
  country: string
  status: ShippingStatus
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  shippedAt?: string
  deliveredAt?: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  currency: string
  subtotal: string | number
  discountAmount: string | number
  shippingAmount: string | number
  total: string | number
  items: OrderItem[]
  payments: Payment[]
  shipping?: ShippingInfo | null
  coupon?: { code: string } | null
  createdAt: string
  updatedAt: string
}
