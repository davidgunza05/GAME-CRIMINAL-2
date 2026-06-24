'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'

function SuccessContent() {
  const params = useSearchParams()
  const orderId = params.get('order')
  const status = params.get('redirect_status')
  const queryClient = useQueryClient()
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer)

  useEffect(() => {
    if (status !== 'failed') {
      // Re-sincroniza o user (role pode ter sido promovido para organizer)
      hydrateFromServer()
      // Invalida queries de acesso e sessões
      queryClient.invalidateQueries({ queryKey: ['cases', 'my-access'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  }, [status, hydrateFromServer, queryClient])

  if (status === 'failed') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-red-950 border border-red-700 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-red-400">✗</span>
        </div>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">Pagamento Falhado</h1>
        <p className="text-crime-text-muted text-sm mb-8">O teu pagamento não foi processado. Tenta novamente.</p>
        {orderId && (
          <Link href={`/checkout/${orderId}`} className="btn-primary">Tentar Novamente</Link>
        )}
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-950 border border-green-700 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={32} className="text-green-400" />
      </div>
      <p className="text-xs font-mono tracking-[0.3em] uppercase text-green-400 mb-3">Pagamento Confirmado</p>
      <h1 className="text-2xl font-bold text-crime-text-primary mb-2">Obrigado pela compra!</h1>
      <p className="text-crime-text-muted text-sm mb-2">
        O acesso ao(s) teu(s) caso(s) foi ativado.
      </p>
      <p className="text-crime-text-faint text-xs mb-8">
        A tua conta foi promovida a <span className="text-crime-red font-mono">Organizador</span> — podes agora criar e gerir sessões.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/dashboard/my-cases" className="btn-primary">Ir para Os Meus Casos</Link>
        {orderId && (
          <Link href={`/dashboard/orders/${orderId}`} className="btn-secondary">Ver Encomenda</Link>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-crime-black flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Suspense fallback={<Loader2 size={28} className="animate-spin text-crime-red mx-auto block" />}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
