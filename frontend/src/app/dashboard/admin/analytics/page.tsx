'use client'

import { useState } from 'react'
import { Loader2, Download } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import LineChart from '@/components/charts/LineChart'
import BarChart from '@/components/charts/BarChart'
import { formatPrice } from '@/lib/shop.utils'

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useAnalytics(days)

  const exportCsv = (rows: any[], filename: string) => {
    if (!rows?.length) return
    const keys = Object.keys(rows[0])
    const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => r[k]).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="text-xs font-mono tracking-[0.3em] uppercase text-crime-red mb-2">Administração</p>
          <h1 className="text-3xl font-bold text-crime-text-primary">Analytics Detalhado</h1>
        </div>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${days === d ? 'bg-crime-red text-white' : 'bg-crime-surface border border-crime-border text-crime-text-faint hover:border-crime-red/40'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="text-crime-red animate-spin" /></div>
      ) : (
        <div className="space-y-6">
          {/* Revenue detailed */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Receita — {days} dias</p>
              <button onClick={() => exportCsv(data?.revenueChart, 'receita.csv')}
                className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
                <Download size={11} /> CSV
              </button>
            </div>
            {data?.revenueChart && (
              <>
                <LineChart data={data.revenueChart} height={220}
                  lines={[{ key: 'revenue', label: 'Receita (€)', color: '#27AE60' }]}
                  formatY={(v) => `€${v.toFixed(0)}`} />
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-crime-border">
                  {[
                    { label: 'Total período', value: formatPrice(data.revenueChart.reduce((s: number, d: any) => s + d.revenue, 0)) },
                    { label: 'Média diária', value: formatPrice(data.revenueChart.reduce((s: number, d: any) => s + d.revenue, 0) / data.revenueChart.length) },
                    { label: 'Melhor dia', value: formatPrice(Math.max(...data.revenueChart.map((d: any) => d.revenue))) },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="font-mono font-bold text-crime-red text-lg">{value}</p>
                      <p className="text-xs text-crime-text-faint font-mono uppercase tracking-widest mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Users detailed */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Crescimento de Utilizadores</p>
              <button onClick={() => exportCsv(data?.userGrowth, 'utilizadores.csv')}
                className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
                <Download size={11} /> CSV
              </button>
            </div>
            {data?.userGrowth && (
              <LineChart data={data.userGrowth} height={200}
                lines={[
                  { key: 'newUsers', label: 'Novos por dia', color: '#2980B9' },
                  { key: 'total',    label: 'Total acumulado', color: '#8E44AD' },
                ]} />
            )}
          </div>

          {/* Sessions detailed */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Volume de Sessões</p>
              <button onClick={() => exportCsv(data?.sessionsChart, 'sessoes.csv')}
                className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
                <Download size={11} /> CSV
              </button>
            </div>
            {data?.sessionsChart && (
              <>
                <LineChart data={data.sessionsChart} height={200}
                  lines={[
                    { key: 'created',   label: 'Criadas',    color: '#8E44AD' },
                    { key: 'completed', label: 'Concluídas', color: '#27AE60' },
                  ]} />
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-crime-border">
                  {[
                    { label: 'Criadas', value: data.sessionsChart.reduce((s: number, d: any) => s + d.created, 0) },
                    { label: 'Concluídas', value: data.sessionsChart.reduce((s: number, d: any) => s + d.completed, 0) },
                    { label: 'Taxa média', value: (() => {
                      const total = data.sessionsChart.reduce((s: number, d: any) => s + d.created, 0)
                      const done  = data.sessionsChart.reduce((s: number, d: any) => s + d.completed, 0)
                      return total > 0 ? `${Math.round((done / total) * 100)}%` : '0%'
                    })() },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="font-mono font-bold text-crime-text-primary text-lg">{value}</p>
                      <p className="text-xs text-crime-text-faint font-mono uppercase tracking-widest mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stage drop-off table */}
          {data?.stageCompletion && data.stageCompletion.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-crime-border">
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Taxa de Conclusão por Stage</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-crime-border bg-crime-black/50">
                      {['Caso', 'Stage', 'Ordem', 'Chegaram', '%', 'Final'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-mono uppercase tracking-widest text-crime-text-faint">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.stageCompletion.flatMap((c: any) =>
                      c.stages.map((s: any, i: number) => (
                        <tr key={s.stageId} className="border-b border-crime-border/50 hover:bg-crime-muted/10">
                          <td className="px-4 py-3 text-crime-text-muted">{i === 0 ? c.caseTitle : ''}</td>
                          <td className="px-4 py-3 text-crime-text-secondary">{s.title}</td>
                          <td className="px-4 py-3 font-mono text-crime-text-faint">{s.order}</td>
                          <td className="px-4 py-3 font-mono text-crime-text-primary">{s.reachedCount}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-crime-black rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${s.reachedPct}%`, background: s.isLast ? '#C0392B' : '#2980B9' }} />
                              </div>
                              <span className="font-mono text-xs text-crime-text-faint">{s.reachedPct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {s.isLast && <span className="badge bg-crime-red/15 text-crime-red text-[9px]">Final</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
