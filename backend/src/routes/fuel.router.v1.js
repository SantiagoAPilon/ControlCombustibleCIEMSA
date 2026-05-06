import express  from 'express'
import multer   from 'multer'
import { obtenerCargas, registrarCarga, actualizarCarga, eliminarCarga, escanearTicket, adjuntarFoto, obtenerFoto } from '../controllers/fuel.controller.js'

const fuelRouterV1 = express.Router()

// Multer en memoria: máx 5 MB, solo imágenes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    cb(null, allowed.includes(file.mimetype))
  },
})

fuelRouterV1.get   ('/fuel',                    obtenerCargas)
fuelRouterV1.post  ('/fuel',                    registrarCarga)
// Rutas específicas antes de las parametrizadas
fuelRouterV1.post  ('/fuel/scan-ticket',         upload.single('image'), escanearTicket)
fuelRouterV1.post  ('/fuel/:id/foto-ticket',     upload.single('image'), adjuntarFoto)
fuelRouterV1.get   ('/fuel/:id/foto-ticket',     obtenerFoto)
fuelRouterV1.put   ('/fuel/:id',                actualizarCarga)
fuelRouterV1.delete('/fuel/:id',                eliminarCarga)

export { fuelRouterV1 }
