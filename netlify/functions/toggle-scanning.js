/**
 * GET  /.netlify/functions/toggle-scanning  -> { enabled: boolean, updatedAt, updatedBy }
 * POST /.netlify/functions/toggle-scanning  Body: { enabled: boolean }
 *
 * Admin-only kill-switch for brand scanning (app_settings.scanning_enabled,
 * see the 20240133 migration). Turning it off makes analyze.js / api-analyze.js
 * answer 503 with an honest "temporarily paused" message instead of letting
 * every scan fail deep inside the model calls, and makes the scheduled
 * re-scanner skip its runs — useful when OpenRouter can't serve requests
 * (no credits, revoked key, provider outage).
 *
 * app_settings has RLS on with no policies, so it's unreachable with an
 * anon/authenticated JWT; this service-role write is gated on the caller's
 * profiles.is_admin, mirroring set-custom-plan-price.js.
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
  console.error('toggle-scanning: Supabase client init failed:', err.message);
}

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

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
  if (!['GET', 'POST'].includes(event.httpMethod)) {
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

    if (event.httpMethod === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('app_settings')
        .select('key, value, updated_at, updated_by')
        .in('key', ['scanning_enabled', 'provider_failures', 'scanning_disabled_reason']);
      if (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
      }
      const rows = Object.fromEntries((data || []).map((r) => [r.key, r]));
      const flag = rows.scanning_enabled;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          // Missing row means "never configured" — scanning is on by default,
          // matching getScanSettings()'s fail-open behaviour.
          enabled: flag ? flag.value !== false && flag.value !== 'false' : true,
          updatedAt: flag?.updated_at ?? null,
          updatedBy: flag?.updated_by ?? null,
          // So the admin UI can say "you paused this" vs "the watchdog did,
          // after N failures, and here's the provider's last error".
          reason: rows.scanning_disabled_reason?.value ?? null,
          failureCount: Number(rows.provider_failures?.value?.count) || 0,
          // The provider's own words for the most recent failed scan. Was
          // only surfaced once the watchdog had already paused scanning, so
          // while a streak was building the admin panel showed a count and
          // nothing about the cause.
          lastError: rows.provider_failures?.value?.lastError ?? null,
          lastFailureAt: rows.provider_failures?.value?.lastFailureAt ?? null,
        }),
      };
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    if (typeof payload.enabled !== 'boolean') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: '"enabled" must be true or false' }) };
    }

    const { error: upsertError } = await supabaseAdmin
      .from('app_settings')
      .upsert({
        key: 'scanning_enabled',
        value: payload.enabled,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'key' });

    if (upsertError) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: upsertError.message }) };
    }

    // Turning it back on clears the watchdog's streak, otherwise the very
    // next failure would immediately re-trip the threshold. Also records who
    // last flipped it, so the UI can distinguish manual from automatic.
    await supabaseAdmin.from('app_settings').upsert([
      { key: 'provider_failures', value: { count: 0 }, updated_at: new Date().toISOString() },
      {
        key: 'scanning_disabled_reason',
        value: payload.enabled ? null : { source: 'manual', at: new Date().toISOString(), by: user.id },
        updated_at: new Date().toISOString(),
      },
    ], { onConflict: 'key' });

    console.log(`toggle-scanning: scanning ${payload.enabled ? 'ENABLED' : 'DISABLED'} by ${user.id}`);
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, enabled: payload.enabled }) };
  } catch (err) {
    console.error('toggle-scanning handler error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Something went wrong. Please try again.' }) };
  }
};
