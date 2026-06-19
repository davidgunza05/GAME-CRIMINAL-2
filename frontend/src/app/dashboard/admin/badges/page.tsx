'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Pencil } from 'lucide-react'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import api from '@/lib/api'

const RARITY_COLORS: Record<string, string> = {
  common:    'bg-crime-muted text-crime-text-faint',
  uncommon:  'bg-green-950 text-green-400',
  rare:      'bg-blue-950 text-blue-400',
  epic:      'bg-purple-950 text-purple-400',
  legendary: 'bg-yellow-950 text-yellow-400',
}

export default function AdminBadgesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editBadge, setEditBadge] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'badges'],
    queryFn: async () => {
      const r = await api.get('/game/admin/badges')
      return r.data.data.badges
    },
  })

  const deleteBadge = useMutation({
    mutationFn: async (id: string) => api.delete(`/game/admin/badges/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'badges'] }); toast.success('Badge eliminada') },
    onError: () => toast.error('Erro ao eliminar'),
  })

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">Badges</h1>
        </div>
        <button onClick={() => { setEditBadge(null); setShowForm(true) }} className="btn-primary gap-2">
          <Plus size={16} /> Nova Badge
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="text-crime-red animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(data ?? []).map((badge: any) => (
            <div key={badge.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{badge.icon}</span>
                <span className={clsx('badge text-[10px]', RARITY_COLORS[badge.rarity] ?? 'bg-crime-muted text-crime-text-faint')}>
                  {badge.rarity}
                </span>
              </div>
              <div>
                <p className="font-bold text-crime-text-primary text-sm">{badge.name}</p>
                <p className="text-xs text-crime-text-faint mt-1 leading-relaxed">{badge.description}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-crime-border">
                <span className="text-xs text-crime-text-faint font-mono">
                  {badge._count?.awards ?? 0} ganhas
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { setEditBadge(badge); setShowForm(true) }}
                    className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-crime-text-primary">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => {
                    if (confirm(`Eliminar badge "${badge.name}"?`)) deleteBadge.mutate(badge.id)
                  }} className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <BadgeFormModal
          badge={editBadge}
          onClose={() => { setShowForm(false); setEditBadge(null) }}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'badges'] })
            setShowForm(false)
            setEditBadge(null)
          }}
        />
      )}
    </div>
  )
}

function BadgeFormModal({ badge, onClose, onSaved }: {
  badge: any; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: badge?.name ?? '',
    description: badge?.description ?? '',
    icon: badge?.icon ?? '🏅',
    rarity: badge?.rarity ?? 'common',
    criteriaType: (badge?.criteria as any)?.type ?? 'sessions_played',
    criteriaThreshold: (badge?.criteria as any)?.threshold ?? 1,
    isActive: badge?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        icon: form.icon,
        rarity: form.rarity,
        criteria: { type: form.criteriaType, threshold: Number(form.criteriaThreshold) },
        isActive: form.isActive,
        slug: badge?.slug ?? form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }
      if (badge?.id) {
        await api.put(`/game/admin/badges/${badge.id}`, payload)
        toast.success('Badge atualizada')
      } else {
        await api.post('/game/admin/badges', payload)
        toast.success('Badge criada')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form, type: string = 'text') => ({
    value: String(form[key]),
    onChange: (e: any) => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value })),
  })

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-crime-surface border border-crime-border rounded-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-crime-text-primary mb-5">
          {badge ? 'Editar Badge' : 'Nova Badge'}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ícone (emoji)</label>
              <input className="input text-2xl text-center" maxLength={4} {...field('icon')} />
            </div>
            <div>
              <label className="label">Raridade</label>
              <select className="input" {...field('rarity')}>
                {['common','uncommon','rare','epic','legendary'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Nome</label>
            <input className="input" placeholder="Nome da badge" {...field('name')} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input resize-none" rows={2} placeholder="Critério descrito para o jogador" {...field('description')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de critério</label>
              <select className="input" {...field('criteriaType')}>
                {[
                  ['sessions_played','Sessões jogadas'],
                  ['sessions_solved','Casos resolvidos'],
                  ['correct_first','1ª tentativa'],
                  ['evidence_found','Evidências encontradas'],
                  ['total_xp','XP total'],
                  ['level','Nível'],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Threshold</label>
              <input className="input" type="number" min={1} {...field('criteriaThreshold', 'number')} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 accent-crime-red" />
            <span className="text-sm text-crime-text-secondary">Ativa</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {badge ? 'Guardar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
