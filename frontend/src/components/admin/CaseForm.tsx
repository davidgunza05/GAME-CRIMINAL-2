'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save, X } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'

const caseSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(120),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(5000),
  shortDescription: z.string().max(300).optional(),
  difficulty: z.enum(['one', 'two', 'three', 'four', 'five']),
  type: z.enum(['digital', 'physical', 'hybrid']),
  minPlayers: z.coerce.number().int().min(1).max(20),
  maxPlayers: z.coerce.number().int().min(1).max(50),
  estimatedMinutes: z.coerce.number().int().min(15).max(600),
  priceDigital: z.coerce.number().min(0).optional(),
  pricePhysical: z.coerce.number().min(0).optional(),
  coverImageUrl: z.string().url('URL inválido').optional().or(z.literal('')),
  tags: z.string().optional(), // comma-separated
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
})

export type CaseFormValues = z.infer<typeof caseSchema>

interface Props {
  defaultValues?: Partial<CaseFormValues>
  onSubmit: (data: CaseFormValues) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

const DIFFICULTIES = [
  { value: 'one',   label: '★ Muito Fácil' },
  { value: 'two',   label: '★★ Fácil' },
  { value: 'three', label: '★★★ Médio' },
  { value: 'four',  label: '★★★★ Difícil' },
  { value: 'five',  label: '★★★★★ Expert' },
]

const TYPES = [
  { value: 'digital',  label: '💻 Digital' },
  { value: 'physical', label: '📦 Físico' },
  { value: 'hybrid',   label: '🔀 Híbrido' },
]

export function CaseForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Guardar' }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      difficulty: 'three',
      type: 'digital',
      minPlayers: 2,
      maxPlayers: 8,
      estimatedMinutes: 120,
      isPublished: false,
      isFeatured: false,
      sortOrder: 0,
      ...defaultValues,
    },
  })

  const title = watch('title')

  // Auto-slug a partir do título (apenas em criação)
  const handleTitleBlur = () => {
    if (!defaultValues?.slug && title) {
      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
      setValue('slug', slug)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Informação básica */}
      <section className="card p-6 space-y-5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-crime-text-faint">Informação Básica</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="label">Título *</label>
            <input
              {...register('title')}
              onBlur={handleTitleBlur}
              className="input w-full"
              placeholder="O Assassinato no Museu"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Slug *</label>
            <input {...register('slug')} className="input w-full font-mono text-sm" placeholder="o-assassinato-no-museu" />
            {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug.message}</p>}
          </div>

          <div>
            <label className="label">URL da Imagem de Capa</label>
            <input {...register('coverImageUrl')} className="input w-full" placeholder="https://..." />
            {errors.coverImageUrl && <p className="text-xs text-red-400 mt-1">{errors.coverImageUrl.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="label">Descrição Curta</label>
            <input {...register('shortDescription')} className="input w-full" placeholder="Resumo de até 300 caracteres..." />
          </div>

          <div className="md:col-span-2">
            <label className="label">Descrição Completa *</label>
            <textarea
              {...register('description')}
              className="input w-full min-h-[120px] resize-y"
              placeholder="Descrição detalhada do caso..."
            />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="label">Tags (separadas por vírgula)</label>
            <input {...register('tags')} className="input w-full" placeholder="mistério, museu, anos 20" />
          </div>
        </div>
      </section>

      {/* Configuração do Jogo */}
      <section className="card p-6 space-y-5">
        <h2 className="text-sm font-mono uppercase tracking-widest text-crime-text-faint">Configuração do Jogo</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <label className="label">Dificuldade</label>
            <select {...register('difficulty')} className="input w-full">
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Tipo</label>
            <select {...register('type')} className="input w-full">
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Mín. Jogadores</label>
            <input type="number" {...register('minPlayers')} className="input w-full" min={1} max={20} />
          </div>

          <div>
            <label className="label">Máx. Jogadores</label>
            <input type="number" {...register('maxPlayers')} className="input w-full" min={1} max={50} />
          </div>

          <div>
            <label className="label">Duração (min)</label>
            <input type="number" {...register('estimatedMinutes')} className="input w-full" min={15} />
          </div>

          <div>
            <label className="label">Preço Digital (€)</label>
            <input type="number" step="0.01" {...register('priceDigital')} className="input w-full" placeholder="9.99" />
          </div>

          <div>
            <label className="label">Preço Físico (€)</label>
            <input type="number" step="0.01" {...register('pricePhysical')} className="input w-full" placeholder="29.99" />
          </div>

          <div>
            <label className="label">Ordem</label>
            <input type="number" {...register('sortOrder')} className="input w-full" />
          </div>
        </div>
      </section>

      {/* Publicação */}
      <section className="card p-6 space-y-4">
        <h2 className="text-sm font-mono uppercase tracking-widest text-crime-text-faint">Publicação</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isPublished')} className="w-4 h-4 accent-crime-red" />
            <span className="text-sm text-crime-text-primary">Publicado (visível na loja)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isFeatured')} className="w-4 h-4 accent-crime-red" />
            <span className="text-sm text-crime-text-primary">Destacado na página inicial</span>
          </label>
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary gap-2 min-w-[140px] justify-center"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isLoading ? 'A guardar...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
