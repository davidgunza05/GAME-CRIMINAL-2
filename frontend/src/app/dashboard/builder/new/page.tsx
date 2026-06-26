'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useCreateBuilderCase } from '@/hooks/useBuilder'
import { FormField } from '@/components/ui/FormField'
import MediaUpload from '@/components/ui/MediaUpload'

const schema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(120).trim(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Apenas minúsculas, números e hífens').trim(),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(5000).trim(),
  shortDescription: z.string().max(300).trim().optional(),
  difficulty: z.enum(['one','two','three','four','five']).default('three'),
  type: z.enum(['digital','physical','hybrid']).default('digital'),
  minPlayers: z.coerce.number().int().min(1).max(20).default(2),
  maxPlayers: z.coerce.number().int().min(1).max(50).default(8),
  estimatedMinutes: z.coerce.number().int().min(15).max(600).default(120),
  priceDigital: z.coerce.number().min(0).optional(),
  pricePhysical: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewCasePage() {
  const create = useCreateBuilderCase()
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { difficulty: 'three', type: 'digital', minPlayers: 2, maxPlayers: 8, estimatedMinutes: 120 },
  })

  // Auto-generate slug from title
  const title = watch('title', '')
  const autoSlug = () => {
    const slug = title.toLowerCase().trim()
      .replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
      .replace(/-+/g, '-').slice(0, 80)
    setValue('slug', slug)
  }

  const onSubmit = (data: FormData) => {
    const tags = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    create.mutate({ ...data, tags, coverImageUrl: data.coverImageUrl || undefined })
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/dashboard/builder" className="btn-ghost text-sm mb-6 inline-flex gap-2">
        <ArrowLeft size={14} /> Os Meus Casos
      </Link>

      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Case Builder</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Novo Caso</h1>
        <p className="text-crime-text-muted text-sm mt-1">Preenche as informações básicas do teu caso investigativo.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField label="Título do Caso *" placeholder="O Mistério da Mansão Aldridge"
            error={errors.title?.message} {...register('title')} />

          <div>
            <label className="label">Slug (URL) *</label>
            <div className="flex gap-2">
              <input className="input flex-1 font-mono text-sm" placeholder="o-misterio-da-mansao"
                {...register('slug')} />
              <button type="button" onClick={autoSlug} className="btn-secondary text-xs px-3 shrink-0">
                Auto
              </button>
            </div>
            {errors.slug && <p className="field-error">{errors.slug.message}</p>}
            <p className="text-[10px] text-crime-text-faint mt-1">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div>
            <label className="label">Descrição * (min. 20 caracteres)</label>
            <textarea className="input resize-none" rows={5}
              placeholder="Descreve o enredo do caso, o cenário e o mistério que os jogadores vão investigar..."
              {...register('description')} />
            {errors.description && <p className="field-error">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Descrição curta (opcional, máx. 300)</label>
            <textarea className="input resize-none" rows={2}
              placeholder="Resumo do caso para o catálogo..."
              {...register('shortDescription')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Dificuldade</label>
              <select className="input" {...register('difficulty')}>
                <option value="one">⭐ Iniciante</option>
                <option value="two">⭐⭐ Fácil</option>
                <option value="three">⭐⭐⭐ Intermédio</option>
                <option value="four">⭐⭐⭐⭐ Difícil</option>
                <option value="five">⭐⭐⭐⭐⭐ Especialista</option>
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" {...register('type')}>
                <option value="digital">💻 Digital</option>
                <option value="physical">📦 Físico</option>
                <option value="hybrid">🔀 Híbrido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Mín. Jogadores" type="number" min={1} max={20}
              error={errors.minPlayers?.message} {...register('minPlayers')} />
            <FormField label="Máx. Jogadores" type="number" min={1} max={50}
              error={errors.maxPlayers?.message} {...register('maxPlayers')} />
            <FormField label="Duração (min)" type="number" min={15}
              error={errors.estimatedMinutes?.message} {...register('estimatedMinutes')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Preço Digital (€)" type="number" step="0.01" min={0} placeholder="9.99"
              error={errors.priceDigital?.message} {...register('priceDigital')} />
            <FormField label="Preço Físico (€)" type="number" step="0.01" min={0} placeholder="29.99"
              error={errors.pricePhysical?.message} {...register('pricePhysical')} />
          </div>

          <MediaUpload
            label="Imagem de Capa (opcional)"
            hint="JPG, PNG, WebP · máx. 10 MB"
            context="cover"
            accept="image"
            value={watch('coverImageUrl') ?? ''}
            onChange={(url) => setValue('coverImageUrl', url, { shouldDirty: true })}
            previewType="image"
          />
          {/* Campo escondido para validação */}
          <input type="hidden"
            error={errors.coverImageUrl?.message} {...register('coverImageUrl')} />

          <div>
            <label className="label">Tags (separadas por vírgula)</label>
            <input className="input" placeholder="murder mystery, roleplay, mansão, clássico"
              {...register('tags')} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary w-full">
              {create.isPending
                ? <><Loader2 size={16} className="animate-spin" /> A criar...</>
                : 'Criar Rascunho → Continuar para Stages'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
