'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Coffee, Image as ImageIcon, AlertCircle } from 'lucide-react'
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
        if (error) {
            console.log('Settings fetch error:', error)
        }
        setLoading(false)
    }

    const saveSettings = async () => {
        setSaving(true)

        try {
            if (settingsId) {
                // Try update first
                const { data, error, status, statusText } = await supabase
                    .from('cafe_settings')
                    .update({
                        cafe_name: cafeName,
                        logo_url: logoUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', settingsId)
                    .select()

                console.log('Update result:', { data, error, status, statusText })

                if (error) {
                    console.error('Save error details:', error.message, error.code, error.details, error.hint)
                    toast.error(`Failed: ${error.message || 'Unknown error'}`)
                    setSaving(false)
                    return
                }

                // Supabase returns empty array if RLS blocked silently
                if (!data || data.length === 0) {
                    console.warn('Update returned no rows — RLS may be blocking')
                    toast.error('Save blocked by permissions. Check RLS policies.')
                    setSaving(false)
                    return
                }

                toast.success('Settings saved!')
            } else {
                // No existing settings — insert
                const { data, error } = await supabase
                    .from('cafe_settings')
                    .insert({
                        cafe_name: cafeName,
                        logo_url: logoUrl,
                        updated_at: new Date().toISOString(),
                    })
                    .select()
                    .single()

                if (error) {
                    toast.error(`Failed: ${error.message || 'Unknown error'}`)
                    setSaving(false)
                    return
                }

                if (data) setSettingsId(data.id)
                toast.success('Settings created!')
            }

            // Re-fetch to confirm
            await fetchSettings()
        } catch (err) {
            console.error('Unexpected error:', err)
            toast.error('Unexpected error occurred')
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="p-6">
            <div className="space-y-4">
                <div className="h-8 w-48 shimmer" />
                <div className="h-64 shimmer" />
            </div>
        </div>
    )

    return (
        <div className="p-6">
            <div className="mb-8 animate-fade-in-up">
                <h1 className="text-2xl font-extrabold text-stone-100">Cafe Settings</h1>
                <p className="text-stone-500 text-sm mt-1">Configure your cafe's identity</p>
            </div>

            <div className="max-w-xl">
                {/* Preview */}
                <div className="glass-card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <p className="text-stone-500 text-xs uppercase tracking-wider font-medium mb-4">Live Preview</p>
                    <div className="flex items-center gap-4">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover"
                                style={{ boxShadow: '0 4px 20px rgba(245,158,11,0.2)' }}
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                                }}
                            >
                                <Coffee size={28} className="text-stone-900" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-extrabold gradient-text">
                                {cafeName || 'Your Cafe Name'}
                            </h2>
                            <p className="text-stone-500 text-sm">Premium coffee experience</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
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
                            <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
                                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
                            >
                                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-amber-400/80">
                                    No settings found in database. Click Save to create initial settings.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />
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
