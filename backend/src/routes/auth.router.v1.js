import express    from 'express'
import rateLimit  from 'express-rate-limit'
import { login } from '../controllers/auth.controller.js'

const authRouterV1 = express.Router()

// Límite estricto para login: 10 intentos / 15 min por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión, intente en 15 minutos' },
})

authRouterV1.post('/auth/login', loginLimiter, login)

export { authRouterV1 }
