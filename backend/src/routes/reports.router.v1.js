import express         from 'express'
import { requireRole } from '../middlewares/auth.middleware.js'
import { getHeatmap, getAnomalias } from '../controllers/reports.controller.js'

const reportsRouterV1 = express.Router()

// Informes de flota completa: no para conductores (ven solo su propio vehículo en /fuel)
reportsRouterV1.get('/reports/heatmap',   requireRole('admin', 'reportes'), getHeatmap)
reportsRouterV1.get('/reports/anomalias', requireRole('admin', 'reportes'), getAnomalias)

export { reportsRouterV1 }
