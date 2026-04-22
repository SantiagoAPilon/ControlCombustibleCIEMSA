import { useState, useEffect } from 'react'
import Login          from './components/Login'
import FuelForm       from './components/FuelForm'
import FuelTable      from './components/FuelTable'
import FilterBar      from './components/FilterBar'
import AdminVehicles  from './components/AdminVehicles'
import EditFuelModal  from './components/EditFuelModal'
import Reports        from './components/Reports'
import {
  login as apiLogin,
  getVehicles,
  getFuelRecords,
  addFuelRecord,
  updateFuelRecord,
  deleteFuelRecord,
} from './api/api'
import './App.css'

const now = new Date()

export default function App() {
  const [isAuth,    setIsAuth]    = useState(!!localStorage.getItem('token'))
  const [userRol,   setUserRol]   = useState(localStorage.getItem('rol') || '')
  const [activeTab, setActiveTab] = useState('form')
  const [vehicles,  setVehicles]  = useState([])
  const [records,   setRecords]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [notify,    setNotify]    = useState(null)
  const [filters,   setFilters]   = useState({
    matricula: 'all',
    anio: now.getFullYear(),
  })
  const [editRecord, setEditRecord] = useState(null)

  // Carga vehículos al autenticarse
  useEffect(() => {
    if (!isAuth) return
    loadVehicles()
  }, [isAuth])

  const loadVehicles = () =>
    getVehicles().then(setVehicles).catch(() => flash('Error al cargar vehículos', 'error'))

  // Carga registros al cambiar filtros o tab
  const { matricula, anio } = filters
  useEffect(() => {
    if (!isAuth || activeTab !== 'history') return
    setLoading(true)
    getFuelRecords({ matricula, anio })
      .then(setRecords)
      .catch(() => flash('Error al cargar registros', 'error'))
      .finally(() => setLoading(false))
  }, [isAuth, activeTab, matricula, anio])

  const flash = (message, type = 'success') => {
    setNotify({ message, type })
    setTimeout(() => setNotify(null), 3500)
  }

  const handleLogin = async (credentials) => {
    const data = await apiLogin(credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('rol', data.rol)
    setUserRol(data.rol)
    setIsAuth(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    setIsAuth(false)
    setUserRol('')
    setActiveTab('form')
    setVehicles([])
    setRecords([])
  }

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      await addFuelRecord(formData)
      flash('Carga registrada correctamente')
      setActiveTab('history')
    } catch (err) {
      flash(err.message || 'Error al guardar la carga', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (formData) => {
    setLoading(true)
    try {
      await updateFuelRecord(editRecord.id, formData)
      setEditRecord(null)
      const data = await getFuelRecords({ matricula, anio })
      setRecords(data)
      flash('Registro actualizado')
    } catch (err) {
      flash(err.message || 'Error al actualizar', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    try {
      await deleteFuelRecord(id)
      const data = await getFuelRecords({ matricula, anio })
      setRecords(data)
      flash('Registro eliminado')
    } catch (err) {
      flash('Error al eliminar', 'error')
    }
  }

  if (!isAuth) return <Login onLogin={handleLogin} />



  return (
    <div className="app">
      {editRecord && (
        <EditFuelModal
          record={editRecord}
          loading={loading}
          onSave={handleEdit}
          onClose={() => setEditRecord(null)}
        />
      )}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <span className="header-icon">⛽</span>
            <h1>Control de Combustible</h1>
          </div>
          <div className="header-right">
            <span className="company-badge">CIEMSA</span>
            <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      {notify && (
        <div className={`notification ${notify.type}`}>{notify.message}</div>
      )}

      <nav className="tabs">
        <button className={`tab ${activeTab === 'form'    ? 'active' : ''}`} onClick={() => setActiveTab('form')}>
          + Nueva Carga
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          Historial
        </button>
        <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          Informes
        </button>
        {userRol === 'admin' && (
          <button className={`tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            ⚙ Administración
          </button>
        )}
      </nav>

      <main className="main-content">
        {activeTab === 'form' && (
          <FuelForm vehicles={vehicles} onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === 'history' && (
          <>
            <FilterBar vehicles={vehicles} filters={filters} onChange={setFilters} />
            <FuelTable records={records} loading={loading} onEdit={setEditRecord} onDelete={handleDelete} />
          </>
        )}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'admin' && (
          <AdminVehicles vehicles={vehicles} onRefresh={loadVehicles} />
        )}
      </main>
    </div>
  )
}
