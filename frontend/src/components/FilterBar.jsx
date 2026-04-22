const thisYear  = new Date().getFullYear();
const yearRange = Array.from({ length: 5 }, (_, i) => thisYear - i);
const CC        = ['OM2204', 'OM2404'];

export default function FilterBar({ vehicles, filters, onChange }) {
  const set = (field) => (e) =>
    onChange(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Vehículo</label>
        <select value={filters.matricula} onChange={set('matricula')}>
          <option value="all">Todos los vehículos</option>
          {CC.map(c => (
            <optgroup key={c} label={`CC: ${c}`}>
              {vehicles.filter(v => v.centro_costo === c).map(v => (
                <option key={v.matricula} value={v.matricula}>
                  {v.matricula} — {v.conductor}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Año</label>
        <select value={filters.anio} onChange={set('anio')}>
          <option value="">Todos los años</option>
          {yearRange.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
