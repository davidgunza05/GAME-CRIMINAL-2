'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { FormField } from '@/components/ui/FormField'
import { useRegister } from '@/hooks/useAuth'

const schema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e _')
    .toLowerCase(),
  email: z.string().email('Email inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de maiúscula')
    .regex(/[a-z]/, 'Precisa de minúscula')
    .regex(/[0-9]/, 'Precisa de número'),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const register = useRegister()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormData) => {
    setErrorMsg(null)
    register.mutate(data, {
      onSuccess: () => setSuccess(true),
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || 'Erro ao criar conta. Tenta novamente.')
      },
    })
  }

  if (success) {
    return (
      <div className="text-center card-elevated p-10">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Conta criada!</h1>
        <p className="text-sm text-crime-text-muted mb-2">
          Enviámos um email de ativação para o teu endereço.
        </p>
        <p className="text-xs text-crime-text-faint mb-6">Confirma o email para ativares a tua conta. Verifica também a pasta de spam.</p>
        <Link href="/auth/login" className="btn-secondary">Ir para o Login</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
          Criar Conta
        </p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">
          Torna-te Detetive
        </h1>
        <p className="text-sm text-crime-text-muted">
          Junta-te à plataforma de investigação criminal mais imersiva
        </p>
      </div>

      {/* Card */}
      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label="Nome"
            placeholder="Como te chamamos?"
            error={errors.displayName?.message}
            {...field('displayName')}
          />

          <FormField
            label="Username"
            placeholder="detetive_silva"
            error={errors.username?.message}
            hint="Apenas letras, números e underscore. Será público."
            {...field('username')}
          />

          <FormField
            label="Email"
            type="email"
            placeholder="tu@exemplo.com"
            error={errors.email?.message}
            {...field('email')}
          />

          <FormField
            label="Password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            hint="Deve conter maiúscula, minúscula e número"
            {...field('password')}
          />

          <button
            type="submit"
            disabled={register.isPending}
            className="btn-primary w-full mt-2"
          >
            {register.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A criar conta...
              </>
            ) : (
              'Criar Conta'
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
              já tens conta?
            </span>
          </div>
        </div>

        <Link href="/auth/login" className="btn-secondary w-full">
          Fazer Login
        </Link>
      </div>
    </div>
  )
}
