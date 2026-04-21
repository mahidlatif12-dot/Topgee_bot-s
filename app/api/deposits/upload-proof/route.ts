import { createAdminClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/upload'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const userId   = (formData.get('userId') as string || '').trim()
    const amount   = parseFloat(formData.get('amount') as string || '0')
    const method   = (formData.get('method') as string || '').trim()
    const proofFile = formData.get('proof') as File | null

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!amount || amount < 10) return NextResponse.json({ error: 'Minimum deposit is $10' }, { status: 400 })
    if (!method) return NextResponse.json({ error: 'Payment method required' }, { status: 400 })
    if (!proofFile) return NextResponse.json({ error: 'Proof of payment required' }, { status: 400 })
    if (proofFile.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })

    const buffer = Buffer.from(await proofFile.arrayBuffer())
    const ext = proofFile.name.split('.').pop() || 'jpg'

    let proofUrl = ''
    try {
      proofUrl = await uploadFile(buffer, `${userId}_${Date.now()}.${ext}`, 'deposits', proofFile.type)
    } catch (e: any) {
      // Upload failed but we still save the deposit — admin can ask for proof
      console.error('Proof upload failed:', e.message)
    }

    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase.from('deposits').insert({
      user_id: userId,
      amount,
      method,
      proof_url: proofUrl,
      status: 'pending',
    })

    if (error) return NextResponse.json({ error: `Failed to submit: ${error.message}` }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
