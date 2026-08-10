import { createClient } from '@supabase/supabase-js';
import ws from "ws";
import { OPENROUTER_MODELS, runBrandScan } from './_lib/runScan.js';

if (!globalThis.WebSocket) {
  globalThis.WebSocket = ws;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_REQUESTS_PER_WINDOW = Number(process.env.MAX_REQUESTS_PER_WINDOW || 10);
const MAX_REQUESTS_PER_DAY = Number(process.env.MAX_REQUESTS_PER_DAY || 200);

// In-memory store: secondary defense only — primary rate limiting is per user ID (verified via JWT)
const requestStore = new Map();

const now = () => Date.now();

const shouldRateLimit = (key) => {
  const current = now();
  const entry = requestStore.get(key) || {
    count: 0,
    windowStart: current,
    dailyCount: 0,
    dailyReset: current + 24 * 60 * 60 * 1000,
    lastRequest: current
  };

  if (current > entry.dailyReset) {
    entry.dailyCount = 0;
    entry.dailyReset = current + 24 * 60 * 60 * 1000;
    entry.windowStart = current;
    entry.count = 0;
  }

  if (current - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.windowStart = current;
    entry.count = 0;
  }

  entry.count += 1;
  entry.dailyCount += 1;
  entry.lastRequest = current;
  requestStore.set(key, entry);

  return entry.count > MAX_REQUESTS_PER_WINDOW || entry.dailyCount > MAX_REQUESTS_PER_DAY;
};

const createAdminClient = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: 0 } },
  });
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Enforce payload size limit
  if (event.body && event.body.length > 16 * 1024) {
    return { statusCode: 413, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Payload too large' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.toString().replace(/^Bearer\s+/i, '');

  // Netlify's own trusted header — cannot be spoofed by the client, unlike
  // x-forwarded-for which a caller can pre-populate themselves.
  const getIp = () => event.headers['x-nf-client-connection-ip'] || 'unknown';
  const GUEST_LIMIT = 3;

  let authedUser = null;
  let supabaseAdmin = null;

  try {
    supabaseAdmin = createAdminClient();

    if (token) {
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return {
          statusCode: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }
      authedUser = user;

      // Rate limit by verified user ID — not spoofable
      if (shouldRateLimit(`user:${user.id}`)) {
        return {
          statusCode: 429,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Too many requests. Spróbuj ponownie później.' })
        };
      }
    } else {
      // No session — the free, no-login scan ("Free analysis, no credit
      // card required" on the landing page). Gate it with a lifetime
      // per-IP counter (increment_guest_limit) enforced right here, at the
      // point that actually spends the paid OpenRouter budget — this used
      // to unconditionally 401 instead, and a separate client-side
      // pre-flight call to a now-removed guest-limit.js endpoint was the
      // only thing tracking guest usage, which nothing stopped a caller
      // from simply skipping.
      const ip = getIp();
      if (ip === 'unknown') {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Could not verify request. Please sign in.', guestLimitReached: true })
        };
      }
      const { data: guestCount, error: guestError } = await supabaseAdmin.rpc('increment_guest_limit', { p_ip: ip });
      if (guestError) {
        console.error('Guest limit RPC error:', guestError.message);
        // Fail open — don't block a real visitor because the DB hiccuped
      } else if ((guestCount ?? 0) > GUEST_LIMIT) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Guest limit reached. Sign up for more free analyses.', guestLimitReached: true })
        };
      }
    }
  } catch (err) {
    console.error('Auth error in analyze function');
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authentication failed. Please try again.' })
    };
  }

  try {
    const { url, models: requestedModelIds } = JSON.parse(event.body || '{}');
    const target = String(url || '').trim().slice(0, 500) || 'unknown brand';

    let planTier = 0; // guests get the Free-equivalent roster
    if (authedUser) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan')
        .eq('id', authedUser.id)
        .single();
      const PLAN_TIER = { free: 0, starter: 1, solo: 1, growth: 2, enterprise: 2, agency: 2 };
      planTier = PLAN_TIER[String(profile?.plan || 'free').toLowerCase()] ?? 0;
    }

    const allowedModels = OPENROUTER_MODELS.filter((m) => m.tier <= planTier);
    // User's model picks from Settings, intersected with what their plan
    // actually allows — never let a client-supplied list escalate past tier.
    const requestedSet = Array.isArray(requestedModelIds) ? new Set(requestedModelIds) : null;
    const selectedModels = requestedSet
      ? allowedModels.filter((m) => requestedSet.has(m.id))
      : allowedModels;
    const modelsToQuery = selectedModels.length > 0 ? selectedModels : allowedModels;

    const result = await runBrandScan({
      supabaseAdmin,
      target,
      models: modelsToQuery,
      userId: authedUser?.id || null,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('analyze handler error:', error.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Analysis failed. Please try again.' })
    };
  }
};
