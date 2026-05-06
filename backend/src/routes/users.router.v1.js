import express from 'express'
import { requireRole } from '../middlewares/auth.middleware.js'
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/users.controller.js'

const usersRouterV1 = express.Router()

// Solo admin puede gestionar usuarios
usersRouterV1.get   ('/users',     requireRole('admin'), getUsers)
usersRouterV1.post  ('/users',     requireRole('admin'), createUser)
usersRouterV1.put   ('/users/:id', requireRole('admin'), updateUser)
usersRouterV1.delete('/users/:id', requireRole('admin'), deleteUser)

export { usersRouterV1 }
