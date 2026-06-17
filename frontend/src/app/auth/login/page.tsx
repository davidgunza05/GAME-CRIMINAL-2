'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useLogin } from '@/hooks/useAuth'

const schema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'Password é obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const login = useLogin()
  const searchParams = useSearchParams()
  const justVerified = searchParams.get('verified') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => login.mutate(data)

  return (
    <div>
      {/* Success banner */}
      {justVerified && (
        <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-lg px-4 py-3 mb-6 text-sm text-green-300">
          <CheckCircle size={16} className="shrink-0" />
          Email verificado com sucesso! Podes fazer login.
        </div>
      )}

      {/* Header */}
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

      {/* Card */}
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

          <button
            type="submit"
            disabled={login.isPending}
            className="btn-primary w-full"
          >
            {login.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A entrar...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-crime-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-crime-surface px-3 text-xs text-crime-text-faint">
              novo aqui?
            </span>
          </div>
        </div>

        <Link href="/auth/register" className="btn-secondary w-full">
          Criar Conta
        </Link>
      </div>
    </div>
  )
}
