import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { APP_SESSION_COOKIE, decodeSession } from '../session-utils'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(APP_SESSION_COOKIE)

  if (!sessionCookie?.value) {
    return NextResponse.json({ success: false, error: 'No active session.' }, { status: 401 })
  }

  const session = decodeSession(sessionCookie.value)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 })
  }

  return NextResponse.json({ success: true, data: session })
}
