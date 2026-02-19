import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protect admin routes (ONLY check login here)
    if (request.nextUrl.pathname.startsWith('/admin') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Protect customer routes
    const protectedPaths = ['/order', '/table', '/payment', '/confirmation', '/orders', '/profile']
    const isProtected = protectedPaths.some(p =>
        request.nextUrl.pathname.startsWith(p)
    )

    if (isProtected && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/order/:path*',
        '/orders/:path*',
        '/table/:path*',
        '/payment/:path*',
        '/confirmation/:path*',
        '/profile/:path*',
    ],
}
