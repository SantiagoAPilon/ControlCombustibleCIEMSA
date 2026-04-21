import express from 'express'
import {
  obtenerVehiculos,
  agregarVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
} from '../controllers/vehicles.controller.js'

const vehiclesRouterV1 = express.Router()

vehiclesRouterV1.get   ('/vehicles',              obtenerVehiculos)
vehiclesRouterV1.post  ('/vehicles',              agregarVehiculo)
vehiclesRouterV1.put   ('/vehicles/:matricula',   actualizarVehiculo)
vehiclesRouterV1.delete('/vehicles/:matricula',   eliminarVehiculo)

export { vehiclesRouterV1 }
