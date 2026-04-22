import * as XLSX from 'xlsx';

const fmtDate = (s) => {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const fmtNum  = (n, dec = 2) => n != null ? Number(n).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : '—';
const fmtKm   = (n) => n != null ? Number(n).toLocaleString('es-AR') : '—';

const consumoClass = (v) => {
  if (v == null) return '';
  if (v >= 10)   return 'good';
  if (v >= 7)    return 'ok';
  return 'low';
};

const exportToExcel = (records) => {
  const rows = records.map(r => ({
    'Fecha':           fmtDate(r.fecha),
    'Matrícula':       r.matricula,
    'Conductor':       r.conductor,
    'Modelo':          r.modelo,
    'CC':              r.centro_costo,
    'Litros':          r.litros,
    'KM Actual':       r.km_actual,
    'KM Anterior':     r.km_anterior ?? '',
    'KM Recorridos':   r.km_recorridos ?? '',
    'km/L':            r.consumo_km_l ?? '',
    'Tipo':            r.tipo_combustible ?? '',
    'Proveedor':       r.proveedor ?? '',
    '$/L':             r.costo_litro ?? '',
    'Total $':         r.costo_total ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Combustible');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `combustible_${today}.xlsx`);
};

export default function FuelTable({ records, loading, onEdit, onDelete }) {
  if (loading) return <div className="state-msg">Cargando registros…</div>;
  if (!records.length) return <div className="state-msg empty">No hay registros para los filtros seleccionados.</div>;

  const totalLitros = records.reduce((s, r) => s + r.litros, 0);
  const totalCosto  = records.reduce((s, r) => s + (r.costo_total || 0), 0);
  const withConsumo = records.filter(r => r.consumo_km_l != null);
  const avgConsumo  = withConsumo.length
    ? withConsumo.reduce((s, r) => s + r.consumo_km_l, 0) / withConsumo.length
    : null;

  return (
    <div className="table-section">
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Registros</span>
          <span className="stat-value">{records.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Litros</span>
          <span className="stat-value">{fmtNum(totalLitros)} L</span>
        </div>
        {totalCosto > 0 && (
          <div className="stat-card">
            <span className="stat-label">Gasto Total</span>
            <span className="stat-value">${fmtNum(totalCosto)}</span>
          </div>
        )}
        {avgConsumo != null && (
          <div className="stat-card">
            <span className="stat-label">Consumo Promedio</span>
            <span className={`stat-value ${consumoClass(avgConsumo)}`}>
              {fmtNum(avgConsumo)} km/L
            </span>
          </div>
        )}
        <button className="btn-excel" onClick={() => exportToExcel(records)}>
          ⬇ Descargar Excel
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="fuel-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Matrícula</th>
              <th>Conductor</th>
              <th>Modelo</th>
              <th>CC</th>
              <th className="r">Litros</th>
              <th className="r">KM Actual</th>
              <th className="r">KM Ant.</th>
              <th className="r">KM Recorr.</th>
              <th className="r">km/L</th>
              <th>Tipo</th>
              <th>Proveedor</th>
              <th className="r">$/L</th>
              <th className="r">Total $</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id}>
                <td className="nowrap">{fmtDate(r.fecha)}</td>
                <td><span className="badge">{r.matricula}</span></td>
                <td>{r.conductor}</td>
                <td className="muted">{r.modelo}</td>
                <td className="muted">{r.centro_costo}</td>
                <td className="r">{fmtNum(r.litros)}</td>
                <td className="r">{fmtKm(r.km_actual)}</td>
                <td className="r muted">{fmtKm(r.km_anterior)}</td>
                <td className="r">{fmtKm(r.km_recorridos)}</td>
                <td className={`r consumo ${consumoClass(r.consumo_km_l)}`}>
                  {r.consumo_km_l != null ? fmtNum(r.consumo_km_l) : '—'}
                </td>
                <td className="muted">{r.tipo_combustible || '—'}</td>
                <td className="muted">{r.proveedor || '—'}</td>
                <td className="r muted">{r.costo_litro != null ? `$${fmtNum(r.costo_litro)}` : '—'}</td>
                <td className="r">{r.costo_total != null ? `$${fmtNum(r.costo_total)}` : '—'}</td>
                <td className="actions-cell">
                  <button className="btn-edit" onClick={() => onEdit(r)} title="Editar">✎</button>
                  <button className="btn-del"  onClick={() => onDelete(r.id)} title="Eliminar">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
