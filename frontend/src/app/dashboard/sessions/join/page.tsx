'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Hash } from 'lucide-react'
import Link from 'next/link'
import { useJoinSession, useSessionByCode } from '@/hooks/useSession'

const schema = z.object({
  accessCode: z.string().length(8, 'O código tem 8 caracteres').toUpperCase().trim(),
})

type FormData = z.infer<typeof schema>

export default function JoinSessionPage() {
  const join = useJoinSession()
  const [preview, setPreview] = useState('')

  const { data: sessionPreview, isLoading: loadingPreview } = useSessionByCode(preview)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const code = watch('accessCode', '')
  const onCodeChange = (v: string) => { if (v.length === 8) setPreview(v.toUpperCase()) }

  const onSubmit = (data: FormData) => join.mutate({ accessCode: data.accessCode })

  return (
    <div className="p-8 max-w-md mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Entrar</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Código de Acesso</h1>
        <p className="text-crime-text-muted text-sm mt-2">Introduz o código de 8 caracteres fornecido pelo organizador.</p>
      </div>

      <div className="card-elevated p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="label">Código da Sessão</label>
            <div className="relative">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-crime-text-faint" />
              <input
                className="input pl-10 uppercase tracking-[0.4em] text-center text-xl font-mono font-bold"
                placeholder="XXXXXXXX"
                maxLength={8}
                {...register('accessCode', {
                  onChange: (e) => onCodeChange(e.target.value),
                })}
              />
            </div>
            {errors.accessCode && <p className="field-error mt-1.5">{errors.accessCode.message}</p>}
          </div>

          {/* Preview */}
          {code.length === 8 && (
            <div className="card p-4">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-crime-text-faint text-sm">
                  <Loader2 size={14} className="animate-spin" /> A verificar código...
                </div>
              ) : sessionPreview ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-crime-black overflow-hidden flex items-center justify-center border border-crime-border shrink-0">
                    {sessionPreview.case.coverImageUrl
                      ? <img src={sessionPreview.case.coverImageUrl} className="w-full h-full object-cover" />
                      : <span className="text-xl opacity-30">🔍</span>
                    }
                  </div>
                  <div>
                    <p className="text-sm font-bold text-crime-text-primary">{sessionPreview.case.title}</p>
                    <p className="text-xs text-crime-text-faint">
                      {sessionPreview.participants.length}/{sessionPreview.case.maxPlayers} jogadores
                      · Host: {sessionPreview.host.username}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-red-400">Código não encontrado</p>
              )}
            </div>
          )}

          <button type="submit" disabled={join.isPending || !sessionPreview} className="btn-primary w-full">
            {join.isPending ? <><Loader2 size={16} className="animate-spin" /> A entrar...</> : 'Entrar na Sessão'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/dashboard/sessions" className="text-xs text-crime-text-faint hover:text-crime-red transition-colors">← Voltar às sessões</Link>
        </div>
      </div>
    </div>
  )
}
