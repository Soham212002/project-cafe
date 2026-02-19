import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
    const cookieStore = await cookies()

    // Regular client to get the logged-in user
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                setAll(_cookiesToSet) {
                    // No-op for read-only route
                },
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({
            error: 'Not authenticated. Please log in first at /login, then visit this page.',
            authError: authError?.message,
        }, { status: 401 })
    }

    // Service role client to bypass RLS
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (fetchError && fetchError.code === 'PGRST116') {
        // No profile exists — create one with admin role
        const { data: newProfile, error: insertError } = await adminClient
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                full_name: user.email?.split('@')[0] || 'Admin',
                role: 'admin',
            })
            .select()
            .single()

        if (insertError) {
            return NextResponse.json({
                error: 'Failed to create admin profile',
                details: insertError.message,
            }, { status: 500 })
        }

        return NextResponse.json({
            message: 'Admin profile created! You can now access /admin.',
            profile: newProfile,
        })
    }

    if (fetchError) {
        return NextResponse.json({
            error: 'Failed to fetch profile',
            details: fetchError.message,
        }, { status: 500 })
    }

    if (existingProfile?.role === 'admin') {
        return NextResponse.json({
            message: 'You are already an admin!',
            profile: existingProfile,
        })
    }

    // Update existing profile to admin
    const { data: updatedProfile, error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .single()

    if (updateError) {
        return NextResponse.json({
            error: 'Failed to update role to admin',
            details: updateError.message,
        }, { status: 500 })
    }

    return NextResponse.json({
        message: 'Role updated to admin! You can now access /admin.',
        profile: updatedProfile,
    })
}
