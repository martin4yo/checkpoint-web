import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

async function verifyTokenEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/mobile') || pathname === '/login') {
    return NextResponse.next()
  }

  // Check authentication for API routes
  if (pathname.startsWith('/api/')) {
    // Try Bearer token first (mobile API)
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    // If no Bearer token, try cookie (web admin)
    if (!token) {
      token = request.cookies.get('token')?.value
    }

    if (!token || !(await verifyTokenEdge(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Check authentication for protected pages
  if (pathname !== '/login') {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const verified = await verifyTokenEdge(token)
    if (!verified) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}