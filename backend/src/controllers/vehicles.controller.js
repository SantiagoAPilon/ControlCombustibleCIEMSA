import { doObtenerVehiculos } from '../services/vehicles.service.js'

export const obtenerVehiculos = async (_req, res) => {
  try {
    const vehiculos = await doObtenerVehiculos()
    res.status(200).json(vehiculos)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}
