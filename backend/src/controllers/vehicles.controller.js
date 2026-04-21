import {
  doObtenerVehiculos,
  doAgregarVehiculo,
  doActualizarVehiculo,
  doEliminarVehiculo,
} from '../services/vehicles.service.js'

export const obtenerVehiculos = async (_req, res) => {
  try {
    const vehiculos = await doObtenerVehiculos()
    res.status(200).json(vehiculos)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

export const agregarVehiculo = async (req, res) => {
  const { matricula, conductor, centro_costo, modelo } = req.body
  if (!matricula || !conductor || !centro_costo || !modelo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' })
  }
  try {
    const vehiculo = await doAgregarVehiculo({ matricula, conductor, centro_costo, modelo })
    res.status(201).json(vehiculo)
  } catch (e) {
    res.status(e.code || 400).json({ message: e.message })
  }
}

export const actualizarVehiculo = async (req, res) => {
  const { conductor, centro_costo, modelo } = req.body
  if (!conductor || !centro_costo || !modelo) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' })
  }
  try {
    const vehiculo = await doActualizarVehiculo(req.params.matricula, { conductor, centro_costo, modelo })
    res.status(200).json(vehiculo)
  } catch (e) {
    res.status(e.code || 400).json({ message: e.message })
  }
}

export const eliminarVehiculo = async (req, res) => {
  try {
    await doEliminarVehiculo(req.params.matricula)
    res.status(204).send()
  } catch (e) {
    res.status(e.code || 500).json({ message: e.message })
  }
}
