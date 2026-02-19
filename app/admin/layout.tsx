'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Users, Settings, LogOut, Coffee, Hash, Tag } from 'lucide-react'
import { useCafeSettings } from '@/hooks/useCafeSettings'

const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Menu', href: '/admin/menu', icon: UtensilsCrossed },
    { label: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { label: 'Tables', href: '/admin/tables', icon: Hash },
    { label: 'Coupons', href: '/admin/coupons', icon: Tag },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { settings } = useCafeSettings()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex" style={{ background: '#0c0a09' }}>
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 flex flex-col"
                style={{
                    background: 'rgba(28,25,23,0.6)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
                        }}
                    >
                        {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                            <Coffee size={20} className="text-stone-900" />
                        )}
                    </div>
                    <div>
                        <h1 className="font-extrabold text-stone-100 text-lg">{settings.cafe_name}</h1>
                        <p className="text-stone-600 text-xs">Admin Panel</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                        const Icon = item.icon
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                                style={{
                                    background: isActive ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))' : 'transparent',
                                    color: isActive ? '#fbbf24' : '#78716c',
                                    border: isActive ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                                }}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-stone-600 hover:text-red-400 hover:bg-red-900/10 transition-all"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}
