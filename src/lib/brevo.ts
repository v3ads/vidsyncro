/**
 * Brevo (formerly Sendinblue) transactional email client
 * Docs: https://developers.brevo.com/reference/sendtransacemail
 * Env vars: BREVO_API_KEY, BREVO_FROM_EMAIL, BREVO_FROM_NAME
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

interface EmailRecipient {
  email: string
  name?: string
}

interface SendEmailOptions {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  htmlContent: string
  textContent?: string
  replyTo?: EmailRecipient
  tags?: string[]
}

export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY not set — email not sent')
    return false
  }

  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to]

  const payload = {
    sender: {
      email: process.env.BREVO_FROM_EMAIL || 'hello@vidsyncro.com',
      name: process.env.BREVO_FROM_NAME || 'VidSyncro',
    },
    to: recipients,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
    textContent: opts.textContent,
    replyTo: opts.replyTo,
    tags: opts.tags,
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Brevo send error:', res.status, err)
    return false
  }

  return true
}

// ── Email templates ─────────────────────────────────────────────────────────

const BTN = `display:inline-block;padding:14px 28px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;margin:24px 0;`

function wrap(content: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0a;color:#fff;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#18181b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:32px 40px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.5px;">⚡ VidSyncro</span>
    </div>
    <div style="padding:32px 40px;">${content}</div>
    <div style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);color:#52525b;font-size:13px;">
      © ${new Date().getFullYear()} VidSyncro &middot; <a href="https://vidsyncro.com" style="color:#7c3aed;">vidsyncro.com</a>
    </div>
  </div></body></html>`
}

export const emailTemplates = {
  welcome(name: string, dashboardUrl: string) {
    return {
      subject: 'Welcome to VidSyncro ⚡',
      htmlContent: wrap(`
        <h1 style="font-size:26px;font-weight:700;margin:0 0 12px;">Welcome, ${name || 'there'} 👋</h1>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 16px;">
          You're now on VidSyncro — the dual-video interactive platform where two realities meet in a single hold.
        </p>
        <ol style="color:#a1a1aa;padding-left:20px;line-height:2;">
          <li>Create your first project</li>
          <li>Upload Reality A and Reality B</li>
          <li>Copy your embed code anywhere</li>
        </ol>
        <a href="${dashboardUrl}" style="${BTN}">Go to Dashboard →</a>
      `),
      textContent: `Welcome to VidSyncro! Get started at ${dashboardUrl}`,
      tags: ['welcome'],
    }
  },

  planUpgraded(name: string, plan: string, dashboardUrl: string) {
    const emoji: Record<string, string> = { starter: '🚀', pro: '⚡', enterprise: '🏢' }
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
    return {
      subject: `You're now on the ${planLabel} plan ✨`,
      htmlContent: wrap(`
        <h1 style="font-size:26px;font-weight:700;margin:0 0 12px;">${emoji[plan] || '✨'} Plan upgraded!</h1>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 16px;">
          Hi ${name || 'there'}, your account is now on the
          <strong style="color:#7c3aed;">${planLabel}</strong> plan. New features are active immediately.
        </p>
        <a href="${dashboardUrl}" style="${BTN}">Explore your plan →</a>
      `),
      textContent: `Plan upgraded to ${plan}. Visit ${dashboardUrl}`,
      tags: ['billing'],
    }
  },

  videoReady(name: string, projectTitle: string, editorUrl: string) {
    return {
      subject: `Your video is ready — "${projectTitle}"`,
      htmlContent: wrap(`
        <h1 style="font-size:26px;font-weight:700;margin:0 0 12px;">🎬 Video ready!</h1>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 16px;">
          Hi ${name || 'there'}, your video for <strong style="color:#e4e4e7;">${projectTitle}</strong>
          has finished processing and is ready to publish.
        </p>
        <a href="${editorUrl}" style="${BTN}">Open Editor →</a>
      `),
      textContent: `Video "${projectTitle}" is ready. Edit at ${editorUrl}`,
      tags: ['video', 'notification'],
    }
  },

  paymentFailed(name: string, billingUrl: string) {
    return {
      subject: 'Payment failed — action needed',
      htmlContent: wrap(`
        <h1 style="font-size:26px;font-weight:700;margin:0 0 12px;">⚠️ Payment issue</h1>
        <p style="color:#a1a1aa;line-height:1.7;margin:0 0 16px;">
          Hi ${name || 'there'}, we couldn't process your last payment.
          Please update your billing to keep your plan active.
        </p>
        <a href="${billingUrl}" style="${BTN}background:#ef4444;">Update Billing →</a>
        <p style="color:#52525b;font-size:13px;">Your projects remain accessible for 7 days.</p>
      `),
      textContent: `Payment failed. Update billing at ${billingUrl}`,
      tags: ['billing', 'alert'],
    }
  },
}
