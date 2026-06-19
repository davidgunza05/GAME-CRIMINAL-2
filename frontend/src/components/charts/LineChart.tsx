'use client'

import { useMemo } from 'react'

interface DataPoint {
  date: string
  [key: string]: string | number
}

interface LineChartProps {
  data: DataPoint[]
  lines: { key: string; label: string; color: string }[]
  height?: number
  dateFormat?: 'day' | 'month'
  formatY?: (v: number) => string
}

export default function LineChart({
  data, lines, height = 180, dateFormat = 'day', formatY
}: LineChartProps) {
  const W = 100 // viewBox units (percentage-based)
  const H = height
  const PAD = { top: 10, right: 4, bottom: 28, left: 36 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const { minY, maxY, xLabels } = useMemo(() => {
    const allVals = data.flatMap((d) => lines.map((l) => Number(d[l.key] ?? 0)))
    const minY = 0
    const maxY = Math.max(...allVals, 1)
    const step = Math.max(1, Math.floor(data.length / 6))
    const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)
    return { minY, maxY, xLabels }
  }, [data, lines])

  const toX = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * plotW
  const toY = (v: number) => PAD.top + plotH - ((v - minY) / (maxY - minY || 1)) * plotH

  const yTicks = useMemo(() => {
    const ticks = []
    const count = 4
    for (let i = 0; i <= count; i++) ticks.push(minY + ((maxY - minY) / count) * i)
    return ticks
  }, [minY, maxY])

  const formatDate = (s: string) => {
    const d = new Date(s)
    return dateFormat === 'day'
      ? d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
      : d.toLocaleDateString('pt-PT', { month: 'short' })
  }

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W + PAD.left + PAD.right} ${H}`}
        style={{ width: '100%', height: H, overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={toY(tick)}
              x2={PAD.left + plotW} y2={toY(tick)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"
            />
            <text
              x={PAD.left - 3} y={toY(tick) + 3}
              textAnchor="end"
              fontSize="5" fill="#555" fontFamily="monospace"
            >
              {formatY ? formatY(tick) : tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick.toFixed(0)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d)
          return (
            <text
              key={i}
              x={toX(idx)} y={H - 5}
              textAnchor="middle" fontSize="4.5"
              fill="#555" fontFamily="monospace"
            >
              {formatDate(d.date)}
            </text>
          )
        })}

        {/* Lines + areas */}
        {lines.map((line) => {
          const pts = data.map((d, i) => `${toX(i)},${toY(Number(d[line.key] ?? 0))}`)
          const polyline = pts.join(' ')
          const areaBottom = toY(minY)
          const firstX = toX(0)
          const lastX  = toX(data.length - 1)

          return (
            <g key={line.key}>
              {/* Area fill */}
              <polygon
                points={`${firstX},${areaBottom} ${polyline} ${lastX},${areaBottom}`}
                fill={line.color}
                fillOpacity="0.07"
              />
              {/* Line */}
              <polyline
                points={polyline}
                fill="none"
                stroke={line.color}
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Dots (only if few data points) */}
              {data.length <= 14 && data.map((d, i) => (
                <circle
                  key={i}
                  cx={toX(i)} cy={toY(Number(d[line.key] ?? 0))}
                  r="2" fill={line.color}
                  stroke="rgba(8,8,16,0.8)" strokeWidth="1"
                />
              ))}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      {lines.length > 1 && (
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4 }}>
          {lines.map((l) => (
            <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 2, background: l.color, borderRadius: 1 }} />
              <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
