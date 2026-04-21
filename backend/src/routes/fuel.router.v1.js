import express                                          from 'express'
import { obtenerCargas, registrarCarga, eliminarCarga } from '../controllers/fuel.controller.js'

const fuelRouterV1 = express.Router()

fuelRouterV1.get   ('/fuel',     obtenerCargas)
fuelRouterV1.post  ('/fuel',     registrarCarga)
fuelRouterV1.delete('/fuel/:id', eliminarCarga)

export { fuelRouterV1 }
