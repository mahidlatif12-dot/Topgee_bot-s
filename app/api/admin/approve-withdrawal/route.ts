import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance, total_withdrawn, email, full_name')
      .eq('id', userId)
      .single()

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

    // Send email notification
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        template: 'withdrawal_approved',
        data: { name: profile.full_name || 'Investor', amount: amount.toFixed(2) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
