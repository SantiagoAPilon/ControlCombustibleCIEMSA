import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  usuario:       { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  rol:           { type: String, default: 'usuario' },
})

export const User = mongoose.model('User', userSchema)
