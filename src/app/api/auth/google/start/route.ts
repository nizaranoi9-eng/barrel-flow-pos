import { NextResponse } from 'next/server'
import { createPkcePair, getAppOrigin, getSupabaseServerConfig } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const { supabaseUrl } = getSupabaseServerConfig()
    const pkce = await createPkcePair()
    const origin = getAppOrigin(request)
    const redirectTo = `${origin}/auth/callback`
    const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`)

    authorizeUrl.searchParams.set('provider', 'google')
    authorizeUrl.searchParams.set('redirect_to', redirectTo)
    authorizeUrl.searchParams.set('prompt', 'select_account')
    authorizeUrl.searchParams.set('code_challenge', pkce.codeChallenge)
    authorizeUrl.searchParams.set('code_challenge_method', pkce.codeChallengeMethod)

    const response = NextResponse.redirect(authorizeUrl)
    response.cookies.set('supabase-code-verifier', pkce.codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 10 * 60,
    })
    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Google auth is not configured.' },
      { status: 500 }
    )
  }
}
