import { getHeatmapData, getAllVehiclesForReport } from '../modelos/reports.model.js'

export const doGetHeatmap = async ({ meses = 12, hasta }) => {
  const hastaDate = hasta ? new Date(hasta) : new Date()
  const desdeDate = new Date(hastaDate)
  desdeDate.setMonth(desdeDate.getMonth() - meses + 1)
  desdeDate.setDate(1)

  const desde = desdeDate.toISOString().split('T')[0]
  const h     = hastaDate.toISOString().split('T')[0]

  const [rows, vehicles] = await Promise.all([
    getHeatmapData({ desde, hasta: h }),
    getAllVehiclesForReport(),
  ])

  // Build month list (YYYY-MM) for the period
  const months = []
  const cur = new Date(desdeDate)
  while (cur <= hastaDate) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
    cur.setMonth(cur.getMonth() + 1)
  }

  // Index rows by matricula → mes_anio
  const byVehicle = {}
  for (const r of rows) {
    if (!byVehicle[r.matricula]) byVehicle[r.matricula] = {}
    byVehicle[r.matricula][r.mes_anio] = {
      cargas:        r.cargas,
      total_litros:  r.total_litros,
      total_costo:   r.total_costo,
      avg_consumo:   r.avg_consumo,
    }
  }

  // Build response: all vehicles × all months
  const result = vehicles.map(v => ({
    matricula:    v.matricula,
    conductor:    v.conductor,
    modelo:       v.modelo,
    centro_costo: v.centro_costo,
    meses:        Object.fromEntries(months.map(m => [m, byVehicle[v.matricula]?.[m] ?? null])),
  }))

  return { months, vehicles: result, desde, hasta: h }
}
