'use client'

import { use, useEffect, useState } from 'react'
import { CheckCircle, Loader2, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useMyOrder, useStripePaymentIntent, usePaypalOrder } from '@/hooks/useShop'
import { formatPrice, orderStatusMap, paymentStatusMap } from '@/lib/shop.utils'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export default function OrderPaymentPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params
  const { data: order, isLoading, refetch } = useMyOrder(orderId)
  const createStripeIntent = useStripePaymentIntent()
  const createPaypalOrder = usePaypalOrder()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = order?.status === 'paid' || order?.status === 'delivered' || order?.status === 'processing'

  const handleStripePayment = async () => {
    setPaying(true)
    setError(null)
    try {
      const { clientSecret } = await createStripeIntent.mutateAsync(orderId)
      const stripe = await stripePromise
      if (!stripe || !clientSecret) throw new Error('Stripe não disponível')

      const { error: stripeError } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${orderId}` },
      })
      if (stripeError) setError(stripeError.message ?? 'Erro no pagamento')
    } catch (e: any) {
      setError(e.message ?? 'Erro ao processar pagamento')
    } finally {
      setPaying(false)
    }
  }

  const handlePaypal = async () => {
    setPaying(true)
    try {
      await createPaypalOrder.mutateAsync(orderId)
      // Redirects to PayPal
    } catch {
      setPaying(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center text-center">
      <div>
        <p className="text-crime-text-muted mb-4">Encomenda não encontrada</p>
        <Link href="/dashboard/orders" className="btn-primary">Ver Encomendas</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-crime-black py-12 px-4">
      <div className="max-w-lg mx-auto">

        {isPaid ? (
          /* ─── Paid state ─── */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-950 border border-green-700 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <p className="text-xs font-mono tracking-[0.3em] uppercase text-green-400 mb-3">Pagamento Confirmado</p>
            <h1 className="text-2xl font-bold text-crime-text-primary mb-2">Encomenda Concluída!</h1>
            <p className="text-crime-text-muted text-sm mb-2">
              Encomenda <span className="font-mono text-crime-text-primary">{order.orderNumber}</span>
            </p>
            <p className="text-crime-text-muted text-sm mb-8">
              Receberás um email de confirmação em breve.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard/orders" className="btn-primary">Ver Encomendas</Link>
              <Link href="/dashboard/cases" className="btn-secondary">Continuar a Comprar</Link>
            </div>
          </div>
        ) : (
          /* ─── Payment form ─── */
          <>
            <div className="text-center mb-8">
              <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">Pagamento</p>
              <h1 className="text-2xl font-bold text-crime-text-primary mb-1">
                {formatPrice(order.total)}
              </h1>
              <p className="text-crime-text-faint text-sm font-mono">{order.orderNumber}</p>
            </div>

            {/* Order items summary */}
            <div className="card p-5 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">Resumo</p>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-crime-text-muted truncate mr-4">
                      {item.case.title} × {item.quantity}
                    </span>
                    <span className="text-crime-text-primary shrink-0">{formatPrice(item.total)}</span>
                  </div>
                ))}
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-400 pt-1 border-t border-crime-border">
                    <span>Desconto</span>
                    <span>−{formatPrice(order.discountAmount)}</span>
                  </div>
                )}
                {Number(order.shippingAmount) > 0 && (
                  <div className="flex justify-between text-sm text-crime-text-muted">
                    <span>Portes</span>
                    <span>{formatPrice(order.shippingAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-crime-text-primary pt-2 border-t border-crime-border">
                  <span>Total</span>
                  <span className="text-crime-red">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-4 py-3 mb-4 text-sm text-red-300">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Payment buttons */}
            <div className="space-y-3">
              {stripePromise && (
                <button
                  onClick={handleStripePayment}
                  disabled={paying}
                  className="btn-primary w-full py-4 text-base gap-3"
                >
                  {paying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  Pagar com Cartão
                </button>
              )}

              <button
                onClick={handlePaypal}
                disabled={paying}
                className="w-full py-4 rounded-lg bg-[#0070BA] hover:bg-[#005ea6] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {paying ? <Loader2 size={16} className="animate-spin" /> : <span className="text-lg">🅿️</span>}
                Pagar com PayPal
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-crime-border" />
                </div>
                <div className="relative text-center">
                  <span className="bg-crime-black px-3 text-xs text-crime-text-faint">ou</span>
                </div>
              </div>

              <div className="card p-4 text-sm text-crime-text-muted text-center">
                <p className="mb-1 font-medium text-crime-text-secondary">Transferência Bancária</p>
                <p className="text-xs">A tua encomenda foi criada. Aguarda a confirmação manual pelo admin após pagamento.</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/dashboard/orders" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">
                Ver todas as encomendas
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
