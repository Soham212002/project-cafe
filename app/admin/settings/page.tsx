'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Coffee, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'

export default function AdminSettingsPage() {
    const [cafeName, setCafeName] = useState('')
    const [logoUrl, setLogoUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settingsId, setSettingsId] = useState<number | null>(null)
    const supabase = createClient()

    useEffect(() => { fetchSettings() }, [])

    async function fetchSettings() {
        const { data, error } = await supabase
            .from('cafe_settings')
            .select('*')
            .limit(1)
            .single()

        if (data) {
            setCafeName(data.cafe_name || '')
            setLogoUrl(data.logo_url || '')
            setSettingsId(data.id)
        }
        if (error) console.log('Settings fetch error:', error)
        setLoading(false)
    }

    const saveSettings = async () => {
        setSaving(true)
        try {
            if (settingsId) {
                const { data, error } = await supabase
                    .from('cafe_settings')
                    .update({
                        cafe_name: cafeName,
                        logo_url: logoUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', settingsId)
                    .select()

                if (error) { toast.error(`Failed: ${error.message || 'Unknown error'}`); setSaving(false); return }
                if (!data || data.length === 0) { toast.error('Save blocked by permissions. Check RLS policies.'); setSaving(false); return }
                toast.success('Settings saved!')
            } else {
                const { data, error } = await supabase
                    .from('cafe_settings')
                    .insert({ cafe_name: cafeName, logo_url: logoUrl, updated_at: new Date().toISOString() })
                    .select()
                    .single()

                if (error) { toast.error(`Failed: ${error.message || 'Unknown error'}`); setSaving(false); return }
                if (data) setSettingsId(data.id)
                toast.success('Settings created!')
            }
            await fetchSettings()
        } catch (err) {
            console.error('Unexpected error:', err)
            toast.error('Unexpected error occurred')
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="p-4 sm:p-6">
            <div className="space-y-4">
                <div className="h-8 w-48 shimmer rounded-lg" />
                <div className="h-48 shimmer rounded-xl" />
                <div className="h-64 shimmer rounded-xl" />
            </div>
        </div>
    )

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6 sm:mb-8 animate-fade-in-up">
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-100">Cafe Settings</h1>
                <p className="text-stone-500 text-xs sm:text-sm mt-1">Configure your cafe's identity</p>
            </div>

            {/* Content: constrained width on larger screens */}
            <div className="w-full max-w-xl">
                {/* Live Preview */}
                <div className="glass-card p-4 sm:p-6 mb-4 sm:mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <p className="text-stone-500 text-xs uppercase tracking-wider font-medium mb-4">Live Preview</p>
                    <div className="flex items-center gap-3 sm:gap-4">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Logo"
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shrink-0"
                                style={{ boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                            />
                        ) : (
                            <div
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                                }}
                            >
                                <Coffee size={26} className="text-stone-900" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-extrabold gradient-text truncate">
                                {cafeName || 'Your Cafe Name'}
                            </h2>
                            <p className="text-stone-500 text-sm">Premium coffee experience</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="glass-card p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                Cafe Name
                            </label>
                            <input
                                type="text"
                                value={cafeName}
                                onChange={(e) => setCafeName(e.target.value)}
                                className="input-premium"
                                placeholder="Enter your cafe name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                                Logo
                            </label>
                            <ImageUpload
                                value={logoUrl}
                                onChange={(url) => setLogoUrl(url)}
                                folder="branding"
                            />
                        </div>

                        {!settingsId && (
                            <div
                                className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                            >
                                <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-amber-400/80 text-xs sm:text-sm">
                                    No settings found in database. Click Save to create initial settings.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                        >
                            {saving ? (
                                <div
                                    className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full"
                                    style={{ animation: 'spin 0.6s linear infinite' }}
                                />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}