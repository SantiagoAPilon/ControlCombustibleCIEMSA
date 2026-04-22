import jwt    from 'jsonwebtoken'
import bcrypt  from 'bcrypt'
import { getDb } from '../config/db_config.js'

export const doLogin = async ({ usuario, password }) => {
  const db   = await getDb()
  const user = await db.get('SELECT * FROM users WHERE usuario = ?', [usuario])

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
