import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
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
                        // No-op for read-only route
                    },
                },
            }
        )

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get payment details from request
        const body = await request.json()
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            order_data, 
        } = body

        // Verify signature
        const text = `${razorpay_order_id}|${razorpay_payment_id}`
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(text)
            .digest('hex')

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            )
        }

        // Payment verified successfully, create order in database
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                table_id: order_data.tableId,
                coupon_id: order_data.couponId || null,
                subtotal: order_data.subtotal,
                discount: order_data.discount,
                total: order_data.total,
                status: 'pending',
                payment_id: razorpay_payment_id,
                payment_status: 'completed',
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation error:', orderError)
            return NextResponse.json(
                { error: 'Failed to create order' },
                { status: 500 }
            )
        }

        // Insert order items
        const orderItems = order_data.items.map((item: any) => ({
            order_id: order.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            console.error('Order items error:', itemsError)
            // Order is created but items failed - this is a critical error
            // You might want to implement rollback logic here
        }

        // Update coupon usage if coupon was applied
        if (order_data.couponId) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('used_count')
                .eq('id', order_data.couponId)
                .single()

            if (coupon) {
                await supabase
                    .from('coupons')
                    .update({ used_count: coupon.used_count + 1 })
                    .eq('id', order_data.couponId)
            }
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                order_number: order.order_number,
            },
        })
    } catch (error: any) {
        console.error('Payment verification error:', error)
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        )
    }
}
