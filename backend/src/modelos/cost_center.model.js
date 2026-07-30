import mongoose from 'mongoose'

const ccSchema = new mongoose.Schema({
  codigo: { type: String, unique: true, required: true, uppercase: true, trim: true },
  nombre: { type: String, required: true },
})

export const CentroCosto = mongoose.model('CentroCosto', ccSchema)

export const findAllCC  = () => CentroCosto.find().sort({ codigo: 1 }).lean()
export const createCC   = ({ codigo, nombre }) => CentroCosto.create({ codigo, nombre })
export const updateCC   = (id, { nombre }) => CentroCosto.findByIdAndUpdate(id, { $set: { nombre } }, { new: true }).lean()
export const removeCC   = (id) => CentroCosto.findByIdAndDelete(id)
