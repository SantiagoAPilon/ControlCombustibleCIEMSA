import { getDb } from '../config/db_config.js'

export const findAll = async ({ matricula, mes, anio } = {}) => {
  const db = await getDb()

  // Compute km_anterior via LAG over ALL records first, then filter.
  // This ensures correct chronological predecessor even when records are
  // entered out of date order.
  let whereClauses = ['1=1']
  const params = []

  if (matricula && matricula !== 'all') {
    whereClauses.push('matricula = ?')
    params.push(matricula)
  }
  if (mes) {
    whereClauses.push("strftime('%m', fecha) = ?")
    params.push(String(mes).padStart(2, '0'))
  }
  if (anio) {
    whereClauses.push("strftime('%Y', fecha) = ?")
    params.push(String(anio))
  }

  const sql = `
    WITH base AS (
      SELECT
        f.id, f.matricula, f.fecha, f.litros, f.km_actual,
        f.tipo_combustible, f.proveedor, f.costo_litro, f.costo_total,
        v.conductor, v.centro_costo, v.modelo,
        LAG(f.km_actual) OVER (
          PARTITION BY f.matricula
          ORDER BY f.fecha ASC, f.id ASC
        ) AS km_anterior
      FROM fuel_records f
      JOIN vehicles v ON f.matricula = v.matricula
    )
    SELECT *,
      CASE WHEN km_anterior IS NOT NULL
        THEN km_actual - km_anterior
        ELSE NULL
      END AS km_recorridos,
      CASE
        WHEN km_anterior IS NOT NULL
          AND (km_actual - km_anterior) > 0
          AND litros > 0
        THEN ROUND((km_actual - km_anterior) / litros, 2)
        ELSE NULL
      END AS consumo_km_l
    FROM base
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY fecha DESC, id DESC
  `

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

export const update = async (id, data) => {
  const db = await getDb()
  const { fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total } = data
  return db.run(
    `UPDATE fuel_records
     SET fecha = ?, litros = ?, km_actual = ?,
         tipo_combustible = ?, proveedor = ?,
         costo_litro = ?, costo_total = ?
     WHERE id = ?`,
    [fecha, parseFloat(litros), parseInt(km_actual, 10),
     tipo_combustible || null, proveedor || null,
     costo_litro != null ? parseFloat(costo_litro) : null,
     costo_total  != null ? parseFloat(costo_total)  : null,
     id]
  )
}

export const remove = async (id) => {
  const db = await getDb()
  return db.run('DELETE FROM fuel_records WHERE id = ?', [id])
}
