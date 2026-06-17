'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useForgotPassword } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    await forgot.mutateAsync(data.email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-crime-red/10 border border-crime-red/30 flex items-center justify-center">
            <Send size={28} className="text-crime-red" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-3">Email enviado!</h1>
        <p className="text-sm text-crime-text-muted mb-8 leading-relaxed">
          Se o email existir na nossa base de dados, receberás instruções para redefinir a tua password. O link expira em <strong className="text-crime-text-secondary">15 minutos</strong>.
        </p>
        <Link href="/auth/login" className="btn-secondary">← Voltar ao Login</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
          Recuperar Acesso
        </p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">
          Esqueceste a Password?
        </h1>
        <p className="text-sm text-crime-text-muted">
          Introduz o teu email e enviamos um link para criar uma nova password.
        </p>
      </div>

      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label="Email"
            type="email"
            placeholder="tu@exemplo.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <button
            type="submit"
            disabled={forgot.isPending}
            className="btn-primary w-full"
          >
            {forgot.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A enviar...
              </>
            ) : (
              'Enviar Link de Recuperação'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/auth/login" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}
