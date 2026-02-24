'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Coffee, Eye, EyeOff, Sparkles } from 'lucide-react'
import { useCafeSettings } from '@/hooks/useCafeSettings'

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const router = useRouter()
    const supabase = createClient()
    const { settings } = useCafeSettings()

    const handleLogin = async () => {
        setLoading(true)
        setError('')
        setSuccess('')
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        // Check if email is confirmed
        if (authData.user && !authData.user.email_confirmed_at) {
            setError('Please verify your email before signing in. Check your inbox for the confirmation link.')
            await supabase.auth.signOut()
            setLoading(false)
            return
        }

        if (authData.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', authData.user.id)
                .single()

            if (profile?.role === 'admin') {
                router.push('/admin')
            } else {
                router.push('/menu')
            }
        }
        setLoading(false)
    }

    const handleRegister = async () => {
        setLoading(true)
        setError('')
        setSuccess('')
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        })
        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }
        if (data.user) {
            // Only insert profile if user was actually created (identities array will be empty if user already exists)
            if (data.user.identities && data.user.identities.length > 0) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    email,
                    full_name: name,
                    role: 'customer'
                })

                // Sign out immediately to prevent auto-login
                await supabase.auth.signOut()

                // Reset form and switch to login tab
                setEmail('')
                setPassword('')
                setName('')
                setIsLogin(true)
                setSuccess('Account created! Please check your email and click the confirmation link before signing in.')
            } else {
                // User already exists
                setError('An account with this email already exists. Please sign in or use a different email.')
                await supabase.auth.signOut()
            }
        }
        setLoading(false)
    }

    const switchTab = (login: boolean) => {
        setIsLogin(login)
        setError('')
        setSuccess('')
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4"
            style={{
                background: 'linear-gradient(135deg, #0c0a09 0%, #1c1917 30%, #292524 60%, #1c1917 100%)',
            }}
        >
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20"
                    style={{
                        background: 'radial-gradient(circle, #f59e0b, transparent)',
                        animation: 'float 6s ease-in-out infinite',
                    }}
                />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
                    style={{
                        background: 'radial-gradient(circle, #d97706, transparent)',
                        animation: 'float 8s ease-in-out infinite reverse',
                    }}
                />
                <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-10"
                    style={{
                        background: 'radial-gradient(circle, #fbbf24, transparent)',
                        animation: 'float 7s ease-in-out infinite 2s',
                    }}
                />
            </div>

            {/* Login Card */}
            <div className="glass-card w-full max-w-md p-8 animate-fade-in-up relative z-10"
                style={{ background: 'rgba(28, 25, 23, 0.8)' }}
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
                            style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.3)',
                            }}
                        >
                            <Coffee size={30} className="text-stone-900" />
                        </div>
                        <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-400" style={{ animation: 'pulseGlow 2s infinite' }} />
                    </div>
                    <h1 className="text-3xl font-extrabold gradient-text">{settings.cafe_name}</h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex rounded-xl p-1 mb-6 animate-fade-in-up"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        animationDelay: '0.15s',
                    }}
                >
                    <button
                        onClick={() => switchTab(true)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            background: isLogin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                            color: isLogin ? '#0c0a09' : '#78716c',
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => switchTab(false)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
                        style={{
                            background: !isLogin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                            color: !isLogin ? '#0c0a09' : '#78716c',
                        }}
                    >
                        Register
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {!isLogin && (
                        <div className="animate-fade-in-up">
                            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input-premium"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-premium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Your Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-premium pr-11"
                                onKeyDown={(e) => e.key === 'Enter' && (isLogin ? handleLogin() : handleRegister())}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-400 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Success */}
                    {success && (
                        <div className="animate-fade-in-up rounded-xl px-4 py-3 text-sm"
                            style={{
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                color: '#86efac',
                            }}
                        >
                            {success}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="animate-fade-in-up rounded-xl px-4 py-3 text-sm"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={isLogin ? handleLogin : handleRegister}
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2 text-base"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />
                        ) : (
                            isLogin ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </div>

                {/* Footer hint */}
                <p className="text-center text-stone-600 text-xs mt-6">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => switchTab(!isLogin)}
                        className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                    >
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    )
}
