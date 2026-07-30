const thisYear  = new Date().getFullYear();
const yearRange = Array.from({ length: 5 }, (_, i) => thisYear - i);

export default function FilterBar({ vehicles, filters, onChange, userRol, userVehiculo, costCenters = [] }) {
  const isConductor = userRol === 'conductor';
  const set = (field) => (e) =>
    onChange(prev => ({ ...prev, [field]: e.target.value }));

  const conductorVehicle = isConductor
    ? vehicles.find(v => v.matricula === userVehiculo)
    : null;

  return (
    <div className="filter-bar">
      {isConductor ? (
        <div className="filter-group">
          <label>Vehículo</label>
          <input
            type="text"
            value={conductorVehicle
              ? `${conductorVehicle.matricula} — ${conductorVehicle.conductor}`
              : userVehiculo}
            disabled
            className="input-locked"
            style={{ minWidth: 210 }}
          />
        </div>
      ) : (
        <div className="filter-group">
          <label>Vehículo</label>
          <select value={filters.matricula} onChange={set('matricula')}>
            <option value="all">Todos los vehículos</option>
            {costCenters.length > 0
              ? costCenters.map(cc => (
                  <optgroup key={cc.codigo} label={`CC: ${cc.codigo}`}>
                    {vehicles.filter(v => v.centro_costo === cc.codigo).map(v => (
                      <option key={v.matricula} value={v.matricula}>
                        {v.matricula} — {v.conductor}
                      </option>
                    ))}
                  </optgroup>
                ))
              : vehicles.map(v => (
                  <option key={v.matricula} value={v.matricula}>
                    {v.matricula} — {v.conductor}
                  </option>
                ))
            }
          </select>
        </div>
      )}

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
