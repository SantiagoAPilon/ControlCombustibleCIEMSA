import { doGetHeatmap } from '../services/reports.service.js'

export const getHeatmap = async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 12
    const hasta = req.query.hasta || undefined
    const data  = await doGetHeatmap({ meses, hasta })
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}
