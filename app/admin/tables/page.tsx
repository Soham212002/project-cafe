'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Check, Hash, Users as UsersIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface CafeTable {
    id: number
    table_number: number
    capacity: number
    is_available: boolean
}

export default function AdminTablesPage() {
    const [tables, setTables] = useState<CafeTable[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<CafeTable | null>(null)
    const [tableNum, setTableNum] = useState('')
    const [capacity, setCapacity] = useState('4')
    const supabase = createClient()

    useEffect(() => { fetchTables() }, [])

    async function fetchTables() {
        const { data } = await supabase
            .from('cafe_tables')
            .select('*')
            .order('table_number')
        if (data) setTables(data)
        setLoading(false)
    }

    const openForm = (table?: CafeTable) => {
        if (table) {
            setEditing(table)
            setTableNum(table.table_number.toString())
            setCapacity(table.capacity.toString())
        } else {
            setEditing(null)
            const nextNum = tables.length > 0 ? Math.max(...tables.map(t => t.table_number)) + 1 : 1
            setTableNum(nextNum.toString())
            setCapacity('4')
        }
        setShowForm(true)
    }

    const saveTable = async () => {
        if (!tableNum || !capacity) { toast.error('All fields are required'); return }
        const payload = {
            table_number: parseInt(tableNum),
            capacity: parseInt(capacity),
            is_available: editing ? editing.is_available : true,
        }
        if (editing) {
            const { error } = await supabase.from('cafe_tables').update(payload).eq('id', editing.id)
            if (error) { toast.error(`Failed: ${error.message}`); return }
            toast.success('Table updated')
        } else {
            const { error } = await supabase.from('cafe_tables').insert(payload)
            if (error) { toast.error(`Failed: ${error.message}`); return }
            toast.success('Table added')
        }
        setShowForm(false)
        fetchTables()
    }

    const deleteTable = async (id: number) => {
        if (!confirm('Delete this table?')) return
        const { error } = await supabase.from('cafe_tables').delete().eq('id', id)
        if (error) { toast.error(`Failed: ${error.message}`); return }
        toast.success('Table deleted')
        fetchTables()
    }

    const toggleAvailability = async (table: CafeTable) => {
        const { error } = await supabase
            .from('cafe_tables')
            .update({ is_available: !table.is_available })
            .eq('id', table.id)
        if (error) { toast.error(`Failed: ${error.message}`); return }
        toast.success(table.is_available ? 'Table marked unavailable' : 'Table marked available')
        fetchTables()
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-up gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Table Management</h1>
                    <p className="text-stone-500 text-xs sm:text-sm mt-1">Manage cafe seating</p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm shrink-0 px-3 py-2 sm:px-4"
                >
                    <Plus size={15} />
                    <span>Add Table</span>
                </button>
            </div>

            {/* Summary strip */}
            {!loading && tables.length > 0 && (
                <div className="flex gap-3 mb-5 text-xs text-stone-500">
                    <span>
                        <span className="text-green-400 font-semibold">{tables.filter(t => t.is_available).length}</span> available
                    </span>
                    <span>·</span>
                    <span>
                        <span className="text-stone-400 font-semibold">{tables.filter(t => !t.is_available).length}</span> unavailable
                    </span>
                    <span>·</span>
                    <span>{tables.length} total</span>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-32 shimmer rounded-xl" />)}
                </div>
            ) : tables.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-stone-600">
                    <Hash size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tables yet. Add your first table.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 stagger-children">
                    {tables.map((table) => (
                        <div key={table.id} className="glass-card p-4 sm:p-5 relative">
                            {/* Table number circle */}
                            <div className="text-center mb-3">
                                <div
                                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mx-auto flex items-center justify-center mb-2"
                                    style={{
                                        background: table.is_available
                                            ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
                                            : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${table.is_available ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                    }}
                                >
                                    <span
                                        className="text-lg sm:text-xl font-extrabold"
                                        style={{ color: table.is_available ? '#4ade80' : '#78716c' }}
                                    >
                                        {table.table_number}
                                    </span>
                                </div>
                                <p className="text-stone-200 font-semibold text-sm">Table {table.table_number}</p>
                                <p className="text-stone-500 text-xs flex items-center justify-center gap-1 mt-0.5">
                                    <UsersIcon size={11} />
                                    {table.capacity} seats
                                </p>
                            </div>

                            {/* Status badge */}
                            <div className="text-center mb-3">
                                <span className={`badge ${table.is_available ? 'badge-ready' : 'badge-served'} text-xs`}>
                                    {table.is_available ? 'Available' : 'Unavailable'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => toggleAvailability(table)}
                                    title="Toggle availability"
                                    className="transition-all"
                                >
                                    {table.is_available
                                        ? <ToggleRight size={22} style={{ color: '#4ade80' }} />
                                        : <ToggleLeft size={22} className="text-stone-600" />
                                    }
                                </button>
                                <button
                                    onClick={() => openForm(table)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                    <Pencil size={12} className="text-stone-400" />
                                </button>
                                <button
                                    onClick={() => deleteTable(table.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-900/30 transition-all"
                                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                >
                                    <Trash2 size={12} className="text-red-400" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal — bottom sheet on mobile */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="glass-card p-5 sm:p-6 w-full sm:max-w-sm animate-scale-in rounded-t-2xl sm:rounded-2xl"
                        style={{ background: 'rgba(28,25,23,0.98)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base sm:text-lg font-bold text-stone-100">
                                {editing ? 'Edit Table' : 'Add Table'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-stone-500 hover:text-stone-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Table Number</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={tableNum}
                                    onChange={(e) => setTableNum(e.target.value)}
                                    className="input-premium"
                                    placeholder="1"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Capacity (seats)</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    className="input-premium"
                                    placeholder="4"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={saveTable} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Check size={16} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}