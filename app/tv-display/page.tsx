'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChefHat, CheckCircle, Coffee } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  created_at: string
  order_items: { quantity: number; menu_items: { name: string } }[]
}

export default function TvDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('tv-display')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, created_at, order_items (quantity, menu_items (name))')
      .in('status', ['preparing', 'ready'])
      .order('created_at', { ascending: true })
    if (data) setOrders(data as any)
  }

  const preparing = orders.filter(o => o.status === 'preparing')
  const ready = orders.filter(o => o.status === 'ready')

  return (
    <div className="min-h-screen p-8" style={{ background: '#0c0a09' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
            }}
          >
            <Coffee size={24} className="text-stone-900" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-100">Order Status</h1>
        </div>
        <div className="text-stone-600 text-lg">
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Preparing */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.15)' }}
            >
              <ChefHat size={20} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100">Preparing</h2>
              <p className="text-stone-600 text-sm">{preparing.length} order{preparing.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-3">
            {preparing.length === 0 ? (
              <div className="glass-card p-8 text-center text-stone-700">
                <p>No orders being prepared</p>
              </div>
            ) : (
              preparing.map((order) => (
                <div key={order.id} className="glass-card p-5 animate-fade-in-up"
                  style={{ borderLeft: '3px solid #60a5fa' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-2xl font-black text-stone-100">{order.order_number}</h3>
                    <div className="w-3 h-3 rounded-full" style={{ background: '#60a5fa', animation: 'pulseGlow 2s infinite' }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {order.order_items?.map((item, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(96,165,250,0.1)', color: '#93c5fd' }}
                      >
                        {item.menu_items?.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ready */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.15)' }}
            >
              <CheckCircle size={20} style={{ color: '#4ade80' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100">Ready for Pickup</h2>
              <p className="text-stone-600 text-sm">{ready.length} order{ready.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="space-y-3">
            {ready.length === 0 ? (
              <div className="glass-card p-8 text-center text-stone-700">
                <p>No orders ready</p>
              </div>
            ) : (
              ready.map((order) => (
                <div key={order.id} className="glass-card p-5 animate-scale-in"
                  style={{
                    borderLeft: '3px solid #4ade80',
                    background: 'rgba(74,222,128,0.05)',
                    animation: 'pulseGlow 2s infinite',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-3xl font-black" style={{ color: '#4ade80' }}>{order.order_number}</h3>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg"
                      style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
                    >
                      Pick Up Now
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {order.order_items?.map((item, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(74,222,128,0.1)', color: '#86efac' }}
                      >
                        {item.menu_items?.name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
