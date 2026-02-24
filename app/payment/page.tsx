'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/store/cart'
import { ArrowLeft, Tag, CheckCircle, XCircle, CreditCard, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Script from 'next/script'

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentPage() {
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponSuccess, setCouponSuccess] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const { items, getTotal, coupon, setCoupon, tableId, clearCart } = useCart()
  const router = useRouter()
  const supabase = createClient()

  const subtotal = getTotal()
  const discount = coupon
    ? coupon.discount_type === 'percent'
      ? (subtotal * coupon.discount_value) / 100
      : Math.min(coupon.discount_value, subtotal)
    : 0
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * 0.05
  const total = afterDiscount + tax

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponMsg('')
    setCouponSuccess(false)

    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setCouponMsg('Invalid or expired coupon code')
      setCouponSuccess(false)
    } else if (data.used_count >= data.max_uses) {
      setCouponMsg('This coupon has reached its usage limit')
      setCouponSuccess(false)
    } else if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setCouponMsg('This coupon has expired')
      setCouponSuccess(false)
    } else if (data.min_order && subtotal < data.min_order) {
      setCouponMsg(`Minimum order value of ₹${data.min_order} required`)
      setCouponSuccess(false)
    } else {
      setCoupon(data)
      setCouponSuccess(true)
      setCouponMsg(
        data.discount_type === 'percent'
          ? `${data.discount_value}% discount applied!`
          : `₹${data.discount_value} discount applied!`
      )
      toast.success('Coupon applied!')
    }
    setCouponLoading(false)
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setCouponMsg('')
    setCouponSuccess(false)
  }

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading. Please wait...')
      return
    }

    setPaymentLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile for contact details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      // Create Razorpay order
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
          notes: {
            table_id: tableId,
            user_id: user.id,
          },
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'The Brew Café',
        description: `Table ${tableId} Order`,
        order_id: orderData.order.id,
        prefill: {
          name: profile?.full_name || '',
          email: profile?.email || '',
        },
        theme: {
          color: '#78350f', // amber-900
        },
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_data: {
                  items: items,
                  tableId: tableId,
                  couponId: coupon?.id || null,
                  subtotal: subtotal,
                  discount: discount,
                  total: total,
                },
              }),
            })

            const verifyData = await verifyResponse.json()

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            // Payment successful
            clearCart()
            toast.success('Payment successful!')
            router.push(`/confirmation?order_id=${verifyData.order.id}`)
          } catch (err: any) {
            console.error('Verification error:', err)
            toast.error(err.message || 'Payment verification failed')
            setPaymentLoading(false)
          }
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false)
            toast.error('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()

    } catch (err: any) {
      console.error('Payment error:', err)
      toast.error(err.message || 'Payment failed. Please try again.')
      setPaymentLoading(false)
    }
  }

  if (items.length === 0) {
    router.push('/menu')
    return null
  }

  return (
    <>
      {/* Load Razorpay script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => {
          toast.error('Failed to load payment gateway')
        }}
      />

      <div className="min-h-screen" style={{ background: '#0c0a09' }}>
        {/* Header */}
        <header className="sticky top-0 z-10 animate-slide-in-down"
          style={{
            background: 'rgba(12,10,9,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push('/table')}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-stone-800"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <ArrowLeft size={18} className="text-stone-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-stone-100">Payment</h1>
              <p className="text-stone-500 text-xs">Review and confirm your order</p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 pb-40">

          {/* Order Summary */}
          <div className="glass-card p-5 mb-4 animate-fade-in-up">
            <h3 className="font-bold text-stone-200 mb-4 text-sm uppercase tracking-wider">Order Summary</h3>
            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-stone-400">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-stone-300">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon Code */}
          <div className="glass-card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-bold text-stone-200 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              <Tag size={16} className="text-amber-500" />
              Coupon Code
            </h3>

            {!coupon ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  className="input-premium flex-1 uppercase tracking-widest text-sm"
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="btn-primary px-5 py-2.5 text-sm"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl px-4 py-3 animate-scale-in"
                style={{
                  background: 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                }}
              >
                <div className="flex items-center gap-2" style={{ color: '#4ade80' }}>
                  <CheckCircle size={18} />
                  <span className="font-semibold">{coupon.code}</span>
                  <span className="text-sm opacity-80">
                    {coupon.discount_type === 'percent'
                      ? `(${coupon.discount_value}% off)`
                      : `(₹${coupon.discount_value} off)`}
                  </span>
                </div>
                <button onClick={removeCoupon} className="text-red-400 hover:text-red-300 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            )}

            {couponMsg && !coupon && (
              <p className={`text-sm mt-2 flex items-center gap-1 ${couponSuccess ? '' : 'text-red-400'}`}
                style={{ color: couponSuccess ? '#4ade80' : undefined }}
              >
                {couponSuccess ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {couponMsg}
              </p>
            )}

            {!coupon && (
              <p className="text-xs text-stone-600 mt-2">
                Try: WELCOME10 · FLAT50 · CAFE20
              </p>
            )}
          </div>

          {/* Bill Breakdown */}
          <div className="glass-card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-bold text-stone-200 mb-4 text-sm uppercase tracking-wider">Bill Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-stone-400">
                <span>Subtotal</span>
                <span className="text-stone-300">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between font-medium" style={{ color: '#4ade80' }}>
                  <span>Discount ({coupon?.code})</span>
                  <span>− ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-400">
                <span>GST (5%)</span>
                <span className="text-stone-300">₹{tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 flex justify-between font-bold text-base"
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-stone-200">Total Payable</span>
                <span className="gradient-text text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Table Info */}
          <div className="glass-card p-4 text-center animate-fade-in-up" style={{
            animationDelay: '0.3s',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
          }}>
            <p className="text-amber-500 text-sm font-medium">
              Table {tableId} — Secure payment via Razorpay
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-stone-600 text-xs animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            <Shield size={12} />
            <span>Powered by Razorpay · Secure & encrypted</span>
          </div>
        </main>

        {/* Pay Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20"
          style={{
            background: 'linear-gradient(0deg, rgba(12,10,9,1) 0%, rgba(12,10,9,0.95) 80%, rgba(12,10,9,0) 100%)',
          }}
        >
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handlePayment}
              disabled={paymentLoading || !razorpayLoaded}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              {paymentLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-stone-900/30 border-t-stone-900 rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />
                  Processing...
                </div>
              ) : !razorpayLoaded ? (
                'Loading payment gateway...'
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay ₹{total.toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
