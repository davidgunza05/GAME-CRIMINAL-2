'use client'

import { useState } from 'react'
import { Loader2, ChevronRight, Package, Laptop, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useMyOrders } from '@/hooks/useShop'
import { formatPrice, orderStatusMap, formatDate } from '@/lib/shop.utils'
import { clsx } from 'clsx'
import { Order } from '@/types/shop'

export default function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useMyOrders(page)

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Conta</p>
        <h1 className="text-3xl font-bold text-crime-text-primary">As Minhas Encomendas</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="text-crime-red animate-spin" />
        </div>
      ) : data?.orders?.length === 0 ? (
        <div className="card p-16 text-center">
          <span className="text-5xl mb-4 block">📦</span>
          <h2 className="text-xl font-bold text-crime-text-primary mb-2">Sem encomendas</h2>
          <p className="text-crime-text-muted text-sm mb-6">Ainda não fizeste nenhuma compra.</p>
          <Link href="/dashboard/cases" className="btn-primary inline-flex">Ver Casos</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.orders?.map((order: Order) => {
            const statusInfo = orderStatusMap[order.status]
            const hasPhysical = order.items?.some((i) => i.type === 'physical')

            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="card p-5 flex items-center gap-5 hover:border-crime-red/30 transition-all group"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-crime-black border border-crime-border flex items-center justify-center shrink-0">
                  {hasPhysical ? <Package size={16} className="text-crime-text-faint" /> : <Laptop size={16} className="text-crime-text-faint" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-crime-text-primary">{order.orderNumber}</span>
                    <span className={clsx('badge text-[10px]', statusInfo.color)}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-crime-text-faint truncate">
                    {order.items?.map((i) => i.case?.title).join(', ')}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-crime-text-faint">
                    <Calendar size={10} />
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                {/* Total + arrow */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-crime-text-primary">{formatPrice(order.total)}</p>
                  <p className="text-[10px] text-crime-text-faint mt-0.5">
                    {order.items?.length} {order.items?.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-crime-text-faint group-hover:text-crime-red transition-colors shrink-0" />
              </Link>
            )
          })}

          {/* Pagination */}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Anterior</button>
              <button onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Próxima →</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
