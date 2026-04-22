import { useState, useEffect, useCallback } from 'react'
import { getHeatmap } from '../api/api'

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`
}

const fmtNum = (n, dec = 1) =>
  n != null ? Number(n).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : null

const cellClass = (v) => {
  if (v == null) return 'hm-empty'
  if (v >= 10)   return 'hm-good'
  if (v >= 7)    return 'hm-ok'
  return 'hm-low'
}

export default function Reports() {
  const [meses,   setMeses]   = useState(12)
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getHeatmap({ meses })
      setData(result)
    } catch (err) {
      console.error('Error cargando informe:', err)
    } finally {
      setLoading(false)
    }
  }, [meses])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="state-msg">Cargando informe…</div>
  if (!data)   return <div className="state-msg empty">Sin datos</div>

  const { months, vehicles } = data

  // Group by CC
  const byCC = vehicles.reduce((acc, v) => {
    ;(acc[v.centro_costo] = acc[v.centro_costo] || []).push(v)
    return acc
  }, {})

  // Global summary
  const allCells = vehicles.flatMap(v => Object.values(v.meses).filter(Boolean))
  const totalLitros = allCells.reduce((s, c) => s + (c.total_litros || 0), 0)
  const totalCosto  = allCells.reduce((s, c) => s + (c.total_costo  || 0), 0)
  const withConsumo = allCells.filter(c => c.avg_consumo != null)
  const avgGlobal   = withConsumo.length
    ? withConsumo.reduce((s, c) => s + c.avg_consumo, 0) / withConsumo.length
    : null

  const showTooltip = (e, v, m, cell) => {
    if (!cell) return
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ v, m, cell, top: rect.bottom + 6, left: rect.left })
  }

  return (
    <div className="reports-section" onMouseLeave={() => setTooltip(null)}>

      {/* Tooltip */}
      {tooltip && (
        <div className="hm-tooltip" style={{ top: tooltip.top, left: tooltip.left }}>
          <strong>{tooltip.v.matricula} — {fmtMonth(tooltip.m)}</strong>
          <div>{tooltip.cell.cargas} carga{tooltip.cell.cargas !== 1 ? 's' : ''} · {fmtNum(tooltip.cell.total_litros)} L</div>
          {tooltip.cell.total_costo > 0 && <div>Costo: ${fmtNum(tooltip.cell.total_costo, 0)}</div>}
          {tooltip.cell.avg_consumo != null
            ? <div>Consumo: <strong>{fmtNum(tooltip.cell.avg_consumo)} km/L</strong></div>
            : <div className="tt-muted">Sin km registrados</div>
          }
        </div>
      )}

      {/* Header */}
      <div className="reports-header">
        <h2 className="admin-title">Informe de Consumo por Vehículo</h2>
        <div className="reports-controls">
          <label>Período:</label>
          <select value={meses} onChange={e => setMeses(parseInt(e.target.value))}>
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Último año</option>
            <option value={24}>Últimos 2 años</option>
            <option value={36}>Últimos 3 años</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-row" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <span className="stat-label">Vehículos</span>
          <span className="stat-value">{vehicles.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Litros</span>
          <span className="stat-value">{fmtNum(totalLitros)} L</span>
        </div>
        {totalCosto > 0 && (
          <div className="stat-card">
            <span className="stat-label">Gasto Total</span>
            <span className="stat-value">${fmtNum(totalCosto, 0)}</span>
          </div>
        )}
        {avgGlobal != null && (
          <div className="stat-card">
            <span className="stat-label">Promedio Global</span>
            <span className={`stat-value ${cellClass(avgGlobal).replace('hm-', '')}`}>
              {fmtNum(avgGlobal)} km/L
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="hm-legend">
        <span className="hm-legend-item hm-good">≥ 10 km/L — Bueno</span>
        <span className="hm-legend-item hm-ok">7 – 9.9 km/L — Aceptable</span>
        <span className="hm-legend-item hm-low">{'< 7'} km/L — Bajo</span>
        <span className="hm-legend-item hm-empty">Sin datos</span>
        <span className="hm-legend-hint">Pasá el cursor sobre una celda para ver detalle</span>
      </div>

      {/* Heatmap */}
      <div className="hm-wrapper">
        <table className="hm-table">
          <thead>
            <tr>
              <th className="hm-th-mat">Matrícula</th>
              <th className="hm-th-cond">Conductor</th>
              <th className="hm-th-mod">Modelo</th>
              {months.map(m => (
                <th key={m} className="hm-th-month">{fmtMonth(m)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(byCC).map(([cc, vList]) => (
              <>
                <tr key={`cc-${cc}`} className="hm-cc-header">
                  <td colSpan={3 + months.length}>Centro de Costo: {cc}</td>
                </tr>
                {vList.map(v => {
                  const rowCells = Object.values(v.meses).filter(Boolean)
                  const rowAvg = rowCells.filter(c => c.avg_consumo != null)
                  const avg = rowAvg.length
                    ? rowAvg.reduce((s, c) => s + c.avg_consumo, 0) / rowAvg.length
                    : null
                  return (
                    <tr key={v.matricula} className="hm-row">
                      <td><span className="badge">{v.matricula}</span></td>
                      <td className="hm-cond">{v.conductor}</td>
                      <td className="hm-mod muted">{v.modelo}</td>
                      {months.map(m => {
                        const cell = v.meses[m]
                        const val  = cell?.avg_consumo
                        return (
                          <td
                            key={m}
                            className={`hm-cell ${cellClass(val)}`}
                            onMouseEnter={e => showTooltip(e, v, m, cell)}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {val != null ? fmtNum(val) : cell ? '?' : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* CC subtotal */}
                <tr className="hm-subtotal">
                  <td colSpan={3}>Promedio {cc}</td>
                  {months.map(m => {
                    const cells = vList.map(v => v.meses[m]).filter(Boolean)
                    const valid = cells.filter(c => c.avg_consumo != null)
                    const avg   = valid.length
                      ? valid.reduce((s, c) => s + c.avg_consumo, 0) / valid.length
                      : null
                    return (
                      <td key={m} className={`hm-cell hm-subtotal-cell ${cellClass(avg)}`}>
                        {avg != null ? fmtNum(avg) : '—'}
                      </td>
                    )
                  })}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
