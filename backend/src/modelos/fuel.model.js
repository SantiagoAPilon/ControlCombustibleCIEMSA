import mongoose from 'mongoose'

const fuelRecordSchema = new mongoose.Schema({
  matricula:        { type: String, required: true },
  fecha:            { type: String, required: true },
  litros:           { type: Number, required: true },
  km_actual:        Number,
  tipo_combustible: String,
  proveedor:        String,
  costo_litro:      Number,
  costo_total:      Number,
  foto:             Buffer,
  foto_mime:        String,
})

export const FuelRecord = mongoose.model('FuelRecord', fuelRecordSchema)

// Pipeline compartido: calcula km_anterior, km_recorridos y consumo_km_l vía ventana
// y hace el JOIN con vehicles. Recibe etapas de filtro pre y post ventana.
const buildPipeline = ({ preMatch = {}, postMatch = {} } = {}) => {
  const pipeline = []

  if (Object.keys(preMatch).length)  pipeline.push({ $match: preMatch })

  // Ventana: km anterior por matrícula ordenado por fecha + _id
  pipeline.push({
    $setWindowFields: {
      partitionBy: '$matricula',
      sortBy: { fecha: 1, _id: 1 },
      output: {
        km_anterior: { $shift: { output: '$km_actual', by: -1, default: null } },
      },
    },
  })

  // km_recorridos
  pipeline.push({
    $addFields: {
      km_recorridos: {
        $cond: {
          if:   { $and: [{ $ne: ['$km_anterior', null] }, { $ne: ['$km_actual', null] }] },
          then: { $subtract: ['$km_actual', '$km_anterior'] },
          else: null,
        },
      },
    },
  })

  // consumo_km_l
  pipeline.push({
    $addFields: {
      consumo_km_l: {
        $cond: {
          if:   { $and: [{ $gt: ['$km_recorridos', 0] }, { $gt: ['$litros', 0] }] },
          then: { $round: [{ $divide: ['$km_recorridos', '$litros'] }, 2] },
          else: null,
        },
      },
    },
  })

  if (Object.keys(postMatch).length) pipeline.push({ $match: postMatch })

  // JOIN vehicles
  pipeline.push({
    $lookup: {
      from:         'vehicles',
      localField:   'matricula',
      foreignField: 'matricula',
      as:           '_v',
    },
  })
  pipeline.push({ $unwind: '$_v' })
  pipeline.push({
    $addFields: {
      conductor:    '$_v.conductor',
      centro_costo: '$_v.centro_costo',
      modelo:       '$_v.modelo',
    },
  })

  // Proyección final
  pipeline.push({
    $project: {
      id:               { $toString: '$_id' },
      matricula:        1,
      fecha:            1,
      litros:           1,
      km_actual:        1,
      km_anterior:      1,
      km_recorridos:    1,
      consumo_km_l:     1,
      tipo_combustible: 1,
      proveedor:        1,
      costo_litro:      1,
      costo_total:      1,
      conductor:        1,
      centro_costo:     1,
      modelo:           1,
      tiene_foto:       { $cond: [{ $gt: ['$foto_mime', null] }, true, false] },
      _id:              0,
    },
  })

  return pipeline
}

export const findAll = async ({ matricula, mes, anio } = {}) => {
  const preMatch  = {}
  const postMatch = {}

  if (matricula && matricula !== 'all') preMatch.matricula = matricula

  if (anio && mes) {
    postMatch.fecha = { $regex: `^${anio}-${String(mes).padStart(2, '0')}` }
  } else if (anio) {
    postMatch.fecha = { $regex: `^${anio}` }
  } else if (mes) {
    postMatch.$expr = { $eq: [{ $substr: ['$fecha', 5, 2] }, String(mes).padStart(2, '0')] }
  }

  const pipeline = buildPipeline({ preMatch, postMatch })
  pipeline.push({ $sort: { fecha: -1, _id: -1 } })

  return FuelRecord.aggregate(pipeline)
}

export const findLastByMatricula = async (matricula) =>
  FuelRecord.findOne({ matricula }).sort({ fecha: -1, _id: -1 }).lean()

export const attachFoto = async (id, buffer, mime) => {
  const doc = await FuelRecord.findByIdAndUpdate(
    id,
    { $set: { foto: buffer, foto_mime: mime } },
    { new: false }
  )
  if (!doc) {
    const err = new Error('Registro no encontrado')
    err.code = 404
    throw err
  }
}

export const getFoto = async (id) =>
  FuelRecord.findById(id).select('foto foto_mime').lean()

export const findMatriculaById = async (id) => {
  const doc = await FuelRecord.findById(id).select('matricula').lean()
  return doc?.matricula ?? null
}

export const create = async (data) => {
  const { matricula, fecha, litros, km_actual,
          km_anterior, km_recorridos, consumo_km_l,
          tipo_combustible, proveedor, costo_litro, costo_total } = data

  const doc = await FuelRecord.create({
    matricula,
    fecha,
    litros:           parseFloat(litros),
    km_actual:        km_actual    != null ? parseInt(km_actual, 10)    : null,
    tipo_combustible: tipo_combustible || null,
    proveedor:        proveedor        || null,
    costo_litro:      costo_litro != null ? parseFloat(costo_litro) : null,
    costo_total:      costo_total  != null ? parseFloat(costo_total)  : null,
  })

  const pipeline = buildPipeline({ preMatch: { _id: doc._id } })
  const [result] = await FuelRecord.aggregate(pipeline)
  return result
}

export const update = async (id, data) => {
  const { fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total } = data
  await FuelRecord.findByIdAndUpdate(id, {
    $set: {
      fecha,
      litros:           parseFloat(litros),
      km_actual:        km_actual != null ? parseInt(km_actual, 10) : null,
      tipo_combustible: tipo_combustible || null,
      proveedor:        proveedor        || null,
      costo_litro:      costo_litro != null ? parseFloat(costo_litro) : null,
      costo_total:      costo_total  != null ? parseFloat(costo_total)  : null,
    },
  })
  return null
}

export const remove = async (id) => FuelRecord.findByIdAndDelete(id)
