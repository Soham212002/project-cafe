'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ShoppingCart, Plus, Minus, Coffee } from 'lucide-react'

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  available: boolean
}

interface Category {
  id: number
  name: string
  emoji: string
  menu_items: MenuItem[]
}

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { items, addItem, updateQuantity, getTotal } = useCart()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchMenu()
  }, [])

  async function fetchMenu() {
    const { data } = await supabase
      .from('categories')
      .select('*, menu_items(*)')
      .eq('menu_items.available', true)
      .order('sort_order')

    if (data) {
      setCategories(data)
      setActiveCategory(data[0]?.id)
    }
    setLoading(false)
  }

  const getItemQuantity = (id: number) =>
    items.find((i) => i.id === id)?.quantity || 0

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)

  if (loading) return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <Coffee className="animate-spin text-amber-600" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">☕ Café Menu</h1>
          <p className="text-amber-200 text-sm">Order fresh, served fast</p>
        </div>
        <button
          onClick={() => router.push('/order')}
          className="relative bg-amber-600 hover:bg-amber-500 px-4 py-2 rounded-full flex items-center gap-2 transition"
        >
          <ShoppingCart size={20} />
          <span className="font-semibold">₹{getTotal().toFixed(2)}</span>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </header>

      {/* Category Tabs */}
      <div className="bg-white shadow-sm sticky top-16 z-10 overflow-x-auto">
        <div className="flex px-4 gap-2 py-3 min-w-max">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {categories
          .filter((cat) => cat.id === activeCategory)
          .map((cat) => (
            <div key={cat.id}>
              <h2 className="text-xl font-bold text-amber-900 mb-4">
                {cat.emoji} {cat.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cat.menu_items?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden flex gap-4 p-4 hover:shadow-md transition"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-amber-800 text-lg">
                          ₹{item.price}
                        </span>
                        {getItemQuantity(item.id) === 0 ? (
                          <button
                            onClick={() => addItem(item)}
                            className="bg-amber-800 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-amber-700 transition"
                          >
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
                              className="bg-amber-100 text-amber-800 w-7 h-7 rounded-full flex items-center justify-center hover:bg-amber-200"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-amber-800 w-4 text-center">
                              {getItemQuantity(item.id)}
                            </span>
                            <button
                              onClick={() => addItem(item)}
                              className="bg-amber-800 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-amber-700"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </main>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20">
          <button
            onClick={() => router.push('/order')}
            className="bg-amber-800 text-white px-8 py-4 rounded-full shadow-2xl font-semibold flex items-center gap-3 hover:bg-amber-700 transition text-lg"
          >
            <ShoppingCart size={22} />
            View Cart ({totalItems} items) — ₹{getTotal().toFixed(2)}
          </button>
        </div>
      )}
    </div>
  )
}