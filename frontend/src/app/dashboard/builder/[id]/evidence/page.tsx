'use client'

import { use, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useBuilderCase, useCreateEvidence, useUpdateEvidence, useDeleteEvidence } from '@/hooks/useBuilder'
import MediaUpload from '@/components/ui/MediaUpload'

const EVIDENCE_TYPES = ['document','photo','video','audio','object','qrcode'] as const
type EvidenceType = typeof EVIDENCE_TYPES[number]

const TYPE_ICONS: Record<EvidenceType, string> = {
  document: '📄', photo: '🖼️', video: '🎬', audio: '🎵', object: '📦', qrcode: '⬛',
}

// Mapear tipo de evidência → tipo de upload aceite
const TYPE_ACCEPT: Record<EvidenceType, 'image' | 'video' | 'audio' | 'document' | 'any'> = {
  photo:    'image',
  video:    'video',
  audio:    'audio',
  document: 'document',
  object:   'image',  // foto do objeto
  qrcode:   'image',  // imagem do QR code
}

const TYPE_HINT: Record<EvidenceType, string> = {
  photo:    'JPG, PNG, WebP ou GIF · máx. 10 MB',
  video:    'MP4, WebM ou MOV · máx. 100 MB',
  audio:    'MP3, WAV ou OGG · máx. 50 MB',
  document: 'PDF ou TXT · máx. 20 MB',
  object:   'Foto do objeto · JPG, PNG · máx. 10 MB',
  qrcode:   'Imagem do QR Code · JPG, PNG · máx. 10 MB',
}

interface EvidenceFormData {
  title: string; description: string; type: EvidenceType
  stageId: string; contentUrl: string; contentText: string
  isRedHerring: boolean; qrCode: string; sortOrder: number
}

const EMPTY_EV: EvidenceFormData = {
  title: '', description: '', type: 'document', stageId: '',
  contentUrl: '', contentText: '', isRedHerring: false, qrCode: '', sortOrder: 0,
}

function EvidenceForm({ initial, stages, onSave, onCancel, loading }: {
  initial?: EvidenceFormData; stages: any[]
  onSave: (d: EvidenceFormData) => void; onCancel: () => void; loading?: boolean
}) {
  const [form, setForm] = useState<EvidenceFormData>(initial ?? EMPTY_EV)

  const set = (key: keyof EvidenceFormData) => (e: any) => {
    const { type, checked, value } = e.target
    setForm(p => ({
      ...p,
      [key]: type === 'checkbox' ? checked
           : type === 'number'  ? (value === '' ? 0 : Number(value))
           : value,
    }))
  }

  const valid = form.title.trim() && form.description.trim() && form.type

  return (
    <div className="card p-5 border-crime-red/20 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Título *</label>
          <input className="input w-full" placeholder="Carta Anónima" value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label">Tipo *</label>
          <select className="input w-full" value={form.type}
            onChange={(e) => setForm(p => ({ ...p, type: e.target.value as EvidenceType, contentUrl: '' }))}>
            {EVIDENCE_TYPES.map(t => (
              <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descrição *</label>
        <textarea className="input resize-none w-full" rows={2}
          placeholder="O que é esta evidência?" value={form.description} onChange={set('description')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Stage</label>
          <select className="input w-full" value={form.stageId} onChange={set('stageId')}>
            <option value="">Sem stage</option>
            {stages.map((s: any) => (
              <option key={s.id} value={s.id}>Stage {s.order}: {s.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input w-full" min={0}
            value={form.sortOrder} onChange={set('sortOrder')} />
        </div>
      </div>

      {/* Upload de mídia — mostrado para tipos com ficheiro */}
      {form.type !== 'qrcode' && (
        <MediaUpload
          label={
            form.type === 'photo' ? 'Imagem da Evidência' :
            form.type === 'video' ? 'Vídeo da Evidência' :
            form.type === 'audio' ? 'Áudio da Evidência' :
            form.type === 'document' ? 'Documento (PDF / TXT)' :
            'Ficheiro do Objeto / Foto'
          }
          hint={TYPE_HINT[form.type]}
          context="evidence"
          accept={TYPE_ACCEPT[form.type]}
          value={form.contentUrl}
          onChange={(url) => setForm(p => ({ ...p, contentUrl: url }))}
          previewType={['photo', 'object'].includes(form.type) ? 'image' : 'none'}
        />
      )}

      {form.type === 'qrcode' && (
        <div>
          <label className="label">Valor do QR Code</label>
          <input className="input font-mono w-full" placeholder="Texto ou URL codificado no QR"
            value={form.qrCode} onChange={set('qrCode')} />
        </div>
      )}

      <div>
        <label className="label">Texto / Transcrição (opcional)</label>
        <textarea className="input resize-none w-full" rows={3}
          placeholder="Conteúdo textual da evidência — transcrição, legenda ou descrição detalhada..."
          value={form.contentText} onChange={set('contentText')} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="w-4 h-4 accent-yellow-500"
          checked={form.isRedHerring}
          onChange={(e) => setForm(p => ({ ...p, isRedHerring: e.target.checked }))} />
        <span className="text-sm text-yellow-400">⚠️ Pista falsa (red herring)</span>
      </label>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancelar</button>
        <button
          onClick={() => valid && onSave(form)}
          disabled={loading || !valid}
          className="btn-primary text-sm py-2 gap-2"
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Guardar Evidência
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const evidence = submission?.case?.evidence ?? []
  const stages   = submission?.case?.stages ?? []
  const isEditable = !submission || ['draft', 'rejected'].includes(submission?.status)
  const realEvidence = evidence.filter((e: any) => !e.isRedHerring)

  const saveNew = (d: EvidenceFormData) => createEvidence.mutate({
    ...d,
    caseId: id,
    stageId: d.stageId || undefined,
    contentUrl: d.contentUrl || undefined,
    contentText: d.contentText || undefined,
    qrCode: d.qrCode || undefined,
    sortOrder: Number(d.sortOrder) || 0,
  }, { onSuccess: () => setShowAdd(false) })

  const saveEdit = (evId: string, d: EvidenceFormData) => updateEvidence.mutate({
    id: evId,
    data: {
      ...d,
      stageId: d.stageId || undefined,
      contentUrl: d.contentUrl || undefined,
      contentText: d.contentText || undefined,
      qrCode: d.qrCode || undefined,
      sortOrder: Number(d.sortOrder) || 0,
    },
  }, { onSuccess: () => setEditingId(null) })

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 4</p>
          <h2 className="text-2xl font-bold text-crime-text-primary">Evidências</h2>
          <p className="text-crime-text-muted text-sm mt-1">Adiciona pistas, ficheiros e red herrings</p>
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
          { check: evidence.length >= 3,      label: 'Pelo menos 3 evidências' },
          { check: realEvidence.length >= 2,   label: 'Pelo menos 2 evidências reais (não red herring)' },
        ].map(({ check, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs">
            <CheckCircle size={13} className={check ? 'text-green-400' : 'text-crime-text-faint'} />
            <span className={check ? 'text-green-300' : 'text-crime-text-faint'}>{label}</span>
          </div>
        ))}
      </div>

      {/* Formulário de adição */}
      {showAdd && (
        <div className="mb-4">
          <EvidenceForm
            stages={stages}
            loading={createEvidence.isPending}
            onCancel={() => setShowAdd(false)}
            onSave={saveNew}
          />
        </div>
      )}

      {/* Lista */}
      <div className="space-y-2 mb-6">
        {evidence.length === 0 && !showAdd && (
          <div className="card p-10 text-center">
            <p className="text-crime-text-faint text-sm">Nenhuma evidência criada. Adiciona pelo menos 3.</p>
          </div>
        )}
        {evidence.map((ev: any) => {
          const stage = stages.find((s: any) => s.id === ev.stageId)
          if (editingId === ev.id) {
            return (
              <EvidenceForm
                key={ev.id}
                stages={stages}
                initial={{
                  title: ev.title, description: ev.description, type: ev.type,
                  stageId: ev.stageId ?? '', contentUrl: ev.contentUrl ?? '',
                  contentText: ev.contentText ?? '', isRedHerring: ev.isRedHerring,
                  qrCode: ev.qrCode ?? '', sortOrder: ev.sortOrder ?? 0,
                }}
                loading={updateEvidence.isPending}
                onCancel={() => setEditingId(null)}
                onSave={(d) => saveEdit(ev.id, d)}
              />
            )
          }
          return (
            <div key={ev.id} className={clsx('card p-3 flex items-center gap-3', ev.isRedHerring && 'opacity-60')}>
              <span className="text-lg shrink-0">{TYPE_ICONS[ev.type as EvidenceType]}</span>

              {/* Preview miniatura se for imagem */}
              {ev.contentUrl && ['photo', 'object'].includes(ev.type) && (
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 border border-crime-border">
                  <img src={ev.contentUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-crime-text-primary text-sm">{ev.title}</p>
                  {ev.isRedHerring && (
                    <span className="badge bg-yellow-950 text-yellow-500 text-[9px]">⚠️ Red Herring</span>
                  )}
                  {stage && (
                    <span className="badge bg-crime-muted text-crime-text-faint text-[9px]">
                      Stage {stage.order}
                    </span>
                  )}
                  {ev.contentUrl && (
                    <a
                      href={ev.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-crime-red hover:underline"
                    >
                      ver ficheiro →
                    </a>
                  )}
                </div>
                <p className="text-xs text-crime-text-faint line-clamp-1 mt-0.5">{ev.description}</p>
              </div>

              {isEditable && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingId(ev.id)} className="btn-ghost p-1.5 rounded">
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: ev.id, title: ev.title })}
                    className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
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

      {/* Modal de confirmação de deleção */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="card p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-crime-text-primary">Eliminar Evidência</h2>
            <p className="text-sm text-crime-text-muted">
              Tens a certeza que queres eliminar{' '}
              <strong className="text-crime-text-primary">"{deleteTarget.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-ghost text-sm">Cancelar</button>
              <button
                onClick={() => { deleteEvidence.mutate(deleteTarget.id); setDeleteTarget(null) }}
                className="btn-danger text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
