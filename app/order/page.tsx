'use client'

import { useRouter } from 'next/navigation'
import { useCart } from '@/store/cart'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center gap-4">
      <ShoppingBag size={60} className="text-amber-300" />
      <h2 className="text-xl font-bold text-amber-900">Your cart is empty</h2>
      <button
        onClick={() => router.push('/menu')}
        className="bg-amber-800 text-white px-6 py-3 rounded-full font-medium hover:bg-amber-700 transition"
      >
        Browse Menu
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <header className="bg-amber-900 text-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.push('/menu')}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Your Order</h1>
          <p className="text-amber-200 text-sm">{items.length} item(s)</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-40">
        {/* Items */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 p-4 ${
                index !== items.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-amber-700 font-bold">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="bg-amber-100 text-amber-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-200"
                >
                  <Minus size={14} />
                </button>
                <span className="font-bold text-gray-800 w-5 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="bg-amber-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-700"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h3 className="font-bold text-gray-800 mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({coupon.code})</span>
                <span>- ₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Taxes (5%)</span>
              <span>₹{(total * 0.05).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-gray-800 text-base">
              <span>Total</span>
              <span>₹{(total * 1.05).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Proceed Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
        <button
          onClick={() => router.push('/table')}
          className="w-full bg-amber-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-700 transition"
        >
          Select Table →
        </button>
      </div>
    </div>
  )
}
