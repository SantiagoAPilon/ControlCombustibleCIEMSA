import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  usuario:       { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  rol:           { type: String, default: 'reportes' },  // admin | conductor | reportes
  vehiculo:      { type: String, default: null },         // solo para conductores
})

export const User = mongoose.model('User', userSchema)

export const findAllUsers = () =>
  User.find().select('-password_hash').lean()

export const createUser = async ({ usuario, password, rol, vehiculo }) => {
  const bcrypt = await import('bcrypt')
  const password_hash = await bcrypt.default.hash(password, 10)
  return User.create({ usuario, password_hash, rol, vehiculo: vehiculo || null })
}

export const updateUser = async (id, { usuario, password, rol, vehiculo }) => {
  const bcrypt = await import('bcrypt')
  const upd = { usuario, rol, vehiculo: vehiculo || null }
  if (password) upd.password_hash = await bcrypt.default.hash(password, 10)
  return User.findByIdAndUpdate(id, { $set: upd }, { new: true }).select('-password_hash')
}

export const removeUser = (id) => User.findByIdAndDelete(id)
