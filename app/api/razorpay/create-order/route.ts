import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
    try {
        // Initialize Razorpay INSIDE the handler
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized' 
            }, { status: 401 })
        }

        const { amount, currency = 'INR', receipt, notes } = await req.json()    
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency,
            receipt: receipt || `order_${Date.now()}`,
            notes: notes || {},
        })
        // ✅ Return with success wrapper
        return NextResponse.json({ 
            success: true, 
            order: order 
        })

    } catch (error) {
        console.error('Razorpay order creation error:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Failed to create order' 
            }, 
            { status: 500 }
        )
    }
}
