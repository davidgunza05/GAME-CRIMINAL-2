'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, XCircle } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useResetPassword } from '@/hooks/useAuth'

const schema = z.object({
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de maiúscula')
    .regex(/[a-z]/, 'Precisa de minúscula')
    .regex(/[0-9]/, 'Precisa de número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const reset = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="text-center">
        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-crime-text-primary mb-2">Link inválido</h1>
        <p className="text-sm text-crime-text-muted mb-6">
          Este link de redefinição não é válido ou expirou.
        </p>
        <Link href="/auth/forgot-password" className="btn-primary">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  const onSubmit = (data: FormData) => {
    reset.mutate({ token, password: data.password })
  }

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">
          Nova Password
        </p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">
          Redefinir Password
        </h1>
        <p className="text-sm text-crime-text-muted">
          Cria uma nova password segura para a tua conta.
        </p>
      </div>

      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label="Nova Password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            {...register('password')}
          />

          <FormField
            label="Confirmar Password"
            type="password"
            placeholder="Repete a password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <button
            type="submit"
            disabled={reset.isPending}
            className="btn-primary w-full"
          >
            {reset.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A redefinir...
              </>
            ) : (
              'Redefinir Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
