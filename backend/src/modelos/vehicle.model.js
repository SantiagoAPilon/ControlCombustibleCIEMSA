import { getDb } from '../config/db_config.js'

export const findAll = async () => {
  const db = await getDb()
  return db.all('SELECT * FROM vehicles ORDER BY centro_costo, matricula')
}
