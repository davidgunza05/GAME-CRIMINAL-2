'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, Shield } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useAuthStore } from '@/store/auth.store'
import KpiCard from '@/components/admin/KpiCard'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import ActivityFeed from '@/components/admin/ActivityFeed'
import { formatPrice } from '@/lib/shop.utils'

const PERIODS = [{ label: '7 dias', value: 7 }, { label: '30 dias', value: 30 }, { label: '90 dias', value: 90 }]

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-5">{title}</p>
      {children}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore()
  const [days, setDays] = useState(30)

  const { data, isLoading, refetch, isFetching } = useAnalytics(days)

  const kpis = data?.kpis

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield size={18} className="text-crime-red" />
            <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red">Administração</p>
          </div>
          <h1 className="text-3xl font-bold text-crime-text-primary">Dashboard</h1>
          {data?.generatedAt && (
            <p className="text-xs text-crime-text-faint font-mono mt-1">
              Atualizado: {new Date(data.generatedAt).toLocaleTimeString('pt-PT')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {PERIODS.map(({ label, value }) => (
              <button key={value} onClick={() => setDays(value)}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${days === value ? 'bg-crime-red text-white' : 'bg-crime-surface border border-crime-border text-crime-text-faint hover:border-crime-red/40'}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary p-2">
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="text-crime-red animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="👥" label="Utilizadores" value={kpis?.users.total?.toLocaleString('pt-PT') ?? '—'} sub={`+${kpis?.users.thisMonth ?? 0} este mês`} pctChange={kpis?.users.pctChange} accent="#2980B9" delay={0} />
            <KpiCard icon="💰" label="Receita" value={formatPrice(kpis?.revenue.total ?? 0)} sub={`${formatPrice(kpis?.revenue.thisMonth ?? 0)} este mês`} pctChange={kpis?.revenue.pctChange} accent="#27AE60" delay={0.05} />
            <KpiCard icon="🛒" label="Encomendas" value={kpis?.orders.total?.toLocaleString('pt-PT') ?? '—'} sub={`+${kpis?.orders.thisMonth ?? 0} este mês`} pctChange={kpis?.orders.pctChange} accent="#E67E22" delay={0.1} />
            <KpiCard icon="🎮" label="Sessões Concluídas" value={kpis?.sessions.completed?.toLocaleString('pt-PT') ?? '—'} sub={`Taxa: ${kpis?.sessions.completionRate ?? 0}%`} accent="#8E44AD" delay={0.15} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon="📦" label="Casos Publicados" value={kpis?.cases.published ?? '—'} accent="#16A085" delay={0.2} />
            <KpiCard icon="⭐" label="XP Total" value={(kpis?.xp.totalAwarded ?? 0).toLocaleString('pt-PT')} accent="#F39C12" delay={0.22} />
            <KpiCard icon="⏱️" label="Tempo Médio" value={`${data?.avgSessionTime?.avgMinutes ?? 0} min`} sub={`${data?.avgSessionTime?.sessions ?? 0} sessões`} accent="#1ABC9C" delay={0.24} />
            <KpiCard icon="🔍" label="Sessões Ativas" value={kpis?.sessions.active ?? '—'} sub="Agora mesmo" accent="#C0392B" delay={0.26} />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Receita Diária">
              {data?.revenueChart && <LineChart data={data.revenueChart} lines={[{ key: 'revenue', label: 'Receita', color: '#27AE60' }]} formatY={(v) => `€${v.toFixed(0)}`} />}
            </ChartCard>
            <ChartCard title="Crescimento de Utilizadores">
              {data?.userGrowth && <LineChart data={data.userGrowth} lines={[{ key: 'newUsers', label: 'Novos', color: '#2980B9' }, { key: 'total', label: 'Total', color: '#8E44AD' }]} />}
            </ChartCard>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Sessões por Dia">
              {data?.sessionsChart && <LineChart data={data.sessionsChart} lines={[{ key: 'created', label: 'Criadas', color: '#8E44AD' }, { key: 'completed', label: 'Concluídas', color: '#27AE60' }]} />}
            </ChartCard>
            <ChartCard title="Drop-off de Sessões">
              {data?.dropOff && <BarChart data={data.dropOff.map((d: any) => ({ label: d.status, value: d.count, color: d.status === 'Concluída' ? '#27AE60' : d.status === 'Ativa' ? '#2980B9' : d.status === 'Cancelada' ? '#C0392B' : '#666' }))} />}
            </ChartCard>
            <ChartCard title="Retenção de Jogadores">
              {data?.retention && <BarChart data={data.retention.map((d: any) => ({ label: d.label, value: d.count, color: d.color }))} />}
            </ChartCard>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartCard title="Top Casos por Receita">
              <div className="space-y-3">
                {(data?.topCases ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-crime-text-faint font-mono text-xs w-4 shrink-0">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-crime-text-secondary truncate">{item.case?.title ?? '—'}</p>
                      <p className="text-xs text-crime-text-faint">{item.orders} encomendas</p>
                    </div>
                    <span className="font-mono font-bold text-sm text-crime-red shrink-0">{formatPrice(item.revenue)}</span>
                  </div>
                ))}
                {(!data?.topCases || data.topCases.length === 0) && (
                  <p className="text-crime-text-faint text-sm text-center py-4 italic">Sem dados de receita</p>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Suspeitos Mais Acusados">
              {data?.accusationStats && (() => {
                const map = new Map<string, number>()
                for (const a of data.accusationStats) {
                  const name = a.suspect?.name ?? '?'
                  map.set(name, (map.get(name) ?? 0) + a.count)
                }
                const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
                return <BarChart horizontal data={sorted.map(([label, value]) => ({ label, value, color: '#C0392B' }))} />
              })()}
            </ChartCard>

            <ChartCard title="Actividade Recente">
              {data?.activityFeed && <ActivityFeed events={data.activityFeed} />}
            </ChartCard>
          </div>

          {/* Stage completion */}
          {data?.stageCompletion && data.stageCompletion.length > 0 && (
            <ChartCard title="Conclusão por Stage">
              <div className="space-y-6">
                {data.stageCompletion.map((c: any) => (
                  <div key={c.caseId}>
                    <p className="text-xs font-mono text-crime-text-faint mb-3">{c.caseTitle}</p>
                    <div className="space-y-2">
                      {c.stages.map((s: any) => (
                        <div key={s.stageId} className="flex items-center gap-3">
                          <span className="font-mono text-xs text-crime-text-faint w-4 shrink-0">{s.order}</span>
                          <span className="text-xs text-crime-text-secondary w-32 truncate">{s.title}</span>
                          <div className="flex-1 h-2 bg-crime-black rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${s.reachedPct}%`, background: s.isLast ? '#C0392B' : '#2980B9', transition: 'width 0.7s ease' }} />
                          </div>
                          <span className="font-mono text-xs text-crime-text-faint w-10 text-right shrink-0">{s.reachedPct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  )
}
