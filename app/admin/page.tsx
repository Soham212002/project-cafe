'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChefHat, CheckCircle, ShoppingBag, TrendingUp, Users, User, DollarSign } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  table_id: number
  profiles: { full_name: string; email: string } | null
  order_items: {
    quantity: number
    unit_price: number
    menu_items: { name: string }
  }[]
}

const STATUS_FLOW = ['pending', 'preparing', 'ready', 'served']

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  preparing: ChefHat,
  ready: CheckCircle,
  served: ShoppingBag
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    subscribeToOrders()
  }, [])

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, order_number, status, total, created_at, table_id, user_id,
        profiles!orders_user_id_fkey (full_name, email),
        order_items (
          quantity, unit_price,
          menu_items (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Dashboard fetch error:', error.message)
      const { data: simple } = await supabase
        .from('orders')
        .select('id, order_number, status, total, created_at, table_id, user_id')
        .order('created_at', { ascending: false })
        .limit(50)
      if (simple) setOrders(simple.map(o => ({ ...o, profiles: null, order_items: [] })) as any)
    } else if (data) {
      setOrders(data as any)
    }
    setLoading(false)
  }

  function subscribeToOrders() {
    supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => fetchOrders())
      .subscribe()
  }

  const updateStatus = async (orderId: string, currentStatus: string) => {
    const nextIndex = STATUS_FLOW.indexOf(currentStatus) + 1
    if (nextIndex >= STATUS_FLOW.length) return
    const nextStatus = STATUS_FLOW[nextIndex]

    setUpdating(orderId)
    await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', orderId)

    await fetchOrders()
    setUpdating(null)
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const stats = {
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    served: orders.filter(o => o.status === 'served').length,
  }

  const todayRevenue = orders
    .filter(o => {
      const d = new Date(o.created_at)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    })
    .reduce((sum, o) => sum + (o.total || 0), 0)

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in-up">
        <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Dashboard</h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8 stagger-children">
        {/* Revenue card — full width on mobile */}
        <div className="glass-card p-4 sm:p-5 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.15)' }}>
              <TrendingUp size={18} className="text-amber-500" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-stone-100">₹{todayRevenue.toFixed(0)}</p>
          <p className="text-stone-500 text-xs mt-1">Today's Revenue</p>
        </div>

        {[
          { label: 'Pending', key: 'pending', color: '#fbbf24', icon: Clock },
          { label: 'Preparing', key: 'preparing', color: '#60a5fa', icon: ChefHat },
          { label: 'Ready', key: 'ready', color: '#4ade80', icon: CheckCircle },
          { label: 'Served', key: 'served', color: '#a8a29e', icon: ShoppingBag },
        ].map(({ label, key, color, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key)}
            className="glass-card p-4 sm:p-5 text-left transition-all"
            style={{
              border: filter === key ? `1px solid ${color}40` : undefined,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-stone-100">{stats[key as keyof typeof stats]}</p>
            <p className="text-stone-500 text-xs mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {['all', 'pending', 'preparing', 'ready', 'served'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0"
            style={{
              background: filter === s ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
              color: filter === s ? '#0c0a09' : '#78716c',
              border: filter === s ? 'none' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span className="ml-1.5 opacity-70">
                {stats[s as keyof typeof stats]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 sm:h-32 shimmer rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 sm:py-20 text-stone-700">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredOrders.map((order) => {
            const StatusIcon = STATUS_ICONS[order.status]
            const isLastStatus = order.status === 'served'
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]

            return (
              <div key={order.id} className="glass-card p-4 sm:p-5">
                {/* Top row: order number + badge + action */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-lg sm:text-xl font-black text-stone-100 shrink-0">
                      {order.order_number}
                    </span>
                    <span className={`badge badge-${order.status} shrink-0`}>
                      <StatusIcon size={11} />
                      <span className="hidden xs:inline">{order.status.toUpperCase()}</span>
                      <span className="xs:hidden">{order.status.slice(0, 4).toUpperCase()}</span>
                    </span>
                    <span className="text-stone-600 text-xs shrink-0">
                      Table {order.table_id}
                    </span>
                  </div>

                  {/* Action button — always visible top-right */}
                  <div className="shrink-0">
                    {!isLastStatus ? (
                      <button
                        onClick={() => updateStatus(order.id, order.status)}
                        disabled={updating === order.id}
                        className="btn-primary px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap"
                      >
                        {updating === order.id
                          ? 'Updating...'
                          : (
                            <>
                              <span className="hidden sm:inline">
                                Mark {nextStatus?.charAt(0).toUpperCase() + nextStatus?.slice(1)} →
                              </span>
                              <span className="sm:hidden">
                                → {nextStatus?.charAt(0).toUpperCase() + nextStatus?.slice(1)}
                              </span>
                            </>
                          )
                        }
                      </button>
                    ) : (
                      <span className="text-xs sm:text-sm font-medium flex items-center gap-1" style={{ color: '#4ade80' }}>
                        <CheckCircle size={13} />
                        <span className="hidden sm:inline">Completed</span>
                        <span className="sm:hidden">Done</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {order.order_items?.map((item, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#a8a29e' }}
                    >
                      {item.menu_items?.name} × {item.quantity}
                    </span>
                  ))}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                  <span className="flex items-center gap-1">
                    <User size={11} />
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {order.profiles?.full_name || order.profiles?.email || 'Customer'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(order.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span className="font-semibold text-amber-500 ml-auto sm:ml-0">
                    ₹{order.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}