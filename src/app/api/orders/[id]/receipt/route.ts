import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  // Extract id from parameters
  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams?.id

  if (!id) {
    return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 })
  }

  // Redirect to the UI page
  const redirectUrl = new URL(`/orders/${id}/receipt`, request.url)
  return NextResponse.redirect(redirectUrl)
}
