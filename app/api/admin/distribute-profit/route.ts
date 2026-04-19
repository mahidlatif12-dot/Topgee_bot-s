import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { profitPct } = await req.json()
    const supabase = await createAdminClient()

    // Get all non-admin users with balance > 0
    const { data: users, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, balance, total_profit')
      .eq('is_admin', false)
      .gt('balance', 0)
    if (fetchErr) throw fetchErr

    const multiplier = profitPct / 100

    // Update each user
    for (const user of (users || [])) {
      const profitAmount = user.balance * multiplier
      const newBalance = user.balance + profitAmount
      const newProfit = (user.total_profit || 0) + profitAmount

      await supabase.from('profiles').update({
        balance: newBalance,
        total_profit: newProfit,
      }).eq('id', user.id)

      // Add transaction
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'profit',
        amount: profitAmount,
        description: `${profitPct}% profit distribution`,
      })
    }

    return NextResponse.json({ success: true, usersUpdated: users?.length || 0 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
