'use client'

import { useMemo } from 'react'

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  formatY?: (v: number) => string
  horizontal?: boolean
}

export default function BarChart({ data, height = 160, formatY, horizontal = false }: BarChartProps) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])

  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 10, color: '#666',
              width: 100, textAlign: 'right', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0
            }}>
              {d.label}
            </span>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 3, height: 20, overflow: 'hidden' }}>
              <div style={{
                width: `${(d.value / maxVal) * 100}%`,
                height: '100%',
                background: d.color ?? '#C0392B',
                borderRadius: 3,
                transition: 'width 0.6s ease',
                minWidth: d.value > 0 ? 4 : 0,
              }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#888', width: 48, flexShrink: 0 }}>
              {formatY ? formatY(d.value) : d.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Vertical bar chart (SVG)
  const W = 100
  const H = height
  const PAD = { top: 10, right: 4, bottom: 28, left: 32 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const barW  = (plotW / data.length) * 0.6
  const gap   = plotW / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }} preserveAspectRatio="none">
      {/* Y axis ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const val = maxVal * pct
        const y   = PAD.top + plotH * (1 - pct)
        return (
          <g key={pct}>
            <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
            <text x={PAD.left - 2} y={y + 2} textAnchor="end" fontSize="4" fill="#555" fontFamily="monospace">
              {formatY ? formatY(val) : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val.toFixed(0)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x   = PAD.left + i * gap + (gap - barW) / 2
        const barH = (d.value / maxVal) * plotH
        const y   = PAD.top + plotH - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH}
              fill={d.color ?? '#C0392B'} fillOpacity="0.8" rx="1.5" />
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fontSize="4" fill="#555" fontFamily="monospace">
              {d.label.length > 8 ? d.label.slice(0, 7) + '…' : d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
