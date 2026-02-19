'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clock, ChefHat, CheckCircle, ShoppingBag, Search, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [updating, setUpdating] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
        const channel = supabase
            .channel('admin-orders-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        id, order_number, status, total, created_at, table_id, user_id,
        profiles!orders_user_id_fkey (full_name, email),
        order_items (quantity, unit_price, menu_items (name))
      `)
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error('Orders fetch error:', error.message)
            const { data: simple } = await supabase
                .from('orders')
                .select('id, order_number, status, total, created_at, table_id, user_id')
                .order('created_at', { ascending: false })
                .limit(100)
            if (simple) setOrders(simple.map(o => ({ ...o, profiles: null, order_items: [] })) as any)
        } else if (data) {
            setOrders(data as any)
        }
        setLoading(false)
    }

    const updateStatus = async (orderId: string, currentStatus: string) => {
        const nextIndex = STATUS_FLOW.indexOf(currentStatus) + 1
        if (nextIndex >= STATUS_FLOW.length) return
        setUpdating(orderId)
        await supabase.from('orders').update({ status: STATUS_FLOW[nextIndex] }).eq('id', orderId)
        toast.success(`Order marked as ${STATUS_FLOW[nextIndex]}`)
        await fetchOrders()
        setUpdating(null)
    }

    const deleteOrder = async (orderId: string) => {
        if (!confirm('Delete this order?')) return
        await supabase.from('order_items').delete().eq('order_id', orderId)
        await supabase.from('orders').delete().eq('id', orderId)
        toast.success('Order deleted')
        fetchOrders()
    }

    const filtered = orders
        .filter(o => filter === 'all' || o.status === filter)
        .filter(o => {
            if (!search) return true
            const q = search.toLowerCase()
            return o.order_number?.toLowerCase().includes(q) ||
                o.profiles?.full_name?.toLowerCase().includes(q) ||
                o.profiles?.email?.toLowerCase().includes(q)
        })

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        served: orders.filter(o => o.status === 'served').length,
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-5 sm:mb-6 animate-fade-in-up">
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Orders</h1>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">Manage and track all orders</p>
            </div>

            {/* Search */}
            <div className="relative mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 z-10" />
                <input
                    type="text"
                    placeholder="Search order or customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-premium"
                    style={{ paddingLeft: '40px' }}
                />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
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
                            <span className="ml-1.5 opacity-70">{stats[s as keyof typeof stats]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Orders */}
            {loading ? (
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-20 sm:h-24 shimmer rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-stone-600">
                    <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No orders found</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {filtered.map((order) => {
                        const StatusIcon = STATUS_ICONS[order.status]
                        const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]
                        const isExpanded = expanded === order.id

                        return (
                            <div key={order.id} className="glass-card overflow-hidden">
                                <div className="p-3 sm:p-4">
                                    {/* Top row: order # + badge + price + actions */}
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <p className="text-base sm:text-lg font-black text-stone-100 shrink-0">
                                                {order.order_number}
                                            </p>
                                            <span className={`badge badge-${order.status} shrink-0`}>
                                                <StatusIcon size={11} />
                                                <span className="hidden xs:inline">{order.status}</span>
                                            </span>
                                        </div>

                                        {/* Actions: always top-right */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="font-bold text-amber-500 text-sm">
                                                ₹{order.total?.toFixed(0)}
                                            </span>
                                            <button
                                                onClick={() => setExpanded(isExpanded ? null : order.id)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                            >
                                                <Eye size={13} className="text-stone-400" />
                                            </button>
                                            {nextStatus && (
                                                <button
                                                    onClick={() => updateStatus(order.id, order.status)}
                                                    disabled={updating === order.id}
                                                    className="btn-primary px-2.5 py-1.5 text-xs"
                                                >
                                                    {updating === order.id ? '...' : `→ ${nextStatus}`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta row: table + customer + time */}
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-500">
                                        <span>Table {order.table_id}</span>
                                        <span className="truncate max-w-[140px] sm:max-w-none">
                                            {order.profiles?.full_name || order.profiles?.email || 'Guest'}
                                        </span>
                                        <span className="ml-auto sm:ml-0">
                                            {new Date(order.created_at).toLocaleString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded detail */}
                                {isExpanded && (
                                    <div
                                        className="px-3 sm:px-4 pb-4 animate-fade-in-up"
                                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                                    >
                                        <div className="pt-3 space-y-1.5">
                                            {order.order_items?.map((item, i) => (
                                                <div key={i} className="flex justify-between text-sm">
                                                    <span className="text-stone-400 truncate pr-4">
                                                        {item.menu_items?.name} × {item.quantity}
                                                    </span>
                                                    <span className="text-stone-300 shrink-0">
                                                        ₹{(item.unit_price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            className="flex justify-between items-center mt-3 pt-3"
                                            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                                        >
                                            <span className="text-stone-500 text-xs truncate pr-4">
                                                {order.profiles?.full_name || order.profiles?.email || 'Guest'}
                                            </span>
                                            <button
                                                onClick={() => deleteOrder(order.id)}
                                                className="text-red-400 text-xs hover:text-red-300 font-medium shrink-0"
                                            >
                                                Delete Order
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}