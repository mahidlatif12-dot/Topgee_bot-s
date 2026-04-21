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
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px 40px;">

    <!-- Logo Header -->
    <div style="text-align:center;padding:28px 0 20px;">
      <img src="https://topgeecapital.com/logo.jpeg"
           alt="Topgee Capital"
           width="64" height="64"
           style="border-radius:16px;display:block;margin:0 auto 12px;box-shadow:0 4px 16px rgba(0,0,0,0.15);" />
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Topgee Capital</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Professional Gold Trading</p>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:20px;box-shadow:0 2px 24px rgba(0,0,0,0.08);overflow:hidden;">

      <!-- Green top bar -->
      <div style="height:6px;background:linear-gradient(90deg,#10b981,#059669,#f59e0b);"></div>

      <!-- Content -->
      <div style="padding:36px 32px;">
        ${body}
      </div>

      <!-- Footer inside card -->
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">© ${new Date().getFullYear()} Topgee Capital. All rights reserved.</p>
        <a href="https://topgeecapital.com" style="color:#10b981;font-size:12px;text-decoration:none;font-weight:600;">topgeecapital.com</a>
        <p style="color:#d1d5db;font-size:11px;margin:8px 0 0;">If you didn&apos;t request this email, you can safely ignore it.</p>
      </div>
    </div>

  </div>
</body>
</html>`
}

function badge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;padding:5px 14px;border-radius:20px;background:${bg};color:${color};font-size:12px;font-weight:700;letter-spacing:0.5px;">${text}</span>`
}

function amountBox(amount: number | string) {
  return `
  <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #10b981;border-radius:16px;padding:24px;text-align:center;margin:24px 0;">
    <p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Amount</p>
    <p style="margin:8px 0 0;color:#059669;font-size:40px;font-weight:800;letter-spacing:-1px;">$${amount}</p>
  </div>`
}

function ctaButton(text: string, url: string) {
  return `
  <div style="text-align:center;margin-top:28px;">
    <a href="${url}" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 4px 12px rgba(16,185,129,0.3);letter-spacing:0.2px;">
      ${text}
    </a>
  </div>`
}

function divider() {
  return `<div style="height:1px;background:#e5e7eb;margin:24px 0;"></div>`
}

function getEmailContent(template: EmailTemplate, data: Record<string, string | number>): { subject: string; html: string } {
  const { amount, name, reason, note } = data as Record<string, string>
  const dashUrl = 'https://topgeecapital.com/dashboard'

  switch (template) {
    case 'welcome':
      return {
        subject: `Welcome to Topgee Capital! 🎉`,
        html: emailLayout('Welcome', `
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:48px;margin-bottom:8px;">🎉</div>
            <h2 style="color:#111827;font-size:24px;font-weight:800;margin:0 0 8px;">Welcome, ${name}!</h2>
            <p style="color:#6b7280;font-size:15px;margin:0;">Your account is ready. Let's get started.</p>
          </div>
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">You've successfully joined <strong>Topgee Capital</strong> — Pakistan's trusted gold trading investment platform.</p>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
            <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 14px;">Get started in 3 steps:</p>
            ${['Complete your KYC verification', 'Make your first deposit', 'Watch your investment grow'].map((s, i) => `
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);color:white;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:28px;">${i + 1}</div>
                <span style="color:#374151;font-size:14px;">${s}</span>
              </div>`).join('')}
          </div>
          ${ctaButton('Go to Dashboard →', dashUrl)}
        `),
      }

    case 'deposit_approved':
      return {
        subject: `✅ Deposit Approved — $${amount}`,
        html: emailLayout('Deposit Approved', `
          <div style="text-align:center;margin-bottom:24px;">
            ${badge('✅ APPROVED', '#059669', '#dcfce7')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Deposit Confirmed!</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Your funds are now in your account</p>
          </div>
          ${amountBox(amount)}
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, your deposit has been approved and added to your Topgee Capital balance. You can now start earning profit.</p>
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;">
            <p style="color:#059669;font-size:13px;margin:0;">📅 Approved on: <strong>${new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}</strong></p>
          </div>
          ${ctaButton('View My Portfolio →', dashUrl)}
        `),
      }

    case 'deposit_rejected':
      return {
        subject: `❌ Deposit Not Approved`,
        html: emailLayout('Deposit Rejected', `
          <div style="text-align:center;margin-bottom:24px;">
            ${badge('❌ NOT APPROVED', '#dc2626', '#fee2e2')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Deposit Rejected</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Your deposit of <strong style="color:#111827;">$${amount}</strong> was not approved</p>
          </div>
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, unfortunately we couldn't approve your recent deposit.</p>
          ${note || reason ? `
          <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px;margin:16px 0;">
            <p style="color:#991b1b;font-size:13px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
            <p style="color:#374151;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#6b7280;font-size:14px;margin:16px 0;">Please resubmit with a clear screenshot of your payment. Make sure the amount and date are visible.</p>
          ${ctaButton('Try Again →', `${dashUrl}/deposit`)}
        `),
      }

    case 'withdrawal_approved':
      return {
        subject: `💸 Withdrawal Processed — $${amount}`,
        html: emailLayout('Withdrawal Processed', `
          <div style="text-align:center;margin-bottom:24px;">
            ${badge('✅ PROCESSED', '#059669', '#dcfce7')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Withdrawal Sent!</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Your funds are on the way</p>
          </div>
          ${amountBox(amount)}
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, your withdrawal has been processed and sent to your registered payment account.</p>
          <div style="background:#f0fdf4;border-radius:10px;padding:16px;margin:16px 0;">
            <p style="color:#059669;font-size:13px;margin:0 0 4px;">⏱️ <strong>Delivery time:</strong> 1–3 business days</p>
            <p style="color:#059669;font-size:13px;margin:0;">📅 Processed on: <strong>${new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}</strong></p>
          </div>
          ${ctaButton('View Dashboard →', dashUrl)}
        `),
      }

    case 'withdrawal_rejected':
      return {
        subject: `❌ Withdrawal Rejected`,
        html: emailLayout('Withdrawal Rejected', `
          <div style="text-align:center;margin-bottom:24px;">
            ${badge('❌ REJECTED', '#dc2626', '#fee2e2')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Withdrawal Rejected</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Your withdrawal of <strong style="color:#111827;">$${amount}</strong> was rejected</p>
          </div>
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, we were unable to process your withdrawal request.</p>
          ${note || reason ? `
          <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px;margin:16px 0;">
            <p style="color:#991b1b;font-size:13px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
            <p style="color:#374151;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#6b7280;font-size:14px;">Your balance has been fully restored. Please contact support if you have questions.</p>
          ${ctaButton('Contact Support →', `${dashUrl}/support`)}
        `),
      }

    case 'kyc_approved':
      return {
        subject: `✅ Identity Verified — Welcome to full access!`,
        html: emailLayout('KYC Approved', `
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:48px;margin-bottom:8px;">🎉</div>
            ${badge('✅ VERIFIED', '#059669', '#dcfce7')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">You're Fully Verified!</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Identity verification complete</p>
          </div>
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Congratulations <strong>${name}</strong>! Your identity has been verified. You now have full access to all Topgee Capital features.</p>
          <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0;">
            <p style="color:#374151;font-size:14px;font-weight:700;margin:0 0 12px;">🔓 Features unlocked:</p>
            ${['Higher deposit limits', 'Priority withdrawals', 'Full platform access', 'Premium investment plans'].map(f => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="color:#10b981;font-size:16px;">✓</span>
                <span style="color:#374151;font-size:14px;">${f}</span>
              </div>`).join('')}
          </div>
          ${ctaButton('Explore Dashboard →', dashUrl)}
        `),
      }

    case 'kyc_rejected':
      return {
        subject: `⚠️ Action Required — KYC Verification Failed`,
        html: emailLayout('KYC Rejected', `
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:48px;margin-bottom:8px;">⚠️</div>
            ${badge('ACTION REQUIRED', '#d97706', '#fef3c7')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Verification Failed</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Please resubmit your documents</p>
          </div>
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, we were unable to verify your identity with the documents submitted.</p>
          ${note || reason ? `
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px;margin:16px 0;">
            <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px;">Admin Note</p>
            <p style="color:#374151;font-size:14px;margin:0;">${note || reason}</p>
          </div>` : ''}
          <p style="color:#6b7280;font-size:14px;margin:16px 0;">Please make sure your document photo is clear, not blurry, and shows all four corners. Resubmit and we'll review again within 24 hours.</p>
          ${ctaButton('Resubmit KYC →', `${dashUrl}/kyc`)}
        `),
      }

    case 'profit_distributed':
      return {
        subject: `💰 Profit Added — $${amount} in your account`,
        html: emailLayout('Profit Distributed', `
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:48px;margin-bottom:8px;">💰</div>
            ${badge('PROFIT DISTRIBUTED', '#d97706', '#fef3c7')}
            <h2 style="color:#111827;font-size:22px;font-weight:800;margin:16px 0 4px;">Your Profit is Here!</h2>
            <p style="color:#6b7280;font-size:14px;margin:0;">Added to your account balance</p>
          </div>
          ${amountBox(amount)}
          ${divider()}
          <p style="color:#374151;font-size:15px;line-height:1.8;">Hi <strong>${name}</strong>, great news! Your profit share has been distributed and added to your Topgee Capital balance.</p>
          <div style="background:#fffbeb;border-radius:10px;padding:16px;margin:16px 0;">
            <p style="color:#92400e;font-size:13px;margin:0;">📅 Distributed on: <strong>${new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}</strong></p>
          </div>
          <p style="color:#6b7280;font-size:14px;">You can withdraw your earnings or keep them invested to compound your returns.</p>
          ${ctaButton('View Portfolio →', dashUrl)}
        `),
      }

    default:
      return { subject: 'Topgee Capital Notification', html: emailLayout('Notification', '<p style="color:#374151;">You have a new notification from Topgee Capital.</p>') }
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
