import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-nowpayments-sig')

    // Verify signature
    if (signature) {
      const expectedSig = crypto
        .createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET!)
        .update(JSON.stringify(JSON.parse(body), Object.keys(JSON.parse(body)).sort()))
        .digest('hex')
      if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }

    const payload = JSON.parse(body)
    const { payment_id, payment_status, order_id, price_amount } = payload

    // Only process finished payments
    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createAdminClient()

    // Find deposit by payment_id
    const { data: deposit } = await supabase
      .from('deposits')
      .select('*')
      .eq('payment_id', payment_id)
      .single()

    if (!deposit || deposit.status === 'approved') {
      return NextResponse.json({ ok: true })
    }

    // Extract user_id from order_id (format: userId_timestamp)
    const userId = order_id?.split('_')[0] || deposit?.user_id

    // Approve deposit
    await supabase.from('deposits').update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('payment_id', payment_id)

    // Credit user balance
    const { data: profile } = await supabase.from('profiles').select('balance, total_deposited').eq('id', userId).single()
    const amount = deposit?.amount || price_amount
    await supabase.from('profiles').update({
      balance: (profile?.balance || 0) + amount,
      total_deposited: (profile?.total_deposited || 0) + amount,
    }).eq('id', userId)

    // Add transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      description: 'USDT deposit (auto-confirmed)',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
