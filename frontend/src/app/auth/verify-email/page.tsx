'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, XCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useVerifyEmail } from '@/hooks/useAuth'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const verify = useVerifyEmail()

  useEffect(() => {
    if (token && !verify.isPending && !verify.isSuccess && !verify.isError) {
      verify.mutate(token)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (!token) return (
    <div className="text-center card-elevated p-10">
      <XCircle size={40} className="text-red-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-crime-text-primary mb-2">Link inválido</h1>
      <p className="text-sm text-crime-text-muted mb-6">O link de verificação não é válido ou está incompleto.</p>
      <Link href="/auth/verify-email-sent" className="btn-secondary mr-3">Pedir novo link</Link>
      <Link href="/auth/login" className="btn-ghost">Login</Link>
    </div>
  )

  if (verify.isPending) return (
    <div className="text-center card-elevated p-10">
      <Loader2 size={40} className="text-crime-red mx-auto mb-4 animate-spin" />
      <h1 className="text-xl font-bold text-crime-text-primary mb-2">A verificar...</h1>
      <p className="text-sm text-crime-text-muted">Aguarda um momento.</p>
    </div>
  )

  if (verify.isError) {
    const status = (verify.error as any)?.response?.status
    const isExpired = status === 400 || status === 404
    return (
      <div className="text-center card-elevated p-10">
        <XCircle size={40} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">
          {isExpired ? 'Link expirado' : 'Verificação falhou'}
        </h1>
        <p className="text-sm text-crime-text-muted mb-6">
          {isExpired
            ? 'Este link de verificação expirou (válido 24h). Pede um novo abaixo.'
            : (verify.error as any)?.response?.data?.message || 'Erro ao verificar email.'
          }
        </p>
        <Link href="/auth/verify-email-sent" className="btn-primary">
          Pedir Novo Link
        </Link>
      </div>
    )
  }

  if (verify.isSuccess) return (
    <div className="text-center card-elevated p-10">
      <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-crime-text-primary mb-2">Conta ativada!</h1>
      <p className="text-sm text-crime-text-muted mb-6">O teu email foi verificado com sucesso. Podes fazer login.</p>
      <Link href="/auth/login?verified=1" className="btn-primary">Fazer Login</Link>
    </div>
  )

  return null
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="text-center card-elevated p-10">
        <Loader2 size={40} className="text-crime-red mx-auto mb-4 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
