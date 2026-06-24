'use client'

import { useState } from 'react'
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useResendVerification } from '@/hooks/useAuth'

export default function VerifyEmailSentPage() {
  const [email, setEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'success' | 'error'>('idle')
  const [resendMsg, setResendMsg] = useState('')
  const resend = useResendVerification()

  const handleResend = () => {
    if (!email) return
    setResendState('idle')
    resend.mutate(email, {
      onSuccess: () => {
        setResendState('success')
        setResendMsg('Email reenviado! Verifica a caixa de entrada e também a pasta de spam.')
      },
      onError: (err: any) => {
        setResendState('error')
        setResendMsg(err.response?.data?.message || 'Erro ao reenviar. Tenta novamente.')
      },
    })
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-crime-red/10 border border-crime-red/30 flex items-center justify-center">
          <Mail size={28} className="text-crime-red" />
        </div>
      </div>

      <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
        Confirma o teu email
      </p>
      <h1 className="text-2xl font-bold text-crime-text-primary mb-3">
        Verifica a tua Caixa de Entrada
      </h1>
      <p className="text-sm text-crime-text-muted mb-2 leading-relaxed">
        Enviámos um link de ativação para o teu email.
      </p>
      <p className="text-xs text-crime-text-faint mb-8">
        O link expira em <strong className="text-crime-text-secondary">24 horas</strong> · Verifica também a pasta de <strong className="text-crime-text-secondary">spam</strong>
      </p>

      <div className="card p-6 text-left mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-3">
          Não recebeste o email?
        </p>

        {resendState === 'success' ? (
          <div className="flex items-start gap-3 bg-green-950/50 border border-green-800 rounded-lg px-4 py-3 text-sm text-green-300">
            <CheckCircle size={14} className="shrink-0 mt-0.5" />
            <p>{resendMsg}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              className="input w-full"
              placeholder="Introduz o teu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResend()}
            />

            {resendState === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                <AlertCircle size={13} className="shrink-0" />
                {resendMsg}
              </div>
            )}

            <button
              onClick={handleResend}
              disabled={resend.isPending || !email}
              className="btn-secondary w-full"
            >
              {resend.isPending
                ? <><Loader2 size={14} className="animate-spin" /> A reenviar...</>
                : 'Reenviar Email de Ativação'
              }
            </button>
          </div>
        )}
      </div>

      <Link href="/auth/login" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">
        ← Voltar ao login
      </Link>
    </div>
  )
}
