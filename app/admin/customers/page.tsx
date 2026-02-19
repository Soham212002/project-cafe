'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, User, ShoppingBag } from 'lucide-react'

interface Profile {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

interface OrderSummary {
    user_id: string
    order_count: number
    total_spent: number
}

export default function AdminCustomersPage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [orderSummaries, setOrderSummaries] = useState<Record<string, OrderSummary>>({})
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [expanded, setExpanded] = useState<string | null>(null)
    const [customerOrders, setCustomerOrders] = useState<any[]>([])
    const supabase = createClient()

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (profilesError) {
            console.error('Profiles fetch error:', profilesError.message)
            // Try without ordering by created_at
            const { data: fallback } = await supabase.from('profiles').select('*')
            if (fallback) setProfiles(fallback)
        } else if (profiles) {
            setProfiles(profiles)
        }

        // Get order summaries
        const { data: orders } = await supabase
            .from('orders')
            .select('user_id, total')

        if (orders) {
            const summaries: Record<string, OrderSummary> = {}
            orders.forEach((o: any) => {
                if (!summaries[o.user_id]) {
                    summaries[o.user_id] = { user_id: o.user_id, order_count: 0, total_spent: 0 }
                }
                summaries[o.user_id].order_count++
                summaries[o.user_id].total_spent += o.total || 0
            })
            setOrderSummaries(summaries)
        }

        setLoading(false)
    }

    async function viewCustomerOrders(userId: string) {
        if (expanded === userId) {
            setExpanded(null)
            return
        }
        const { data } = await supabase
            .from('orders')
            .select('id, order_number, status, total, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)
        setCustomerOrders(data || [])
        setExpanded(userId)
    }

    const filtered = profiles.filter(p => {
        if (!search) return true
        const q = search.toLowerCase()
        return p.full_name?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q)
    })

    return (
        <div className="p-6">
            <div className="mb-6 animate-fade-in-up">
                <h1 className="text-2xl font-extrabold text-stone-100">Customers</h1>
                <p className="text-stone-500 text-sm mt-1">{profiles.length} registered customers</p>
            </div>

            {/* Search */}
            <div className="relative mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 z-10" />
                <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-premium"
                    style={{ paddingLeft: '44px' }}
                />
            </div>

            {loading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 shimmer" />)}</div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-stone-600"><p>No customers found</p></div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {filtered.map((profile) => {
                        const summary = orderSummaries[profile.id]
                        const isExpanded = expanded === profile.id

                        return (
                            <div key={profile.id} className="glass-card overflow-hidden">
                                <div className="flex items-center justify-between p-4 cursor-pointer"
                                    onClick={() => viewCustomerOrders(profile.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))' }}
                                        >
                                            <User size={18} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-stone-100 text-sm">{profile.full_name || 'Unnamed'}</h3>
                                            <div className="flex items-center gap-1 text-stone-500 text-xs">
                                                <Mail size={10} />
                                                {profile.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-right">
                                        <div>
                                            <p className="text-stone-300 font-bold text-sm">{summary?.order_count || 0}</p>
                                            <p className="text-stone-600 text-xs">Orders</p>
                                        </div>
                                        <div>
                                            <p className="text-amber-500 font-bold text-sm">₹{(summary?.total_spent || 0).toFixed(0)}</p>
                                            <p className="text-stone-600 text-xs">Spent</p>
                                        </div>
                                        <span className="badge" style={{
                                            background: profile.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
                                            color: profile.role === 'admin' ? '#fbbf24' : '#78716c',
                                            border: profile.role === 'admin' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                        }}>
                                            {profile.role}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 animate-fade-in-up" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <p className="text-stone-500 text-xs py-3 uppercase tracking-wider font-medium">Recent Orders</p>
                                        {customerOrders.length === 0 ? (
                                            <p className="text-stone-600 text-sm py-2">No orders yet</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {customerOrders.map((order: any) => (
                                                    <div key={order.id} className="flex items-center justify-between py-2"
                                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <ShoppingBag size={14} className="text-stone-600" />
                                                            <span className="text-stone-300 text-sm font-medium">{order.order_number}</span>
                                                            <span className={`badge badge-${order.status}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs">
                                                            <span className="text-stone-500">
                                                                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                            <span className="text-amber-500 font-bold">₹{order.total?.toFixed(0)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-stone-600 text-xs mt-3">
                                            Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
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
