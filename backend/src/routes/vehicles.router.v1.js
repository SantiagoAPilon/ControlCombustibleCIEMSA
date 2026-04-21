import express            from 'express'
import { obtenerVehiculos } from '../controllers/vehicles.controller.js'

const vehiclesRouterV1 = express.Router()

vehiclesRouterV1.get('/vehicles', obtenerVehiculos)

export { vehiclesRouterV1 }
