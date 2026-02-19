'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ArrowLeft, Users } from 'lucide-react'

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
        <div className="min-h-screen bg-amber-50">
            {/* Header */}
            <header className="bg-amber-900 text-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => router.push('/order')}>
                    <ArrowLeft size={22} />
                </button>
                <div>
                    <h1 className="text-xl font-bold">Select Your Table</h1>
                    <p className="text-amber-200 text-sm">Choose where you'd like to sit</p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Legend */}
                <div className="flex gap-4 mb-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-800"></div>
                        <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white border-2 border-amber-300"></div>
                        <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-200"></div>
                        <span className="text-gray-600">Occupied</span>
                    </div>
                </div>

                {/* Cafe Layout */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <p className="text-center text-gray-400 text-xs mb-6 uppercase tracking-widest">
                        — Entrance —
                    </p>

                    {loading ? (
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-4">
                            {tables.map((table) => (
                                <button
                                    key={table.id}
                                    onClick={() => handleSelect(table)}
                                    disabled={!table.is_available}
                                    className={`
                    relative p-3 rounded-xl border-2 flex flex-col items-center gap-1
                    transition-all duration-200
                    ${selected === table.id
                                            ? 'bg-amber-800 border-amber-800 text-white scale-105 shadow-lg'
                                            : table.is_available
                                                ? 'bg-white border-amber-200 text-amber-800 hover:border-amber-400 hover:shadow-md cursor-pointer'
                                                : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                        }
                  `}
                                >
                                    <span className="text-lg font-bold">{table.table_number}</span>
                                    <div className="flex items-center gap-1">
                                        <Users size={10} />
                                        <span className="text-xs">{table.capacity}</span>
                                    </div>
                                    {!table.is_available && (
                                        <span className="text-xs">Occupied</span>
                                    )}
                                    {selected === table.id && (
                                        <span className="text-xs">Selected</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest">
                        — Counter —
                    </p>
                </div>

                {/* Selected Table Info */}
                {selected && (
                    <div className="bg-amber-100 border border-amber-300 rounded-2xl p-4 mb-4 text-center">
                        <p className="text-amber-800 font-semibold">
                            Table {tables.find(t => t.id === selected)?.table_number} selected
                        </p>
                        <p className="text-amber-600 text-sm">
                            Seats up to {tables.find(t => t.id === selected)?.capacity} people
                        </p>
                    </div>
                )}
            </main>

            {/* Continue Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4">
                <button
                    onClick={handleContinue}
                    disabled={!selected}
                    className="w-full bg-amber-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-amber-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {selected ? 'Proceed to Payment →' : 'Please select a table'}
                </button>
            </div>
        </div>
    )
}