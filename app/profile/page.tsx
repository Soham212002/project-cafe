'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, ShoppingBag, LogOut, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Profile {
    full_name: string
    email: string
    role: string
    created_at: string
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [orderCount, setOrderCount] = useState(0)
    const [totalSpent, setTotalSpent] = useState(0)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => { fetchProfile() }, [])

    async function fetchProfile() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profile) setProfile(profile)

        const { data: orders } = await supabase
            .from('orders')
            .select('total')
            .eq('user_id', user.id)

        if (orders) {
            setOrderCount(orders.length)
            setTotalSpent(orders.reduce((sum, o) => sum + (o.total || 0), 0))
        }

        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success('Logged out')
        router.push('/login')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0a09' }}>
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: `float 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen" style={{ background: '#0c0a09' }}>
            <header className="sticky top-0 z-10 animate-slide-in-down"
                style={{
                    background: 'rgba(12,10,9,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/menu')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <ArrowLeft size={18} className="text-stone-400" />
                    </button>
                    <h1 className="text-xl font-bold text-stone-100">Profile</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 py-8">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center mb-8 animate-fade-in-up">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 8px 30px rgba(245,158,11,0.3)',
                        }}
                    >
                        <User size={36} className="text-stone-900" />
                    </div>
                    <h2 className="text-xl font-bold text-stone-100">{profile?.full_name || 'User'}</h2>
                    <p className="text-stone-500 text-sm flex items-center gap-1">
                        <Mail size={12} />
                        {profile?.email}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-black text-stone-100">{orderCount}</p>
                        <p className="text-stone-500 text-xs mt-1">Total Orders</p>
                    </div>
                    <div className="glass-card p-4 text-center">
                        <p className="text-2xl font-black gradient-text">₹{totalSpent.toFixed(0)}</p>
                        <p className="text-stone-500 text-xs mt-1">Total Spent</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={() => router.push('/orders')}
                        className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all hover:border-amber-900/50"
                    >
                        <ShoppingBag size={20} className="text-amber-500" />
                        <div>
                            <p className="font-medium text-stone-200 text-sm">Order History</p>
                            <p className="text-stone-600 text-xs">View and reorder past orders</p>
                        </div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full glass-card p-4 flex items-center gap-3 text-left transition-all"
                        style={{ borderColor: 'rgba(239,68,68,0.15)' }}
                    >
                        <LogOut size={20} className="text-red-400" />
                        <div>
                            <p className="font-medium text-red-400 text-sm">Logout</p>
                            <p className="text-stone-600 text-xs">Sign out of your account</p>
                        </div>
                    </button>
                </div>

                {/* Member since */}
                {profile?.created_at && (
                    <p className="text-center text-stone-700 text-xs mt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                )}
            </main>
        </div>
    )
}
