import { getDb } from '../config/db_config.js'

export const findAll = async () => {
  const db = await getDb()
  return db.all('SELECT * FROM vehicles ORDER BY centro_costo, matricula')
}

export const create = async ({ matricula, conductor, centro_costo, modelo }) => {
  const db  = await getDb()
  const mat = matricula.toUpperCase().trim()
  try {
    await db.run(
      'INSERT INTO vehicles (matricula, conductor, centro_costo, modelo) VALUES (?, ?, ?, ?)',
      [mat, conductor, centro_costo, modelo]
    )
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      const e = new Error(`La matrícula ${mat} ya existe`)
      e.code = 409
      throw e
    }
    throw err
  }
  return db.get('SELECT * FROM vehicles WHERE matricula = ?', [mat])
}

export const update = async (matricula, { conductor, centro_costo, modelo }) => {
  const db = await getDb()
  await db.run(
    'UPDATE vehicles SET conductor = ?, centro_costo = ?, modelo = ? WHERE matricula = ?',
    [conductor, centro_costo, modelo, matricula]
  )
  return db.get('SELECT * FROM vehicles WHERE matricula = ?', [matricula])
}

export const remove = async (matricula) => {
  const db    = await getDb()
  const { c } = await db.get(
    'SELECT COUNT(*) AS c FROM fuel_records WHERE matricula = ?',
    [matricula]
  )
  if (c > 0) {
    const e = new Error(`No se puede eliminar: el vehículo tiene ${c} registros de carga`)
    e.code = 409
    throw e
  }
  return db.run('DELETE FROM vehicles WHERE matricula = ?', [matricula])
}
