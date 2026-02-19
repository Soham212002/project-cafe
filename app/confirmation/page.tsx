'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Clock, ArrowRight, Package } from 'lucide-react'

interface Order {
    id: string
    order_number: string
    status: string
    total: number
    created_at: string
    order_items: {
        quantity: number
        unit_price: number
        menu_items: { name: string }
    }[]
}

function ConfirmationContent() {
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const searchParams = useSearchParams()
    const router = useRouter()
    const supabase = createClient()
    const orderId = searchParams.get('order_id')

    useEffect(() => {
        if (orderId) fetchOrder()
    }, [orderId])

    async function fetchOrder() {
        const { data } = await supabase
            .from('orders')
            .select(`
        id, order_number, status, total, created_at,
        order_items (
          quantity, unit_price,
          menu_items (name)
        )
      `)
            .eq('id', orderId)
            .single()

        if (data) setOrder(data as any)
        setLoading(false)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0a09' }}>
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-amber-500" style={{ animation: `float 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0c0a09' }}>
            <div className="max-w-md w-full text-center">
                {/* Success Animation */}
                <div className="mb-8 animate-bounce-in">
                    <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4"
                        style={{
                            background: 'rgba(34,197,94,0.1)',
                            border: '2px solid rgba(34,197,94,0.3)',
                            boxShadow: '0 0 40px rgba(34,197,94,0.15)',
                        }}
                    >
                        <CheckCircle size={40} style={{ color: '#4ade80' }} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-stone-100 mb-2">Order Placed!</h1>
                    <p className="text-stone-500 text-sm">Your order has been confirmed</p>
                </div>

                {/* Order Details */}
                {order && (
                    <div className="glass-card p-6 mb-6 text-left animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-stone-500 text-xs uppercase tracking-wider">Order Number</p>
                                <p className="text-2xl font-black gradient-text">{order.order_number}</p>
                            </div>
                            <div className="badge badge-pending flex items-center gap-1">
                                <Clock size={12} />
                                {order.status.toUpperCase()}
                            </div>
                        </div>

                        <div className="space-y-2 mb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                            {order.order_items?.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-stone-400">{item.menu_items?.name} × {item.quantity}</span>
                                    <span className="text-stone-300">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between font-bold pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <span className="text-stone-200">Total Paid</span>
                            <span className="gradient-text">₹{order.total?.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Estimated Time */}
                <div className="glass-card p-4 mb-6 animate-fade-in-up" style={{
                    animationDelay: '0.3s',
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.15)',
                }}>
                    <div className="flex items-center justify-center gap-2 text-amber-500">
                        <Package size={18} />
                        <span className="font-medium text-sm">Estimated prep time: 10-15 minutes</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    <button
                        onClick={() => router.push('/orders')}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        Track Your Order
                        <ArrowRight size={18} />
                    </button>
                    <button
                        onClick={() => router.push('/menu')}
                        className="btn-secondary w-full"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0a09' }}>
                <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-3 h-3 rounded-full bg-amber-500" style={{ animation: `float 1s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                </div>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    )
}
