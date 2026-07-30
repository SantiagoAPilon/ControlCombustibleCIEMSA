import mongoose    from 'mongoose'
import { FuelRecord } from './fuel.model.js'

const vehicleSchema = new mongoose.Schema({
  matricula:          { type: String, unique: true, required: true, uppercase: true, trim: true },
  conductor:          String,
  centro_costo:       String,
  modelo:             String,
  km_proximo_service: { type: Number, default: null },
})

export const Vehicle = mongoose.model('Vehicle', vehicleSchema)

const toObj = (v) => ({
  matricula:          v.matricula,
  conductor:          v.conductor,
  centro_costo:       v.centro_costo,
  modelo:             v.modelo,
  km_proximo_service: v.km_proximo_service ?? null,
})

export const findAll = async () => {
  const docs = await Vehicle.find().sort({ centro_costo: 1, matricula: 1 }).lean()
  return docs.map(toObj)
}

export const create = async ({ matricula, conductor, centro_costo, modelo }) => {
  const mat = matricula.toUpperCase().trim()
  try {
    const doc = await Vehicle.create({ matricula: mat, conductor, centro_costo, modelo })
    return toObj(doc)
  } catch (err) {
    if (err.code === 11000) {
      const e = new Error(`La matrícula ${mat} ya existe`)
      e.code = 409
      throw e
    }
    throw err
  }
}

export const update = async (matricula, { conductor, centro_costo, modelo, km_proximo_service }) => {
  const doc = await Vehicle.findOneAndUpdate(
    { matricula },
    { conductor, centro_costo, modelo, km_proximo_service: km_proximo_service ?? null },
    { new: true }
  ).lean()
  return toObj(doc)
}

export const remove = async (matricula) => {
  const count = await FuelRecord.countDocuments({ matricula })
  if (count > 0) {
    const e = new Error(`No se puede eliminar: el vehículo tiene ${count} registros de carga`)
    e.code = 409
    throw e
  }
  return Vehicle.deleteOne({ matricula })
}

export const getLastKm = async (matricula) => {
  const doc = await FuelRecord.findOne({ matricula, km_actual: { $ne: null } })
    .sort({ fecha: -1, _id: -1 })
    .select('km_actual fecha')
    .lean()
  return doc ? { km_actual: doc.km_actual, fecha: doc.fecha } : null
}
