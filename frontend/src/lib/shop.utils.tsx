import { CaseDifficulty, CaseType, OrderStatus, PaymentStatus, ShippingStatus } from '@/types/shop'

// ─── Difficulty ───────────────────────────────────────────────────────────────

export const difficultyMap: Record<CaseDifficulty, { label: string; stars: number; color: string }> = {
  one:   { label: 'Iniciante',     stars: 1, color: 'text-green-400' },
  two:   { label: 'Fácil',         stars: 2, color: 'text-lime-400' },
  three: { label: 'Intermédio',    stars: 3, color: 'text-yellow-400' },
  four:  { label: 'Difícil',       stars: 4, color: 'text-orange-400' },
  five:  { label: 'Especialista',  stars: 5, color: 'text-red-400' },
}

export const DifficultyStars = ({ difficulty }: { difficulty: CaseDifficulty }) => {
  const { stars, color } = difficultyMap[difficulty]
  return (
    <span className={color} title={difficultyMap[difficulty].label}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  )
}

// ─── Case Type ────────────────────────────────────────────────────────────────

export const caseTypeMap: Record<CaseType, { label: string; icon: string }> = {
  digital:  { label: 'Digital',  icon: '💻' },
  physical: { label: 'Físico',   icon: '📦' },
  hybrid:   { label: 'Híbrido',  icon: '🔀' },
}

// ─── Price ────────────────────────────────────────────────────────────────────

export const formatPrice = (value?: number | string | null, currency = 'EUR'): string => {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency }).format(num)
}

// ─── Duration ─────────────────────────────────────────────────────────────────

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

// ─── Order Status ─────────────────────────────────────────────────────────────

export const orderStatusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending:    { label: 'Pendente',    color: 'bg-yellow-950 text-yellow-400' },
  paid:       { label: 'Pago',        color: 'bg-green-950 text-green-400' },
  processing: { label: 'A processar', color: 'bg-blue-950 text-blue-400' },
  shipped:    { label: 'Enviado',     color: 'bg-purple-950 text-purple-400' },
  delivered:  { label: 'Entregue',    color: 'bg-green-950 text-green-300' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-950 text-red-400' },
  refunded:   { label: 'Reembolsado', color: 'bg-gray-900 text-gray-400' },
}

export const paymentStatusMap: Record<PaymentStatus, { label: string; color: string }> = {
  pending:    { label: 'Pendente',    color: 'bg-yellow-950 text-yellow-400' },
  processing: { label: 'A processar', color: 'bg-blue-950 text-blue-400' },
  paid:       { label: 'Pago',        color: 'bg-green-950 text-green-400' },
  failed:     { label: 'Falhado',     color: 'bg-red-950 text-red-400' },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-950 text-red-400' },
  refunded:   { label: 'Reembolsado', color: 'bg-gray-900 text-gray-400' },
}

export const shippingStatusMap: Record<ShippingStatus, { label: string; color: string }> = {
  pending:   { label: 'Pendente',   color: 'bg-yellow-950 text-yellow-400' },
  preparing: { label: 'A preparar', color: 'bg-blue-950 text-blue-400' },
  shipped:   { label: 'Enviado',    color: 'bg-purple-950 text-purple-400' },
  delivered: { label: 'Entregue',   color: 'bg-green-950 text-green-400' },
  returned:  { label: 'Devolvido',  color: 'bg-gray-900 text-gray-400' },
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(date))
}
