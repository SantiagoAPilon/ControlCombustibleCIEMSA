import express         from 'express'
import { getHeatmap, getAnomalias } from '../controllers/reports.controller.js'

const reportsRouterV1 = express.Router()

reportsRouterV1.get('/reports/heatmap',   getHeatmap)
reportsRouterV1.get('/reports/anomalias', getAnomalias)

export { reportsRouterV1 }
