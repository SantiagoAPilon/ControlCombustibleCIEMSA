import jwt    from 'jsonwebtoken'
import bcrypt  from 'bcrypt'
import { User } from '../modelos/user.model.js'

export const doLogin = async ({ usuario, password }) => {
  const user = await User.findOne({ usuario }).lean()

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
