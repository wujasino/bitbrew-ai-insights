// Reads runtime feature flags from public.app_settings (see the 20240133
// migration). Service-role only — that table has RLS on with no policies.

/**
 * Is brand scanning currently enabled?
 *
 * Fails OPEN (returns true) if the row is missing or the query errors: this
 * flag is a deliberate off-switch an admin flips, not a security control, so
 * a transient DB problem must never silently take scanning down.
 */
export async function isScanningEnabled(supabaseAdmin) {
  try {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'scanning_enabled')
      .maybeSingle();

    if (error) {
      console.warn('isScanningEnabled: query failed, assuming enabled:', error.message);
      return true;
    }
    if (!data) return true;

    // Stored as jsonb, so it arrives as a real boolean; tolerate the string
    // form too in case someone sets it by hand in the SQL editor.
    return data.value !== false && data.value !== 'false';
  } catch (err) {
    console.warn('isScanningEnabled: unexpected failure, assuming enabled:', err.message);
    return true;
  }
}
