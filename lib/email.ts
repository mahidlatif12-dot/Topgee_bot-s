/**
 * Email notification utility for Topgee Capital
 * Uses Resend (free tier: 3000 emails/month) or falls back to Supabase built-in SMTP
 *
 * Setup: Add RESEND_API_KEY to .env.local
 * Get free key at: https://resend.com (free plan, no credit card)
 */

export type EmailTemplate =
  | 'deposit_approved'
  | 'deposit_rejected'
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'profit_distributed'
  | 'welcome'

interface EmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, string | number>
}

const BRAND = 'Topgee Capital'
const BRAND_COLOR = '#10b981'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@topgeecapital.com'

function emailLayout(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;padding:0 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:white;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${BRAND}</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Professional Gold Trading</p>
    </div>
    <!-- Body -->
    <div style="background:#111827;border:1px solid #1f2937;border-top:none;border-radius:0 0 16px 16px;padding:32px;">
      ${body}
      <!-- Footer -->
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1f2937;text-align:center;">
        <p style="color:#6b7280;font-size:12px;margin:0;">
          © ${new Date().getFullYear()} ${BRAND}. All rights reserved.<br>
          <a href="https://topgeecapital.com" style="color:${BRAND_COLOR};text-decoration:none;">topgeecapital.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function badge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:${color};font-size:12px;font-weight:700;">${text}</span>`
}

function amountBox(amount: number | string) {
  return `
  <div style="background:#0d1117;border:1px solid #10b981;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
    <p style="margin:0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Amount</p>
    <p style="margin:8px 0 0;color:#10b981;font-size:32px;font-weight:800;">$${amount}</p>
  </div>`
}

function ctaButton(text: string, url: string) {
  return `
  <div style="text-align:center;margin-top:24px;">
    <a href="${url}" style="display:inline-block;padding:13px 32px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">
      ${text}
    </a>
  </div>`
}

function getEmailContent(template: EmailTemplate, data: Record<string, string | number>): { subject: string; html: string } {
  const { amount, name, reason, note } = data as Record<string, string>
  const dashUrl = 'https://topgeecapital.com/dashboard'

  switch (template) {
    case 'welcome':
      return {
        subject: `Welcome to ${BRAND}! 🎉`,
        html: emailLayout('Welcome', `
          <h2 style="color:white;font-size:20px;margin:0 0 8px;">Welcome, ${name}! 🎉</h2>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Your account has been verified and you're all set to start investing with Topgee Capital.</p>
          <div style="background:#0d1117;border:1px solid #1f2937;border-radius:12px;padding:20px;margin:20px 0;">
            <p style="color:#9ca3af;font-size:14px;margin:0 0 12px;">Get started in 3 easy steps:</p>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${['Complete your KYC verification', 'Make your first deposit', 'Watch your investment grow'].map((s, i) => `
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="width:24px;height:24px;border-radius:50%;background:#10b981;color:white;font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
                  <span style="color:#e5e7eb;font-size:14px;">${s}</span>
                </div>`).join('')}
            </div>
          </div>
          ${ctaButton('Go to Dashboard →', dashUrl)}
        `),
      }

    case 'deposit_approved':
      return {
        subject: `✅ Deposit Approved — $${amount}`,
        html: emailLayout('Deposit Approved', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">✅</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Deposit Approved</h2>
              ${badge('APPROVED', '#10b981', 'rgba(16,185,129,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Great news, ${name}! Your deposit has been approved and added to your account balance.</p>
          ${amountBox(amount)}
          <p style="color:#9ca3af;font-size:14px;">Your balance is now updated. You can view your portfolio and transactions in the dashboard.</p>
          ${ctaButton('View Dashboard →', dashUrl)}
        `),
      }

    case 'deposit_rejected':
      return {
        subject: `❌ Deposit Rejected`,
        html: emailLayout('Deposit Rejected', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(239,68,68,0.15);border:2px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">❌</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Deposit Rejected</h2>
              ${badge('REJECTED', '#ef4444', 'rgba(239,68,68,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${name}, unfortunately your deposit of <strong style="color:white;">$${amount}</strong> was not approved.</p>
          ${note || reason ? `
          <div style="background:#0d1117;border:1px solid #ef4444;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Reason</p>
            <p style="color:#e5e7eb;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#9ca3af;font-size:14px;">Please make sure to upload clear proof of payment. Contact support if you need help.</p>
          ${ctaButton('Try Again →', `${dashUrl}/deposit`)}
        `),
      }

    case 'withdrawal_approved':
      return {
        subject: `✅ Withdrawal Processed — $${amount}`,
        html: emailLayout('Withdrawal Processed', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💸</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Withdrawal Processed</h2>
              ${badge('PROCESSED', '#10b981', 'rgba(16,185,129,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${name}, your withdrawal request has been processed and sent to your account.</p>
          ${amountBox(amount)}
          <p style="color:#9ca3af;font-size:14px;">Please allow 1-3 business days for the funds to arrive depending on your payment method.</p>
          ${ctaButton('View Dashboard →', dashUrl)}
        `),
      }

    case 'withdrawal_rejected':
      return {
        subject: `❌ Withdrawal Rejected`,
        html: emailLayout('Withdrawal Rejected', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(239,68,68,0.15);border:2px solid #ef4444;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">❌</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Withdrawal Rejected</h2>
              ${badge('REJECTED', '#ef4444', 'rgba(239,68,68,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${name}, your withdrawal of <strong style="color:white;">$${amount}</strong> was rejected.</p>
          ${note || reason ? `
          <div style="background:#0d1117;border:1px solid #ef4444;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Reason</p>
            <p style="color:#e5e7eb;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#9ca3af;font-size:14px;">Your balance has been restored. Please contact support if you have questions.</p>
          ${ctaButton('Contact Support →', `${dashUrl}/support`)}
        `),
      }

    case 'kyc_approved':
      return {
        subject: `✅ KYC Verified — You're fully verified!`,
        html: emailLayout('KYC Approved', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.15);border:2px solid #10b981;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🎉</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Identity Verified!</h2>
              ${badge('VERIFIED', '#10b981', 'rgba(16,185,129,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Congratulations ${name}! Your identity has been verified. You now have full access to all Topgee Capital features.</p>
          <div style="background:#0d1117;border:1px solid #1f2937;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#9ca3af;font-size:13px;margin:0 0 10px;">✅ Verified features unlocked:</p>
            ${['Higher deposit limits', 'Faster withdrawals', 'Full platform access'].map(f => `<p style="color:#e5e7eb;font-size:14px;margin:4px 0;">• ${f}</p>`).join('')}
          </div>
          ${ctaButton('Go to Dashboard →', dashUrl)}
        `),
      }

    case 'kyc_rejected':
      return {
        subject: `⚠️ KYC Verification Failed`,
        html: emailLayout('KYC Rejected', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.15);border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">⚠️</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Verification Failed</h2>
              ${badge('ACTION REQUIRED', '#f59e0b', 'rgba(245,158,11,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${name}, your KYC submission could not be approved at this time.</p>
          ${note || reason ? `
          <div style="background:#0d1117;border:1px solid #f59e0b;border-radius:12px;padding:16px;margin:16px 0;">
            <p style="color:#9ca3af;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Admin Note</p>
            <p style="color:#e5e7eb;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#9ca3af;font-size:14px;">Please resubmit with clear, readable documents. Make sure the photo is not blurry or cropped.</p>
          ${ctaButton('Resubmit KYC →', `${dashUrl}/kyc`)}
        `),
      }

    case 'profit_distributed':
      return {
        subject: `💰 Profit Distributed — $${amount} added to your account`,
        html: emailLayout('Profit Distributed', `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.15);border:2px solid #f59e0b;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">💰</div>
            <div>
              <h2 style="color:white;font-size:18px;margin:0 0 4px;">Profit Distributed!</h2>
              ${badge('PROFIT', '#f59e0b', 'rgba(245,158,11,0.15)')}
            </div>
          </div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">Hi ${name}, great news! Your profit share has been distributed to your account.</p>
          ${amountBox(amount)}
          <p style="color:#9ca3af;font-size:14px;">This has been added to your account balance. You can withdraw or keep it invested.</p>
          ${ctaButton('View Portfolio →', dashUrl)}
        `),
      }

    default:
      return { subject: 'Topgee Capital Notification', html: emailLayout('Notification', '<p style="color:#9ca3af;">You have a new notification from Topgee Capital.</p>') }
  }
}

export async function sendEmail({ to, template, data }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY

  if (!resendKey) {
    console.warn('[Email] RESEND_API_KEY not set — email not sent to', to)
    return { success: false, error: 'Email service not configured' }
  }

  const { subject, html } = getEmailContent(template, data)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${BRAND} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
      }),
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Resend error')
    console.log('[Email] Sent:', template, 'to', to)
    return { success: true }
  } catch (err) {
    console.error('[Email] Failed to send:', err)
    return { success: false, error: String(err) }
  }
}
