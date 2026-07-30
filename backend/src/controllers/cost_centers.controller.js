import { findAllCC, createCC, updateCC, removeCC } from '../modelos/cost_center.model.js'

export const getCostCenters = async (_req, res) => {
  try { res.json(await findAllCC()) }
  catch (e) { res.status(500).json({ message: e.message }) }
}

export const addCostCenter = async (req, res) => {
  const { codigo, nombre } = req.body
  if (!codigo || !nombre) return res.status(400).json({ message: 'codigo y nombre son obligatorios' })
  try {
    const cc = await createCC({ codigo, nombre })
    res.status(201).json(cc)
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({ message: e.code === 11000 ? `El código ${req.body.codigo} ya existe` : e.message })
  }
}

export const editCostCenter = async (req, res) => {
  if (!req.body.nombre) return res.status(400).json({ message: 'nombre es obligatorio' })
  try {
    const cc = await updateCC(req.params.id, req.body)
    if (!cc) return res.status(404).json({ message: 'Centro de costo no encontrado' })
    res.json(cc)
  } catch (e) { res.status(500).json({ message: e.message }) }
}

export const deleteCostCenter = async (req, res) => {
  try {
    await removeCC(req.params.id)
    res.status(204).send()
  } catch (e) { res.status(500).json({ message: e.message }) }
}
