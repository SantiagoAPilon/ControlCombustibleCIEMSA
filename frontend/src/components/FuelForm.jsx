import { useState, useEffect, useRef } from 'react';
import { scanTicket } from '../api/api.js';

const FUEL_TYPES = ['Gasoil', 'Nafta', 'Nafta Premium', 'GNC'];

const todayISO = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  matricula:        '',
  fecha:            todayISO(),
  litros:           '',
  km_actual:        '',
  tipo_combustible: 'Gasoil',
  proveedor:        '',
  costo_litro:      '',
  costo_total:      '',
});

export default function FuelForm({ vehicles, onSubmit, loading }) {
  const [form, setForm]           = useState(emptyForm());
  const [autoTotal, setAutoTotal] = useState(true);
  const [scanning, setScanning]   = useState(false);
  const [scanError, setScanError] = useState('');
  const fileInputRef              = useRef(null);

  const selectedVehicle = vehicles.find(v => v.matricula === form.matricula);

  useEffect(() => {
    if (!autoTotal) return;
    if (form.costo_litro && form.litros) {
      const total = (parseFloat(form.costo_litro) * parseFloat(form.litros)).toFixed(2);
      setForm(prev => ({ ...prev, costo_total: total }));
    }
  }, [form.costo_litro, form.litros, autoTotal]);

  const set = (e) => {
    const { name, value } = e.target;
    if (name === 'costo_total') setAutoTotal(false);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleScanTicket = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanError('');
    setScanning(true);
    try {
      const datos = await scanTicket(file);
      setForm(prev => ({
        ...prev,
        ...(datos.fecha            ? { fecha: datos.fecha }                       : {}),
        ...(datos.litros != null   ? { litros: String(datos.litros) }             : {}),
        ...(datos.tipo_combustible ? { tipo_combustible: datos.tipo_combustible } : {}),
        ...(datos.proveedor        ? { proveedor: datos.proveedor }               : {}),
        ...(datos.costo_litro != null ? { costo_litro: String(datos.costo_litro) } : {}),
        ...(datos.costo_total != null ? { costo_total: String(datos.costo_total) } : {}),
      }));
      if (datos.costo_total != null) setAutoTotal(false);
    } catch (err) {
      setScanError(err.message || 'Error al procesar el ticket');
    } finally {
      setScanning(false);
      // Limpiar el input para permitir escanear el mismo archivo nuevamente
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      matricula:        form.matricula,
      fecha:            form.fecha,
      litros:           parseFloat(form.litros),
      km_actual:        parseInt(form.km_actual, 10),
      tipo_combustible: form.tipo_combustible || null,
      proveedor:        form.proveedor || null,
      costo_litro:      form.costo_litro ? parseFloat(form.costo_litro) : null,
      costo_total:      form.costo_total  ? parseFloat(form.costo_total)  : null,
    });
    setForm(emptyForm());
    setAutoTotal(true);
  };

  const cc = ['OM2204', 'OM2404'];

  return (
    <div className="form-card">
      <h2>Registrar Carga de Combustible</h2>

      {/* Escaneo de ticket */}
      <div className="scan-ticket-bar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleScanTicket}
        />
        <button
          type="button"
          className="btn-scan"
          disabled={scanning}
          onClick={() => fileInputRef.current?.click()}
        >
          {scanning ? 'Leyendo ticket…' : 'Leer ticket con IA'}
        </button>
        <span className="scan-hint">
          Sacá una foto al ticket y se completarán los campos automáticamente (excepto KM)
        </span>
      </div>
      {scanError && <p className="scan-error">{scanError}</p>}

      <form onSubmit={handleSubmit} className="fuel-form">

        {/* Matrícula */}
        <div className="form-group">
          <label>Matrícula *</label>
          <select name="matricula" value={form.matricula} onChange={set} required>
            <option value="">Seleccionar vehículo…</option>
            {cc.map(c => (
              <optgroup key={c} label={`Centro de Costo: ${c}`}>
                {vehicles.filter(v => v.centro_costo === c).map(v => (
                  <option key={v.matricula} value={v.matricula}>
                    {v.matricula} — {v.conductor}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {selectedVehicle && (
          <div className="vehicle-info">
            <span><strong>Conductor:</strong> {selectedVehicle.conductor}</span>
            <span><strong>Modelo:</strong> {selectedVehicle.modelo}</span>
            <span><strong>Centro de Costo:</strong> {selectedVehicle.centro_costo}</span>
          </div>
        )}

        {/* Fecha + Tipo */}
        <div className="form-row">
          <div className="form-group">
            <label>Fecha *</label>
            <input type="date" name="fecha" value={form.fecha} onChange={set} required />
          </div>
          <div className="form-group">
            <label>Tipo de Combustible</label>
            <select name="tipo_combustible" value={form.tipo_combustible} onChange={set}>
              {FUEL_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Litros + KM */}
        <div className="form-row">
          <div className="form-group">
            <label>Litros cargados *</label>
            <input
              type="number" name="litros" value={form.litros} onChange={set}
              step="0.01" min="0.01" placeholder="0.00" required
            />
          </div>
          <div className="form-group">
            <label>KM al momento de carga *</label>
            <input
              type="number" name="km_actual" value={form.km_actual} onChange={set}
              min="0" placeholder="0" required
            />
          </div>
        </div>

        {/* Proveedor */}
        <div className="form-group">
          <label>Proveedor / Estación de servicio</label>
          <input
            type="text" name="proveedor" value={form.proveedor} onChange={set}
            placeholder="Ej: YPF Avenida San Martín"
          />
        </div>

        {/* Costos */}
        <div className="form-row">
          <div className="form-group">
            <label>Costo por litro ($)</label>
            <input
              type="number" name="costo_litro" value={form.costo_litro} onChange={set}
              step="0.01" min="0" placeholder="0.00"
            />
          </div>
          <div className="form-group">
            <label>
              Costo total ($)
              {autoTotal && form.costo_litro && form.litros && (
                <span className="auto-label"> — auto-calculado</span>
              )}
            </label>
            <input
              type="number" name="costo_total" value={form.costo_total} onChange={set}
              step="0.01" min="0" placeholder="0.00"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando…' : 'Registrar Carga'}
          </button>
        </div>
      </form>
    </div>
  );
}
