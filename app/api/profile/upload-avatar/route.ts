import { createAdminClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/upload'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const userId = (formData.get('userId') as string || '').trim()
    const file = formData.get('avatar') as File | null

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > 3 * 1024 * 1024) return NextResponse.json({ error: 'Avatar must be under 3MB' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const url = await uploadFile(buffer, `${userId}_avatar.${ext}`, 'avatars', file.type)

    // Save to profile
    const adminSupabase = await createAdminClient()
    await adminSupabase.from('profiles').update({ avatar_url: url }).eq('id', userId)

    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
