'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Image, ToggleLeft, ToggleRight, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'

interface MenuItem {
    id: number
    name: string
    description: string
    price: number
    image_url: string
    available: boolean
    category_id: number
}

interface Category {
    id: number
    name: string
    sort_order: number
    menu_items: MenuItem[]
}

export default function AdminMenuPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedCat, setExpandedCat] = useState<number | null>(null)

    // Category form
    const [showCatForm, setShowCatForm] = useState(false)
    const [editingCat, setEditingCat] = useState<Category | null>(null)
    const [catName, setCatName] = useState('')
    const [catOrder, setCatOrder] = useState(0)

    // Item form
    const [showItemForm, setShowItemForm] = useState(false)
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
    const [itemCatId, setItemCatId] = useState<number | null>(null)
    const [itemName, setItemName] = useState('')
    const [itemDesc, setItemDesc] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [itemImage, setItemImage] = useState('')

    const supabase = createClient()

    useEffect(() => { fetchCategories() }, [])

    async function fetchCategories() {
        const { data } = await supabase
            .from('categories')
            .select('*, menu_items(*)')
            .order('sort_order')
        if (data) setCategories(data)
        setLoading(false)
    }

    // ===== CATEGORY CRUD =====
    const openCatForm = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat)
            setCatName(cat.name)
            setCatOrder(cat.sort_order)
        } else {
            setEditingCat(null)
            setCatName('')
            setCatOrder(categories.length)
        }
        setShowCatForm(true)
    }

    const saveCat = async () => {
        if (!catName.trim()) { toast.error('Category name is required'); return }
        const payload = { name: catName.trim(), sort_order: catOrder }
        if (editingCat) {
            const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id)
            if (error) { toast.error('Failed to update category'); return }
            toast.success('Category updated')
        } else {
            const { error } = await supabase.from('categories').insert(payload)
            if (error) { toast.error('Failed to add category'); return }
            toast.success('Category added')
        }
        setShowCatForm(false)
        fetchCategories()
    }

    const deleteCat = async (id: number) => {
        if (!confirm('Delete category and all its items?')) return
        await supabase.from('menu_items').delete().eq('category_id', id)
        await supabase.from('categories').delete().eq('id', id)
        toast.success('Category deleted')
        fetchCategories()
    }

    // ===== ITEM CRUD =====
    const openItemForm = (catId: number, item?: MenuItem) => {
        setItemCatId(catId)
        if (item) {
            setEditingItem(item)
            setItemName(item.name)
            setItemDesc(item.description)
            setItemPrice(item.price.toString())
            setItemImage(item.image_url || '')
        } else {
            setEditingItem(null)
            setItemName('')
            setItemDesc('')
            setItemPrice('')
            setItemImage('')
        }
        setShowItemForm(true)
    }

    const saveItem = async () => {
        if (!itemName.trim() || !itemPrice) { toast.error('Name and price are required'); return }
        const payload = {
            name: itemName.trim(),
            description: itemDesc.trim(),
            price: parseFloat(itemPrice),
            image_url: itemImage.trim(),
            category_id: itemCatId,
            available: editingItem ? editingItem.available : true,
        }
        if (editingItem) {
            const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id)
            if (error) { toast.error('Failed to update item'); return }
            toast.success('Item updated')
        } else {
            const { error } = await supabase.from('menu_items').insert(payload)
            if (error) { toast.error('Failed to add item'); return }
            toast.success('Item added')
        }
        setShowItemForm(false)
        fetchCategories()
    }

    const deleteItem = async (id: number) => {
        if (!confirm('Delete this item?')) return
        await supabase.from('menu_items').delete().eq('id', id)
        toast.success('Item deleted')
        fetchCategories()
    }

    const toggleAvailability = async (item: MenuItem) => {
        await supabase.from('menu_items').update({ available: !item.available }).eq('id', item.id)
        toast.success(item.available ? 'Item marked unavailable' : 'Item marked available')
        fetchCategories()
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-up gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Menu Management</h1>
                    <p className="text-stone-500 text-xs sm:text-sm mt-1">Manage categories and menu items</p>
                </div>
                <button
                    onClick={() => openCatForm()}
                    className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm shrink-0 px-3 py-2 sm:px-4"
                >
                    <Plus size={15} />
                    <span className="hidden xs:inline">Add Category</span>
                    <span className="xs:hidden">Add</span>
                </button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16 sm:py-20 text-stone-600">
                    <Layers size={44} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No categories yet. Add your first category to get started.</p>
                </div>
            ) : (
                <div className="space-y-3 stagger-children">
                    {categories.map((cat) => (
                        <div key={cat.id} className="glass-card overflow-hidden">
                            {/* Category Header */}
                            <div
                                className="flex items-center justify-between p-3 sm:p-4 cursor-pointer"
                                onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))' }}
                                    >
                                        <Layers size={16} className="text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-stone-100 text-sm sm:text-base truncate">{cat.name}</h3>
                                        <p className="text-stone-500 text-xs">{cat.menu_items?.length || 0} items</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openCatForm(cat) }}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                    >
                                        <Pencil size={12} className="text-stone-400" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteCat(cat.id) }}
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center hover:bg-red-900/30 transition-all"
                                        style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                    >
                                        <Trash2 size={12} className="text-red-400" />
                                    </button>
                                    {expandedCat === cat.id
                                        ? <ChevronUp size={16} className="text-stone-500" />
                                        : <ChevronDown size={16} className="text-stone-500" />
                                    }
                                </div>
                            </div>

                            {/* Items List */}
                            {expandedCat === cat.id && (
                                <div className="animate-fade-in-up" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    {cat.menu_items?.length === 0 && (
                                        <div className="px-4 py-6 text-center text-stone-600 text-sm">
                                            No items in this category yet
                                        </div>
                                    )}

                                    {cat.menu_items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 px-3 sm:px-4 py-3 transition-all hover:bg-white/[0.02]"
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                                        >
                                            {/* Thumbnail */}
                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0"
                                                />
                                            ) : (
                                                <div
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0"
                                                    style={{ background: 'rgba(255,255,255,0.05)' }}
                                                >
                                                    <Image size={14} className="text-stone-600" />
                                                </div>
                                            )}

                                            {/* Name + description */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-stone-200 text-sm truncate">{item.name}</h4>
                                                <p className="text-stone-500 text-xs truncate hidden sm:block">{item.description}</p>
                                            </div>

                                            {/* Price */}
                                            <span className="font-bold text-amber-500 text-sm whitespace-nowrap shrink-0">
                                                ₹{item.price}
                                            </span>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                <button
                                                    onClick={() => toggleAvailability(item)}
                                                    title={item.available ? 'Available' : 'Unavailable'}
                                                    className="transition-all"
                                                >
                                                    {item.available
                                                        ? <ToggleRight size={22} style={{ color: '#4ade80' }} />
                                                        : <ToggleLeft size={22} className="text-stone-600" />
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => openItemForm(cat.id, item)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-all"
                                                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                                >
                                                    <Pencil size={11} className="text-stone-400" />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-900/30 transition-all"
                                                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}
                                                >
                                                    <Trash2 size={11} className="text-red-400" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="p-3">
                                        <button
                                            onClick={() => openItemForm(cat.id)}
                                            className="w-full py-2 rounded-xl text-sm font-medium text-stone-500 hover:text-amber-400 hover:bg-amber-900/10 transition-all"
                                            style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
                                        >
                                            + Add Item
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Category Modal ── */}
            {showCatForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowCatForm(false)}
                >
                    <div
                        className="glass-card p-5 sm:p-6 w-full sm:max-w-md animate-scale-in rounded-t-2xl sm:rounded-2xl"
                        style={{ background: 'rgba(28,25,23,0.98)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle (mobile) */}
                        <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base sm:text-lg font-bold text-stone-100">
                                {editingCat ? 'Edit Category' : 'Add Category'}
                            </h3>
                            <button onClick={() => setShowCatForm(false)} className="text-stone-500 hover:text-stone-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Category Name</label>
                                <input
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    className="input-premium"
                                    placeholder="e.g. Hot Beverages"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Sort Order</label>
                                <input
                                    type="number"
                                    value={catOrder}
                                    onChange={(e) => setCatOrder(Number(e.target.value))}
                                    className="input-premium"
                                />
                                <p className="text-stone-600 text-xs mt-1">Lower numbers appear first</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowCatForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={saveCat} className="btn-primary flex-1 flex items-center justify-center gap-2">
                                    <Check size={16} /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Item Modal ── */}
            {showItemForm && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setShowItemForm(false)}
                >
                    <div
                        className="glass-card p-5 sm:p-6 w-full sm:max-w-md animate-scale-in rounded-t-2xl sm:rounded-2xl max-h-[90dvh] overflow-y-auto"
                        style={{ background: 'rgba(28,25,23,0.98)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle (mobile) */}
                        <div className="w-10 h-1 rounded-full bg-stone-700 mx-auto mb-4 sm:hidden" />

                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base sm:text-lg font-bold text-stone-100">
                                {editingItem ? 'Edit Item' : 'Add Item'}
                            </h3>
                            <button onClick={() => setShowItemForm(false)} className="text-stone-500 hover:text-stone-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Name</label>
                                <input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="input-premium"
                                    placeholder="Item name"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Description</label>
                                <textarea
                                    value={itemDesc}
                                    onChange={(e) => setItemDesc(e.target.value)}
                                    className="input-premium resize-none"
                                    rows={2}
                                    placeholder="Brief description"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Price (₹)</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={itemPrice}
                                    onChange={(e) => setItemPrice(e.target.value)}
                                    className="input-premium"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">Image</label>
                                <ImageUpload
                                    value={itemImage}
                                    onChange={(url) => setItemImage(url)}
                                    folder="menu-items"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowItemForm(false)} className="btn-secondary flex-1">Cancel</button>
                                <button onClick={saveItem} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
