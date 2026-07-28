/**
 * GET  /.netlify/functions/newsletter-preference   -> { subscribed: boolean }
 * POST /.netlify/functions/newsletter-preference    body: { subscribed: boolean }
 *
 * Authenticated (Bearer token) read/write of the logged-in user's own
 * newsletter subscription — lets Settings show and change real state instead
 * of a local-only toggle. Always operates on the verified user's own email,
 * never a client-supplied one.
 */
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALLOWED_ORIGINS = new Set(['https://presora.app', 'https://www.presora.app']);

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://presora.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
});

exports.handler = async (event) => {
  const headers = corsHeaders(event.headers.origin || '');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  const email = user.email.toLowerCase();

  if (event.httpMethod === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('unsubscribed_at')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('newsletter-preference GET error');
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ subscribed: !!data && !data.unsubscribed_at }) };
  }

  // POST
  let subscribed;
  try {
    ({ subscribed } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  if (typeof subscribed !== 'boolean') {
    return { statusCode: 400, headers, body: JSON.stringify({ error: '"subscribed" must be a boolean' }) };
  }

  const { error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: subscribed ? null : new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (error) {
    console.error('newsletter-preference POST error');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Database error' }) };
  }

  return { statusCode: 200, headers, body: JSON.stringify({ subscribed }) };
};
