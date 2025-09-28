import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https'),
    sameSite: 'lax',
    maxAge: 0,
  })

  return response
}