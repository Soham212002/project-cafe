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

    // Form state
    const [code, setCode] = useState('')
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
    const [discountValue, setDiscountValue] = useState('')
    const [minOrder, setMinOrder] = useState('0')
    const [maxUses, setMaxUses] = useState('100')
    const [expiresAt, setExpiresAt] = useState('')

    const supabase = createClient()

    useEffect(() => { fetchCoupons() }, [])

    async function fetchCoupons() {
        // First try with all columns
        const { data, error } = await supabase
            .from('coupons')
            .select('*')

        if (error) {
            console.error('Fetch coupons error:', error.message)
        } else if (data) {
            // Map data to ensure all fields have defaults
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
        if (!code.trim() || !discountValue) {
            toast.error('Code and discount value are required')
            return
        }

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
        <div className="p-6">
            <div className="flex items-center justify-between mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-extrabold text-stone-100">Coupons</h1>
                    <p className="text-stone-500 text-sm mt-1">Create and manage discount codes</p>
                </div>
                <button onClick={() => openForm()} className="btn-primary flex items-center gap-2 text-sm">
                    <Plus size={16} />
                    Create Coupon
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-20 shimmer" />)}
                </div>
            ) : coupons.length === 0 ? (
                <div className="text-center py-20 text-stone-600">
                    <Tag size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No coupons yet. Create your first discount code.</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {coupons.map((coupon) => (
                        <div key={coupon.id} className="glass-card p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: coupon.is_active && !isExpired(coupon)
                                                ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
                                                : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${coupon.is_active && !isExpired(coupon) ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                        }}
                                    >
                                        {coupon.discount_type === 'percent'
                                            ? <Percent size={20} style={{ color: coupon.is_active ? '#4ade80' : '#78716c' }} />
                                            : <DollarSign size={20} style={{ color: coupon.is_active ? '#4ade80' : '#78716c' }} />
                                        }
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => copyCode(coupon.code)}
                                                className="font-mono font-bold text-amber-400 text-lg tracking-wider hover:text-amber-300 transition-colors flex items-center gap-1.5"
                                            >
                                                {coupon.code}
                                                <Copy size={12} className="opacity-50" />
                                            </button>
                                            {!coupon.is_active && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-500 font-medium">INACTIVE</span>
                                            )}
                                            {isExpired(coupon) && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full text-red-400 font-medium"
                                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                                                >EXPIRED</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                                            <span className="font-semibold text-stone-300">
                                                {coupon.discount_type === 'percent'
                                                    ? `${coupon.discount_value}% off`
                                                    : `₹${coupon.discount_value} off`
                                                }
                                            </span>
                                            {coupon.min_order > 0 && (
                                                <span>Min order: ₹{coupon.min_order}</span>
                                            )}
                                            <span>Used: {coupon.used_count}/{coupon.max_uses}</span>
                                            {coupon.expires_at && (
                                                <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleActive(coupon)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                        style={{
                                            background: coupon.is_active ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                            border: `1px solid ${coupon.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                            color: coupon.is_active ? '#f87171' : '#4ade80',
                                        }}
                                    >
                                        {coupon.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => openForm(coupon)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        <Pencil size={14} className="text-stone-400" />
                                    </button>
                                    <button onClick={() => deleteCoupon(coupon.id)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-900/30 transition-all"
                                        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <Trash2 size={14} className="text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowForm(false)}
                >
                    <div className="glass-card p-6 w-full max-w-md animate-scale-in"
                        style={{ background: 'rgba(28,25,23,0.95)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-stone-100">
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
                                    <button onClick={generateCode}
                                        className="px-3 rounded-xl text-xs font-medium text-amber-400 transition-all hover:bg-amber-900/20"
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
                                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                                        style={{
                                            background: discountType === 'percent' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                                            color: discountType === 'percent' ? '#0c0a09' : '#78716c',
                                        }}
                                    >
                                        <Percent size={14} /> Percentage
                                    </button>
                                    <button
                                        onClick={() => setDiscountType('fixed')}
                                        className="flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                                        style={{
                                            background: discountType === 'fixed' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'transparent',
                                            color: discountType === 'fixed' ? '#0c0a09' : '#78716c',
                                        }}
                                    >
                                        ₹ Fixed Amount
                                    </button>
                                </div>
                            </div>

                            {/* Discount Value */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                    {discountType === 'percent' ? 'Discount (%)' : 'Discount Amount (₹)'}
                                </label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="input-premium"
                                    placeholder={discountType === 'percent' ? '10' : '50'}
                                />
                            </div>

                            {/* Min Order */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Minimum Order (₹)</label>
                                <input
                                    type="number"
                                    value={minOrder}
                                    onChange={(e) => setMinOrder(e.target.value)}
                                    className="input-premium"
                                    placeholder="0"
                                />
                            </div>

                            {/* Max Uses */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Max Uses</label>
                                <input
                                    type="number"
                                    value={maxUses}
                                    onChange={(e) => setMaxUses(e.target.value)}
                                    className="input-premium"
                                    placeholder="100"
                                />
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Expiry Date (optional)</label>
                                <input
                                    type="date"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className="input-premium"
                                />
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
