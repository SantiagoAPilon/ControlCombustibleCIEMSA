import { useState, useEffect } from 'react';
import FuelForm  from './components/FuelForm';
import FuelTable from './components/FuelTable';
import FilterBar from './components/FilterBar';
import { getVehicles, getFuelRecords, addFuelRecord, deleteFuelRecord } from './api/api';
import './App.css';

const now = new Date();

export default function App() {
  const [activeTab, setActiveTab]   = useState('form');
  const [vehicles,  setVehicles]    = useState([]);
  const [records,   setRecords]     = useState([]);
  const [loading,   setLoading]     = useState(false);
  const [notify,    setNotify]      = useState(null);
  const [filters,   setFilters]     = useState({
    matricula: 'all',
    mes:  now.getMonth() + 1,
    anio: now.getFullYear(),
  });

  useEffect(() => {
    getVehicles().then(setVehicles).catch(() => flash('Error al cargar vehículos', 'error'));
  }, []);

  const { matricula, mes, anio } = filters;
  useEffect(() => {
    if (activeTab !== 'history') return;
    setLoading(true);
    getFuelRecords({ matricula, mes, anio })
      .then(setRecords)
      .catch(() => flash('Error al cargar registros', 'error'))
      .finally(() => setLoading(false));
  }, [activeTab, matricula, mes, anio]);

  const flash = (message, type = 'success') => {
    setNotify({ message, type });
    setTimeout(() => setNotify(null), 3500);
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await addFuelRecord(formData);
      flash('Carga registrada correctamente');
      setActiveTab('history');
    } catch (err) {
      flash(err.message || 'Error al guardar la carga', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      await deleteFuelRecord(id);
      const data = await getFuelRecords({ matricula, mes, anio });
      setRecords(data);
      flash('Registro eliminado');
    } catch (err) {
      flash('Error al eliminar', 'error');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-title">
            <span className="header-icon">⛽</span>
            <h1>Control de Combustible</h1>
          </div>
          <span className="company-badge">CIEMSA</span>
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
      </nav>

      <main className="main-content">
        {activeTab === 'form' && (
          <FuelForm vehicles={vehicles} onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === 'history' && (
          <>
            <FilterBar vehicles={vehicles} filters={filters} onChange={setFilters} />
            <FuelTable records={records} loading={loading} onDelete={handleDelete} />
          </>
        )}
      </main>
    </div>
  );
}
