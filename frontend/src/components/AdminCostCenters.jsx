import { useState } from 'react'
import { addCostCenter, updateCostCenter, deleteCostCenter } from '../api/api'

const emptyForm = () => ({ codigo: '', nombre: '' })

export default function AdminCostCenters({ costCenters, onRefresh }) {
  const [form,    setForm]    = useState(emptyForm())
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  const set = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const flash = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(null) }
    else                    { setError(msg);   setSuccess(null) }
    setTimeout(() => { setSuccess(null); setError(null) }, 3500)
  }

  const startEdit = (cc) => {
    setEditing(cc._id)
    setForm({ codigo: cc.codigo, nombre: cc.nombre })
    setError(null)
  }

  const cancelEdit = () => { setEditing(null); setForm(emptyForm()); setError(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updateCostCenter(editing, { nombre: form.nombre })
        flash(`Centro de costo ${form.codigo} actualizado`)
      } else {
        await addCostCenter({ codigo: form.codigo.toUpperCase(), nombre: form.nombre })
        flash(`Centro de costo ${form.codigo.toUpperCase()} creado`)
      }
      await onRefresh()
      cancelEdit()
    } catch (err) {
      flash(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (cc) => {
    if (!window.confirm(`¿Eliminar el centro de costo ${cc.codigo} — ${cc.nombre}?`)) return
    try {
      await deleteCostCenter(cc._id)
      flash(`Centro de costo ${cc.codigo} eliminado`)
      await onRefresh()
    } catch (err) {
      flash(err.message, 'error')
    }
  }

  return (
    <div className="admin-section">
      <h2 className="admin-title">Centros de Costo</h2>

      {error   && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      <div className="table-wrapper">
        <table className="fuel-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre / Descripción</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {costCenters.length === 0 ? (
              <tr>
                <td colSpan={3} className="muted" style={{ padding: '16px', textAlign: 'center' }}>
                  No hay centros de costo registrados
                </td>
              </tr>
            ) : costCenters.map(cc => (
              <tr key={cc._id} className={editing === cc._id ? 'row-editing' : ''}>
                <td><span className="badge">{cc.codigo}</span></td>
                <td>{cc.nombre}</td>
                <td style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button className="btn-edit" onClick={() => startEdit(cc)}>✎</button>
                  <button className="btn-del"  onClick={() => handleDelete(cc)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-form-card">
        <h3>{editing ? `Editando: ${form.codigo}` : 'Agregar centro de costo'}</h3>
        <form onSubmit={handleSubmit} className="fuel-form">
          <div className="form-row">
            <div className="form-group">
              <label>Código *</label>
              <input
                type="text" name="codigo" value={form.codigo} onChange={set}
                required disabled={!!editing} placeholder="Ej: OM2204"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label>Nombre / Descripción *</label>
              <input
                type="text" name="nombre" value={form.nombre} onChange={set}
                required placeholder="Ej: Obras y Mantenimiento 2204"
              />
            </div>
          </div>

          <div className="form-actions admin-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar centro de costo'}
            </button>
            {editing && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
