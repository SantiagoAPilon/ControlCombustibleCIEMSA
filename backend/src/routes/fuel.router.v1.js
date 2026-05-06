import express  from 'express'
import multer   from 'multer'
import { obtenerCargas, registrarCarga, actualizarCarga, eliminarCarga, escanearTicket } from '../controllers/fuel.controller.js'

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

fuelRouterV1.get   ('/fuel',            obtenerCargas)
fuelRouterV1.post  ('/fuel',            registrarCarga)
fuelRouterV1.put   ('/fuel/:id',        actualizarCarga)
fuelRouterV1.delete('/fuel/:id',        eliminarCarga)
fuelRouterV1.post  ('/fuel/scan-ticket', upload.single('image'), escanearTicket)

export { fuelRouterV1 }
