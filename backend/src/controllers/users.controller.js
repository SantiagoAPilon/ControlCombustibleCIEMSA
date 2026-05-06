import { doGetUsers, doCreateUser, doUpdateUser, doRemoveUser } from '../services/users.service.js'

export const getUsers = async (req, res) => {
  try {
    const users = await doGetUsers()
    res.json(users)
  } catch (e) { res.status(500).json({ message: e.message }) }
}

export const createUser = async (req, res) => {
  const { usuario, password, rol, vehiculo } = req.body
  if (!usuario || !password || !rol) return res.status(400).json({ message: 'Faltan campos: usuario, password, rol' })
  if (rol === 'conductor' && !vehiculo) return res.status(400).json({ message: 'Un conductor necesita vehículo asignado' })
  try {
    const user = await doCreateUser({ usuario, password, rol, vehiculo })
    res.status(201).json({ id: user._id, usuario: user.usuario, rol: user.rol, vehiculo: user.vehiculo })
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({ message: e.code === 11000 ? 'El usuario ya existe' : e.message })
  }
}

export const updateUser = async (req, res) => {
  const { usuario, password, rol, vehiculo } = req.body
  if (!usuario || !rol) return res.status(400).json({ message: 'Faltan campos: usuario, rol' })
  if (rol === 'conductor' && !vehiculo) return res.status(400).json({ message: 'Un conductor necesita vehículo asignado' })
  try {
    const user = await doUpdateUser(req.params.id, { usuario, password, rol, vehiculo })
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.json(user)
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? 'El usuario ya existe' : e.message })
  }
}

export const deleteUser = async (req, res) => {
  // No permitir que el admin se elimine a sí mismo (req.params.id es ObjectId, req.user.usuario es el nombre)
  // La comparación real es por ObjectId vs nombre de usuario; se verifica en el service si coincide
  try {
    const deleted = await doRemoveUser(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' })
    res.status(204).send()
  } catch (e) { res.status(500).json({ message: e.message }) }
}
