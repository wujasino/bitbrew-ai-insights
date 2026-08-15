/**
 * Verifies a Presora API key (Authorization: Bearer bb_live_...) for the
 * public API endpoints (api-analyze.js, api-analyses.js). Keys are stored
 * as a SHA-256 hash (api_keys.key_hash, see dev-keys.js) — never in
 * plaintext — so this hashes the presented key and looks up the hash.
 */
import crypto from 'crypto';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/**
 * @returns {Promise<{ userId: string } | null>} null if the key is missing,
 * malformed, unknown, or revoked.
 */
export async function verifyApiKey(supabaseAdmin, authHeader) {
  const raw = String(authHeader || '').replace(/^Bearer\s+/i, '').trim();
  if (!raw || !raw.startsWith('bb_live_')) return null;

  const hash = sha256(raw);
  const { data: key, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, revoked_at, active')
    .eq('key_hash', hash)
    .maybeSingle();
  if (error || !key || key.revoked_at || !key.active) return null;

  // Best-effort — a failed write here should never block the request it's
  // timing/logging.
  supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id)
    .then(() => {}, () => {});
  supabaseAdmin.from('api_key_usage').insert({ api_key_id: key.id, user_id: key.user_id })
    .then(() => {}, () => {});

  return { userId: key.user_id };
}
