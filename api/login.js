import { createAuthToken } from '../lib/authToken.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const sitePassword = process.env.SITE_PASSWORD
  const authSecret = process.env.AUTH_SECRET

  if (!sitePassword || !authSecret) {
    return res.status(500).json({ error: 'Autenticación no configurada en el servidor' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Solicitud inválida' })
    }
  }

  const password = body?.password
  if (!password || password !== sitePassword) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }

  const token = await createAuthToken(authSecret)
  const secure = process.env.VERCEL === '1' ? '; Secure' : ''
  const maxAge = 60 * 60 * 24 * 30

  res.setHeader(
    'Set-Cookie',
    `site_auth=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  )

  return res.status(200).json({ ok: true })
}
