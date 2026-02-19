'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    folder?: string
    className?: string
}

export default function ImageUpload({ value, onChange, folder = 'uploads', className = '' }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [dragOver, setDragOver] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const uploadFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB')
            return
        }

        setUploading(true)
        const ext = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error } = await supabase.storage
            .from('images')
            .upload(fileName, file, { upsert: true })

        if (error) {
            console.error('Upload error:', error)
            // Fallback: convert to base64 data URL if storage not set up
            const reader = new FileReader()
            reader.onload = (e) => {
                onChange(e.target?.result as string)
                setUploading(false)
            }
            reader.readAsDataURL(file)
            return
        }

        const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)
        onChange(urlData.publicUrl)
        setUploading(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) uploadFile(file)
    }

    return (
        <div className={className}>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadFile(file)
                }}
            />

            {value ? (
                <div className="relative group">
                    <img
                        src={value}
                        alt="Uploaded"
                        className="w-full h-40 rounded-xl object-cover"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <div className="absolute inset-0 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.6)' }}
                    >
                        <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-200"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                        >
                            Replace
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className="w-full h-32 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{
                        border: `2px dashed ${dragOver ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        background: dragOver ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                    }}
                >
                    {uploading ? (
                        <>
                            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />
                            <span className="text-stone-500 text-xs">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload size={20} className="text-stone-600" />
                            <span className="text-stone-500 text-xs">Click or drag image here</span>
                            <span className="text-stone-700 text-[10px]">JPG, PNG under 5MB</span>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
