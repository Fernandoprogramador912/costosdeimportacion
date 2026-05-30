import { useState } from 'react'

/**
 * Protección local en desarrollo (Vite no ejecuta middleware de Vercel).
 * En producción la protección real la hace middleware.js + /api/login.
 */
export default function AuthGate({ children }) {
  const [autenticado, setAutenticado] = useState(
    () => sessionStorage.getItem('dev_authenticated') === '1',
  )
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  if (autenticado) return children

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'same-origin',
      })

      if (res.ok) {
        sessionStorage.setItem('dev_authenticated', '1')
        setAutenticado(true)
        return
      }

      const devPassword = import.meta.env.VITE_SITE_PASSWORD
      if (devPassword && password === devPassword) {
        sessionStorage.setItem('dev_authenticated', '1')
        setAutenticado(true)
        return
      }

      setError('Contraseña incorrecta')
    } catch {
      const devPassword = import.meta.env.VITE_SITE_PASSWORD
      if (devPassword && password === devPassword) {
        sessionStorage.setItem('dev_authenticated', '1')
        setAutenticado(true)
        return
      }
      setError('Contraseña incorrecta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate-card">
        <div className="auth-gate-header">
          <span>🔒</span>
          <h2>Costos de Importación</h2>
          <p>Ingresá la contraseña para acceder</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-gate-form">
          <label htmlFor="dev-password">Contraseña</label>
          <input
            id="dev-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <button type="submit" disabled={cargando}>
            {cargando ? 'Verificando…' : 'Ingresar'}
          </button>
          {error && <p className="auth-gate-error" role="alert">{error}</p>}
        </form>
      </div>
    </div>
  )
}
