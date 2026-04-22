import 'dotenv/config'
import express from 'express'
import cors    from 'cors'
import { authRouterV1 }     from './src/routes/auth.router.v1.js'
import { vehiclesRouterV1 } from './src/routes/vehicles.router.v1.js'
import { fuelRouterV1 }     from './src/routes/fuel.router.v1.js'
import { reportsRouterV1 }  from './src/routes/reports.router.v1.js'
import { logMiddleware }    from './src/middlewares/logger.middleware.js'
import { authMiddleware }   from './src/middlewares/auth.middleware.js'
import { conectarBD }       from './src/config/db_config.js'

const app  = express()
const PORT = process.env.PORT || 8001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8000' }))
app.use(express.json())
app.use(logMiddleware)

// Ruta pública
app.use('/v1', authRouterV1)

// Rutas protegidas
app.use(authMiddleware)
app.use('/v1', vehiclesRouterV1)
app.use('/v1', fuelRouterV1)
app.use('/v1', reportsRouterV1)

conectarBD()
  .then(() => app.listen(PORT, () => console.log(`Backend CIEMSA → http://localhost:${PORT}`)))
  .catch(err => { console.error('Error iniciando BD:', err); process.exit(1) })
