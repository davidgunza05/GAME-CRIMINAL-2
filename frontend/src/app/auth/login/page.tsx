'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Mail } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useLogin } from '@/hooks/useAuth'
import { Suspense, useState } from 'react'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password obrigatória'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const login = useLogin()
  const searchParams = useSearchParams()
  const justVerified = searchParams.get('verified') === '1'
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isUnverified, setIsUnverified] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (data: FormData) => {
    setErrorMsg(null)
    setIsUnverified(false)
    login.mutate(data, {
      onError: (err: any) => {
        const msg: string = err.response?.data?.message || 'Erro ao fazer login'
        const status: number = err.response?.status ?? 0
        // 403 = email não verificado
        if (status === 403) setIsUnverified(true)
        setErrorMsg(msg)
      },
    })
  }

  return (
    <div>
      {justVerified && (
        <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-lg px-4 py-3 mb-6 text-sm text-green-300">
          <CheckCircle size={15} className="shrink-0" />
          Email verificado com sucesso! Podes fazer login.
        </div>
      )}

      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
          Bem-vindo de Volta
        </p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">
          Iniciar Investigação
        </h1>
        <p className="text-sm text-crime-text-muted">
          Acede à tua conta e retoma os casos em aberto
        </p>
      </div>

      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            label="Email"
            type="email"
            placeholder="tu@exemplo.com"
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />

          <FormField
            label="Password"
            type="password"
            placeholder="A tua password"
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-crime-text-faint hover:text-crime-red transition-colors"
            >
              Esqueceste a password?
            </Link>
          </div>

          {/* Erro inline — visível mesmo depois de parar de carregar */}
          {errorMsg && !login.isPending && (
            <div className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm border ${
              isUnverified
                ? 'bg-yellow-950/50 border-yellow-800 text-yellow-300'
                : 'bg-red-950/50 border-red-900 text-red-300'
            }`}>
              {isUnverified
                ? <Mail size={15} className="shrink-0 mt-0.5" />
                : <AlertCircle size={15} className="shrink-0 mt-0.5" />
              }
              <div>
                <p>{errorMsg}</p>
                {isUnverified && (
                  <Link
                    href="/auth/verify-email-sent"
                    className="text-yellow-400 hover:text-yellow-200 underline text-xs mt-1 inline-block"
                  >
                    Reenviar email de ativação →
                  </Link>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="btn-primary w-full"
          >
            {login.isPending
              ? <><Loader2 size={16} className="animate-spin" /> A entrar...</>
              : 'Entrar'
            }
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-crime-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-crime-surface px-3 text-xs text-crime-text-faint">novo aqui?</span>
          </div>
        </div>

        <Link href="/auth/register" className="btn-secondary w-full text-center block">
          Criar Conta
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
