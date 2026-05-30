import { createAuthToken, getCookie, isValidAuthToken } from './lib/authToken.js'

const PUBLIC_PATHS = new Set(['/login.html', '/favicon.svg'])

export default async function middleware(request) {
  const { pathname } = new URL(request.url)

  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/login')) {
    return
  }

  const secret = process.env.AUTH_SECRET
  const token = getCookie(request, 'site_auth')

  if (await isValidAuthToken(token, secret)) {
    return
  }

  const loginUrl = new URL('/login.html', request.url)
  if (pathname !== '/') {
    loginUrl.searchParams.set('from', pathname)
  }

  return Response.redirect(loginUrl.toString(), 302)
}

export const config = {
  matcher: ['/((?!assets/).*)'],
}
