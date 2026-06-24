import { NextResponse } from 'next/server'
import { supabaseAuthFetch } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const codeVerifier = request.headers
      .get('cookie')
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('supabase-code-verifier='))
      ?.split('=')
      .slice(1)
      .join('=')

    if (!code) {
      return NextResponse.json({ success: false, error: 'Missing OAuth code.' }, { status: 400 })
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { success: false, error: 'OAuth session expired. Please start Google login again.' },
        { status: 400 }
      )
    }

    const response = await supabaseAuthFetch('/token?grant_type=pkce', {
      method: 'POST',
      body: JSON.stringify({ auth_code: code, code_verifier: decodeURIComponent(codeVerifier) }),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.user || !data?.access_token) {
      return NextResponse.json(
        { success: false, error: data?.msg || data?.message || 'Could not complete Supabase sign in.' },
        { status: response.status || 500 }
      )
    }

    const nextResponse = NextResponse.json({
      success: true,
      data: {
        accessToken: data.access_token,
        user: data.user,
      },
    })
    nextResponse.cookies.delete('supabase-code-verifier')
    return nextResponse
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not complete Supabase sign in.' },
      { status: 500 }
    )
  }
}
