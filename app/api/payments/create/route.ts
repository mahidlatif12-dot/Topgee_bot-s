import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { amount, userId } = await req.json()
    if (!amount || amount < 10) return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 })
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    const user = { id: userId }

    // Create NOWPayments hosted invoice
    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
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
        success_url: 'https://topgeecapital.com/dashboard/deposit?status=success',
        cancel_url: 'https://topgeecapital.com/dashboard/deposit?status=cancel',
        order_id: `${user.id}_${Date.now()}`,
        order_description: `Topgee Capital deposit`,
      }),
    })

    const invoice = await res.json()
    if (!invoice.invoice_url) return NextResponse.json({ error: 'Payment creation failed', details: invoice }, { status: 500 })

    // Store pending deposit in DB (ignore error if payment_id column missing)
    try {
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminSupabase = await createAdminClient()
      await adminSupabase.from('deposits').insert({
        user_id: user.id,
        amount,
        method: 'USDT (TRC20) - Auto',
        proof_url: '',
        status: 'pending',
      })
    } catch (dbErr) {
      console.error('DB insert error:', dbErr)
    }

    return NextResponse.json({ invoiceUrl: invoice.invoice_url })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
