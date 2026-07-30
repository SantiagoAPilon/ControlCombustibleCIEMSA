import { useState, useEffect, useCallback } from 'react'
import { getHeatmap, getAnomalias } from '../api/api'

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const fmtMonth = (ym) => {
  const [y, m] = ym.split('-')
  return `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`
}

const fmtNum = (n, dec = 1) =>
  n != null ? Number(n).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : null

const fmtDate = (s) => {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

const cellClass = (v) => {
  if (v == null) return 'hm-empty'
  if (v >= 10)   return 'hm-good'
  if (v >= 7)    return 'hm-ok'
  return 'hm-low'
}

const ANOMALY_LABELS = {
  km_bajo:     { label: 'KM menor al anterior', color: '#b71c1c', bg: '#ffcdd2' },
  consumo_alto:{ label: 'Consumo inusualmente alto', color: '#bf360c', bg: '#ffe0b2' },
  doble_carga: { label: 'Doble carga el mismo día', color: '#1565c0', bg: '#dbeafe' },
}

export default function Reports({ userRol }) {
  const [meses,         setMeses]         = useState(12)
  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [tooltip,       setTooltip]       = useState(null)
  const [anomalias,     setAnomalias]     = useState([])
  const [loadingAnom,   setLoadingAnom]   = useState(false)
  const [diasAnom,      setDiasAnom]      = useState(90)
  const [section,       setSection]       = useState('heatmap')

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

  const loadAnomalias = useCallback(async () => {
    setLoadingAnom(true)
    try {
      const result = await getAnomalias({ dias: diasAnom })
      setAnomalias(result)
    } catch (err) {
      console.error('Error cargando anomalías:', err)
    } finally {
      setLoadingAnom(false)
    }
  }, [diasAnom])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (section === 'anomalias') loadAnomalias()
  }, [section, loadAnomalias])

  const renderHeatmap = () => {
    if (loading) return <div className="state-msg">Cargando informe…</div>
    if (!data)   return <div className="state-msg empty">Sin datos</div>

    const { months, vehicles } = data

    const byCC = vehicles.reduce((acc, v) => {
      ;(acc[v.centro_costo] = acc[v.centro_costo] || []).push(v)
      return acc
    }, {})

    const allCells   = vehicles.flatMap(v => Object.values(v.meses).filter(Boolean))
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
      <>
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

        <div className="hm-legend">
          <span className="hm-legend-item hm-good">≥ 10 km/L — Bueno</span>
          <span className="hm-legend-item hm-ok">7 – 9.9 km/L — Aceptable</span>
          <span className="hm-legend-item hm-low">{'< 7'} km/L — Bajo</span>
          <span className="hm-legend-item hm-empty">Sin datos</span>
          <span className="hm-legend-hint">Pasá el cursor sobre una celda para ver detalle</span>
        </div>

        <div className="hm-wrapper" onMouseLeave={() => setTooltip(null)}>
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
                    const rowAvg   = rowCells.filter(c => c.avg_consumo != null)
                    const avg      = rowAvg.length
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
      </>
    )
  }

  const renderRanking = () => {
    if (loading) return <div className="state-msg">Cargando…</div>
    if (!data)   return <div className="state-msg empty">Sin datos</div>

    const { vehicles } = data

    const ranking = vehicles.map(v => {
      const cells      = Object.values(v.meses).filter(Boolean)
      const withConsumo = cells.filter(c => c.avg_consumo != null)
      const avg        = withConsumo.length
        ? withConsumo.reduce((s, c) => s + c.avg_consumo, 0) / withConsumo.length
        : null
      const totalLitros = cells.reduce((s, c) => s + (c.total_litros || 0), 0)
      const totalCosto  = cells.reduce((s, c) => s + (c.total_costo  || 0), 0)
      const totalKmEst  = avg != null ? avg * totalLitros : null
      const costoPorKm  = totalKmEst > 0 ? totalCosto / totalKmEst : null
      return { ...v, avg, totalLitros, totalCosto, costoPorKm }
    }).sort((a, b) => {
      if (a.avg == null && b.avg == null) return 0
      if (a.avg == null) return 1
      if (b.avg == null) return -1
      return b.avg - a.avg
    })

    return (
      <div className="table-wrapper">
        <table className="fuel-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Matrícula</th>
              <th>Conductor</th>
              <th>CC</th>
              <th className="r">Consumo Prom.</th>
              <th className="r">Total Litros</th>
              <th className="r">Gasto Total</th>
              <th className="r">Costo/km (est.)</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((v, i) => (
              <tr key={v.matricula}>
                <td className="muted">{i + 1}</td>
                <td><span className="badge">{v.matricula}</span></td>
                <td>{v.conductor}</td>
                <td className="muted">{v.centro_costo}</td>
                <td className={`r consumo ${v.avg != null ? cellClass(v.avg).replace('hm-','') : ''}`}>
                  {v.avg != null ? `${fmtNum(v.avg)} km/L` : '—'}
                </td>
                <td className="r">{fmtNum(v.totalLitros)} L</td>
                <td className="r">{v.totalCosto > 0 ? `$${fmtNum(v.totalCosto, 0)}` : '—'}</td>
                <td className="r muted">
                  {v.costoPorKm != null ? `$${fmtNum(v.costoPorKm, 2)}/km` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderAnomalias = () => {
    if (loadingAnom) return <div className="state-msg">Cargando anomalías…</div>

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#6b7a92' }}>Período:</label>
          <select
            value={diasAnom}
            onChange={e => setDiasAnom(Number(e.target.value))}
            style={{ padding: '7px 12px', border: '1.5px solid #d3daea', borderRadius: 7, fontSize: 13 }}
          >
            <option value={30}>Últimos 30 días</option>
            <option value={60}>Últimos 60 días</option>
            <option value={90}>Últimos 90 días</option>
            <option value={180}>Últimos 6 meses</option>
          </select>
          <button
            className="btn-secondary"
            style={{ padding: '7px 14px', fontSize: 13 }}
            onClick={loadAnomalias}
          >
            Actualizar
          </button>
          {anomalias.length > 0 && (
            <span className="anom-badge-count">{anomalias.length} alerta{anomalias.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {anomalias.length === 0 ? (
          <div className="state-msg empty" style={{ padding: 40 }}>
            Sin anomalías detectadas en los últimos {diasAnom} días
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Matrícula</th>
                  <th>Conductor</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {anomalias.map((a, i) => {
                  const meta = ANOMALY_LABELS[a.tipo] || { label: a.tipo, color: '#333', bg: '#f0f0f0' }
                  return (
                    <tr key={i}>
                      <td>
                        <span className="anom-badge" style={{ background: meta.bg, color: meta.color }}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="nowrap">{fmtDate(a.fecha)}</td>
                      <td><span className="badge">{a.matricula}</span></td>
                      <td>{a.conductor}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{a.detalle}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="reports-section">

      {/* Header con selector de período (solo para heatmap y ranking) */}
      <div className="reports-header">
        <h2 className="admin-title">Informes</h2>
        {(section === 'heatmap' || section === 'ranking') && (
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
        )}
      </div>

      {/* Sub-navegación de informes */}
      <div className="reports-nav">
        <button
          className={`reports-nav-btn ${section === 'heatmap' ? 'active' : ''}`}
          onClick={() => setSection('heatmap')}
        >
          Mapa de Consumo
        </button>
        <button
          className={`reports-nav-btn ${section === 'ranking' ? 'active' : ''}`}
          onClick={() => setSection('ranking')}
        >
          Ranking Eficiencia
        </button>
        <button
          className={`reports-nav-btn ${section === 'anomalias' ? 'active' : ''}`}
          onClick={() => setSection('anomalias')}
        >
          Anomalías {anomalias.length > 0 && <span className="reports-badge">{anomalias.length}</span>}
        </button>
      </div>

      {section === 'heatmap'   && renderHeatmap()}
      {section === 'ranking'   && renderRanking()}
      {section === 'anomalias' && renderAnomalias()}
    </div>
  )
}
