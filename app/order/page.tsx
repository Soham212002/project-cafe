'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/store/cart'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ChevronRight } from 'lucide-react'

export default function OrderPage() {
  const { items, updateQuantity, removeItem, getTotal, coupon } = useCart()
  const router = useRouter()

  const subtotal = getTotal()
  const discount = coupon
    ? coupon.discount_type === 'percent'
      ? (subtotal * coupon.discount_value) / 100
      : coupon.discount_value
    : 0
  const total = subtotal - discount

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#0c0a09' }}>
      <div className="animate-float">
        <ShoppingBag size={60} className="text-stone-700" />
      </div>
      <h2 className="text-xl font-bold text-stone-300 animate-fade-in-up">Your cart is empty</h2>
      <p className="text-stone-600 text-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Add some delicious items from the menu</p>
      <button
        onClick={() => router.push('/menu')}
        className="btn-primary mt-2 animate-fade-in-up"
        style={{ animationDelay: '0.2s' }}
      >
        Browse Menu
      </button>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0c0a09' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 animate-slide-in-down"
        style={{
          background: 'rgba(12,10,9,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/menu')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={18} className="text-stone-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-100">Your Order</h1>
            <p className="text-stone-500 text-xs">{items.length} item{items.length !== 1 ? 's' : ''} in cart</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-40">
        {/* Items */}
        <div className="glass-card overflow-hidden mb-4">
          <div className="stagger-children">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 transition-all"
                style={{
                  borderBottom: index !== items.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-100 truncate">{item.name}</h3>
                  <p className="text-amber-500 font-bold">₹{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-stone-700"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <Minus size={14} className="text-stone-300" />
                  </button>
                  <span className="font-bold text-amber-400 w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      boxShadow: '0 2px 10px rgba(245,158,11,0.3)',
                    }}
                  >
                    <Plus size={14} className="text-stone-900" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-900/30"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="glass-card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-bold text-stone-200 mb-4 text-sm uppercase tracking-wider">Bill Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal</span>
              <span className="text-stone-300">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between" style={{ color: '#4ade80' }}>
                <span>Discount ({coupon.code})</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-400">
              <span>Taxes (5%)</span>
              <span className="text-stone-300">₹{(total * 0.05).toFixed(2)}</span>
            </div>
            <div className="pt-3 flex justify-between font-bold text-base"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-stone-200">Total</span>
              <span className="gradient-text text-lg">₹{(total * 1.05).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Add more items */}
        <button
          onClick={() => router.push('/menu')}
          className="w-full py-3 rounded-xl text-sm font-medium text-stone-500 transition-all hover:text-amber-400 hover:bg-stone-900 animate-fade-in-up"
          style={{ animationDelay: '0.3s', border: '1px dashed rgba(255,255,255,0.1)' }}
        >
          + Add more items
        </button>
      </main>

      {/* Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20"
        style={{
          background: 'linear-gradient(0deg, rgba(12,10,9,1) 0%, rgba(12,10,9,0.95) 80%, rgba(12,10,9,0) 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/table')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            Select Table
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
