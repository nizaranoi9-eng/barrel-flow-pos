import { NextResponse } from 'next/server'
import { createPkcePair, getAppOrigin, supabaseAuthFetch } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalizedEmail = String(email || '').trim()

    if (!normalizedEmail) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 })
    }

    const pkce = await createPkcePair()
    const redirectTo = `${getAppOrigin(request)}/auth/callback?mode=password-reset`
    const response = await supabaseAuthFetch(`/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: 'POST',
      body: JSON.stringify({
        email: normalizedEmail,
        code_challenge: pkce.codeChallenge,
        code_challenge_method: pkce.codeChallengeMethod,
      }),
    })

    if (!response.ok) {
      const details = await response.json().catch(() => null)
      return NextResponse.json(
        { success: false, error: details?.msg || details?.message || 'Could not send reset email.' },
        { status: response.status }
      )
    }

    const nextResponse = NextResponse.json({ success: true })
    nextResponse.cookies.set('supabase-code-verifier', pkce.codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    })
    return nextResponse
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not send reset email.' },
      { status: 500 }
    )
  }
}
