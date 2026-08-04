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
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;"><tr><td align="center" style="padding:48px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
      <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a2a;text-align:center;">
        <img src="data:image/png;base64,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" alt="Presora" width="48" height="48" style="display:inline-block;border-radius:10px;margin-bottom:12px;" />
        <div style="font-size:20px;font-weight:700;color:#F7F1DD;letter-spacing:-0.3px;">Presora</div>
        <div style="font-size:11px;color:#666;margin-top:2px;text-transform:uppercase;letter-spacing:1px;">AI Brand Intelligence</div>
      </td></tr>
      <tr><td style="padding:36px 40px 28px;">
        <div style="text-align:center;margin-bottom:28px;"><div style="display:inline-block;width:56px;height:56px;border-radius:14px;background-color:#1f1a0e;border:1px solid #D4A01740;text-align:center;line-height:56px;"><span style="font-size:26px;">✉️</span></div></div>
        <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#F7F1DD;text-align:center;letter-spacing:-0.3px;">Jesteś zapisany!</h1>
        <p style="margin:0 0 28px;font-size:14px;line-height:1.65;color:#888;text-align:center;">Dzięki za dołączenie do newslettera Presora.<br/>Będziemy wysyłać Ci najważniejsze aktualizacje o widoczności marek w AI.</p>
        <div style="text-align:center;margin-bottom:28px;"><a href="https://www.presora.app/dashboard" style="display:inline-block;padding:13px 32px;background-color:#D4A017;color:#0f0f0f;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">Przejdź do Presora →</a></div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
          <tr><td style="padding:12px 14px;background-color:#141414;border-radius:10px;border:1px solid #222;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;"><span style="font-size:15px;">📊</span></td>
            <td><div style="font-size:12px;font-weight:600;color:#F7F1DD;">Nowości o widoczności w AI</div><div style="font-size:11px;color:#555;margin-top:2px;">Co się zmienia w ChatGPT, Claude i Gemini</div></td>
          </tr></table></td></tr>
          <tr><td style="height:6px;"></td></tr>
          <tr><td style="padding:12px 14px;background-color:#141414;border-radius:10px;border:1px solid #222;"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;"><span style="font-size:15px;">💡</span></td>
            <td><div style="font-size:12px;font-weight:600;color:#F7F1DD;">Praktyczne wskazówki GEO</div><div style="font-size:11px;color:#555;margin-top:2px;">Jak zwiększyć rekomendacje marki w modelach AI</div></td>
          </tr></table></td></tr>
        </table>
        <div style="border-top:1px solid #2a2a2a;margin:24px 0;"></div>
        <p style="margin:0;font-size:12px;color:#555;text-align:center;line-height:1.6;">Zmieniłeś zdanie? Możesz zrezygnować w każdej chwili z linku na dole tej wiadomości.</p>
      </td></tr>
      <tr><td style="padding:20px 40px 28px;border-top:1px solid #2a2a2a;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#444;">Wiadomość wysłana automatycznie przez <a href="https://presora.app" style="color:#D4A017;text-decoration:none;">Presora</a></p>
        <p style="margin:0 0 10px;font-size:11px;color:#333;">© 2026 Presora · Wszystkie prawa zastrzeżone</p>
        <p style="margin:0;font-size:11px;color:#444;"><a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Wypisz się z newslettera</a></p>
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
