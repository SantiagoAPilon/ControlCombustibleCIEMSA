import { useState, useEffect } from 'react';
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

const exportToExcel = (records, verDatosSensibles) => {
  const rows = records.map(r => ({
    'Fecha':           fmtDate(r.fecha),
    'Matrícula':       r.matricula,
    'Conductor':       r.conductor,
    'Modelo':          r.modelo,
    'CC':              r.centro_costo,
    'Litros':          r.litros,
    'KM Anterior':     r.km_anterior ?? '',
    'KM Actual':       r.km_actual ?? '',
    'KM Recorridos':   r.km_recorridos ?? '',
    'km/L':            r.consumo_km_l ?? '',
    'Tipo':            r.tipo_combustible ?? '',
    ...(verDatosSensibles ? {
      'Proveedor': r.proveedor ?? '',
      '$/L':       r.costo_litro ?? '',
      'Total $':   r.costo_total ?? '',
    } : {}),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Combustible');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `combustible_${today}.xlsx`);
};

const PAGE_SIZE_OPTIONS = [20, 50, 100, 150, 200];

export default function FuelTable({ records, loading, onEdit, onDelete, onVerFoto, userRol }) {
  const canEdit = !!onEdit && !!onDelete;
  // El conductor ve solo datos básicos + consumo, sin costos ni proveedor
  const verDatosSensibles = userRol !== 'conductor';
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Volver a pág 1 cuando cambian los registros o el tamaño de página
  useEffect(() => { setPage(1); }, [records, pageSize]);

  if (loading) return <div className="state-msg">Cargando registros…</div>;
  if (!records.length) return <div className="state-msg empty">No hay registros para los filtros seleccionados.</div>;

  // Stats sobre TODOS los registros
  const totalLitros = records.reduce((s, r) => s + r.litros, 0);
  const totalCosto  = records.reduce((s, r) => s + (r.costo_total || 0), 0);
  const withConsumo = records.filter(r => r.consumo_km_l != null);
  const avgConsumo  = withConsumo.length
    ? withConsumo.reduce((s, r) => s + r.consumo_km_l, 0) / withConsumo.length
    : null;

  // Paginación
  const totalPages  = Math.ceil(records.length / pageSize);
  const start       = (page - 1) * pageSize;
  const pageRecords = records.slice(start, start + pageSize);

  const goTo = (p) => setPage(Math.max(1, Math.min(totalPages, p)));

  // Páginas a mostrar en el control (máx 7 botones)
  const pageButtons = () => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    if (range[0] > 2) range.unshift('...');
    if (range[0] !== 1) range.unshift(1);
    if (range[range.length - 1] < totalPages - 1) range.push('...');
    if (range[range.length - 1] !== totalPages) range.push(totalPages);
    return range;
  };

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
        {verDatosSensibles && totalCosto > 0 && (
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
        <button className="btn-excel" onClick={() => exportToExcel(records, verDatosSensibles)}>
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
              <th className="r">KM Ant.</th>
              <th className="r">KM Actual</th>
              <th className="r">KM Recorr.</th>
              <th className="r">km/L</th>
              <th>Tipo</th>
              {verDatosSensibles && <th>Proveedor</th>}
              {verDatosSensibles && <th className="r">$/L</th>}
              {verDatosSensibles && <th className="r">Total $</th>}
              <th>Ticket</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {pageRecords.map(r => (
              <tr key={r.id}>
                <td className="nowrap">{fmtDate(r.fecha)}</td>
                <td><span className="badge">{r.matricula}</span></td>
                <td>{r.conductor}</td>
                <td className="muted">{r.modelo}</td>
                <td className="muted">{r.centro_costo}</td>
                <td className="r">{fmtNum(r.litros)}</td>
                <td className="r muted">{fmtKm(r.km_anterior)}</td>
                <td className="r">{fmtKm(r.km_actual)}</td>
                <td className="r">{fmtKm(r.km_recorridos)}</td>
                <td className={`r consumo ${consumoClass(r.consumo_km_l)}`}>
                  {r.consumo_km_l != null ? fmtNum(r.consumo_km_l) : '—'}
                </td>
                <td className="muted">{r.tipo_combustible || '—'}</td>
                {verDatosSensibles && <td className="muted">{r.proveedor || '—'}</td>}
                {verDatosSensibles && <td className="r muted">{r.costo_litro != null ? `$${fmtNum(r.costo_litro)}` : '—'}</td>}
                {verDatosSensibles && <td className="r">{r.costo_total != null ? `$${fmtNum(r.costo_total)}` : '—'}</td>}
                <td className="tc">
                  {r.tiene_foto
                    ? <button className="btn-foto" onClick={() => onVerFoto(r.id)} title="Ver foto del ticket">📷</button>
                    : <span className="muted">—</span>
                  }
                </td>
                {canEdit && (
                  <td className="actions-cell">
                    <button className="btn-edit" onClick={() => onEdit(r)}      title="Editar">✎</button>
                    <button className="btn-del"  onClick={() => onDelete(r.id)} title="Eliminar">✕</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="pagination">
        <div className="pagination-info">
          Mostrando {start + 1}–{Math.min(start + pageSize, records.length)} de {records.length} registros
        </div>

        <div className="pagination-controls">
          <button className="pg-btn" onClick={() => goTo(1)}        disabled={page === 1}>«</button>
          <button className="pg-btn" onClick={() => goTo(page - 1)} disabled={page === 1}>‹</button>

          {pageButtons().map((p, i) =>
            p === '...'
              ? <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
              : <button
                  key={p}
                  className={`pg-btn ${p === page ? 'active' : ''}`}
                  onClick={() => goTo(p)}
                >{p}</button>
          )}

          <button className="pg-btn" onClick={() => goTo(page + 1)} disabled={page === totalPages}>›</button>
          <button className="pg-btn" onClick={() => goTo(totalPages)} disabled={page === totalPages}>»</button>
        </div>

        <div className="pagination-size">
          <label>Filas:</label>
          <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
            {PAGE_SIZE_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
