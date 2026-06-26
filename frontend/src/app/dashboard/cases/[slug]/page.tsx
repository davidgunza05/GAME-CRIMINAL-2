'use client'

import { use } from 'react'
import {
  Users, Clock, Star, ShoppingCart, Package, ArrowLeft,
  Loader2, PlayCircle, Lock, CheckCircle, Gamepad2,
} from 'lucide-react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useCaseBySlug } from '@/hooks/useShop'
import { useCartStore } from '@/store/cart.store'
import { difficultyMap, caseTypeMap, formatPrice, formatDuration } from '@/lib/shop.utils'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export default function CaseDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { data: c, isLoading } = useCaseBySlug(slug)
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const user = useAuthStore((s) => s.user)

  // Verificar se utilizador já tem acesso a este caso
  const { data: accessData } = useQuery({
    queryKey: ['cases', slug, 'access'],
    queryFn: async () => {
      const res = await api.get(`/cases/${slug}/access`)
      return res.data.data as { hasAccess: boolean }
    },
    enabled: !!slug && !!user,
  })

  const hasAccess = accessData?.hasAccess ?? false
  const isInCart = c ? cartItems.some((i) => i.caseId === c.id) : false
  const isFree = c && (!c.priceDigital || Number(c.priceDigital) === 0)

  const handleAdd = (type: 'digital' | 'physical') => {
    if (hasAccess) {
      toast('Já tens acesso a este caso!', { icon: '✅' })
      return
    }
    const price = type === 'digital' ? c.priceDigital : c.pricePhysical
    const unitPrice = price ? parseFloat(String(price)) : 0
    const hasDifferentPaidItem = cartItems.some(
      (i) => i.caseId !== c.id && (i.unitPrice ?? 0) > 0
    )
    addItem({ caseId: c.id, type, quantity: 1, caseTitle: c.title, coverImageUrl: c.coverImageUrl, unitPrice })
    if (hasDifferentPaidItem) {
      toast(`Carrinho atualizado — substituído pelo caso "${c.title}"`, { icon: '🔄' })
    } else {
      toast.success(`"${c.title}" adicionado ao carrinho!`)
    }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 size={32} className="text-crime-red animate-spin" />
    </div>
  )

  if (!c) return (
    <div className="p-8 text-center">
      <p className="text-crime-text-muted">Caso não encontrado.</p>
      <Link href="/dashboard/cases" className="btn-secondary mt-4 inline-flex">← Voltar</Link>
    </div>
  )

  const diff = difficultyMap[c.difficulty as keyof typeof difficultyMap]
  const typeInfo = caseTypeMap[c.type as keyof typeof caseTypeMap]

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/dashboard/cases" className="btn-ghost text-sm mb-6 inline-flex gap-2">
        <ArrowLeft size={14} /> Voltar ao catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — cover + ação */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden aspect-[4/3] bg-crime-black flex items-center justify-center">
            {c.coverImageUrl
              ? <img src={c.coverImageUrl} alt={c.title} className="w-full h-full object-cover" />
              : <span className="text-6xl opacity-20">🔍</span>
            }
          </div>

          {/* Action box */}
          <div className="card p-5 space-y-4">

            {hasAccess || isFree ? (
              /* ── Tem acesso: mostrar botão de jogar ── */
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle size={15} />
                  <span>{isFree ? 'Caso Gratuito' : 'Caso Adquirido'}</span>
                </div>
                <Link
                  href={`/dashboard/sessions/new?caseId=${c.id}`}
                  className="btn-primary w-full gap-2 justify-center"
                >
                  <PlayCircle size={16} /> Criar Sessão
                </Link>
                <Link
                  href="/dashboard/sessions"
                  className="btn-ghost w-full text-sm text-center flex items-center justify-center gap-2"
                >
                  <Gamepad2 size={14} /> Ver Sessões
                </Link>
              </div>
            ) : (
              /* ── Sem acesso: mostrar opções de compra ── */
              <>
                <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint">Adquirir</p>

                {c.priceDigital && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-crime-text-muted flex items-center gap-1.5">
                        <ShoppingCart size={12} /> Digital
                      </span>
                      <span className="font-bold text-crime-text-primary">{formatPrice(c.priceDigital)}</span>
                    </div>
                    <button
                      onClick={() => handleAdd('digital')}
                      disabled={isInCart}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {isInCart ? '✓ No carrinho' : 'Comprar Digital'}
                    </button>
                  </div>
                )}

                {c.pricePhysical && (
                  <div className="space-y-2 pt-2 border-t border-crime-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-crime-text-muted flex items-center gap-1.5">
                        <Package size={12} /> Kit Físico
                      </span>
                      <span className="font-bold text-crime-text-primary">{formatPrice(c.pricePhysical)}</span>
                    </div>
                    <p className="text-[10px] text-crime-text-faint">+ €4,99 portes de envio</p>
                    <button
                      onClick={() => handleAdd('physical')}
                      disabled={isInCart}
                      className="btn-secondary w-full disabled:opacity-50"
                    >
                      {isInCart ? '✓ No carrinho' : 'Comprar Kit Físico'}
                    </button>
                  </div>
                )}

                {/* Aviso caso não tenha preço definido */}
                {!c.priceDigital && !c.pricePhysical && (
                  <div className="flex items-center gap-2 text-crime-text-faint text-sm">
                    <Lock size={14} />
                    <span>Brevemente disponível</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right — detalhes */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="badge bg-crime-muted text-crime-text-muted text-[10px]">
                {typeInfo.icon} {typeInfo.label}
              </span>
              {c.isFeatured && (
                <span className="badge bg-crime-red text-white text-[10px]">⭐ Destaque</span>
              )}
              {hasAccess && (
                <span className="badge bg-green-950 text-green-400 text-[10px] flex items-center gap-1">
                  <CheckCircle size={9} /> Adquirido
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-crime-text-primary mb-3">{c.title}</h1>

            <div className="flex flex-wrap items-center gap-5 text-sm text-crime-text-muted mb-4">
              <span className="flex items-center gap-1.5">
                <Star size={13} className={diff.color} />
                <span className={diff.color}>{diff.label}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={13} /> {c.minPlayers}–{c.maxPlayers} jogadores
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {formatDuration(c.estimatedMinutes)}
              </span>
            </div>

            {c.shortDescription && (
              <p className="text-crime-text-muted leading-relaxed text-sm mb-4">{c.shortDescription}</p>
            )}
          </div>

          {c.description && (
            <div className="card p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-crime-text-faint mb-4">Sobre o Caso</p>
              <p className="text-crime-text-muted leading-relaxed text-sm whitespace-pre-line">{c.description}</p>
            </div>
          )}

          {c.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {c.tags.map((tag: string) => (
                <span key={tag} className="badge bg-crime-muted text-crime-text-muted text-[10px]">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
