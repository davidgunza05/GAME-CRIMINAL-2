'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Truck, Tag, CreditCard, Loader2, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/store/cart.store'
import { useCreateOrder, useValidateCoupon } from '@/hooks/useShop'
import { FormField } from '@/components/ui/FormField'
import { formatPrice } from '@/lib/shop.utils'

const shippingSchema = z.object({
  recipientName: z.string().min(2, 'Nome obrigatório').max(100),
  phone: z.string().max(30).optional(),
  addressLine1: z.string().min(5, 'Morada obrigatória'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Cidade obrigatória'),
  state: z.string().optional(),
  postalCode: z.string().min(3, 'Código postal obrigatório'),
  country: z.string().length(2).default('PT'),
  notes: z.string().max(500).optional(),
})

type ShippingForm = z.infer<typeof shippingSchema>

const COUNTRIES = [
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brasil' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'França' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const createOrder = useCreateOrder()
  const validateCoupon = useValidateCoupon()

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal' | 'manual'>('stripe')

  const hasPhysical = items.some((i) => i.type === 'physical')
  const shippingCost = hasPhysical ? 4.99 : 0
  const subtotal = total()
  const discount = appliedCoupon?.discountAmount ?? 0
  const orderTotal = Math.max(0, subtotal - discount + shippingCost)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingForm>({
    resolver: hasPhysical ? zodResolver(shippingSchema) : undefined,
    defaultValues: { country: 'PT' },
  })

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-crime-black flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block opacity-30">🛒</span>
          <p className="text-crime-text-muted mb-4">O teu carrinho está vazio</p>
          <Link href="/dashboard/cases" className="btn-primary">Ver Casos</Link>
        </div>
      </div>
    )
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    try {
      const result = await validateCoupon.mutateAsync({ code: couponCode, orderAmount: subtotal })
      setAppliedCoupon({ code: couponCode.toUpperCase(), discountAmount: result.discountAmount })
    } catch {}
  }

  const onSubmit = async (shippingData?: ShippingForm) => {
    const payload: any = {
      items: items.map((i) => ({ caseId: i.caseId, type: i.type, quantity: i.quantity })),
      paymentMethod,
      currency: 'EUR',
      ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      ...(hasPhysical && shippingData && { shippingAddress: shippingData }),
    }
    await createOrder.mutateAsync(payload)
  }

  return (
    <div className="min-h-screen bg-crime-black">
      {/* Header */}
      <div className="border-b border-crime-border bg-crime-surface px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/cases" className="btn-ghost p-2">
          <ArrowLeft size={16} />
        </Link>
        <span className="font-mono text-xs tracking-[0.3em] uppercase text-crime-text-muted">Checkout</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* Left — form */}
        <div className="lg:col-span-3 space-y-6">

          {/* Items summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={14} className="text-crime-red" />
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                Itens ({items.length})
              </p>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.caseId}-${item.type}`} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-crime-black shrink-0 overflow-hidden flex items-center justify-center">
                      {item.coverImageUrl
                        ? <img src={item.coverImageUrl} alt={item.caseTitle} className="w-full h-full object-cover" />
                        : <span className="text-lg opacity-20">🔍</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-crime-text-primary truncate text-xs">{item.caseTitle}</p>
                      <p className="text-[10px] text-crime-text-faint">
                        {item.type === 'digital' ? '💻 Digital' : '📦 Kit Físico'} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-crime-text-primary font-medium shrink-0 ml-3">
                    {formatPrice((item.unitPrice ?? 0) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          {hasPhysical && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <Truck size={14} className="text-crime-red" />
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Morada de Envio</p>
              </div>
              <div className="space-y-4">
                <FormField label="Nome do destinatário" placeholder="Nome completo"
                  error={errors.recipientName?.message} {...register('recipientName')} />
                <FormField label="Telefone (opcional)" placeholder="+351 912 345 678"
                  error={errors.phone?.message} {...register('phone')} />
                <FormField label="Morada" placeholder="Rua, número, andar"
                  error={errors.addressLine1?.message} {...register('addressLine1')} />
                <FormField label="Complemento (opcional)" placeholder="Apartamento, bloco..."
                  error={errors.addressLine2?.message} {...register('addressLine2')} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Cidade" placeholder="Lisboa"
                    error={errors.city?.message} {...register('city')} />
                  <FormField label="Código Postal" placeholder="1000-001"
                    error={errors.postalCode?.message} {...register('postalCode')} />
                </div>
                <div>
                  <label className="label">País</label>
                  <select className="input" {...register('country')}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Notas de entrega (opcional)</label>
                  <textarea className="input resize-none" rows={2}
                    placeholder="Instruções especiais para o estafeta..."
                    {...register('notes')} />
                </div>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard size={14} className="text-crime-red" />
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Método de Pagamento</p>
            </div>
            <div className="space-y-3">
              {[
                { value: 'stripe',  icon: '💳', label: 'Cartão de Crédito / Débito', desc: 'Visa, Mastercard, American Express' },
                { value: 'paypal',  icon: '🅿️', label: 'PayPal', desc: 'Paga com a tua conta PayPal' },
                { value: 'manual',  icon: '🏦', label: 'Transferência Bancária', desc: 'Confirmação manual pelo admin' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                    paymentMethod === method.value
                      ? 'border-crime-red bg-crime-red/5'
                      : 'border-crime-border hover:border-crime-border/80'
                  }`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-crime-text-primary">{method.label}</p>
                    <p className="text-xs text-crime-text-faint mt-0.5">{method.desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    paymentMethod === method.value ? 'border-crime-red' : 'border-crime-border'
                  }`}>
                    {paymentMethod === method.value && (
                      <div className="w-2 h-2 rounded-full bg-crime-red" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — order summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 sticky top-6">
            <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-5">Resumo</p>

            {/* Coupon */}
            <div className="mb-5">
              <label className="label">Cupão de desconto</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-950 border border-green-800 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-green-400" />
                    <span className="text-xs text-green-300 font-mono">{appliedCoupon.code}</span>
                    <span className="text-xs text-green-400">−{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode('') }}
                    className="text-green-500 hover:text-green-300 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1 uppercase text-xs tracking-widest"
                    placeholder="CÓDIGO"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={validateCoupon.isPending || !couponCode}
                    className="btn-secondary px-4 text-xs py-2 shrink-0"
                  >
                    {validateCoupon.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2.5 text-sm border-t border-crime-border pt-4">
              <div className="flex justify-between text-crime-text-muted">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Desconto</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              {hasPhysical && (
                <div className="flex justify-between text-crime-text-muted">
                  <span>Portes</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-crime-text-primary text-base pt-2 border-t border-crime-border">
                <span>Total</span>
                <span className="text-crime-red">{formatPrice(orderTotal)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={hasPhysical ? handleSubmit(onSubmit) : () => onSubmit()}
              disabled={createOrder.isPending}
              className="btn-primary w-full mt-6 py-3"
            >
              {createOrder.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> A processar...</>
              ) : (
                `Confirmar Encomenda · ${formatPrice(orderTotal)}`
              )}
            </button>

            <p className="text-[10px] text-crime-text-faint text-center mt-3 leading-relaxed">
              Ao confirmar, aceitas os nossos Termos de Serviço e Política de Privacidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
