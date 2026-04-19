import { createClient } from '@/lib/supabase/server'
import { createAccessToken } from '@/lib/sumsub'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = await createAccessToken(user.id)
    return NextResponse.json({ token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
