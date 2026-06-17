'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useVerifyEmail } from '@/hooks/useAuth'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const verify = useVerifyEmail()

  useEffect(() => {
    if (token && !verify.isPending && !verify.isSuccess && !verify.isError) {
      verify.mutate(token)
    }
  }, [token])

  if (!token) {
    return (
      <div className="text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Link inválido</h1>
        <p className="text-sm text-crime-text-muted mb-6">O link de verificação não é válido.</p>
        <Link href="/auth/login" className="btn-primary">Ir ao Login</Link>
      </div>
    )
  }

  if (verify.isPending) {
    return (
      <div className="text-center">
        <Loader2 size={48} className="text-crime-red mx-auto mb-4 animate-spin" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">A verificar...</h1>
        <p className="text-sm text-crime-text-muted">Aguarda um momento.</p>
      </div>
    )
  }

  if (verify.isError) {
    const msg = (verify.error as any)?.response?.data?.message || 'Erro ao verificar email'
    return (
      <div className="text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Verificação falhou</h1>
        <p className="text-sm text-crime-text-muted mb-6">{msg}</p>
        <Link href="/auth/verify-email-sent" className="btn-secondary">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  return null // onSuccess redireciona automaticamente
}
