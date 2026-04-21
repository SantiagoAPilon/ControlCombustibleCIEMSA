import jwt from 'jsonwebtoken'

export const doLogin = ({ usuario, password }) => {
  if (usuario !== process.env.ADMIN_USER || password !== process.env.ADMIN_PASSWORD) {
    const err = new Error('Usuario o contraseña incorrectos')
    err.code = 401
    throw err
  }
  const token = jwt.sign(
    { usuario, rol: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  return { token, usuario, rol: 'admin' }
}
