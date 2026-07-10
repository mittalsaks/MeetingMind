import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/forgot-password', '/accept-invite', '/backend', '/auth/google', '/google-success', '/onboarding']

// Routes that ONLY mentors/admins should access
const adminOnlyPaths = ['/team', '/students', '/settings', '/install-extension', '/analytics', '/archive']

export function proxy(request: NextRequest) {
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

  // Student trying to access admin-only routes (not the shared ones)
  const isAdminOnlyPath = adminOnlyPaths.some((p) => path.startsWith(p))
  if (hasSession && role === 'user' && (path === '/' || isAdminOnlyPath)) {
    return NextResponse.redirect(new URL('/student', request.url))
  }

  // Admin trying to access student dashboard (exact match only, not /students)
  if (hasSession && role === 'admin' && (path === '/student' || path.startsWith('/student/'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|backend).*)']
}