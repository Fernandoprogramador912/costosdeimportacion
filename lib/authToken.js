const AUTH_PAYLOAD = 'spotsline-site-auth-v1'

export async function createAuthToken(secret) {
  if (!secret) return null
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(AUTH_PAYLOAD))
  return bytesToBase64Url(new Uint8Array(signature))
}

export async function isValidAuthToken(token, secret) {
  if (!token || !secret) return false
  const expected = await createAuthToken(secret)
  return timingSafeEqual(token, expected)
}

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function getCookie(request, name) {
  const header = request.headers.get('cookie') || ''
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}
