export function getSupabaseServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase server config is missing SUPABASE_URL or SUPABASE_ANON_KEY.')
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    supabaseAnonKey,
  }
}

export function getAppOrigin(request: Request) {
  return request.headers.get('origin') || new URL(request.url).origin
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return Buffer.from(binary, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32))
  const codeVerifier = base64UrlEncode(verifierBytes)
  const challengeBytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier)
  )

  return {
    codeVerifier,
    codeChallenge: base64UrlEncode(challengeBytes),
    codeChallengeMethod: 's256',
  }
}

export async function supabaseAuthFetch(path: string, init: RequestInit = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseServerConfig()
  const headers = new Headers(init.headers)
  headers.set('apikey', supabaseAnonKey)
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${supabaseAnonKey}`)
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`${supabaseUrl}/auth/v1${path}`, {
    ...init,
    headers,
  })
}
