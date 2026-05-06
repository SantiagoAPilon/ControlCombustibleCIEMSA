import { doObtenerCargas, doRegistrarCarga, doActualizarCarga, doEliminarCarga } from '../services/fuel.service.js'
import { doScanTicket } from '../services/ticket.service.js'

export const obtenerCargas = async (req, res) => {
  try {
    const cargas = await doObtenerCargas(req.query)
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
  try {
    const carga = await doRegistrarCarga(req.body)
    res.status(201).json(carga)
  } catch (e) {
    res.status(e.code || 400).json({ message: e.message })
  }
}

export const actualizarCarga = async (req, res) => {
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
