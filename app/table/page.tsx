'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ArrowLeft, Users, ChevronRight } from 'lucide-react'

interface CafeTable {
  id: number
  table_number: number
  capacity: number
  is_available: boolean
}

export default function TablePage() {
  const [tables, setTables] = useState<CafeTable[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { setTable } = useCart()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTables()
  }, [])

  async function fetchTables() {
    const { data } = await supabase
      .from('cafe_tables')
      .select('*')
      .order('table_number')
    if (data) setTables(data)
    setLoading(false)
  }

  const handleSelect = (table: CafeTable) => {
    if (!table.is_available) return
    setSelected(table.id)
  }

  const handleContinue = () => {
    if (!selected) return
    setTable(selected)
    router.push('/payment')
  }

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
            onClick={() => router.push('/order')}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={18} className="text-stone-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-stone-100">Select Your Table</h1>
            <p className="text-stone-500 text-xs">Choose where you'd like to sit</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        {/* Legend */}
        <div className="flex gap-5 mb-6 text-xs animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }} />
            <span className="text-stone-500">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }} />
            <span className="text-stone-500">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-md bg-stone-800" />
            <span className="text-stone-500">Occupied</span>
          </div>
        </div>

        {/* Cafe Layout */}
        <div className="glass-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-center text-stone-600 text-xs mb-6 uppercase tracking-[0.2em] font-medium">
            ── Entrance ──
          </p>

          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-20 shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 stagger-children">
              {tables.map((table) => {
                const isSelected = selected === table.id
                const isAvailable = table.is_available

                return (
                  <button
                    key={table.id}
                    onClick={() => handleSelect(table)}
                    disabled={!isAvailable}
                    className="relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-300"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : isAvailable
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(255,255,255,0.02)',
                      border: isSelected
                        ? '2px solid #f59e0b'
                        : isAvailable
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid rgba(255,255,255,0.04)',
                      color: isSelected ? '#0c0a09' : isAvailable ? '#d6d3d1' : '#57534e',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: isSelected ? '0 8px 30px rgba(245,158,11,0.3)' : 'none',
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      opacity: isAvailable ? 1 : 0.5,
                    }}
                  >
                    <span className="text-lg font-bold">{table.table_number}</span>
                    <div className="flex items-center gap-1">
                      <Users size={10} />
                      <span className="text-xs">{table.capacity}</span>
                    </div>
                    {!isAvailable && (
                      <span className="text-[10px] uppercase tracking-wider">Occupied</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <p className="text-center text-stone-600 text-xs mt-6 uppercase tracking-[0.2em] font-medium">
            ── Counter ──
          </p>
        </div>

        {/* Selected Table Info */}
        {selected && (
          <div className="glass-card p-4 mb-4 text-center animate-scale-in"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <p className="text-amber-400 font-semibold">
              Table {tables.find(t => t.id === selected)?.table_number} selected
            </p>
            <p className="text-stone-500 text-sm">
              Seats up to {tables.find(t => t.id === selected)?.capacity} people
            </p>
          </div>
        )}
      </main>

      {/* Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-20"
        style={{
          background: 'linear-gradient(0deg, rgba(12,10,9,1) 0%, rgba(12,10,9,0.95) 80%, rgba(12,10,9,0) 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
          >
            {selected ? (
              <>
                Proceed to Payment
                <ChevronRight size={20} />
              </>
            ) : 'Please select a table'}
          </button>
        </div>
      </div>
    </div>
  )
}
