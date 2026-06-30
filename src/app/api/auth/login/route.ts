import { NextResponse } from 'next/server'
import {
  APP_SESSION_COOKIE,
  createPasswordAdminSession,
  encodeSession,
} from '../session-utils'

function safeEqual(a: string, b: string) {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  if (aBytes.length !== bBytes.length) return false

  let mismatch = 0
  for (let index = 0; index < aBytes.length; index += 1) {
    mismatch |= aBytes[index] ^ bBytes[index]
  }

  return mismatch === 0
}

export async function POST(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Email/password admin login is not configured.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      )
    }

    const session = createPasswordAdminSession(adminEmail)
    const response = NextResponse.json({ success: true, data: session })
    response.cookies.set(APP_SESSION_COOKIE, encodeSession(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Could not sign in.' },
      { status: 500 }
    )
  }
}
