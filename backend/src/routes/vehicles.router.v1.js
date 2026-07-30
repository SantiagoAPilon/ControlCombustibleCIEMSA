import express from 'express'
import { requireRole } from '../middlewares/auth.middleware.js'
import {
  obtenerVehiculos,
  agregarVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  obtenerUltimoKm,
} from '../controllers/vehicles.controller.js'

const vehiclesRouterV1 = express.Router()

// GET es accesible para todos los roles autenticados (necesario para selectores y quick-form)
vehiclesRouterV1.get   ('/vehicles',                       obtenerVehiculos)
vehiclesRouterV1.get   ('/vehicles/:matricula/last-km',    obtenerUltimoKm)
// Alta, edición y baja de vehículos: solo admin
vehiclesRouterV1.post  ('/vehicles',                       requireRole('admin'), agregarVehiculo)
vehiclesRouterV1.put   ('/vehicles/:matricula',            requireRole('admin'), actualizarVehiculo)
vehiclesRouterV1.delete('/vehicles/:matricula',            requireRole('admin'), eliminarVehiculo)

export { vehiclesRouterV1 }
