import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()
    if (!amount || amount < 10) return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Create NOWPayments payment
    const res = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: 'usdttrc20',
        ipn_callback_url: 'https://topgeecapital.com/api/payments/nowpayments-webhook',
        order_id: `${user.id}_${Date.now()}`,
        order_description: `Topgee Capital deposit for ${user.email}`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      }),
    })

    const payment = await res.json()
    if (!payment.pay_address) return NextResponse.json({ error: 'Payment creation failed', details: payment }, { status: 500 })

    // Store pending deposit in DB
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminSupabase = await createAdminClient()
    await adminSupabase.from('deposits').insert({
      user_id: user.id,
      amount,
      method: 'USDT (TRC20) - Auto',
      proof_url: '',
      status: 'pending',
      payment_id: payment.payment_id,
    })

    return NextResponse.json({
      paymentId: payment.payment_id,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      status: payment.payment_status,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
