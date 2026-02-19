'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ShoppingCart, Plus, Minus, Coffee, Search, X, History, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCafeSettings } from '@/hooks/useCafeSettings'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { items, addItem, updateQuantity, getTotal } = useCart()
  const router = useRouter()
  const supabase = createClient()
  const { settings } = useCafeSettings()

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

  const handleAddItem = (item: MenuItem) => {
    addItem({ ...item, quantity: 1 })
    toast.success(`${item.name} added to cart`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filter items based on search
  const getFilteredItems = () => {
    if (!searchQuery.trim()) return null
    const query = searchQuery.toLowerCase()
    const allItems: MenuItem[] = []
    categories.forEach(cat => {
      cat.menu_items?.forEach(item => {
        if (item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)) {
          allItems.push(item)
        }
      })
    })
    return allItems
  }

  const filteredItems = getFilteredItems()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0a09' }}>
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 30px rgba(245,158,11,0.3)' }}>
          <Coffee size={30} className="text-stone-900" />
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: `float 1s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0c0a09' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 animate-slide-in-down"
        style={{
          background: 'linear-gradient(180deg, rgba(12,10,9,0.98) 0%, rgba(12,10,9,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold gradient-text">{settings.cafe_name}</h1>
            <p className="text-stone-500 text-xs mt-0.5">Order fresh, served fast</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Search size={18} className="text-stone-400" />
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              title="Order History"
            >
              <History size={18} className="text-stone-400" />
            </button>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              title="Logout"
            >
              <LogOut size={18} className="text-stone-400" />
            </button>
            <button
              onClick={() => router.push('/order')}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0c0a09',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
              }}
            >
              <ShoppingCart size={14} />
              <span>₹{getTotal().toFixed(0)}</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce-in"
                  style={{ background: '#ef4444' }}
                >
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3 animate-slide-in-down">
            <div className="max-w-4xl mx-auto relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-premium pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Category Tabs */}
      {!filteredItems && (
        <div className="sticky top-[73px] z-10 overflow-x-auto"
          style={{
            background: 'rgba(12,10,9,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex px-4 gap-2 py-3 min-w-max max-w-4xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap"
                style={{
                  background: activeCategory === cat.id
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'rgba(255,255,255,0.05)',
                  color: activeCategory === cat.id ? '#0c0a09' : '#a8a29e',
                  border: activeCategory === cat.id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: activeCategory === cat.id ? '0 4px 15px rgba(245,158,11,0.2)' : 'none',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-28">
        {filteredItems ? (
          // Search results
          <div>
            <p className="text-stone-500 text-sm mb-4">
              {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getItemQuantity(item.id)}
                  onAdd={() => handleAddItem(item)}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>
          </div>
        ) : (
          categories
            .filter((cat) => cat.id === activeCategory)
            .map((cat) => (
              <div key={cat.id} className="animate-fade-in">
                <h2 className="text-xl font-bold text-stone-200 mb-4">
                  {cat.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
                  {cat.menu_items?.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={getItemQuantity(item.id)}
                      onAdd={() => handleAddItem(item)}
                      onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                    />
                  ))}
                </div>
              </div>
            ))
        )}
      </main>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20">
          <button
            onClick={() => router.push('/order')}
            className="px-8 py-4 rounded-2xl font-bold flex items-center gap-3 text-lg animate-bounce-in transition-all"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0c0a09',
              boxShadow: '0 8px 40px rgba(245,158,11,0.4)',
            }}
          >
            <ShoppingCart size={22} />
            View Cart ({totalItems}) — ₹{getTotal().toFixed(0)}
          </button>
        </div>
      )}
    </div>
  )
}

function MenuItemCard({
  item,
  quantity,
  onAdd,
  onUpdateQuantity
}: {
  item: MenuItem
  quantity: number
  onAdd: () => void
  onUpdateQuantity: (qty: number) => void
}) {
  return (
    <div className="glass-card overflow-hidden flex gap-4 p-4 group">
      {item.image_url && (
        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-stone-100 truncate">{item.name}</h3>
        <p className="text-stone-500 text-sm mt-1 line-clamp-2">
          {item.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg gradient-text">
            ₹{item.price}
          </span>
          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0c0a09',
                boxShadow: '0 2px 10px rgba(245,158,11,0.2)',
              }}
            >
              Add +
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-scale-in">
              <button
                onClick={() => onUpdateQuantity(quantity - 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-stone-700"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <Minus size={14} className="text-stone-300" />
              </button>
              <span className="font-bold text-amber-400 w-5 text-center">
                {quantity}
              </span>
              <button
                onClick={onAdd}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 2px 10px rgba(245,158,11,0.3)',
                }}
              >
                <Plus size={14} className="text-stone-900" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url: string
  available: boolean
}
