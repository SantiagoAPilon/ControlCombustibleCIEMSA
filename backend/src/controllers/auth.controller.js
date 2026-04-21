import { doLogin } from '../services/auth.service.js'

export const login = async (req, res) => {
  try {
    const resultado = await doLogin(req.body)
    res.status(200).json(resultado)
  } catch (e) {
    res.status(e.code || 401).json({ message: e.message })
  }
}
