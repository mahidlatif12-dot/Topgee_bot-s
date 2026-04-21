import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { depositId, userId, amount } = await req.json()
    const supabase = await createAdminClient()

    // Update deposit status
    const { error: depError } = await supabase
      .from('deposits')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', depositId)
    if (depError) throw depError

    // Get current user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance, total_deposited, email, full_name')
      .eq('id', userId)
      .single()
    const newBalance = (profile?.balance || 0) + amount
    const newDeposited = (profile?.total_deposited || 0) + amount

    // Update user balance
    const { error: balError } = await supabase
      .from('profiles')
      .update({ balance: newBalance, total_deposited: newDeposited })
      .eq('id', userId)
    if (balError) throw balError

    // Add transaction record
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      description: `Deposit approved`,
    })

    // Send email notification
    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        template: 'deposit_approved',
        data: { name: profile.full_name || 'Investor', amount: amount.toFixed(2) },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
