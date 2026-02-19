'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Check, Tag, Percent, DollarSign, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface Coupon {
    id: number
    code: string
    discount_type: 'percent' | 'fixed'
    discount_value: number
    min_order: number
    max_uses: number
    used_count: number
    is_active: boolean
    expires_at: string | null
    created_at: string
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<Coupon | null>(null)

    const [code, setCode] = useState('')
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [discountValue, setDiscountValue] = useState('')
    const [minOrder, setMinOrder] = useState('0')
    const [maxUses, setMaxUses] = useState('100')
    const [expiresAt, setExpiresAt] = useState('')

    const supabase = createClient()

    useEffect(() => { fetchCoupons() }, [])

    async function fetchCoupons() {
        const { data, error } = await supabase.from('coupons').select('*')
        if (error) {
            console.error('Fetch coupons error:', error.message)
        } else if (data) {
            setCoupons(data.map(c => ({
                id: c.id,
                code: c.code || '',
                discount_type: c.discount_type || 'percent',
                discount_value: c.discount_value || 0,
                min_order: c.min_order || 0,
                max_uses: c.max_uses || 100,
                used_count: c.used_count || 0,
                is_active: c.is_active ?? true,
                expires_at: c.expires_at || null,
                created_at: c.created_at || '',
            })))
        }
        setLoading(false)
    }

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
        setCode(result)
    }

    const openForm = (coupon?: Coupon) => {
        if (coupon) {
            setEditing(coupon)
            setCode(coupon.code)
            setDiscountType(coupon.discount_type)
            setDiscountValue(coupon.discount_value.toString())
            setMinOrder((coupon.min_order || 0).toString())
            setMaxUses(coupon.max_uses.toString())
            setExpiresAt(coupon.expires_at ? coupon.expires_at.split('T')[0] : '')
        } else {
            setEditing(null)
            setCode('')
            setDiscountType('percent')
            setDiscountValue('')
            setMinOrder('0')
            setMaxUses('100')
            setExpiresAt('')
            generateCode()
        }
        setShowForm(true)
    }

    const saveCoupon = async () => {
        if (!code.trim() || !discountValue) { toast.error('Code and discount value are required'); return }
        const payload = {
            code: code.toUpperCase().trim(),
            discount_type: discountType,
            discount_value: parseFloat(discountValue),
            min_order: parseFloat(minOrder) || 0,
            max_uses: parseInt(maxUses) || 100,
            is_active: true,
            expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }
        if (editing) {
            const { error } = await supabase.from('coupons').update(payload).eq('id', editing.id)
            if (error) { toast.error(`Failed: ${error.message}`); return }
            toast.success('Coupon updated')
        } else {
            const { error } = await supabase.from('coupons').insert({ ...payload, used_count: 0 })
            if (error) { toast.error(`Failed: ${error.message}`); return }
            toast.success('Coupon created')
        }
        setShowForm(false)
        fetchCoupons()
    }

    const deleteCoupon = async (id: number) => {
        if (!confirm('Delete this coupon?')) return
        const { error } = await supabase.from('coupons').delete().eq('id', id)
        if (error) { toast.error(`Failed: ${error.message}`); return }
        toast.success('Coupon deleted')
        fetchCoupons()
    }

    const toggleActive = async (coupon: Coupon) => {
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: !coupon.is_active })
            .eq('id', coupon.id)
        if (error) { toast.error(`Failed: ${error.message}`); return }
        toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
        fetchCoupons()
    }

    const copyCode = (c: string) => {
        navigator.clipboard.writeText(c)
        toast.success(`Copied: ${c}`)
    }

    const isExpired = (c: Coupon) => c.expires_at && new Date(c.expires_at) < new Date()

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-up gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Coupons</h1>
                    <p className="text-stone-500 text-xs sm:text-sm mt-1">Create and manage discount codes</p>
                </div>
                <button
                    onClick={() => openForm()}
                    className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm shrink-0 px-3 py-2 sm:px-4"
                >
                    <Plus size={15} />
                    <span className="hidden xs:inline">Create Coupon</span>
                    <span className="xs:hidden">Create</span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-stone-600">
                    <Tag size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No coupons yet. Create your first discount code.</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="glass-card p-4 sm:p-5">
                            {/* Top row: icon + code + action buttons */}
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                                    style={{
                                        background: coupon.is_active && !isExpired(coupon)
                                            ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
                                            : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${coupon.is_active && !isExpired(coupon) ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                    }}
                                >
                                    {coupon.discount_type === 'percent'
                                        ? <Percent size={18} style={{ color: coupon.is_active ? '#4ade80' : '#78716c' }} />
                                        : <DollarSign size={18} style={{ color: coupon.is_active ? '#4ade80' : '#78716c' }} />
                                    }
                                </div>

                                {/* Code + meta */}
                                <div className="flex-1 min-w-0">
                                    {/* Code + status badges */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <button
                                            onClick={() => copyCode(coupon.code)}
                                            className="font-mono font-bold text-amber-400 text-base sm:text-lg tracking-wider hover:text-amber-300 transition-colors flex items-center gap-1.5 shrink-0"
                                        >
                                            {coupon.code}
                                            <Copy size={11} className="opacity-50" />
                                        </button>
                                        {!coupon.is_active && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-500 font-medium">INACTIVE</span>
                                        )}
                                        {isExpired(coupon) && (
                                            <span
                                                className="text-[10px] px-2 py-0.5 rounded-full text-red-400 font-medium"
                                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                            >EXPIRED</span>
                                        )}
                                    </div>

                                    {/* Meta — wrap on mobile, inline on desktop */}
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                                        <span className="font-semibold text-stone-300">
                                            {coupon.discount_type === 'percent'
                                                ? `${coupon.discount_value}% off`
                                                : `₹${coupon.discount_value} off`
                                            }
                                        </span>
                                        {coupon.min_order > 0 && (
                                            <span>Min ₹{coupon.min_order}</span>
                                        )}
                                        <span>{coupon.used_count}/{coupon.max_uses} used</span>
                                        {coupon.expires_at && (
                                            <span className="hidden sm:inline">
                                                Exp: {new Date(coupon.expires_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Expiry — shown on mobile below */}
                                    {coupon.expires_at && (
                                        <p className="sm:hidden text-xs text-stone-600 mt-0.5">
                                            Exp: {new Date(coupon.expires_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {/* Actions — vertical stack on mobile, horizontal on sm+ */}
                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => toggleActive(coupon)}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                                        style={{
                                            background: coupon.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                            border: `1px solid ${coupon.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                            color: coupon.is_active ? '#f87171' : '#4ade80',
                                        }}
                                    >
                                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => openForm(coupon)}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                        >
                                            <Pencil size={12} className="text-stone-400" />
                                        </button>
                                        <button
                                            onClick={() => deleteCoupon(coupon.id)}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-red-900/30 transition-all"
                                            style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                        >
                                            <Trash2 size={12} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal — bottom sheet on mobile */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowForm(false)}
                >
                    <div
                        className="glass-card p-5 sm:p-6 w-full sm:max-w-md animate-scale-in rounded-t-2xl sm:rounded-2xl max-h-[92dvh] overflow-y-auto"
                        style={{ background: 'rgba(28,25,23,0.98)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base sm:text-lg font-bold text-stone-100">
                                {editing ? 'Edit Coupon' : 'Create Coupon'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-stone-500 hover:text-stone-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Code */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Coupon Code</label>
                                <div className="flex gap-2">
                                    <input
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="input-premium flex-1 font-mono tracking-wider"
                                        placeholder="SAVE20"
                                        autoFocus
                                    />
                                    <button
                                        onClick={generateCode}
                                        className="px-3 rounded-xl text-xs font-medium text-amber-400 transition-all hover:bg-amber-900/20 shrink-0"
                                        style={{ border: '1px solid rgba(245,158,11,0.2)' }}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Discount Type</label>
                                <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <button
                                        onClick={() => setDiscountType('percent')}
                                        className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                                        style={{
                                            background: discountType === 'percent' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                                            color: discountType === 'percent' ? '#0c0a09' : '#78716c',
                                        }}
                                    >
                                        <Percent size={13} /> Percentage
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('fixed')}
                                        className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                                        style={{
                                            background: discountType === 'fixed' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                                            color: discountType === 'fixed' ? '#0c0a09' : '#78716c',
                                        }}
                                    >
                                        ₹ Fixed
                                    </button>
                                </div>
                            </div>

                            {/* Two-column row: value + min order */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                        {discountType === 'percent' ? 'Discount (%)' : 'Amount (₹)'}
                                    </label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        className="input-premium"
                                        placeholder={discountType === 'percent' ? '10' : '50'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Min Order (₹)</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={minOrder}
                                        onChange={(e) => setMinOrder(e.target.value)}
                                        className="input-premium"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Two-column row: max uses + expiry */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Max Uses</label>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={maxUses}
                                        onChange={(e) => setMaxUses(e.target.value)}
                                        className="input-premium"
                                        placeholder="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                        className="input-premium"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={saveCoupon} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Check size={16} /> {editing ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}