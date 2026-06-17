'use client'

import { ShoppingBag, Gamepad2, Trophy, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

const stats = [
  { label: 'Casos Comprados', value: '0', icon: ShoppingBag, color: 'text-purple-400' },
  { label: 'Sessões Jogadas', value: '0', icon: Gamepad2, color: 'text-blue-400' },
  { label: 'Casos Resolvidos', value: '0', icon: Trophy, color: 'text-crime-red' },
  { label: 'XP Total', value: '0', icon: TrendingUp, color: 'text-green-400' },
]

export default function DashboardPage() {
  const { user } = useAuthStore()

  return (
    <div className="p-8">
      {/* Welcome */}
      <div className="mb-10">
        <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">
          Painel do Detetive
        </p>
        <h1 className="text-3xl font-bold text-crime-text-primary">
          Bem-vindo, {user?.displayName || user?.username}
        </h1>
        <p className="text-crime-text-muted mt-2">
          Pronto para resolver o próximo caso?
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">
                {label}
              </span>
              <Icon size={16} className={color} />
            </div>
            <p className="text-3xl font-bold text-crime-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold text-crime-text-primary mb-2">
          Nenhum caso em aberto
        </h2>
        <p className="text-sm text-crime-text-muted mb-6">
          Visita o catálogo de casos para começares a tua primeira investigação.
        </p>
        <a href="/dashboard/cases" className="btn-primary inline-flex">
          Ver Casos Disponíveis
        </a>
      </div>
    </div>
  )
}
