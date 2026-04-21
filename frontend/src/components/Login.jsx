import { useState } from 'react'

export default function Login({ onLogin }) {
  const [form, setForm]     = useState({ usuario: '', password: '' })
  const [error, setError]   = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onLogin(form)
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-icon">⛽</span>
          <h1>Control de Combustible</h1>
          <span className="company-badge">CIEMSA</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="text" name="usuario" value={form.usuario}
              onChange={set} required autoFocus placeholder="Ingresá tu usuario"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password" name="password" value={form.password}
              onChange={set} required placeholder="Ingresá tu contraseña"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary login-btn">
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
