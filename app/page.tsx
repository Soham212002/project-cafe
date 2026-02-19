'use client'

import { useRouter } from 'next/navigation'
import { Coffee, ArrowRight, Star, Clock, Shield } from 'lucide-react'
import { useCafeSettings } from '@/hooks/useCafeSettings'

export default function HomePage() {
  const router = useRouter()
  const { settings } = useCafeSettings()

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0c0a09' }}>
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #d97706 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Logo */}
        <div className="mb-8 animate-bounce-in">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 8px 40px rgba(245,158,11,0.4)',
            }}
          >
            <Coffee size={40} className="text-stone-900" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-center mb-4 animate-fade-in-up">
          <span className="gradient-text">{settings.cafe_name}</span>
          <span className="block text-stone-200 text-2xl md:text-3xl mt-2 font-semibold">
            Cafe & Kitchen
          </span>
        </h1>

        <p className="text-stone-500 text-center max-w-md mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Handcrafted beverages and artisan food, made with love. Order from your table and enjoy the experience.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => router.push('/menu')}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg py-4"
          >
            View Menu
            <ArrowRight size={20} />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="btn-secondary flex-1 text-lg py-4"
          >
            Sign In
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg w-full animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: Star, label: 'Premium Quality', desc: 'Best ingredients' },
            { icon: Clock, label: 'Fast Service', desc: '15 min or less' },
            { icon: Shield, label: 'Secure Payment', desc: 'SSL encrypted' },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <feature.icon size={20} className="text-amber-500" />
              </div>
              <p className="text-stone-200 text-xs font-semibold">{feature.label}</p>
              <p className="text-stone-600 text-[10px] mt-0.5">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-stone-700 text-xs animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        © 2025 {settings.cafe_name} · Crafted with care
      </footer>
    </div>
  )
}
