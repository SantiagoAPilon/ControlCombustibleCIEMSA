import jwt    from 'jsonwebtoken'
import bcrypt  from 'bcrypt'
import { User } from '../modelos/user.model.js'

export const doLogin = async ({ usuario, password }) => {
  // Validar tipos antes de construir la regex (previene ReDoS)
  if (typeof usuario !== 'string' || usuario.length > 50 ||
      typeof password !== 'string' || password.length > 128) {
    const err = new Error('Datos de acceso inválidos')
    err.code = 400
    throw err
  }

  // Escapar caracteres especiales para evitar inyección regex
  const escaped = usuario.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const user = await User.findOne({ usuario: { $regex: `^${escaped}$`, $options: 'i' } }).lean()

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    const err = new Error('Usuario o contraseña incorrectos')
    err.code  = 401
    throw err
  }

  const token = jwt.sign(
    { usuario: user.usuario, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  return { token, usuario: user.usuario, rol: user.rol }
}
