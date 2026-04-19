import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { depositId, userId, amount } = await req.json()
    const supabase = await createAdminClient()

    // Check caller is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      if (!profile?.is_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update deposit status
    const { error: depError } = await supabase
      .from('deposits')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', depositId)
    if (depError) throw depError

    // Get current user profile
    const { data: profile } = await supabase.from('profiles').select('balance, total_deposited').eq('id', userId).single()
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

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
