'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Users, Settings, LogOut, Coffee, Hash, Tag, Menu, X } from 'lucide-react'
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

// Items shown in mobile bottom nav (most important ones)
const bottomNavItems = navItems.slice(0, 5)

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { settings } = useCafeSettings()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navigate = (href: string) => {
        router.push(href)
        setSidebarOpen(false)
    }

    const isActive = (href: string) =>
        pathname === href || (href !== '/admin' && pathname.startsWith(href))

    return (
        <div className="min-h-screen flex" style={{ background: '#0c0a09' }}>

            {/* ── Desktop Sidebar ── */}
            <aside
                className="hidden lg:flex w-64 flex-shrink-0 flex-col"
                style={{
                    background: 'rgba(28,25,23,0.6)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <SidebarContent
                    settings={settings}
                    pathname={pathname}
                    navigate={navigate}
                    handleLogout={handleLogout}
                    isActive={isActive}
                />
            </aside>

            {/* ── Mobile Drawer Overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    style={{ background: 'rgba(0,0,0,0.6)' }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Mobile Drawer ── */}
            <aside
                className="fixed top-0 left-0 h-full w-72 z-50 flex flex-col lg:hidden transition-transform duration-300"
                style={{
                    background: 'rgba(20,18,17,0.97)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    backdropFilter: 'blur(20px)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-stone-500 hover:text-stone-300 hover:bg-white/5 transition-all"
                >
                    <X size={18} />
                </button>

                <SidebarContent
                    settings={settings}
                    pathname={pathname}
                    navigate={navigate}
                    handleLogout={handleLogout}
                    isActive={isActive}
                />
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-auto flex flex-col min-h-screen">
                {/* Mobile top bar */}
                <header
                    className="lg:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-30"
                    style={{
                        background: 'rgba(12,10,9,0.9)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-200 hover:bg-white/5 transition-all"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                        >
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                                <Coffee size={14} className="text-stone-900" />
                            )}
                        </div>
                        <span className="font-extrabold text-stone-100 text-sm truncate">{settings.cafe_name}</span>
                    </div>

                    {/* Current page label */}
                    <span className="text-stone-600 text-xs shrink-0">
                        {navItems.find(n => isActive(n.href))?.label ?? 'Admin'}
                    </span>
                </header>

                {/* Page content — adds bottom padding on mobile for the tab bar */}
                <div className="flex-1 pb-20 lg:pb-0">
                    {children}
                </div>
            </main>

            {/* ── Mobile Bottom Tab Bar ── */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2"
                style={{
                    background: 'rgba(20,18,17,0.95)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(16px)',
                }}
            >
                {bottomNavItems.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                        <button
                            key={item.href}
                            onClick={() => navigate(item.href)}
                            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
                            style={{ color: active ? '#fbbf24' : '#57534e' }}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}

                {/* "More" button to open drawer for remaining items */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
                    style={{
                        color: navItems.slice(5).some(n => isActive(n.href)) ? '#fbbf24' : '#57534e'
                    }}
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </nav>
        </div>
    )
}

/* ── Shared sidebar content ── */
function SidebarContent({
    settings,
    pathname,
    navigate,
    handleLogout,
    isActive,
}: {
    settings: any
    pathname: string
    navigate: (href: string) => void
    handleLogout: () => void
    isActive: (href: string) => boolean
}) {
    return (
        <>
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
                <div className="min-w-0">
                    <h1 className="font-extrabold text-stone-100 text-lg leading-tight truncate">{settings.cafe_name}</h1>
                    <p className="text-stone-600 text-xs">Admin Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                        <button
                            key={item.href}
                            onClick={() => navigate(item.href)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                                background: active ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))' : 'transparent',
                                color: active ? '#fbbf24' : '#78716c',
                                border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
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
        </>
    )
}