import { NextResponse } from 'next/server'
import { supabaseAuthFetch } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const { accessToken, password } = await request.json()

    if (!accessToken || !password || String(password).length < 6) {
      return NextResponse.json(
        { success: false, error: 'A verified session and a password of at least 6 characters are required.' },
        { status: 400 }
      )
    }

    const response = await supabaseAuthFetch('/user', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password }),
    })
    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data?.msg || data?.message || 'Could not update password.' },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not update password.' },
      { status: 500 }
    )
  }
}
