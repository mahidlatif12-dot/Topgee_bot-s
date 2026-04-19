import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-payload-digest')

    // Verify webhook signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.SUMSUB_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (signature && signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const payload = JSON.parse(body)
    const { externalUserId, reviewResult, type } = payload

    if (type !== 'applicantReviewed') {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createAdminClient()
    const reviewAnswer = reviewResult?.reviewAnswer

    let kycStatus: string
    if (reviewAnswer === 'GREEN') {
      kycStatus = 'verified'
    } else if (reviewAnswer === 'RED') {
      kycStatus = 'rejected'
    } else {
      kycStatus = 'pending'
    }

    await supabase
      .from('profiles')
      .update({ kyc_status: kycStatus })
      .eq('id', externalUserId)

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
