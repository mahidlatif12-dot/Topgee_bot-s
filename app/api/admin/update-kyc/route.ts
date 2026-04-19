import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, status } = await req.json()
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from('profiles')
      .update({ kyc_status: status })
      .eq('id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
