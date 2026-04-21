import { getDb } from '../config/db_config.js'

export const findAll = async ({ matricula, mes, anio } = {}) => {
  const db     = await getDb()
  let   sql    = `
    SELECT f.*, v.conductor, v.centro_costo, v.modelo
    FROM fuel_records f
    JOIN vehicles v ON f.matricula = v.matricula
    WHERE 1=1
  `
  const params = []

  if (matricula && matricula !== 'all') {
    sql += ' AND f.matricula = ?'
    params.push(matricula)
  }
  if (mes) {
    sql += " AND strftime('%m', f.fecha) = ?"
    params.push(String(mes).padStart(2, '0'))
  }
  if (anio) {
    sql += " AND strftime('%Y', f.fecha) = ?"
    params.push(String(anio))
  }

  sql += ' ORDER BY f.fecha DESC, f.id DESC'
  return db.all(sql, params)
}

export const findLastByMatricula = async (matricula) => {
  const db = await getDb()
  return db.get(
    'SELECT km_actual FROM fuel_records WHERE matricula = ? ORDER BY fecha DESC, id DESC LIMIT 1',
    [matricula]
  )
}

export const create = async (data) => {
  const db = await getDb()
  const { matricula, fecha, litros, km_actual, km_anterior, km_recorridos, consumo_km_l,
          tipo_combustible, proveedor, costo_litro, costo_total } = data

  const result = await db.run(
    `INSERT INTO fuel_records
       (matricula, fecha, litros, km_actual, km_anterior, km_recorridos, consumo_km_l,
        tipo_combustible, proveedor, costo_litro, costo_total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [matricula, fecha, litros, km_actual, km_anterior, km_recorridos, consumo_km_l,
     tipo_combustible || null, proveedor || null,
     costo_litro != null ? parseFloat(costo_litro) : null,
     costo_total  != null ? parseFloat(costo_total)  : null]
  )

  return db.get(
    `SELECT f.*, v.conductor, v.centro_costo, v.modelo
     FROM fuel_records f
     JOIN vehicles v ON f.matricula = v.matricula
     WHERE f.id = ?`,
    [result.lastID]
  )
}

export const remove = async (id) => {
  const db = await getDb()
  return db.run('DELETE FROM fuel_records WHERE id = ?', [id])
}
