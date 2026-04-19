import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create profile if doesn't exist
      const { createAdminClient } = await import('@/lib/supabase/server')
      const adminSupabase = await createAdminClient()
      await adminSupabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email ?? '',
        full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '',
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
