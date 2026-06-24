import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, OrderItemType } from '@/types/shop'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (caseId: string, type: OrderItemType) => void
  updateQuantity: (caseId: string, type: OrderItemType, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          // Cada encomenda é um caso — 1 caso por checkout (regra de negócio)
          const isDuplicate = state.items.some(
            (i) => i.caseId === item.caseId && i.type === item.type
          )
          if (isDuplicate) return state

          // Casos pagos: não permitir mais de 1 por carrinho
          // (o utilizador faz checkout separado para cada caso)
          const hasPaidItem = state.items.some((i) => (i.unitPrice ?? 0) > 0)
          const isNewItemPaid = (item.unitPrice ?? 0) > 0
          if (hasPaidItem && isNewItemPaid) {
            // Substituir o item existente pelo novo
            return { items: [item] }
          }

          return { items: [...state.items, item] }
        })
      },

      removeItem: (caseId, type) => {
        set((state) => ({
          items: state.items.filter((i) => !(i.caseId === caseId && i.type === type)),
        }))
      },

      updateQuantity: (caseId, type, quantity) => {
        if (quantity <= 0) {
          get().removeItem(caseId, type)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.caseId === caseId && i.type === type ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'crime-game-cart' }
  )
)
