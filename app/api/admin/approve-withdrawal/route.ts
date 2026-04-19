import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { withdrawalId, userId, amount } = await req.json()
    const supabase = await createAdminClient()

    // Update withdrawal status
    const { error: wdError } = await supabase
      .from('withdrawals')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', withdrawalId)
    if (wdError) throw wdError

    // Deduct from user balance
    const { data: profile } = await supabase.from('profiles').select('balance, total_withdrawn').eq('id', userId).single()
    const newBalance = Math.max(0, (profile?.balance || 0) - amount)
    const newWithdrawn = (profile?.total_withdrawn || 0) + amount

    const { error: balError } = await supabase
      .from('profiles')
      .update({ balance: newBalance, total_withdrawn: newWithdrawn })
      .eq('id', userId)
    if (balError) throw balError

    // Add transaction record
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount,
      description: 'Withdrawal processed',
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
