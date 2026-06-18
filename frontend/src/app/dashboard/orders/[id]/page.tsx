'use client'

import { use } from 'react'
import { ArrowLeft, Loader2, Package, Truck, CreditCard, CheckCircle, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useMyOrder } from '@/hooks/useShop'
import { formatPrice, orderStatusMap, paymentStatusMap, shippingStatusMap, formatDate } from '@/lib/shop.utils'
import { Order } from '@/types/shop'

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-crime-border">
        <Icon size={14} className="text-crime-red" />
        <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params

  const { data: order, isLoading } = useMyOrder(id)

  if (isLoading) return (
    <div className="p-8 flex justify-center py-20">
      <Loader2 size={28} className="text-crime-red animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="p-8 text-center">
      <p className="text-crime-text-muted mb-4">Encomenda não encontrada</p>
      <Link href="/dashboard/orders" className="btn-secondary inline-flex">← Voltar</Link>
    </div>
  )

  const o = order as Order
  const statusInfo = orderStatusMap[o.status]
  const lastPayment = o.payments?.[0]
  const isPending = o.status === 'pending'

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/dashboard/orders" className="btn-ghost text-sm mb-6 inline-flex gap-2">
        <ArrowLeft size={14} /> Voltar às Encomendas
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Encomenda</p>
          <h1 className="text-2xl font-bold text-crime-text-primary font-mono">{o.orderNumber}</h1>
          <p className="text-crime-text-faint text-xs mt-1">{formatDate(o.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={clsx('badge text-xs px-3 py-1.5', statusInfo.color)}>
            {statusInfo.label}
          </span>
          {isPending && lastPayment?.status !== 'paid' && (
            <Link href={`/checkout/${o.id}`} className="btn-primary text-sm py-2 px-4">
              Pagar Agora
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* Items */}
        <Section title="Itens" icon={Package}>
          <div className="space-y-3">
            {o.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-crime-black shrink-0 overflow-hidden flex items-center justify-center">
                  {item.case?.coverImageUrl
                    ? <img src={item.case.coverImageUrl} alt={item.case.title} className="w-full h-full object-cover" />
                    : <span className="text-xl opacity-20">🔍</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-crime-text-primary">{item.case?.title}</p>
                  <p className="text-xs text-crime-text-faint">
                    {item.type === 'digital' ? '💻 Digital' : '📦 Kit Físico'} × {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-crime-text-primary shrink-0">
                  {formatPrice(item.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-crime-border space-y-2 text-sm">
            <div className="flex justify-between text-crime-text-muted">
              <span>Subtotal</span><span>{formatPrice(o.subtotal)}</span>
            </div>
            {Number(o.discountAmount) > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Desconto {o.coupon && <span className="font-mono text-[11px]">({o.coupon.code})</span>}</span>
                <span>−{formatPrice(o.discountAmount)}</span>
              </div>
            )}
            {Number(o.shippingAmount) > 0 && (
              <div className="flex justify-between text-crime-text-muted">
                <span>Portes</span><span>{formatPrice(o.shippingAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-crime-text-primary text-base pt-2 border-t border-crime-border">
              <span>Total</span>
              <span className="text-crime-red">{formatPrice(o.total)}</span>
            </div>
          </div>
        </Section>

        {/* Payment */}
        {lastPayment && (
          <Section title="Pagamento" icon={CreditCard}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-crime-text-primary capitalize">{lastPayment.provider}</p>
                {lastPayment.paidAt && (
                  <p className="text-xs text-crime-text-faint mt-0.5">{formatDate(lastPayment.paidAt)}</p>
                )}
              </div>
              <div className="text-right">
                <span className={clsx('badge text-[10px]', paymentStatusMap[lastPayment.status].color)}>
                  {paymentStatusMap[lastPayment.status].label}
                </span>
                <p className="text-sm font-bold text-crime-text-primary mt-1">{formatPrice(lastPayment.amount)}</p>
              </div>
            </div>
          </Section>
        )}

        {/* Shipping */}
        {o.shipping && (
          <Section title="Envio" icon={Truck}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-crime-text-muted">Estado</span>
                <span className={clsx('badge text-[10px]', shippingStatusMap[o.shipping.status].color)}>
                  {shippingStatusMap[o.shipping.status].label}
                </span>
              </div>

              {o.shipping.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-crime-text-muted">Rastreio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-crime-text-primary">{o.shipping.trackingNumber}</span>
                    {o.shipping.trackingUrl && (
                      <a href={o.shipping.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-crime-red hover:text-red-400 transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {o.shipping.estimatedDelivery && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-crime-text-muted flex items-center gap-1.5">
                    <Clock size={12} /> Entrega estimada
                  </span>
                  <span className="text-sm text-crime-text-primary">{formatDate(o.shipping.estimatedDelivery)}</span>
                </div>
              )}

              {o.shipping.deliveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-400 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Entregue em
                  </span>
                  <span className="text-sm text-green-300">{formatDate(o.shipping.deliveredAt)}</span>
                </div>
              )}

              {/* Address */}
              <div className="mt-3 pt-3 border-t border-crime-border text-xs text-crime-text-faint space-y-0.5">
                <p className="text-crime-text-secondary font-medium">{o.shipping.recipientName}</p>
                <p>{o.shipping.addressLine1}</p>
                {o.shipping.addressLine2 && <p>{o.shipping.addressLine2}</p>}
                <p>{o.shipping.postalCode} {o.shipping.city}</p>
                <p>{o.shipping.country}</p>
              </div>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
