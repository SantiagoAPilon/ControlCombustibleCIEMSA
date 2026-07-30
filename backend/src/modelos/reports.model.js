import { FuelRecord } from './fuel.model.js'
import { Vehicle }    from './vehicle.model.js'

export const getHeatmapData = async ({ desde, hasta }) => {
  return FuelRecord.aggregate([
    // Ventana sobre todos los registros para calcular consumo correcto
    {
      $setWindowFields: {
        partitionBy: '$matricula',
        sortBy: { fecha: 1, _id: 1 },
        output: {
          km_anterior: { $shift: { output: '$km_actual', by: -1, default: null } },
        },
      },
    },
    {
      $addFields: {
        km_recorridos: {
          $cond: {
            if:   { $and: [{ $ne: ['$km_anterior', null] }, { $ne: ['$km_actual', null] }] },
            then: { $subtract: ['$km_actual', '$km_anterior'] },
            else: null,
          },
        },
      },
    },
    {
      $addFields: {
        consumo_km_l: {
          $cond: {
            if:   { $and: [{ $gt: ['$km_recorridos', 0] }, { $gt: ['$litros', 0] }] },
            then: { $round: [{ $divide: ['$km_recorridos', '$litros'] }, 2] },
            else: null,
          },
        },
      },
    },
    // Filtrar por rango de fechas
    { $match: { fecha: { $gte: desde, $lte: hasta } } },
    // mes_anio como YYYY-MM
    { $addFields: { mes_anio: { $substr: ['$fecha', 0, 7] } } },
    // Agrupar por matrícula + mes
    {
      $group: {
        _id:          { matricula: '$matricula', mes_anio: '$mes_anio' },
        cargas:       { $sum: 1 },
        total_litros: { $sum: '$litros' },
        total_costo:  { $sum: { $ifNull: ['$costo_total', 0] } },
        avg_consumo:  { $avg: '$consumo_km_l' },
      },
    },
    {
      $project: {
        _id:          0,
        matricula:    '$_id.matricula',
        mes_anio:     '$_id.mes_anio',
        cargas:       1,
        total_litros: { $round: ['$total_litros', 2] },
        total_costo:  { $round: ['$total_costo',  2] },
        avg_consumo:  { $round: ['$avg_consumo',  2] },
      },
    },
    { $sort: { matricula: 1, mes_anio: 1 } },
  ])
}

export const getAllVehiclesForReport = async () => {
  const docs = await Vehicle.find().sort({ centro_costo: 1, matricula: 1 }).lean()
  return docs.map(v => ({
    matricula:    v.matricula,
    conductor:    v.conductor,
    centro_costo: v.centro_costo,
    modelo:       v.modelo,
  }))
}

export const getAnomaliesData = async ({ dias = 90 }) => {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const desdeStr = desde.toISOString().split('T')[0]

  // Pipeline que calcula km_anterior para detectar km que bajan
  const registros = await FuelRecord.aggregate([
    { $match: { fecha: { $gte: desdeStr } } },
    {
      $setWindowFields: {
        partitionBy: '$matricula',
        sortBy: { fecha: 1, _id: 1 },
        output: {
          km_anterior: { $shift: { output: '$km_actual', by: -1, default: null } },
          costo_litro_anterior: { $shift: { output: '$costo_litro', by: -1, default: null } },
        },
      },
    },
    {
      $addFields: {
        km_recorridos: {
          $cond: {
            if: { $and: [{ $ne: ['$km_anterior', null] }, { $ne: ['$km_actual', null] }] },
            then: { $subtract: ['$km_actual', '$km_anterior'] },
            else: null,
          },
        },
      },
    },
    {
      $lookup: {
        from: 'vehicles',
        localField: 'matricula',
        foreignField: 'matricula',
        as: '_v',
      },
    },
    { $unwind: { path: '$_v', preserveNullAndEmpty: true } },
    {
      $project: {
        id: { $toString: '$_id' },
        matricula: 1,
        fecha: 1,
        litros: 1,
        km_actual: 1,
        km_anterior: 1,
        km_recorridos: 1,
        costo_litro: 1,
        costo_litro_anterior: 1,
        conductor: '$_v.conductor',
        _id: 0,
      },
    },
    { $sort: { fecha: -1, matricula: 1 } },
  ])

  const anomalias = []

  // Agrupar por matrícula para estadísticas de consumo
  const statsPorMatricula = {}
  for (const r of registros) {
    if (!statsPorMatricula[r.matricula]) statsPorMatricula[r.matricula] = []
    if (r.km_recorridos != null && r.litros > 0) {
      statsPorMatricula[r.matricula].push(r.km_recorridos / r.litros)
    }
  }

  // Calcular media y desvío por matrícula
  const statsMap = {}
  for (const [mat, consumos] of Object.entries(statsPorMatricula)) {
    if (consumos.length < 2) continue
    const media = consumos.reduce((a, b) => a + b, 0) / consumos.length
    const varianza = consumos.reduce((a, b) => a + Math.pow(b - media, 2), 0) / consumos.length
    statsMap[mat] = { media, desvio: Math.sqrt(varianza) }
  }

  // Detectar por fecha: doble carga mismo vehículo mismo día
  const cargasPorDia = {}
  for (const r of registros) {
    const key = `${r.matricula}|${r.fecha}`
    if (!cargasPorDia[key]) cargasPorDia[key] = []
    cargasPorDia[key].push(r)
  }

  const yaReportado = new Set()

  for (const r of registros) {
    // 1. KM que bajan
    if (r.km_actual != null && r.km_anterior != null && r.km_actual < r.km_anterior) {
      anomalias.push({
        tipo: 'km_bajo',
        label: 'KM menor al anterior',
        matricula: r.matricula,
        conductor: r.conductor,
        fecha: r.fecha,
        detalle: `KM actual ${r.km_actual.toLocaleString()} < KM anterior ${r.km_anterior.toLocaleString()}`,
        id_registro: r.id,
      })
    }

    // 2. Consumo alto (> media + 2σ)
    const consumo = r.km_recorridos != null && r.litros > 0 ? r.km_recorridos / r.litros : null
    if (consumo != null && statsMap[r.matricula]) {
      const { media, desvio } = statsMap[r.matricula]
      if (desvio > 0 && consumo < media - 2 * desvio) {
        anomalias.push({
          tipo: 'consumo_alto',
          label: 'Consumo inusualmente alto',
          matricula: r.matricula,
          conductor: r.conductor,
          fecha: r.fecha,
          detalle: `${(r.km_recorridos / r.litros).toFixed(2)} km/L — media histórica: ${media.toFixed(2)} km/L`,
          id_registro: r.id,
        })
      }
    }

    // 3. Doble carga mismo día
    const keyDia = `${r.matricula}|${r.fecha}`
    if (cargasPorDia[keyDia]?.length > 1 && !yaReportado.has(keyDia)) {
      yaReportado.add(keyDia)
      anomalias.push({
        tipo: 'doble_carga',
        label: 'Doble carga el mismo día',
        matricula: r.matricula,
        conductor: r.conductor,
        fecha: r.fecha,
        detalle: `${cargasPorDia[keyDia].length} cargas registradas el mismo día`,
        id_registro: r.id,
      })
    }
  }

  return anomalias.sort((a, b) => b.fecha.localeCompare(a.fecha))
}
