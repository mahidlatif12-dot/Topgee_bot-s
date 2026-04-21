import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { depositId, userId, amount, note } = await req.json()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('deposits')
      .update({ status: 'rejected' })
      .eq('id', depositId)
    if (error) throw error

    // Send email notification if userId + amount provided
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()

      if (profile?.email) {
        await sendEmail({
          to: profile.email,
          template: 'deposit_rejected',
          data: {
            name: profile.full_name || 'Investor',
            amount: amount ? amount.toFixed(2) : '0',
            note: note || '',
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
