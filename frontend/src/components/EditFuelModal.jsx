import { useState, useEffect } from 'react';

const FUEL_TYPES = ['Gasoil', 'Nafta', 'Nafta Premium', 'GNC'];

export default function EditFuelModal({ record, loading, onSave, onClose }) {
  const [form, setForm] = useState({
    fecha:            record.fecha,
    litros:           record.litros,
    km_actual:        record.km_actual,
    tipo_combustible: record.tipo_combustible || 'Gasoil',
    proveedor:        record.proveedor || '',
    costo_litro:      record.costo_litro ?? '',
    costo_total:      record.costo_total  ?? '',
  });

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      fecha:            form.fecha,
      litros:           parseFloat(form.litros),
      km_actual:        parseInt(form.km_actual, 10),
      tipo_combustible: form.tipo_combustible || null,
      proveedor:        form.proveedor || null,
      costo_litro:      form.costo_litro !== '' ? parseFloat(form.costo_litro) : null,
      costo_total:      form.costo_total  !== '' ? parseFloat(form.costo_total)  : null,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Editar registro — <span className="badge">{record.matricula}</span></h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="fuel-form">
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

          <div className="form-row">
            <div className="form-group">
              <label>Litros cargados *</label>
              <input
                type="number" name="litros" value={form.litros} onChange={set}
                step="0.01" min="0.01" required
              />
            </div>
            <div className="form-group">
              <label>KM al momento de carga *</label>
              <input
                type="number" name="km_actual" value={form.km_actual} onChange={set}
                min="0" required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Proveedor / Estación de servicio</label>
            <input type="text" name="proveedor" value={form.proveedor} onChange={set} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Costo por litro ($)</label>
              <input
                type="number" name="costo_litro" value={form.costo_litro} onChange={set}
                step="0.01" min="0"
              />
            </div>
            <div className="form-group">
              <label>Costo total ($)</label>
              <input
                type="number" name="costo_total" value={form.costo_total} onChange={set}
                step="0.01" min="0"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
