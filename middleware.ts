import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/forgot-password', '/accept-invite', '/backend', '/auth/google', '/google-success', '/onboarding']

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isPublicPath = publicPaths.some((p) => path.startsWith(p))
  const hasSession = request.cookies.get('hasSession')?.value === 'true'
  const role = request.cookies.get('userRole')?.value

  if (!isPublicPath && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isPublicPath && hasSession && !path.startsWith('/accept-invite') && !path.startsWith('/backend')) {
    const dest = role === 'admin' ? '/' : '/student'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Student trying to access admin routes
  if (hasSession && role === 'user' && !path.startsWith('/student')) {
    return NextResponse.redirect(new URL('/student', request.url))
  }

  // Admin trying to access student route (exact match only, not /students)
  if (hasSession && role === 'admin' && (path === '/student' || path.startsWith('/student/'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
   matcher: ['/((?!api|_next/static|_next/image|favicon.ico|backend).*)'],
}