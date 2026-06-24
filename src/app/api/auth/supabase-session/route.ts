import { NextResponse } from 'next/server'
import { APP_SESSION_COOKIE, createGoogleAppSession, encodeSession } from '../session-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const email = typeof body.email === 'string' ? body.email : ''
    const name = typeof body.name === 'string' ? body.name : email

    if (!id || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing Google user details.' },
        { status: 400 }
      )
    }

    const session = createGoogleAppSession({ id, email, name })
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
      { success: false, error: 'Could not create app session.' },
      { status: 500 }
    )
  }
}
