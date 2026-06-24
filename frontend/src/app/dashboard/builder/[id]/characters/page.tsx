'use client'

import { use, useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRight, Loader2, CheckCircle, Skull, Search } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import { useBuilderCase, useCreateCharacter, useUpdateCharacter, useDeleteCharacter } from '@/hooks/useBuilder'

interface CharFormData {
  name: string; description: string; backstory: string
  objectives: string; secrets: string; alibi: string
  isKiller: boolean; isDetective: boolean; avatarUrl?: string
}

const EMPTY: CharFormData = {
  name: '', description: '', backstory: '', objectives: '',
  secrets: '', alibi: '', isKiller: false, isDetective: false, avatarUrl: '',
}

function CharacterForm({ initial, onSave, onCancel, loading }: {
  initial?: CharFormData; onSave: (d: CharFormData) => void; onCancel: () => void; loading?: boolean
}) {
  const [form, setForm] = useState<CharFormData>(initial ?? EMPTY)
  const f = (key: keyof CharFormData, rows?: number) => ({
    value: String(form[key]),
    onChange: (e: any) => setForm(p => ({ ...p, [key]: e.target.value })),
  })

  const valid = form.name && form.description && form.backstory && form.objectives && form.secrets && form.alibi

  return (
    <div className="card p-6 border-crime-red/20 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nome *</label>
          <input className="input" placeholder="Helena Voss" {...f('name')} />
        </div>
        <div>
          <label className="label">URL Avatar (opcional)</label>
          <input className="input" placeholder="https://..." {...f('avatarUrl')} />
        </div>
      </div>

      <div>
        <label className="label">Descrição curta *</label>
        <input className="input" placeholder="Secretária há 15 anos, discreta e eficiente" {...f('description')} />
      </div>

      <div>
        <label className="label">Backstory *</label>
        <textarea className="input resize-none" rows={3} placeholder="A história de vida da personagem..." {...f('backstory')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Objetivos *</label>
          <textarea className="input resize-none" rows={2} placeholder="O que esta personagem quer alcançar..." {...f('objectives')} />
        </div>
        <div>
          <label className="label">Segredos *</label>
          <textarea className="input resize-none" rows={2} placeholder="O que esta personagem esconde..." {...f('secrets')} />
        </div>
      </div>

      <div>
        <label className="label">Álibi *</label>
        <input className="input" placeholder="Onde estava no momento do crime?" {...f('alibi')} />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-red-600"
            checked={form.isKiller} onChange={e => setForm(p => ({ ...p, isKiller: e.target.checked, isDetective: e.target.checked ? false : p.isDetective }))} />
          <span className="text-sm text-red-400 font-medium">💀 É o culpado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-blue-500"
            checked={form.isDetective} onChange={e => setForm(p => ({ ...p, isDetective: e.target.checked, isKiller: e.target.checked ? false : p.isKiller }))} />
          <span className="text-sm text-blue-400">🔍 É detetive</span>
        </label>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="btn-secondary text-sm py-2">Cancelar</button>
        <button onClick={() => valid && onSave(form)} disabled={loading || !valid} className="btn-primary text-sm py-2 gap-2">
          {loading && <Loader2 size={13} className="animate-spin" />} Guardar Personagem
        </button>
      </div>
    </div>
  )
}

export default function BuilderCharactersPage({ params }: { params: { id: string } }) {
  const { id } = params

  const { data: submission } = useBuilderCase(id)
  const createCharacter = useCreateCharacter(id)
  const updateCharacter = useUpdateCharacter(id)
  const deleteCharacter = useDeleteCharacter(id)

  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const characters = submission?.case?.characters ?? []
  const isEditable = !submission || ['draft', 'rejected'].includes(submission?.status)
  const hasKiller = characters.some((c: any) => c.isKiller)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-1">Passo 3</p>
          <h2 className="text-2xl font-bold text-crime-text-primary">Personagens</h2>
          <p className="text-crime-text-muted text-sm mt-1">Cria os participantes do caso</p>
        </div>
        {isEditable && !showAdd && (
          <button onClick={() => setShowAdd(true)} className="btn-primary gap-2 text-sm">
            <Plus size={14} /> Add Personagem
          </button>
        )}
      </div>

      {/* Checklist */}
      <div className="card p-4 mb-6 space-y-1.5">
        {[
          { check: characters.length >= 2, label: 'Pelo menos 2 personagens' },
          { check: hasKiller,              label: '1 personagem marcada como culpado' },
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
          <CharacterForm
            loading={createCharacter.isPending}
            onCancel={() => setShowAdd(false)}
            onSave={(d) => createCharacter.mutate({ ...d, caseId: id }, { onSuccess: () => setShowAdd(false) })}
          />
        </div>
      )}

      {/* Character list */}
      <div className="space-y-3 mb-6">
        {characters.length === 0 && !showAdd && (
          <div className="card p-10 text-center">
            <p className="text-crime-text-faint text-sm">Nenhuma personagem criada. Adiciona pelo menos 2.</p>
          </div>
        )}
        {characters.map((char: any) => (
          editingId === char.id ? (
            <CharacterForm
              key={char.id}
              initial={{ name: char.name, description: char.description, backstory: char.backstory, objectives: char.objectives, secrets: char.secrets, alibi: char.alibi, isKiller: char.isKiller, isDetective: char.isDetective, avatarUrl: char.avatarUrl ?? '' }}
              loading={updateCharacter.isPending}
              onCancel={() => setEditingId(null)}
              onSave={(d) => updateCharacter.mutate({ id: char.id, data: d }, { onSuccess: () => setEditingId(null) })}
            />
          ) : (
            <div key={char.id} className={clsx('card p-4 flex items-start gap-4', char.isKiller && 'border-red-800/30')}>
              <div className="w-10 h-10 rounded-full bg-crime-black border border-crime-border flex items-center justify-center overflow-hidden shrink-0">
                {char.avatarUrl ? <img src={char.avatarUrl} className="w-full h-full object-cover" /> : <span className="font-bold text-crime-text-faint">{char.name[0]}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <p className="font-bold text-crime-text-primary text-sm">{char.name}</p>
                  {char.isKiller    && <span className="badge bg-red-950 text-red-400 text-[9px]">💀 Culpado</span>}
                  {char.isDetective && <span className="badge bg-blue-950 text-blue-400 text-[9px]">🔍 Detetive</span>}
                </div>
                <p className="text-xs text-crime-text-muted line-clamp-1">{char.description}</p>
                <p className="text-[10px] text-crime-text-faint mt-1 italic">Álibi: {char.alibi}</p>
              </div>
              {isEditable && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditingId(char.id)} className="btn-ghost p-1.5 rounded"><Pencil size={13} /></button>
                  <button onClick={() => { if (confirm(`Eliminar "${char.name}"?`)) deleteCharacter.mutate(char.id) }}
                    className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          )
        ))}
      </div>

      <div className="flex justify-end">
        <Link href={`/dashboard/builder/${id}/evidence`} className="btn-primary gap-2">
          Próximo: Evidências <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
