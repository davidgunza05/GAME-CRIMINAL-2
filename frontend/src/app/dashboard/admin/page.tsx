'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, Shield, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/auth.store'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'

type Role = 'admin' | 'organizer' | 'player'

export default function AdminUsersPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [page, setPage] = useState(1)

  // Redirect non-admins
  if (user && user.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const res = await api.get(`/users?${params}`)
      return res.data.data
    },
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.patch(`/users/${id}/active`, { isActive })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Estado do utilizador atualizado')
    },
    onError: () => toast.error('Erro ao atualizar utilizador'),
  })

  const changeRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      await api.patch(`/users/${id}/role`, { role })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Role atualizada')
    },
    onError: () => toast.error('Erro ao alterar role'),
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={18} className="text-crime-red" />
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red">Administração</p>
        </div>
        <h1 className="text-3xl font-bold text-crime-text-primary">Gestão de Utilizadores</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crime-text-faint" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Pesquisar por email, username..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-40"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as Role | ''); setPage(1) }}
        >
          <option value="">Todos os roles</option>
          <option value="admin">Admin</option>
          <option value="organizer">Organizer</option>
          <option value="player">Player</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">Utilizador</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">Role</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">Email</th>
                <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">Estado</th>
                <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 size={24} className="animate-spin text-crime-red mx-auto" />
                  </td>
                </tr>
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-crime-text-faint">
                    Nenhum utilizador encontrado
                  </td>
                </tr>
              ) : (
                data?.users?.map((u: any) => (
                  <tr key={u.id} className="border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-crime-red/15 border border-crime-red/20 flex items-center justify-center text-crime-red text-xs font-bold">
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-crime-text-primary font-medium">{u.displayName || u.username}</p>
                          <p className="text-xs text-crime-text-faint">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="bg-transparent text-xs border border-crime-border rounded px-2 py-1 text-crime-text-secondary"
                        value={u.role}
                        onChange={(e) => changeRole.mutate({ id: u.id, role: e.target.value as Role })}
                        disabled={u.id === user?.id}
                      >
                        <option value="player">player</option>
                        <option value="organizer">organizer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-crime-text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'badge',
                        u.isActive
                          ? 'bg-green-950 text-green-400'
                          : 'bg-red-950 text-red-400'
                      )}>
                        {u.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                        disabled={u.id === user?.id}
                        className="btn-ghost text-xs py-1.5 px-3 disabled:opacity-30"
                        title={u.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {u.isActive
                          ? <UserX size={14} className="text-red-400" />
                          : <UserCheck size={14} className="text-green-400" />
                        }
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
            <p className="text-xs text-crime-text-faint">
              {data.meta.total} utilizadores · página {page} de {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
