import { getDb } from '../config/db_config.js'

export const getHeatmapData = async ({ desde, hasta }) => {
  const db = await getDb()

  // LAG over ALL records so the first record in the filtered window
  // still gets a correct km_anterior from records before the window.
  const rows = await db.all(`
    WITH base AS (
      SELECT
        f.id, f.matricula, f.fecha, f.litros, f.km_actual, f.costo_total,
        LAG(f.km_actual) OVER (PARTITION BY f.matricula ORDER BY f.fecha ASC, f.id ASC) AS km_anterior,
        v.conductor, v.centro_costo, v.modelo
      FROM fuel_records f
      JOIN vehicles v ON f.matricula = v.matricula
    ),
    computed AS (
      SELECT *,
        CASE
          WHEN km_anterior IS NOT NULL
           AND (km_actual - km_anterior) > 0
           AND litros > 0
          THEN ROUND((km_actual - km_anterior) / CAST(litros AS REAL), 2)
          ELSE NULL
        END AS consumo_km_l
      FROM base
    )
    SELECT
      matricula, conductor, modelo, centro_costo,
      strftime('%Y-%m', fecha) AS mes_anio,
      COUNT(*)                                          AS cargas,
      ROUND(SUM(litros), 2)                             AS total_litros,
      ROUND(SUM(COALESCE(costo_total, 0)), 2)           AS total_costo,
      ROUND(AVG(consumo_km_l), 2)                       AS avg_consumo
    FROM computed
    WHERE fecha >= ? AND fecha <= ?
    GROUP BY matricula, mes_anio
    ORDER BY centro_costo, matricula, mes_anio
  `, [desde, hasta])

  return rows
}

export const getAllVehiclesForReport = async () => {
  const db = await getDb()
  return db.all('SELECT * FROM vehicles ORDER BY centro_costo, matricula')
}
