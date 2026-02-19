'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CafeSettings {
    id: number
    cafe_name: string
    logo_url: string
}

const defaultSettings: CafeSettings = {
    id: 0,
    cafe_name: 'The Brew',
    logo_url: '',
}

export function useCafeSettings() {
    const [settings, setSettings] = useState<CafeSettings>(defaultSettings)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()
        supabase
            .from('cafe_settings')
            .select('id, cafe_name, logo_url')
            .limit(1)
            .single()
            .then(({ data }) => {
                if (data) {
                    setSettings({
                        id: data.id,
                        cafe_name: data.cafe_name || 'The Brew',
                        logo_url: data.logo_url || '',
                    })
                }
                setLoading(false)
            })
    }, [])

    return { settings, loading }
}
