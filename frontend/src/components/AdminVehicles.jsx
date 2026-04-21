import { useState } from 'react'
import { addVehicle, updateVehicle, deleteVehicle } from '../api/api'

const CC_OPTIONS  = ['OM2204', 'OM2404']
const emptyForm   = () => ({ matricula: '', conductor: '', centro_costo: 'OM2204', modelo: '' })

export default function AdminVehicles({ vehicles, onRefresh }) {
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

  const startEdit = (v) => {
    setEditing(v.matricula)
    setForm({ matricula: v.matricula, conductor: v.conductor, centro_costo: v.centro_costo, modelo: v.modelo })
    setError(null)
  }

  const cancelEdit = () => { setEditing(null); setForm(emptyForm()); setError(null) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editing) {
        await updateVehicle(editing, { conductor: form.conductor, centro_costo: form.centro_costo, modelo: form.modelo })
        flash(`Vehículo ${editing} actualizado`)
      } else {
        await addVehicle(form)
        flash(`Vehículo ${form.matricula.toUpperCase()} agregado correctamente`)
      }
      await onRefresh()
      cancelEdit()
    } catch (err) {
      flash(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (v) => {
    if (!window.confirm(`¿Eliminar el vehículo ${v.matricula} — ${v.conductor}?`)) return
    try {
      await deleteVehicle(v.matricula)
      flash(`Vehículo ${v.matricula} eliminado`)
      await onRefresh()
    } catch (err) {
      flash(err.message, 'error')
    }
  }

  const byCC = (cc) => vehicles.filter(v => v.centro_costo === cc)

  return (
    <div className="admin-section">
      <h2 className="admin-title">Administración de Vehículos</h2>

      {error   && <div className="admin-alert error">{error}</div>}
      {success && <div className="admin-alert success">{success}</div>}

      {/* Tablas por CC */}
      {CC_OPTIONS.map(cc => (
        <div key={cc} className="admin-cc-block">
          <h3 className="cc-label">Centro de Costo: {cc}</h3>
          <div className="table-wrapper">
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Conductor</th>
                  <th>Modelo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {byCC(cc).length === 0 ? (
                  <tr><td colSpan={4} className="muted" style={{ padding: '14px', textAlign: 'center' }}>Sin vehículos</td></tr>
                ) : byCC(cc).map(v => (
                  <tr key={v.matricula} className={editing === v.matricula ? 'row-editing' : ''}>
                    <td><span className="badge">{v.matricula}</span></td>
                    <td>{v.conductor}</td>
                    <td className="muted">{v.modelo}</td>
                    <td style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button className="btn-edit" onClick={() => startEdit(v)}>✎</button>
                      <button className="btn-del"  onClick={() => handleDelete(v)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Formulario agregar / editar */}
      <div className="admin-form-card">
        <h3>{editing ? `Editando: ${editing}` : 'Agregar vehículo'}</h3>
        <form onSubmit={handleSubmit} className="fuel-form">
          <div className="form-row">
            <div className="form-group">
              <label>Matrícula *</label>
              <input
                type="text" name="matricula" value={form.matricula} onChange={set}
                required disabled={!!editing} placeholder="Ej: ABC1234"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label>Centro de Costo *</label>
              <select name="centro_costo" value={form.centro_costo} onChange={set} required>
                {CC_OPTIONS.map(cc => <option key={cc} value={cc}>{cc}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Conductor *</label>
              <input
                type="text" name="conductor" value={form.conductor} onChange={set}
                required placeholder="Nombre completo"
              />
            </div>
            <div className="form-group">
              <label>Modelo *</label>
              <input
                type="text" name="modelo" value={form.modelo} onChange={set}
                required placeholder="Ej: Renault Oroch Diesel"
              />
            </div>
          </div>

          <div className="form-actions admin-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Agregar vehículo'}
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
