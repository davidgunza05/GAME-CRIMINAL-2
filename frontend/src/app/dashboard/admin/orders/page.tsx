'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Loader2, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { formatPrice, orderStatusMap, formatDate } from '@/lib/shop.utils'
import { OrderStatus } from '@/types/shop'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'processing', label: 'A processar' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
]

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', page, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      const res = await api.get(`/orders/admin/all?${params}`)
      return res.data.data
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/orders/admin/${id}/status`, { status })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast.success('Estado atualizado') },
    onError: () => toast.error('Erro ao atualizar estado'),
  })

  const confirmManual = useMutation({
    mutationFn: async ({ orderId, amount }: { orderId: string; amount: number }) => {
      await api.post('/orders/admin/payments/manual', { orderId, amount })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }); toast.success('Pagamento confirmado') },
    onError: () => toast.error('Erro ao confirmar pagamento'),
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">Gestão de Encomendas</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-crime-text-faint" />
          <input type="text" className="input pl-9" placeholder="Nº encomenda, email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-crime-border bg-crime-black/50">
                {['Encomenda', 'Cliente', 'Itens', 'Total', 'Estado', 'Data', 'Ações'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 size={24} className="animate-spin text-crime-red mx-auto" />
                </td></tr>
              ) : data?.orders?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-crime-text-faint">Nenhuma encomenda encontrada</td></tr>
              ) : (
                data?.orders?.map((order: any) => {
                  const statusInfo = orderStatusMap[order.status as OrderStatus]
                  const hasPhysical = order.items?.some((i: any) => i.type === 'physical')
                  const isPending = order.status === 'pending'

                  return (
                    <tr key={order.id} className="border-b border-crime-border/50 hover:bg-crime-muted/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasPhysical && <Package size={12} className="text-crime-text-faint" />}
                          <span className="font-mono text-xs text-crime-text-primary">{order.orderNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-crime-text-primary text-xs">{order.user?.email}</p>
                        <p className="text-[10px] text-crime-text-faint">@{order.user?.username}</p>
                      </td>
                      <td className="px-4 py-3 text-crime-text-muted text-xs">
                        {order.items?.length} {order.items?.length === 1 ? 'item' : 'itens'}
                      </td>
                      <td className="px-4 py-3 font-bold text-crime-text-primary">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="bg-transparent text-xs border border-crime-border rounded px-2 py-1"
                          value={order.status}
                          onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                        >
                          {STATUS_OPTIONS.filter(o => o.value).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-crime-text-faint text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              onClick={() => {
                                const amount = parseFloat(String(order.total))
                                if (confirm(`Confirmar pagamento manual de ${formatPrice(amount)}?`)) {
                                  confirmManual.mutate({ orderId: order.id, amount })
                                }
                              }}
                              className="text-[10px] bg-green-950 text-green-400 border border-green-800 px-2 py-1 rounded hover:bg-green-900 transition-colors"
                            >
                              Confirmar Pgto
                            </button>
                          )}
                          <Link href={`/dashboard/admin/orders/${order.id}`}
                            className="btn-ghost p-1.5 rounded text-crime-text-faint hover:text-crime-text-primary">
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-crime-border">
            <p className="text-xs text-crime-text-faint">{data.meta.total} encomendas · página {page}/{data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs py-1.5 px-3">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="btn-ghost text-xs py-1.5 px-3">Próxima →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
