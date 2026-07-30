import express from 'express'
import { requireRole } from '../middlewares/auth.middleware.js'
import { getCostCenters, addCostCenter, editCostCenter, deleteCostCenter } from '../controllers/cost_centers.controller.js'

const ccRouterV1 = express.Router()

// GET es accesible para todos los roles autenticados (necesario para llenar selectores)
ccRouterV1.get   ('/cost-centers',     getCostCenters)
ccRouterV1.post  ('/cost-centers',     requireRole('admin'), addCostCenter)
ccRouterV1.put   ('/cost-centers/:id', requireRole('admin'), editCostCenter)
ccRouterV1.delete('/cost-centers/:id', requireRole('admin'), deleteCostCenter)

export { ccRouterV1 }
