'use client'

import { use, useState, useEffect, useRef } from 'react'
import {
  CheckCircle, Loader2, AlertCircle, Lock,
  ArrowLeft, Package, ShoppingBag, CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useQueryClient } from '@tanstack/react-query'
import { useMyOrder, useStripePaymentIntent, useConfirmStripePayment } from '@/hooks/useShop'
import { useAuthStore } from '@/store/auth.store'
import { formatPrice } from '@/lib/shop.utils'

// ─── Stripe singleton fora do componente ─────────────────────────────────────

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// ─── Payment Form (dentro de <Elements>) ─────────────────────────────────────

interface PaymentFormProps {
  orderId: string
  paymentId: string
  amount: string
  onSuccess: () => void
}

function StripePaymentForm({ orderId, paymentId, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const confirm = useConfirmStripePayment()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    // 1. Validar campos do Stripe Elements
    const { error: submitErr } = await elements.submit()
    if (submitErr) {
      setError(submitErr.message ?? 'Dados de pagamento inválidos')
      setLoading(false)
      return
    }

    // 2. Confirmar pagamento no Stripe
    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // não redirecionar — tratar resultado aqui
    })

    if (confirmErr) {
      // Erros do utilizador (cartão recusado, fundos insuficientes, etc.)
      setError(confirmErr.message ?? 'Pagamento recusado')
      setLoading(false)
      return
    }

    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      setError('O pagamento não foi concluído. Tenta novamente.')
      setLoading(false)
      return
    }

    // 3. Confirmar no backend (verifica estado real no Stripe + concede acesso)
    confirm.mutate(
      { paymentIntentId: paymentIntent.id, paymentId },
      {
        onSuccess: () => {
          setLoading(false)
          onSuccess()
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || 'Erro ao confirmar pagamento. Contacta o suporte.'
          setError(msg)
          setLoading(false)
        },
      }
    )
  }

  return (
    <form onSubmit={handlePay} className="space-y-5">
      {/* Stripe Payment Element — suporta cartão, SEPA, etc. */}
      <div className="rounded-lg border border-crime-border bg-crime-black/40 p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'never', googlePay: 'never' }, // focar em cartão no sandbox
          }}
        />
      </div>

      {/* Cartão de teste em sandbox */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="rounded-lg border border-yellow-900/50 bg-yellow-950/20 px-4 py-3 text-xs text-yellow-600 space-y-1">
          <p className="font-mono font-semibold text-yellow-500">Modo Sandbox — Cartão de Teste</p>
          <p>Número: <span className="font-mono">4242 4242 4242 4242</span></p>
          <p>Validade: qualquer data futura &nbsp;·&nbsp; CVC: qualquer 3 dígitos</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-sm text-red-300">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="btn-primary w-full py-4 text-base justify-center gap-2 disabled:opacity-60"
      >
        {loading
          ? <><Loader2 size={18} className="animate-spin" /> A processar...</>
          : <><Lock size={16} /> Pagar {amount}</>
        }
      </button>

      <p className="text-center text-xs text-crime-text-faint flex items-center justify-center gap-1.5">
        <Lock size={10} /> Pagamento seguro via Stripe · Dados encriptados SSL
      </p>
    </form>
  )
}

// ─── Estado de Sucesso ────────────────────────────────────────────────────────

function SuccessState({ order }: { order: any }) {
  return (
    <div className="text-center space-y-6">
      {/* Ícone animado */}
      <div className="relative mx-auto w-20 h-20">
        <div className="w-20 h-20 rounded-full bg-green-950 border-2 border-green-700 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
          <CheckCircle size={40} className="text-green-400" />
        </div>
      </div>

      <div>
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-green-400 mb-2">
          Pagamento Confirmado
        </p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-1">
          Obrigado pela compra!
        </h1>
        <p className="text-crime-text-faint text-sm font-mono">{order.orderNumber}</p>
      </div>

      {/* Casos desbloqueados */}
      <div className="card p-5 text-left">
        <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3 flex items-center gap-2">
          <CheckCircle size={11} className="text-green-400" /> Casos Desbloqueados
        </p>
        <div className="space-y-2">
          {order.items.map((item: any) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                {item.case.coverImageUrl
                  ? <img src={item.case.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xs opacity-30">🔍</span>
                }
              </div>
              <span className="text-sm text-crime-text-primary font-medium">{item.case.title}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-crime-text-faint">
        A tua conta foi promovida a{' '}
        <span className="text-crime-red font-mono font-semibold">Organizador</span>
        {' '}— podes agora criar e gerir sessões.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/my-cases" className="btn-primary flex-1 justify-center gap-2">
          <ShoppingBag size={15} /> Ver Os Meus Casos
        </Link>
        <Link href="/dashboard/sessions/new" className="btn-secondary flex-1 justify-center gap-2">
          <Package size={15} /> Criar Sessão
        </Link>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  const { orderId } = params
  const { data: order, isLoading, refetch } = useMyOrder(orderId)
  const createIntent = useStripePaymentIntent()
  const hydrateAuth = useAuthStore((s) => s.hydrateFromServer)
  const queryClient = useQueryClient()

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const intentCreated = useRef(false)

  const alreadyPaid = ['paid', 'delivered'].includes(order?.status ?? '')

  // Criar Payment Intent uma vez quando a ordem carrega
  useEffect(() => {
    if (!order || alreadyPaid || intentCreated.current) return
    intentCreated.current = true

    createIntent.mutate(orderId, {
      onSuccess: (data) => {
        setClientSecret(data.clientSecret)
        setPaymentId(data.paymentId)
      },
      onError: (err: any) => {
        setIntentError(err.response?.data?.message || 'Erro ao preparar pagamento. Recarrega a página.')
        intentCreated.current = false // permitir retry
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const handleSuccess = async () => {
    // Sincronizar tudo em paralelo
    await Promise.all([
      refetch(),
      hydrateAuth(),
    ])
    queryClient.invalidateQueries({ queryKey: ['cases', 'my-access'] })
    setPaid(true)
  }

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  // ── Não encontrado ──
  if (!order) return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center text-center px-4">
      <div>
        <p className="text-crime-text-muted mb-4">Encomenda não encontrada.</p>
        <Link href="/dashboard/orders" className="btn-primary">Ver Encomendas</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-crime-black py-12 px-4">
      <div className="max-w-md mx-auto">

        {/* Back */}
        {!paid && !alreadyPaid && (
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm text-crime-text-faint hover:text-crime-text-primary mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Encomendas
          </Link>
        )}

        {/* ── Sucesso (já pago antes ou acabou de pagar) ── */}
        {(paid || alreadyPaid) ? (
          <SuccessState order={order} />
        ) : (
          <>
            {/* Cabeçalho */}
            <div className="text-center mb-8">
              <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
                Pagamento Seguro
              </p>
              <h1 className="text-3xl font-bold text-crime-text-primary mb-1">
                {formatPrice(order.total)}
              </h1>
              <p className="text-crime-text-faint text-sm font-mono">{order.orderNumber}</p>
            </div>

            {/* Resumo da encomenda */}
            <div className="card p-5 mb-6">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">
                Resumo
              </p>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-crime-black border border-crime-border flex items-center justify-center shrink-0 overflow-hidden">
                        {item.case.coverImageUrl
                          ? <img src={item.case.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[10px]">🔍</span>
                        }
                      </div>
                      <span className="text-crime-text-muted truncate">
                        {item.case.title}
                        {item.quantity > 1 && <span className="text-crime-text-faint"> ×{item.quantity}</span>}
                      </span>
                    </div>
                    <span className="text-crime-text-primary shrink-0">{formatPrice(item.total)}</span>
                  </div>
                ))}

                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-green-400 pt-2 border-t border-crime-border">
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
                  <span className="text-crime-red text-lg">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Stripe Elements */}
            {intentError ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <p>{intentError}</p>
                </div>
                <button
                  onClick={() => {
                    intentCreated.current = false
                    setIntentError(null)
                    // Trigger effect again
                    createIntent.mutate(orderId, {
                      onSuccess: (data) => {
                        setClientSecret(data.clientSecret)
                        setPaymentId(data.paymentId)
                      },
                      onError: (err: any) => {
                        setIntentError(err.response?.data?.message || 'Erro ao preparar pagamento.')
                      },
                    })
                  }}
                  className="btn-secondary w-full"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : !stripePromise ? (
              <div className="flex items-center gap-3 bg-yellow-950/30 border border-yellow-900/50 rounded-lg px-4 py-3 text-sm text-yellow-600">
                <AlertCircle size={15} className="shrink-0" />
                Stripe não configurado. Define <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
              </div>
            ) : clientSecret && paymentId ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#dc2626',
                      colorBackground: '#0d0d12',
                      colorText: '#e8e8e8',
                      colorDanger: '#ef4444',
                      borderRadius: '8px',
                      fontFamily: 'Georgia, serif',
                    },
                    rules: {
                      '.Input': {
                        border: '1px solid #2a2a30',
                        backgroundColor: '#0a0a0f',
                      },
                      '.Input:focus': {
                        border: '1px solid #dc2626',
                        boxShadow: '0 0 0 1px #dc2626',
                      },
                      '.Tab': { border: '1px solid #2a2a30', backgroundColor: '#111116' },
                      '.Tab--selected': { border: '1px solid #dc2626', backgroundColor: '#1a0505' },
                    },
                  },
                }}
              >
                <StripePaymentForm
                  orderId={orderId}
                  paymentId={paymentId}
                  amount={formatPrice(order.total)}
                  onSuccess={handleSuccess}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-10 gap-3 text-crime-text-faint">
                <Loader2 size={20} className="animate-spin text-crime-red" />
                <span className="text-sm">A preparar pagamento...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
