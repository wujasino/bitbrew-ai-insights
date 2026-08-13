/**
 * POST /.netlify/functions/send-announcement
 * Body: { title: string, body: string, planScope?: string[], expiresAt?: string|null }
 *
 * Admin-only broadcast: writes one `notifications` row (type: 'announcement')
 * per matching account, so it shows up in the bell (avatar-notifications.tsx)
 * the same way a score_alert does, but with its own icon/color and an
 * optional planScope badge. expiresAt (if set) is stored as
 * notifications.expires_at — avatar-notifications.tsx filters those out
 * once they're in the past, so a message doesn't linger after it stops
 * being relevant.
 */
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

if (!globalThis.WebSocket) globalThis.WebSocket = ws;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin;
try {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
} catch (err) {
  console.error('send-announcement: Supabase client init failed:', err.message);
}

const ALLOWED_ORIGINS = new Set(['https://presora.app', 'https://www.presora.app']);
const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://presora.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
  'Vary': 'Origin',
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestStore = new Map();
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

const MAX_TITLE_LEN = 200;
const MAX_BODY_LEN = 2000;

// Display names shown in the admin form (and Pricing.tsx) → raw values
// stored in profiles.plan. Growth's paid-plan display name is "Business"
// (see PLAN_LABELS in useAccountInfo.ts) and Agency covers both the current
// 'agency' and legacy 'enterprise' rows for that same tier.
const PLAN_RAW_VALUES = {
  Free: ['free'],
  Starter: ['starter'],
  Solo: ['solo'],
  Business: ['growth'],
  Agency: ['enterprise', 'agency'],
};

exports.handler = async (event) => {
  const headers = corsHeaders(event.headers.origin || '');

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    if (!supabaseAdmin) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
    }

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!callerProfile?.is_admin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
    }

    if (shouldRateLimit(user.id)) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests. Please try again later.' }) };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const bodyText = typeof payload.body === 'string' ? payload.body.trim() : '';
    if (!title || title.length > MAX_TITLE_LEN) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `"title" is required (max ${MAX_TITLE_LEN} chars)` }) };
    }
    if (!bodyText || bodyText.length > MAX_BODY_LEN) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `"body" is required (max ${MAX_BODY_LEN} chars)` }) };
    }

    const planScope = Array.isArray(payload.planScope) ? payload.planScope.filter((p) => typeof p === 'string') : [];
    let rawPlanValues = null; // null = no filter, send to every account
    if (planScope.length > 0) {
      const invalid = planScope.filter((p) => !PLAN_RAW_VALUES[p]);
      if (invalid.length > 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: `Unknown plan(s): ${invalid.join(', ')}` }) };
      }
      rawPlanValues = planScope.flatMap((p) => PLAN_RAW_VALUES[p]);
    }

    let expiresAt = null;
    if (payload.expiresAt) {
      const parsed = new Date(payload.expiresAt);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: '"expiresAt" must be a valid future date' }) };
      }
      expiresAt = parsed.toISOString();
    }

    let targetQuery = supabaseAdmin.from('profiles').select('id');
    if (rawPlanValues) targetQuery = targetQuery.in('plan', rawPlanValues);
    const { data: targets, error: targetsError } = await targetQuery;
    if (targetsError) throw targetsError;

    if (!targets || targets.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0 }) };
    }

    const rows = targets.map((t) => ({
      user_id: t.id,
      type: 'announcement',
      title,
      body: bodyText,
      data: planScope.length > 0 ? { planScope } : null,
      expires_at: expiresAt,
    }));

    const { error: insertError } = await supabaseAdmin.from('notifications').insert(rows);
    if (insertError) throw insertError;

    return { statusCode: 200, headers, body: JSON.stringify({ sent: rows.length }) };
  } catch (err) {
    console.error('send-announcement handler error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
