import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const adminSupabase = await createAdminClient()

      // Check if profile already exists
      const { data: existing } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      const isNew = !existing

      // Upsert profile
      const fullName = data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? ''
      await adminSupabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email ?? '',
        full_name: fullName,
      }, { onConflict: 'id', ignoreDuplicates: true })

      // Send welcome email for new Google signups
      if (isNew && data.user.email) {
        await sendEmail({
          to: data.user.email,
          template: 'welcome',
          data: { name: fullName || 'Investor' },
        })
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
