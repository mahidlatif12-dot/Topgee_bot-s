import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { userId, status, note } = await req.json()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: status, kyc_admin_note: note || null })
      .eq('id', userId)
    if (error) throw error

    // Also update kyc_submissions table if exists
    await supabase
      .from('kyc_submissions')
      .update({
        status,
        admin_note: note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    // Send email notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        template: status === 'verified' ? 'kyc_approved' : 'kyc_rejected',
        data: {
          name: profile.full_name || 'Investor',
          note: note || '',
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
