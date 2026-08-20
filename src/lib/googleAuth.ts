// Google requires the redirect_uri sent when exchanging the code (in
// GoogleCallback.tsx) to be byte-identical to the one sent here when
// starting the flow — a mismatch fails the exchange (previously
// GoogleCallback.tsx computed its own copy from window.location.origin
// alone, while this function preferred VITE_SITE_URL first; the two only
// coincidentally agreed before presora.app started redirecting to
// www.presora.app, which is what exposed the drift as real "Invalid
// redirect_uri" errors). Both call sites must use this one function.
export function getGoogleRedirectUri(): string {
  const origin = (import.meta.env.VITE_SITE_URL as string | undefined) ?? window.location.origin;
  return `${origin}/auth/google/callback`;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function signInWithGoogle(): Promise<void> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  if (!clientId) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem('google_pkce_verifier', codeVerifier);

  const redirectUri = getGoogleRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export default signInWithGoogle;
