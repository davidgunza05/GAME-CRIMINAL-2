'use client'

import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart.store'
import CartSidebar from './CartSidebar'

export default function CartButton() {
  const [open, setOpen] = useState(false)
  const count = useCartStore((s) => s.itemCount())

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative btn-ghost p-2 rounded-md"
        title="Carrinho"
      >
        <ShoppingCart size={18} className="text-crime-text-muted" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-crime-red text-white text-[9px] font-bold flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      <CartSidebar open={open} onClose={() => setOpen(false)} />
    </>
  )
}
