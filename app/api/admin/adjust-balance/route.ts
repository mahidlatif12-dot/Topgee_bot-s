import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, amount, type } = await req.json()
    const supabase = await createAdminClient()

    let newBalance = amount
    if (type === 'add') {
      const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single()
      newBalance = (profile?.balance || 0) + amount
    }

    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId)
    if (error) throw error

    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount: amount,
      description: `Admin balance adjustment (${type})`,
    })

    return NextResponse.json({ success: true, newBalance })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
