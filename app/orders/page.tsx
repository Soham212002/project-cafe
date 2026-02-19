'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ArrowLeft, Clock, CheckCircle, ChefHat, ShoppingBag, RotateCcw, Package } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
    id: string
    order_number: string
    status: string
    total: number
    created_at: string
    order_items: {
        quantity: number
        unit_price: number
        menu_item_id: number
        menu_items: { id: number; name: string; price: number; image_url: string }
    }[]
}

const STATUS_ICONS: Record<string, any> = {
    pending: Clock,
    preparing: ChefHat,
    ready: CheckCircle,
    served: ShoppingBag
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const { addItem } = useCart()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchOrders()
        // Subscribe to real-time status updates
        const channel = supabase
            .channel('user-orders')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => fetchOrders())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    async function fetchOrders() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('orders')
            .select(`
        id, order_number, status, total, created_at,
        order_items (
          quantity, unit_price, menu_item_id,
          menu_items (id, name, price, image_url)
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) setOrders(data as any)
        setLoading(false)
    }

    const handleReorder = (order: Order) => {
        order.order_items?.forEach((item) => {
            if (item.menu_items) {
                for (let i = 0; i < item.quantity; i++) {
                    addItem({
                        id: item.menu_items.id,
                        name: item.menu_items.name,
                        price: item.menu_items.price,
                        quantity: 1,
                        image_url: item.menu_items.image_url,
                    })
                }
            }
        })
        toast.success('Items added to cart!')
        router.push('/menu')
    }

    const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
    const pastOrders = orders.filter(o => o.status === 'served')

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
                        <h1 className="text-xl font-bold text-stone-100">My Orders</h1>
                        <p className="text-stone-500 text-xs">Track and reorder your meals</p>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-28 shimmer" />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="animate-float mb-4">
                            <Package size={48} className="text-stone-700 mx-auto" />
                        </div>
                        <h2 className="text-lg font-bold text-stone-300">No orders yet</h2>
                        <p className="text-stone-600 text-sm mt-1 mb-4">Your order history will appear here</p>
                        <button onClick={() => router.push('/menu')} className="btn-primary">
                            Browse Menu
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Active Orders */}
                        {activeOrders.length > 0 && (
                            <div className="mb-8 animate-fade-in-up">
                                <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'pulseGlow 2s infinite' }} />
                                    Active Orders
                                </h2>
                                <div className="space-y-3">
                                    {activeOrders.map((order) => {
                                        const StatusIcon = STATUS_ICONS[order.status] || Clock
                                        return (
                                            <div key={order.id} className="glass-card p-4 animate-pulse-glow"
                                                style={{ animationDuration: '3s' }}
                                                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-stone-100 text-lg">{order.order_number}</span>
                                                        <span className={`badge badge-${order.status}`}>
                                                            <StatusIcon size={12} />
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <span className="gradient-text font-bold">₹{order.total?.toFixed(0)}</span>
                                                </div>
                                                {expanded === order.id && (
                                                    <div className="mt-3 pt-3 space-y-1 animate-fade-in-up" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                        {order.order_items?.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-stone-400">{item.menu_items?.name} × {item.quantity}</span>
                                                                <span className="text-stone-300">₹{(item.unit_price * item.quantity).toFixed(0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Past Orders */}
                        {pastOrders.length > 0 && (
                            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-3">
                                    Past Orders
                                </h2>
                                <div className="space-y-3">
                                    {pastOrders.map((order) => (
                                        <div key={order.id} className="glass-card overflow-hidden">
                                            <div className="p-4 cursor-pointer" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="font-bold text-stone-200">{order.order_number}</span>
                                                        <p className="text-stone-600 text-xs mt-0.5">
                                                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-amber-500 font-bold text-sm">₹{order.total?.toFixed(0)}</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleReorder(order) }}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                                                            style={{
                                                                background: 'rgba(245,158,11,0.1)',
                                                                color: '#fbbf24',
                                                                border: '1px solid rgba(245,158,11,0.2)',
                                                            }}
                                                        >
                                                            <RotateCcw size={12} />
                                                            Reorder
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {expanded === order.id && (
                                                <div className="px-4 pb-4 animate-fade-in-up" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <div className="pt-3 space-y-1">
                                                        {order.order_items?.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-sm">
                                                                <span className="text-stone-400">{item.menu_items?.name} × {item.quantity}</span>
                                                                <span className="text-stone-300">₹{(item.unit_price * item.quantity).toFixed(0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
