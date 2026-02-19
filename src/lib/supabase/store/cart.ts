import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
    id: number
    name: string
    price: number
    quantity: number
    image_url?: string
}

interface CartStore {
    items: CartItem[]
    tableId: number | null
    coupon: any
    addItem: (item: CartItem) => void
    removeItem: (id: number) => void
    updateQuantity: (id: number, quantity: number) => void
    clearCart: () => void
    setTable: (id: number) => void
    setCoupon: (c: any) => void
    getTotal: () => number
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            tableId: null,
            coupon: null,

            addItem: (item) => set((s) => {
                const exists = s.items.find((i) => i.id === item.id)
                return exists
                    ? {
                        items: s.items.map((i) => i.id === item.id
                            ? { ...i, quantity: i.quantity + 1 } : i)
                    }
                    : { items: [...s.items, { ...item, quantity: 1 }] }
            }),

            removeItem: (id) => set((s) => ({
                items: s.items.filter((i) => i.id !== id)
            })),

            updateQuantity: (id, quantity) => set((s) => ({
                items: quantity === 0
                    ? s.items.filter((i) => i.id !== id)
                    : s.items.map((i) => i.id === id ? { ...i, quantity } : i)
            })),

            clearCart: () => set({ items: [], tableId: null, coupon: null }),
            setTable: (id) => set({ tableId: id }),
            setCoupon: (c) => set({ coupon: c }),
            getTotal: () => get().items.reduce(
                (sum, i) => sum + i.price * i.quantity, 0
            ),
        }),
        { name: 'cafe-cart' }
    )
)