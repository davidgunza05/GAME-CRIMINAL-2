'use client'

import { use, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useBuilderCase, useCreateStage, useUpdateStage, useDeleteStage } from '@/hooks/useBuilder'

interface StageFormData { order: number; title: string; description: string; isLast: boolean }

function StageForm({ initial, onSave, onCancel, loading }: {
  initial?: StageFormData; onSave: (d: StageFormData) => void; onCancel: () => void; loading?: boolean
}) {
  const [form, setForm] = useState<StageFormData>(initial ?? { order: 1, title: '', description: '', isLast: false })
  const f = (key: keyof StageFormData) => ({
    value: String(form[key]),
    onChange: (e: any) => setForm(p => ({ ...p, [key]: key === 'order' ? Number(e.target.value) : e.target.value })),
  })

  return (
    <div className="card p-5 border-crime-red/20 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input" min={1} {...f('order')} />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-crime-red"
              checked={form.isLast} onChange={e => setForm(p => ({ ...p, isLast: e.target.checked }))} />
            <span className="text-sm text-crime-text-secondary">Stage Final</span>
          </label>
        </div>
      </div>
      <div>
        <label className="label">Título *</label>
        <input className="input" placeholder="ex: A Descoberta" {...f('title')} />
      </div>
      <div>
        <label className="label">Descrição *</label>
        <textarea className="input resize-none" rows={3} placeholder="O que acontece nesta fase..." {...f('description')} />
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancelar</button>
        <button onClick={() => form.title && form.description && onSave(form)} disabled={loading || !form.title || !form.description} className="btn-primary text-sm py-2 gap-2">
          {loading && <Loader2 size={13} className="animate-spin" />}
          Guardar Stage
        </button>
      </div>
    </div>
  )
}

export default function BuilderStagesPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { data: submission } = useBuilderCase(id)
  const createStage = useCreateStage(id)
  const updateStage = useUpdateStage(id)
  const deleteStage = useDeleteStage(id)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const stages = submission?.case?.stages ?? []
  const isEditable = !submission || ['draft', 'rejected'].includes(submission?.status)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 2</p>
          <h2 className="text-2xl font-bold text-crime-text-primary">Stages / Capítulos</h2>
          <p className="text-crime-text-muted text-sm mt-1">Define a progressão narrativa do caso</p>
        </div>
        {isEditable && !showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-primary gap-2 text-sm">
            <Plus size={14} /> Add Stage
          </button>
        )}
      </div>

      {/* Checklist hint */}
      <div className="card p-4 mb-6 space-y-1.5">
        {[
          { check: stages.length >= 1, label: 'Pelo menos 1 stage' },
          { check: stages.some((s: any) => s.isLast), label: '1 stage marcada como Final' },
        ].map(({ check, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <CheckCircle size={13} className={check ? 'text-green-400' : 'text-crime-text-faint'} />
            <span className={check ? 'text-green-300' : 'text-crime-text-faint'}>{label}</span>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4">
          <StageForm
            initial={{ order: stages.length + 1, title: '', description: '', isLast: stages.length === 0 }}
            loading={createStage.isPending}
            onCancel={() => setShowAdd(false)}
            onSave={(d) => {
              createStage.mutate({ ...d, caseId: id }, { onSuccess: () => setShowAdd(false) })
            }}
          />
        </div>
      )}

      {/* Stages list */}
      <div className="space-y-3 mb-6">
        {stages.length === 0 && !showAdd && (
          <div className="card p-10 text-center">
            <p className="text-crime-text-faint text-sm">Nenhuma stage criada. Adiciona pelo menos uma.</p>
          </div>
        )}
        {stages.map((stage: any) => (
          editingId === stage.id ? (
            <StageForm
              key={stage.id}
              initial={{ order: stage.order, title: stage.title, description: stage.description, isLast: stage.isLast }}
              loading={updateStage.isPending}
              onCancel={() => setEditingId(null)}
              onSave={(d) => updateStage.mutate({ id: stage.id, data: d }, { onSuccess: () => setEditingId(null) })}
            />
          ) : (
            <div key={stage.id} className={clsx('card p-4 flex items-start gap-4', stage.isLast && 'border-crime-red/25')}>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <span className="w-7 h-7 rounded-full bg-crime-red/10 border border-crime-red/20 flex items-center justify-center text-crime-red font-mono text-xs font-bold">
                  {stage.order}
                </span>
                {stage.isLast && <span className="text-[9px] font-mono text-crime-red uppercase tracking-widest">Final</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-crime-text-primary text-sm">{stage.title}</p>
                <p className="text-xs text-crime-text-muted mt-1 leading-relaxed line-clamp-2">{stage.description}</p>
              </div>
              {isEditable && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingId(stage.id)} className="btn-ghost p-1.5 rounded"><Pencil size={13} /></button>
                  <button onClick={() => { if (confirm('Eliminar esta stage?')) deleteStage.mutate(stage.id) }}
                    className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          )
        ))}
      </div>

      <div className="flex justify-end">
        <Link href={`/dashboard/builder/${id}/characters`} className="btn-primary gap-2">
          Próximo: Personagens <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
