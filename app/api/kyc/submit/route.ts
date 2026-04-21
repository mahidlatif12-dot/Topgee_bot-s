import { createAdminClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/upload'
import { NextResponse } from 'next/server'

// Simple in-memory rate limit (per deployment instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 }) // 1 min window
    return true
  }
  if (entry.count >= 5) return false // max 5 submissions per minute
  entry.count++
  return true
}

export async function POST(req: Request) {
  try {
    // Rate limit
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    const formData = await req.formData()

    const userId    = (formData.get('userId') as string || '').trim()
    const fullName  = (formData.get('fullName') as string || '').trim()
    const dob       = (formData.get('dob') as string || '').trim()
    const idType    = (formData.get('idType') as string || '').trim()
    const idNumber  = (formData.get('idNumber') as string || '').trim()
    const address   = (formData.get('address') as string || '').trim()
    const docFile   = formData.get('document') as File | null
    const selfieFile = formData.get('selfie') as File | null

    // Validate
    if (!userId)    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!fullName)  return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!dob)       return NextResponse.json({ error: 'Date of birth is required' }, { status: 400 })
    if (!idNumber)  return NextResponse.json({ error: 'ID number is required' }, { status: 400 })
    if (!address)   return NextResponse.json({ error: 'Address is required' }, { status: 400 })
    if (!docFile)   return NextResponse.json({ error: 'ID document photo is required' }, { status: 400 })
    if (!selfieFile) return NextResponse.json({ error: 'Selfie photo is required' }, { status: 400 })

    // File size check (5MB max)
    if (docFile.size > 5 * 1024 * 1024)    return NextResponse.json({ error: 'Document photo must be under 5MB' }, { status: 400 })
    if (selfieFile.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Selfie photo must be under 5MB' }, { status: 400 })

    // File type check
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!allowed.includes(docFile.type) && !docFile.type.startsWith('image/'))
      return NextResponse.json({ error: 'Document must be an image file' }, { status: 400 })

    // Clean date — ensure YYYY-MM-DD
    const cleanDob = dob.includes('T') ? dob.split('T')[0] : dob

    // Upload both files
    const docBuffer = Buffer.from(await docFile.arrayBuffer())
    const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer())

    const docExt = docFile.name.split('.').pop() || 'jpg'
    const selfieExt = selfieFile.name.split('.').pop() || 'jpg'

    let docUrl: string
    let selfieUrl: string

    try {
      docUrl = await uploadFile(docBuffer, `${userId}_doc.${docExt}`, 'kyc', docFile.type)
    } catch (e: any) {
      return NextResponse.json({ error: `Document upload failed: ${e.message}` }, { status: 500 })
    }

    try {
      selfieUrl = await uploadFile(selfieBuffer, `${userId}_selfie.${selfieExt}`, 'kyc', selfieFile.type)
    } catch (e: any) {
      return NextResponse.json({ error: `Selfie upload failed: ${e.message}` }, { status: 500 })
    }

    const adminSupabase = await createAdminClient()

    // Save to DB
    const { error: dbErr } = await adminSupabase.from('kyc_submissions').upsert({
      user_id: userId,
      full_name: fullName,
      date_of_birth: cleanDob,
      id_type: idType,
      id_number: idNumber,
      address: address,
      document_url: docUrl,
      selfie_url: selfieUrl,
      status: 'pending',
      admin_note: null,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (dbErr) {
      console.error('KYC DB error:', dbErr)
      return NextResponse.json({ error: `Save failed: ${dbErr.message}` }, { status: 500 })
    }

    // Update profile status
    await adminSupabase.from('profiles')
      .update({ kyc_status: 'pending', kyc_admin_note: null })
      .eq('id', userId)

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('KYC submit error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error. Please try again.' }, { status: 500 })
  }
}
