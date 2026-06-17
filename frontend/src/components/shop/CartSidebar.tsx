'use client'

import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useCartStore } from '@/store/cart.store'
import { formatPrice } from '@/lib/shop.utils'
import { OrderItemType } from '@/types/shop'

interface CartSidebarProps {
  open: boolean
  onClose: () => void
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-crime-surface border-l border-crime-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-crime-border">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-crime-red" />
                <span className="font-mono text-xs tracking-widest uppercase text-crime-text-secondary">
                  Carrinho
                </span>
                {itemCount() > 0 && (
                  <span className="w-5 h-5 rounded-full bg-crime-red text-white text-[10px] font-bold flex items-center justify-center">
                    {itemCount()}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5 rounded">
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-5 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <span className="text-5xl mb-4 opacity-30">🛒</span>
                  <p className="text-crime-text-faint text-sm">O teu carrinho está vazio</p>
                  <button onClick={onClose} className="btn-secondary mt-4 text-xs py-2">
                    Ver Casos
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.caseId}-${item.type}`}
                    className="card p-4 flex gap-3"
                  >
                    {/* Cover thumb */}
                    <div className="w-14 h-14 rounded bg-crime-black shrink-0 overflow-hidden flex items-center justify-center">
                      {item.coverImageUrl
                        ? <img src={item.coverImageUrl} alt={item.caseTitle} className="w-full h-full object-cover" />
                        : <span className="text-xl opacity-20">🔍</span>
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-crime-text-primary truncate">{item.caseTitle}</p>
                      <p className="text-[10px] text-crime-text-faint font-mono uppercase mt-0.5">
                        {item.type === 'digital' ? '💻 Digital' : '📦 Kit Físico'}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        {/* Qty controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.caseId, item.type as OrderItemType, item.quantity - 1)}
                            className="w-6 h-6 rounded border border-crime-border text-crime-text-faint hover:border-crime-red hover:text-crime-red transition-colors flex items-center justify-center"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="w-6 text-center text-xs text-crime-text-primary">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.caseId, item.type as OrderItemType, item.quantity + 1)}
                            className="w-6 h-6 rounded border border-crime-border text-crime-text-faint hover:border-crime-red hover:text-crime-red transition-colors flex items-center justify-center"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-crime-text-primary">
                            {formatPrice((item.unitPrice ?? 0) * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.caseId, item.type as OrderItemType)}
                            className="text-crime-text-faint hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-crime-border p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-crime-text-muted">Subtotal</span>
                  <span className="text-lg font-bold text-crime-text-primary">{formatPrice(total())}</span>
                </div>
                <p className="text-[10px] text-crime-text-faint">
                  Portes e cupões calculados no checkout
                </p>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  Finalizar Compra
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
