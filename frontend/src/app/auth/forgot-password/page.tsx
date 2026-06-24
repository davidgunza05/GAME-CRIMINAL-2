'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useForgotPassword } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setErrorMsg(null)
    forgot.mutate(data, {
      onSuccess: () => setSubmitted(true),
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || 'Erro ao enviar email. Tenta novamente.')
      },
    })
  }

  return (
    <div>
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-crime-text-faint hover:text-crime-red mb-6 transition-colors">
        <ArrowLeft size={14} /> Voltar ao login
      </Link>

      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">Recuperação</p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">Esqueceste a Password?</h1>
        <p className="text-sm text-crime-text-muted">
          Introduz o teu email e enviamos instruções para criares uma nova.
        </p>
      </div>

      <div className="card-elevated p-8">
        {submitted ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-950 border border-green-800 flex items-center justify-center mx-auto">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <p className="font-medium text-crime-text-primary">Email enviado!</p>
            <p className="text-sm text-crime-text-muted">
              Se existe uma conta com esse email, receberás um link para redefinir a password nos próximos minutos.
            </p>
            <p className="text-xs text-crime-text-faint">Verifica também a pasta de spam.</p>
            <Link href="/auth/login" className="btn-secondary block mt-4">Voltar ao Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <FormField
              label="Email da conta"
              type="email"
              placeholder="tu@exemplo.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            {errorMsg && !forgot.isPending && (
              <div className="flex items-center gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-sm text-red-300">
                <AlertCircle size={14} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={forgot.isPending} className="btn-primary w-full">
              {forgot.isPending
                ? <><Loader2 size={16} className="animate-spin" /> A enviar...</>
                : <><Send size={15} /> Enviar Link de Recuperação</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
