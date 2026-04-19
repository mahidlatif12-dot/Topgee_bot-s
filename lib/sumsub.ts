import crypto from 'crypto'

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN!
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY!
const SUMSUB_BASE_URL = 'https://api.sumsub.com'

function createSignature(ts: number, method: string, path: string, body?: string): string {
  const data = ts + method.toUpperCase() + path + (body || '')
  return crypto.createHmac('sha256', SUMSUB_SECRET_KEY).update(data).digest('hex')
}

export async function createAccessToken(userId: string, levelName = 'Topgee Capital KYC'): Promise<string> {
  const ts = Math.floor(Date.now() / 1000)
  const method = 'POST'
  const path = `/resources/accessTokens?userId=${userId}&levelName=${encodeURIComponent(levelName)}&ttlInSecs=1800`
  const signature = createSignature(ts, method, path)

  const res = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method,
    headers: {
      'X-App-Token': SUMSUB_APP_TOKEN,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': ts.toString(),
      'Content-Type': 'application/json',
    },
  })

  const data = await res.json()
  return data.token
}

export async function getApplicantStatus(userId: string) {
  const ts = Math.floor(Date.now() / 1000)
  const method = 'GET'
  const path = `/resources/applicants/-;externalUserId=${userId}/one`
  const signature = createSignature(ts, method, path)

  const res = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method,
    headers: {
      'X-App-Token': SUMSUB_APP_TOKEN,
      'X-App-Access-Sig': signature,
      'X-App-Access-Ts': ts.toString(),
    },
  })

  if (!res.ok) return null
  return res.json()
}
