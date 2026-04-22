import express         from 'express'
import { getHeatmap } from '../controllers/reports.controller.js'

const reportsRouterV1 = express.Router()

reportsRouterV1.get('/reports/heatmap', getHeatmap)

export { reportsRouterV1 }
