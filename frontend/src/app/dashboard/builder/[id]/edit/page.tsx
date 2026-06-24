'use client'

import { use, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useBuilderCase, useUpdateBuilderCase } from '@/hooks/useBuilder'
import { FormField } from '@/components/ui/FormField'

const schema = z.object({
  title: z.string().min(3).max(120).trim(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).trim(),
  description: z.string().min(20).max(5000).trim(),
  shortDescription: z.string().max(300).trim().optional(),
  difficulty: z.enum(['one','two','three','four','five']),
  type: z.enum(['digital','physical','hybrid']),
  minPlayers: z.coerce.number().int().min(1).max(20),
  maxPlayers: z.coerce.number().int().min(1).max(50),
  estimatedMinutes: z.coerce.number().int().min(15).max(600),
  priceDigital: z.coerce.number().min(0).optional(),
  pricePhysical: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
})
 
type FormData = z.infer<typeof schema>

export default function BuilderEditPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: submission } = useBuilderCase(id)
  const update = useUpdateBuilderCase(id)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (submission?.case) {
      const c = submission.case
      reset({
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortDescription: c.shortDescription ?? '',
        difficulty: c.difficulty,
        type: c.type,
        minPlayers: c.minPlayers,
        maxPlayers: c.maxPlayers,
        estimatedMinutes: c.estimatedMinutes,
        priceDigital: c.priceDigital ? Number(c.priceDigital) : undefined,
        pricePhysical: c.pricePhysical ? Number(c.pricePhysical) : undefined,
        coverImageUrl: c.coverImageUrl ?? '',
        tags: c.tags?.join(', ') ?? '',
      })
    }
  }, [submission, reset])

  const titleVal = watch('title', '')
  const autoSlug = () => {
    setValue('slug', titleVal.toLowerCase()
      .replace(/[àáâãä]/g,'a').replace(/[èéêë]/g,'e')
      .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
      .replace(/[ùúûü]/g,'u').replace(/ç/g,'c')
      .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-')
      .replace(/-+/g,'-').slice(0,80), { shouldDirty: true })
  }

  const onSubmit = (data: FormData) => {
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    update.mutate({ ...data, tags, coverImageUrl: data.coverImageUrl || undefined })
  }

  const isEditable = !submission || ['draft', 'rejected'].includes(submission.status)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 1</p>
        <h2 className="text-2xl font-bold text-crime-text-primary">Informações do Caso</h2>
      </div>

      {!isEditable && (
        <div className="card p-4 mb-6 border-yellow-800/30 bg-yellow-950/20">
          <p className="text-sm text-yellow-300">
            Este caso está em estado <strong>{submission?.status}</strong> e não pode ser editado.
          </p>
        </div>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Título *" placeholder="Nome do caso" error={errors.title?.message} disabled={!isEditable} {...register('title')} />

          <div>
            <label className="label">Slug *</label>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono text-sm" placeholder="slug-do-caso" disabled={!isEditable} {...register('slug')} />
              {isEditable && <button type="button" onClick={autoSlug} className="btn-secondary text-xs px-3 shrink-0">Auto</button>}
            </div>
            {errors.slug && <p className="field-error">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="label">Descrição *</label>
            <textarea className="input resize-none" rows={5} disabled={!isEditable} {...register('description')} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Descrição Curta</label>
            <textarea className="input resize-none" rows={2} disabled={!isEditable} {...register('shortDescription')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dificuldade</label>
              <select className="input" disabled={!isEditable} {...register('difficulty')}>
                <option value="one">⭐ Iniciante</option>
                <option value="two">⭐⭐ Fácil</option>
                <option value="three">⭐⭐⭐ Intermédio</option>
                <option value="four">⭐⭐⭐⭐ Difícil</option>
                <option value="five">⭐⭐⭐⭐⭐ Especialista</option>
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" disabled={!isEditable} {...register('type')}>
                <option value="digital">💻 Digital</option>
                <option value="physical">📦 Físico</option>
                <option value="hybrid">🔀 Híbrido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Mín. Jogadores" type="number" disabled={!isEditable} error={errors.minPlayers?.message} {...register('minPlayers')} />
            <FormField label="Máx. Jogadores" type="number" disabled={!isEditable} error={errors.maxPlayers?.message} {...register('maxPlayers')} />
            <FormField label="Duração (min)" type="number" disabled={!isEditable} error={errors.estimatedMinutes?.message} {...register('estimatedMinutes')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Preço Digital (€)" type="number" step="0.01" disabled={!isEditable} error={errors.priceDigital?.message} {...register('priceDigital')} />
            <FormField label="Preço Físico (€)" type="number" step="0.01" disabled={!isEditable} error={errors.pricePhysical?.message} {...register('pricePhysical')} />
          </div>

          <FormField label="URL Imagem Capa" placeholder="https://..." disabled={!isEditable} error={errors.coverImageUrl?.message} {...register('coverImageUrl')} />

          <div>
            <label className="label">Tags (vírgula)</label>
            <input className="input" placeholder="murder mystery, roleplay" disabled={!isEditable} {...register('tags')} />
          </div>

          {isEditable && (
            <div className="flex items-center justify-between pt-2">
              <button type="submit" disabled={update.isPending || !isDirty} className="btn-primary gap-2">
                {update.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Guardar Alterações
              </button>
              <Link href={`/dashboard/builder/${id}/stages`} className="btn-secondary gap-2">
                Próximo: Stages <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
