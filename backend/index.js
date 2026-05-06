import 'dotenv/config'
import express       from 'express'
import cors          from 'cors'
import helmet        from 'helmet'
import rateLimit     from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { authRouterV1 }     from './src/routes/auth.router.v1.js'
import { vehiclesRouterV1 } from './src/routes/vehicles.router.v1.js'
import { fuelRouterV1 }     from './src/routes/fuel.router.v1.js'
import { reportsRouterV1 }  from './src/routes/reports.router.v1.js'
import { logMiddleware }    from './src/middlewares/logger.middleware.js'
import { authMiddleware }   from './src/middlewares/auth.middleware.js'
import { conectarBD }       from './src/config/db_config.js'

const app  = express()
const PORT = process.env.PORT || 8001

// Seguridad HTTP (14 cabeceras defensivas)
app.use(helmet())

// CORS restringido al frontend conocido
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:8000').split(',').map(s => s.trim())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true)
    else cb(new Error('CORS: origen no permitido'))
  },
}))

// Rate limiting global: 100 req / 15 min por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiadas solicitudes, intente más tarde' },
}))

app.use(express.json({ limit: '1mb' }))

// Elimina operadores $ y . del body/params para prevenir inyección NoSQL
app.use(mongoSanitize())

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
