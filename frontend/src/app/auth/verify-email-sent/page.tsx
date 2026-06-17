'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useResendVerification } from '@/hooks/useAuth'

export default function VerifyEmailSentPage() {
  const [email, setEmail] = useState('')
  const resend = useResendVerification()

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-crime-red/10 border border-crime-red/30 flex items-center justify-center">
          <Mail size={28} className="text-crime-red" />
        </div>
      </div>

      <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
        Verifica o teu email
      </p>
      <h1 className="text-2xl font-bold text-crime-text-primary mb-3">
        Email enviado!
      </h1>
      <p className="text-sm text-crime-text-muted mb-8 leading-relaxed">
        Enviámos um link de verificação para o teu email. O link expira em <strong className="text-crime-text-secondary">24 horas</strong>.
      </p>

      <div className="card p-6 text-left mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">
          Não recebeste o email?
        </p>
        <div className="space-y-3">
          <input
            type="email"
            className="input"
            placeholder="O teu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={() => email && resend.mutate(email)}
            disabled={resend.isPending || !email}
            className="btn-secondary w-full"
          >
            {resend.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                A reenviar...
              </>
            ) : (
              'Reenviar email'
            )}
          </button>
        </div>
      </div>

      <Link href="/auth/login" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">
        ← Voltar ao login
      </Link>
    </div>
  )
}
