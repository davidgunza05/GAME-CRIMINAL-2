'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, XCircle, CheckCircle, AlertCircle } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { useResetPassword } from '@/hooks/useAuth'
import { Suspense, useState } from 'react'

const schema = z.object({
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Precisa de letra maiúscula')
    .regex(/[a-z]/, 'Precisa de letra minúscula')
    .regex(/[0-9]/, 'Precisa de número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As passwords não coincidem',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const reset = useResetPassword()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  if (!token) {
    return (
      <div className="card-elevated p-8 text-center">
        <XCircle size={32} className="text-red-400 mx-auto mb-4" />
        <p className="font-medium text-crime-text-primary mb-2">Link inválido</p>
        <p className="text-sm text-crime-text-muted mb-6">Este link de redefinição de password não é válido ou já foi utilizado.</p>
        <Link href="/auth/forgot-password" className="btn-primary">Pedir novo link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card-elevated p-8 text-center">
        <CheckCircle size={32} className="text-green-400 mx-auto mb-4" />
        <p className="font-medium text-crime-text-primary mb-2">Password alterada!</p>
        <p className="text-sm text-crime-text-muted mb-6">Podes agora fazer login com a tua nova password.</p>
        <Link href="/auth/login" className="btn-primary">Fazer Login</Link>
      </div>
    )
  }

  const onSubmit = ({ password }: FormData) => {
    setErrorMsg(null)
    reset.mutate({ token, password }, {
      onSuccess: () => setDone(true),
      onError: (err: any) => {
        const status = err.response?.status
        const msg = err.response?.data?.message
        if (status === 400 || status === 404) {
          setErrorMsg('Este link expirou ou já foi utilizado. Pede um novo link de recuperação.')
        } else {
          setErrorMsg(msg || 'Erro ao redefinir password. Tenta novamente.')
        }
      },
    })
  }

  return (
    <div>
      <div className="text-center mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-3">Nova Password</p>
        <h1 className="text-2xl font-bold text-crime-text-primary mb-2">Redefine a tua Password</h1>
        <p className="text-sm text-crime-text-muted">Escolhe uma password forte para a tua conta.</p>
      </div>

      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            label="Nova Password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            error={errors.password?.message}
            autoComplete="new-password"
            {...register('password')}
          />
          <FormField
            label="Confirmar Password"
            type="password"
            placeholder="Repete a password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
            {...register('confirmPassword')}
          />

          {errorMsg && !reset.isPending && (
            <div className="flex items-start gap-3 bg-red-950/50 border border-red-900 rounded-lg px-4 py-3 text-sm text-red-300">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <div>
                <p>{errorMsg}</p>
                <Link href="/auth/forgot-password" className="text-red-400 hover:text-red-200 underline text-xs mt-1 inline-block">
                  Pedir novo link →
                </Link>
              </div>
            </div>
          )}

          <button type="submit" disabled={reset.isPending} className="btn-primary w-full">
            {reset.isPending
              ? <><Loader2 size={16} className="animate-spin" /> A guardar...</>
              : 'Guardar Nova Password'
            }
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
