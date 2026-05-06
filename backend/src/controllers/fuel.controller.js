import { doObtenerCargas, doRegistrarCarga, doActualizarCarga, doEliminarCarga, doAttachFoto, doGetFoto } from '../services/fuel.service.js'
import { doScanTicket } from '../services/ticket.service.js'

export const obtenerCargas = async (req, res) => {
  try {
    // Conductor solo ve sus propios registros
    const filters = { ...req.query }
    if (req.user.rol === 'conductor') filters.matricula = req.user.vehiculo
    const cargas = await doObtenerCargas(filters)
    res.status(200).json(cargas)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const registrarCarga = async (req, res) => {
  const { matricula, fecha, litros, km_actual } = req.body
  if (!matricula || !fecha || litros == null || km_actual == null) {
    return res.status(400).json({ message: 'Faltan campos obligatorios: matricula, fecha, litros, km_actual' })
  }
  // Conductor solo puede registrar su propio vehículo
  if (req.user.rol === 'conductor' && req.body.matricula !== req.user.vehiculo) {
    return res.status(403).json({ message: 'Solo podés registrar cargas para tu vehículo asignado' })
  }
  try {
    const carga = await doRegistrarCarga(req.body)
    res.status(201).json(carga)
  } catch (e) {
    res.status(e.code || 400).json({ message: e.message })
  }
}

export const actualizarCarga = async (req, res) => {
  if (req.user.rol === 'reportes') return res.status(403).json({ message: 'No tenés permiso para modificar registros' })
  const { fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total } = req.body
  if (!fecha || litros == null || km_actual == null) {
    return res.status(400).json({ message: 'Faltan campos obligatorios: fecha, litros, km_actual' })
  }
  try {
    const carga = await doActualizarCarga(req.params.id, { fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total })
    res.status(200).json(carga)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const eliminarCarga = async (req, res) => {
  if (req.user.rol === 'reportes') return res.status(403).json({ message: 'No tenés permiso para modificar registros' })
  try {
    await doEliminarCarga(req.params.id)
    res.status(204).send()
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const escanearTicket = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Se requiere una imagen del ticket' })
  }
  try {
    const datos = await doScanTicket(req.file.buffer, req.file.mimetype)
    res.status(200).json(datos)
  } catch (e) {
    res.status(e.code || 500).json({ message: e.message })
  }
}

export const adjuntarFoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Se requiere una imagen' })
  }
  try {
    await doAttachFoto(req.params.id, req.file.buffer, req.file.mimetype)
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(e.code || 500).json({ message: e.message })
  }
}

export const obtenerFoto = async (req, res) => {
  try {
    const doc = await doGetFoto(req.params.id)
    if (!doc?.foto) return res.status(404).json({ message: 'Este registro no tiene foto de ticket' })
    res.set('Content-Type', doc.foto_mime)
    res.set('Cache-Control', 'private, max-age=86400')
    res.send(doc.foto.buffer ?? doc.foto)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}
