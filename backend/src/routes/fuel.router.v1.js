import express                                                          from 'express'
import { obtenerCargas, registrarCarga, actualizarCarga, eliminarCarga } from '../controllers/fuel.controller.js'

const fuelRouterV1 = express.Router()

fuelRouterV1.get   ('/fuel',     obtenerCargas)
fuelRouterV1.post  ('/fuel',     registrarCarga)
fuelRouterV1.put   ('/fuel/:id', actualizarCarga)
fuelRouterV1.delete('/fuel/:id', eliminarCarga)

export { fuelRouterV1 }
