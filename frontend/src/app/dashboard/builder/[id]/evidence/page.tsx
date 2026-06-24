'use client'

import { use, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRight, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useBuilderCase, useCreateEvidence, useUpdateEvidence, useDeleteEvidence } from '@/hooks/useBuilder'

const EVIDENCE_TYPES = ['document','photo','video','audio','object','qrcode'] as const
type EvidenceType = typeof EVIDENCE_TYPES[number]

const TYPE_ICONS: Record<EvidenceType, string> = {
  document: '📄', photo: '🖼️', video: '🎬', audio: '🎵', object: '📦', qrcode: '⬛'
}

interface EvidenceFormData {
  title: string; description: string; type: EvidenceType
  stageId: string; contentUrl: string; contentText: string
  isRedHerring: boolean; qrCode: string; sortOrder: number
}

const EMPTY_EV: EvidenceFormData = {
  title: '', description: '', type: 'document', stageId: '',
  contentUrl: '', contentText: '', isRedHerring: false, qrCode: '', sortOrder: 0
}

function EvidenceForm({ initial, stages, onSave, onCancel, loading }: {
  initial?: EvidenceFormData; stages: any[]; onSave: (d: EvidenceFormData) => void; onCancel: () => void; loading?: boolean
}) {
  const [form, setForm] = useState<EvidenceFormData>(initial ?? EMPTY_EV)
  const set = (key: keyof EvidenceFormData) => (e: any) =>
    setForm(p => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const valid = form.title && form.description && form.type

  return (
    <div className="card p-5 border-crime-red/20 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Título *</label>
          <input className="input" placeholder="Carta Anónima" value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input" value={form.type} onChange={set('type')}>
            {EVIDENCE_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descrição *</label>
        <textarea className="input resize-none" rows={2} placeholder="O que é esta evidência?" value={form.description} onChange={set('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Stage</label>
          <select className="input" value={form.stageId} onChange={set('stageId')}>
            <option value="">Sem stage</option>
            {stages.map((s: any) => <option key={s.id} value={s.id}>Stage {s.order}: {s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input" min={0} value={form.sortOrder} onChange={set('sortOrder')} />
        </div>
      </div>

      {['photo','video','audio','document'].includes(form.type) && (
        <div>
          <label className="label">URL do Conteúdo</label>
          <input className="input" placeholder="https://..." value={form.contentUrl} onChange={set('contentUrl')} />
        </div>
      )}

      <div>
        <label className="label">Texto / Transcrição</label>
        <textarea className="input resize-none" rows={3} placeholder="Conteúdo textual da evidência..." value={form.contentText} onChange={set('contentText')} />
      </div>

      {form.type === 'qrcode' && (
        <div>
          <label className="label">Código QR</label>
          <input className="input font-mono" placeholder="Valor do QR Code" value={form.qrCode} onChange={set('qrCode')} />
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-yellow-500" checked={form.isRedHerring} onChange={set('isRedHerring')} />
        <span className="text-sm text-yellow-400">⚠️ Pista falsa (red herring)</span>
      </label>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancelar</button>
        <button onClick={() => valid && onSave(form)} disabled={loading || !valid} className="btn-primary text-sm py-2 gap-2">
          {loading && <Loader2 size={13} className="animate-spin" />} Guardar Evidência
        </button>
      </div>
    </div>
  )
}

export default function BuilderEvidencePage({ params }: { params: { id: string } }) {
  const { id } = params
  
  const { data: submission } = useBuilderCase(id)
  const createEvidence = useCreateEvidence(id)
  const updateEvidence = useUpdateEvidence(id)
  const deleteEvidence = useDeleteEvidence(id)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const evidence = submission?.case?.evidence ?? []
  const stages = submission?.case?.stages ?? []
  const isEditable = !submission || ['draft', 'rejected'].includes(submission?.status)
  const realEvidence = evidence.filter((e: any) => !e.isRedHerring)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 4</p>
          <h2 className="text-2xl font-bold text-crime-text-primary">Evidências</h2>
          <p className="text-crime-text-muted text-sm mt-1">Adiciona pistas reais e falsas</p>
        </div>
        {isEditable && !showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-primary gap-2 text-sm">
            <Plus size={14} /> Add Evidência
          </button>
        )}
      </div>

      {/* Checklist */}
      <div className="card p-4 mb-6 space-y-1.5">
        {[
          { check: evidence.length >= 3, label: 'Pelo menos 3 evidências' },
          { check: realEvidence.length >= 2, label: 'Pelo menos 2 evidências reais (não red herring)' },
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
          <EvidenceForm
            stages={stages}
            loading={createEvidence.isPending}
            onCancel={() => setShowAdd(false)}
            onSave={(d) => createEvidence.mutate({ ...d, caseId: id, stageId: d.stageId || undefined, contentUrl: d.contentUrl || undefined, contentText: d.contentText || undefined, qrCode: d.qrCode || undefined }, { onSuccess: () => setShowAdd(false) })}
          />
        </div>
      )}

      {/* Evidence list */}
      <div className="space-y-2 mb-6">
        {evidence.length === 0 && !showAdd && (
          <div className="card p-10 text-center">
            <p className="text-crime-text-faint text-sm">Nenhuma evidência criada. Adiciona pelo menos 3.</p>
          </div>
        )}
        {evidence.map((ev: any) => {
          const stage = stages.find((s: any) => s.id === ev.stageId)
          return editingId === ev.id ? (
            <EvidenceForm
              key={ev.id}
              stages={stages}
              initial={{ title: ev.title, description: ev.description, type: ev.type, stageId: ev.stageId ?? '', contentUrl: ev.contentUrl ?? '', contentText: ev.contentText ?? '', isRedHerring: ev.isRedHerring, qrCode: ev.qrCode ?? '', sortOrder: ev.sortOrder ?? 0 }}
              loading={updateEvidence.isPending}
              onCancel={() => setEditingId(null)}
              onSave={(d) => updateEvidence.mutate({ id: ev.id, data: { ...d, stageId: d.stageId || undefined, contentUrl: d.contentUrl || undefined, contentText: d.contentText || undefined, qrCode: d.qrCode || undefined } }, { onSuccess: () => setEditingId(null) })}
            />
          ) : (
            <div key={ev.id} className={clsx('card p-3 flex items-center gap-3', ev.isRedHerring && 'opacity-60')}>
              <span className="text-lg shrink-0">{TYPE_ICONS[ev.type as EvidenceType]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-crime-text-primary text-sm">{ev.title}</p>
                  {ev.isRedHerring && <span className="badge bg-yellow-950 text-yellow-500 text-[9px]">⚠️ Red Herring</span>}
                  {stage && <span className="badge bg-crime-muted text-crime-text-faint text-[9px]">Stage {stage.order}</span>}
                </div>
                <p className="text-xs text-crime-text-faint line-clamp-1 mt-0.5">{ev.description}</p>
              </div>
              {isEditable && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingId(ev.id)} className="btn-ghost p-1.5 rounded"><Pencil size={12} /></button>
                  <button onClick={() => { if (confirm(`Eliminar "${ev.title}"?`)) deleteEvidence.mutate(ev.id) }}
                    className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Link href={`/dashboard/builder/${id}/submit`} className="btn-primary gap-2">
          Próximo: Submeter <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
