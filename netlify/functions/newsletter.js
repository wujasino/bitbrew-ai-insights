/**
 * POST /.netlify/functions/newsletter
 * Body: { email: string }
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const ws = require('ws');

// Node < 22 has no native WebSocket — supabase-js inits Realtime eagerly.
if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

// Matches the fallback pattern used by the other functions (analyze.js,
// chat.js, send-reset-otp.js) — the project's Netlify env has used both
// naming conventions at different times.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Dedicated signing secret — was previously a plain SHA-256 of the service
// role key, meaning a leak of one weakened the other. Falls back to the
// service role key only until NEWSLETTER_UNSUBSCRIBE_SECRET is set in
// Netlify; set it and every link signed after that uses the real HMAC key.
// Same secret/scheme verified by unsubscribe-newsletter.js.
const UNSUBSCRIBE_SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || SUPABASE_SERVICE_KEY;
const signUnsubscribe = (email) =>
  crypto.createHmac('sha256', UNSUBSCRIBE_SECRET).update(email).digest('hex');

// Inlined branded email — keeps the function self-contained (no filesystem reads).
// Visual language matches the other transactional emails (src/email-templates/*.html).
const buildWelcomeEmail = (unsubscribeUrl) => `<!DOCTYPE html>
<html lang="pl"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0B0F19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0B0F19;"><tr><td align="center" style="padding:48px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#111827;border-radius:16px;border:1px solid #334155;overflow:hidden;">
      <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #334155;text-align:center;">
        <img src="https://presora.app/presora-mark-indigo.png" alt="Presora" width="48" height="48" style="display:inline-block;margin-bottom:12px;" />
        <div style="font-size:20px;font-weight:700;color:#F8FAFC;letter-spacing:-0.3px;">Presora</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">AI Brand Intelligence</div>
      </td></tr>
      <tr><td style="padding:36px 40px 28px;">
        <div style="text-align:center;margin-bottom:28px;"><div style="display:inline-block;width:56px;height:56px;border-radius:14px;background-color:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);text-align:center;line-height:56px;"><span style="font-size:26px;">✉️</span></div></div>
        <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#F8FAFC;text-align:center;letter-spacing:-0.3px;">Jesteś zapisany!</h1>
        <p style="margin:0 0 28px;font-size:14px;line-height:1.65;color:#94A3B8;text-align:center;">Dzięki za dołączenie do newslettera Presora.<br/>Będziemy wysyłać Ci najważniejsze aktualizacje o widoczności marek w AI.</p>
        <div style="text-align:center;margin-bottom:28px;"><a href="https://www.presora.app/dashboard" style="display:inline-block;padding:13px 32px;background-color:#6366F1;color:#F8FAFC;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">Przejdź do Presora →</a></div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
          <tr><td style="padding:12px 14px;background-color:#1E293B;border-radius:10px;border:1px solid #334155;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;"><span style="font-size:15px;">📊</span></td>
            <td><div style="font-size:12px;font-weight:600;color:#F8FAFC;">Nowości o widoczności w AI</div><div style="font-size:11px;color:#94A3B8;margin-top:2px;">Co się zmienia w ChatGPT, Claude i Gemini</div></td>
          </tr></table></td></tr>
          <tr><td style="height:6px;"></td></tr>
          <tr><td style="padding:12px 14px;background-color:#1E293B;border-radius:10px;border:1px solid #334155;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;"><span style="font-size:15px;">💡</span></td>
            <td><div style="font-size:12px;font-weight:600;color:#F8FAFC;">Praktyczne wskazówki GEO</div><div style="font-size:11px;color:#94A3B8;margin-top:2px;">Jak zwiększyć rekomendacje marki w modelach AI</div></td>
          </tr></table></td></tr>
        </table>
        <div style="border-top:1px solid #334155;margin:24px 0;"></div>
        <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6;">Zmieniłeś zdanie? Możesz zrezygnować w każdej chwili z linku na dole tej wiadomości.</p>
      </td></tr>
      <tr><td style="padding:20px 40px 28px;border-top:1px solid #334155;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#94A3B8;">Wiadomość wysłana automatycznie przez <a href="https://presora.app" style="color:#6366F1;text-decoration:none;">Presora</a></p>
        <p style="margin:0 0 10px;font-size:11px;color:#64748B;">© 2026 Presora · Wszystkie prawa zastrzeżone</p>
        <p style="margin:0;font-size:11px;color:#94A3B8;"><a href="${unsubscribeUrl}" style="color:#94A3B8;text-decoration:underline;">Wypisz się z newslettera</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

const ALLOWED_ORIGINS = new Set(['https://presora.app', 'https://www.presora.app']);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestStore = new Map();
// Only trust Netlify's own connection-IP header — x-forwarded-for can be
// pre-populated by the client itself and isn't a reliable rate-limit key.
const getIp = (event) => event.headers['x-nf-client-connection-ip'] || 'unknown';
const shouldRateLimit = (key) => {
  const current = Date.now();
  const entry = requestStore.get(key) || { count: 0, windowStart: current };
  if (current - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.windowStart = current;
    entry.count = 0;
  }
  entry.count += 1;
  requestStore.set(key, entry);
  return entry.count > MAX_REQUESTS_PER_WINDOW;
};

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://presora.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
});

// Stricter email regex: requires TLD of at least 2 chars
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[a-zA-Z]{2,}$/;

exports.handler = async (event) => {
  const origin = event.headers.origin || '';
  const headers = corsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (event.body && event.body.length > 4 * 1024) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large' }) };
  }

  if (shouldRateLimit(getIp(event))) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests. Please try again later.' }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { error: dbError } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      { email: normalizedEmail, subscribed_at: new Date().toISOString(), unsubscribed_at: null },
      { onConflict: 'email' }
    );

  if (dbError) {
    console.error('Newsletter DB error');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }

  // Optional: Mailchimp integration
  if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_LIST_ID) {
    try {
      const dc = process.env.MAILCHIMP_API_KEY.split('-').pop();
      await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${process.env.MAILCHIMP_LIST_ID}/members`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: normalizedEmail, status: 'subscribed' }),
      });
    } catch {
      // Non-fatal — subscriber is already saved in Supabase
    }
  }

  // Welcome email — best-effort, subscription already succeeded either way
  if (process.env.RESEND_API_KEY) {
    try {
      const unsubscribeUrl = `${process.env.URL || 'https://www.presora.app'}/.netlify/functions/unsubscribe-newsletter?email=${encodeURIComponent(normalizedEmail)}&sig=${signUnsubscribe(normalizedEmail)}`;
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || 'Presora <noreply@presora.app>',
          to: normalizedEmail,
          subject: 'Jesteś zapisany do newslettera Presora',
          html: buildWelcomeEmail(unsubscribeUrl),
        }),
      });
      if (!resendRes.ok) {
        console.error('Resend welcome email error:', await resendRes.text());
      }
    } catch (err) {
      console.error('Resend welcome email failed:', err.message);
    }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
};
