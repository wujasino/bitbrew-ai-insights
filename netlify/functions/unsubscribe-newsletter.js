/**
 * GET /.netlify/functions/unsubscribe-newsletter?email=...&sig=...
 * Link target from the newsletter welcome email — verifies the signature
 * (so a stranger can't unsubscribe someone else just by knowing their email)
 * and marks the subscriber as unsubscribed. Renders a small HTML page since
 * this is opened directly in a browser from an email client, not called by
 * the app.
 */
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const ws = require('ws');

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Same secret/scheme used to sign the link in newsletter.js's buildWelcomeEmail.
const sign = (email) =>
  crypto.createHash('sha256').update(`${email}:${process.env.SUPABASE_SERVICE_KEY}`).digest('hex');

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (title, body) => ({
  statusCode: 200,
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
  body: `<!DOCTYPE html><html lang="pl"><head><meta charset="UTF-8" /><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f;min-height:100vh;"><tr><td align="center" style="padding:48px 16px;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:420px;background-color:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;padding:40px;text-align:center;">
<div style="font-size:18px;font-weight:700;color:#F7F1DD;margin-bottom:16px;">Presora</div>
<p style="font-size:14px;line-height:1.6;color:#ccc;margin:0;">${body}</p>
</table></td></tr></table></body></html>`,
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { email, sig } = event.queryStringParameters || {};
  if (!email || !sig) {
    return page('Nieprawidłowy link', 'Ten link do wypisania jest niekompletny.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (sign(normalizedEmail) !== sig) {
    return page('Nieprawidłowy link', 'Nie udało się zweryfikować tego linku.');
  }

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', normalizedEmail);

  if (error) {
    console.error('Unsubscribe DB error');
    return page('Coś poszło nie tak', 'Spróbuj ponownie później albo napisz do nas.');
  }

  return page('Wypisano', `Adres <strong style="color:#F7F1DD;">${escapeHtml(normalizedEmail)}</strong> został wypisany z newslettera Presora.`);
};
