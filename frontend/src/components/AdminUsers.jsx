import { useState, useEffect } from 'react'
import { getUsers, addUser, updateUser, deleteUser } from '../api/api'

const ROLES = ['admin', 'conductor', 'reportes']
const ROL_LABEL = { admin: 'Administrador', conductor: 'Conductor', reportes: 'Solo reportes' }

const emptyForm = () => ({ usuario: '', password: '', rol: 'conductor', vehiculo: '' })

export default function AdminUsers({ vehicles }) {
  const [users,   setUsers]   = useState([])
  const [form,    setForm]    = useState(emptyForm())
  const [editing, setEditing] = useState(null)   // id del usuario en edición
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => { loadUsers() }, [])

  const loadUsers = () =>
    getUsers().then(setUsers).catch(() => setError('Error al cargar usuarios'))

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(null) }
    else                    { setError(msg);   setSuccess(null) }
    setTimeout(() => { setSuccess(null); setError(null) }, 3500)
  }

  const set = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const startEdit = (u) => {
    setEditing(u._id)
    setForm({ usuario: u.usuario, password: '', rol: u.rol, vehiculo: u.vehiculo || '' })
    setError(null)
  }

  const cancelEdit = () => { setEditing(null); setForm(emptyForm()); setError(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        usuario:  form.usuario.trim(),
        password: form.password || undefined,
        rol:      form.rol,
        vehiculo: form.rol === 'conductor' ? form.vehiculo : null,
      }
      if (editing) {
        await updateUser(editing, payload)
        flash('Usuario actualizado')
      } else {
        if (!form.password) return flash('La contraseña es obligatoria al crear un usuario', 'error')
        await addUser({ ...payload, password: form.password })
        flash('Usuario creado')
      }
      cancelEdit()
      loadUsers()
    } catch (err) {
      flash(err.message || 'Error al guardar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`¿Eliminar el usuario "${u.usuario}"?`)) return
    try {
      await deleteUser(u._id)
      flash('Usuario eliminado')
      loadUsers()
    } catch (err) {
      flash(err.message || 'Error al eliminar', 'error')
    }
  }

  const vehicleForUser = (matricula) => {
    const v = vehicles.find(v => v.matricula === matricula)
    return v ? `${matricula} — ${v.conductor}` : matricula
  }

  return (
    <div className="admin-section">
      <h3>Gestión de Usuarios</h3>

      {error   && <div className="admin-msg error">{error}</div>}
      {success && <div className="admin-msg success">{success}</div>}

      {/* Formulario */}
      <div className="admin-form-card">
        <h4>{editing ? 'Editar usuario' : 'Nuevo usuario'}</h4>
        <form onSubmit={handleSubmit} className="admin-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Usuario *</label>
              <input name="usuario" value={form.usuario} onChange={set} required placeholder="nombre de usuario" />
            </div>
            <div className="form-group">
              <label>{editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
              <input name="password" type="password" value={form.password} onChange={set}
                required={!editing} placeholder={editing ? 'sin cambios' : 'contraseña'} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Rol *</label>
              <select name="rol" value={form.rol} onChange={set}>
                {ROLES.map(r => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
              </select>
            </div>
            {form.rol === 'conductor' && (
              <div className="form-group">
                <label>Vehículo asignado *</label>
                <select name="vehiculo" value={form.vehiculo} onChange={set} required>
                  <option value="">Seleccionar vehículo…</option>
                  {vehicles.map(v => (
                    <option key={v.matricula} value={v.matricula}>
                      {v.matricula} — {v.conductor}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : editing ? 'Actualizar' : 'Crear usuario'}
            </button>
            {editing && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de usuarios */}
      <div className="table-wrapper" style={{ marginTop: 18 }}>
        <table className="fuel-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Vehículo asignado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td><strong>{u.usuario}</strong></td>
                <td><span className={`rol-badge rol-${u.rol}`}>{ROL_LABEL[u.rol] ?? u.rol}</span></td>
                <td>{u.vehiculo ? vehicleForUser(u.vehiculo) : <span className="muted">—</span>}</td>
                <td className="actions-cell">
                  <button className="btn-edit" onClick={() => startEdit(u)} title="Editar">✎</button>
                  <button className="btn-del"  onClick={() => handleDelete(u)} title="Eliminar">✕</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 16 }}>Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
