'use client'

import Link from 'next/link'
import { Users, Clock, ShoppingCart, Package } from 'lucide-react'
import { clsx } from 'clsx'
import { Case } from '@/types/shop'
import { difficultyMap, caseTypeMap, formatPrice, formatDuration } from '@/lib/shop.utils'
import { useCartStore } from '@/store/cart.store'
import toast from 'react-hot-toast'

interface CaseCardProps {
  case: Case
  className?: string
}

export default function CaseCard({ case: c, className }: CaseCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const diff = difficultyMap[c.difficulty]
  const typeInfo = caseTypeMap[c.type]

  const handleAddToCart = (type: 'digital' | 'physical', e: React.MouseEvent) => {
    e.preventDefault()
    const price = type === 'digital' ? c.priceDigital : c.pricePhysical
    addItem({
      caseId: c.id,
      type,
      quantity: 1,
      caseTitle: c.title,
      coverImageUrl: c.coverImageUrl,
      unitPrice: price ? parseFloat(String(price)) : 0,
    })
    toast.success(`"${c.title}" adicionado ao carrinho!`)
  }

  return (
    <Link
      href={`/dashboard/cases/${c.slug}`}
      className={clsx(
        'card group flex flex-col overflow-hidden hover:border-crime-red/30 transition-all duration-300',
        className
      )}
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] bg-crime-black overflow-hidden">
        {c.coverImageUrl ? (
          <img
            src={c.coverImageUrl}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">🔍</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="badge bg-crime-black/80 text-crime-text-muted text-[10px]">
            {typeInfo.icon} {typeInfo.label}
          </span>
          {c.isFeatured && (
            <span className="badge bg-crime-red text-white text-[10px]">
              ⭐ Destaque
            </span>
          )}
        </div>

        {/* Difficulty */}
        <div className="absolute top-3 right-3">
          <span className={clsx('text-sm', diff.color)} title={diff.label}>
            {'★'.repeat(diff.stars)}{'☆'.repeat(5 - diff.stars)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-bold text-crime-text-primary text-base leading-snug mb-2 group-hover:text-crime-red transition-colors">
          {c.title}
        </h3>

        {c.shortDescription && (
          <p className="text-xs text-crime-text-muted leading-relaxed mb-4 flex-1 line-clamp-2">
            {c.shortDescription}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-crime-text-faint mb-4">
          <span className="flex items-center gap-1">
            <Users size={11} />
            {c.minPlayers}–{c.maxPlayers}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {formatDuration(c.estimatedMinutes)}
          </span>
        </div>

        {/* Tags */}
        {c.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {c.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-crime-muted/50 text-crime-text-faint px-2 py-0.5 rounded font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Prices + CTA */}
        <div className="border-t border-crime-border pt-4 space-y-2">
          {c.priceDigital && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-crime-text-faint flex items-center gap-1">
                <ShoppingCart size={11} /> Digital
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-crime-text-primary">
                  {formatPrice(c.priceDigital)}
                </span>
                <button
                  onClick={(e) => handleAddToCart('digital', e)}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  Comprar
                </button>
              </div>
            </div>
          )}

          {c.pricePhysical && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-crime-text-faint flex items-center gap-1">
                <Package size={11} /> Kit Físico
              </span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-crime-text-primary">
                  {formatPrice(c.pricePhysical)}
                </span>
                <button
                  onClick={(e) => handleAddToCart('physical', e)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Comprar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
