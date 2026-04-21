import express    from 'express'
import { login } from '../controllers/auth.controller.js'

const authRouterV1 = express.Router()

authRouterV1.post('/auth/login', login)

export { authRouterV1 }
