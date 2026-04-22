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
