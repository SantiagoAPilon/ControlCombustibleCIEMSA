// Ejecutar una sola vez desde backend/: node scripts/seed_excel.js
import { conectarBD, getDb } from '../src/config/db_config.js'

const RECORDS = [
  { fecha:'2025-07-01', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:45.63,  costo_total:2193.90, proveedor:'Sintiel - Florida',            km_actual:24977 },
  { fecha:'2025-07-01', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:34.035, costo_total:1541.61, proveedor:'Palmar Chico - Cerro Chato',     km_actual:24977 },
  { fecha:'2025-07-01', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:27.47,  costo_total:1244.07, proveedor:'Barney Martínez - Melo',         km_actual:24977 },
  { fecha:'2025-07-01', matricula:'CBC6787', tipo_combustible:'Nafta',  litros:29.58,  costo_total:2328.70, proveedor:'Barney Martínez - Melo',         km_actual:40264 },
  { fecha:'2025-07-03', matricula:'CBC6787', tipo_combustible:'Nafta',  litros:36.027, costo_total:2836.00, proveedor:'Barney Martínez - Melo',         km_actual:40526 },
  { fecha:'2025-07-07', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:53.03,  costo_total:2401.00, proveedor:'Barney Martínez - Melo',         km_actual:26123 },
  { fecha:'2025-07-07', matricula:'SDD7218', tipo_combustible:'Gasoil', litros:57.00,  costo_total:2581.42, proveedor:'Barney Martínez - Melo',         km_actual:30048 },
  { fecha:'2025-07-10', matricula:'CBC6787', tipo_combustible:'Nafta',  litros:41.325, costo_total:3253.00, proveedor:'Barney Martínez - Melo',         km_actual:41469 },
  { fecha:'2025-07-11', matricula:'CBC4624', tipo_combustible:'Nafta',  litros:33.505, costo_total:2637.50, proveedor:'Mividal 33',                     km_actual:78602 },
  { fecha:'2025-07-11', matricula:'CBC4624', tipo_combustible:'Nafta',  litros:17.97,  costo_total:1414.60, proveedor:'Martínez Manzone - Florida',     km_actual:78602 },
  { fecha:'2025-07-11', matricula:'CBC4624', tipo_combustible:'Nafta',  litros:21.125, costo_total:2450.00, proveedor:'Marimar - Melo',                 km_actual:78602 },
  { fecha:'2025-07-15', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:20.67,  costo_total: 935.93, proveedor:'ANCAP Batlle',                   km_actual:27184 },
  { fecha:'2025-07-16', matricula:'CBC4624', tipo_combustible:'Nafta',  litros:39.62,  costo_total:3119.40, proveedor:'Barney Martínez - Melo',         km_actual:79116 },
  { fecha:'2025-07-17', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:39.51,  costo_total:1789.34, proveedor:'Barney Martínez - Melo',         km_actual:27682 },
  { fecha:'2025-07-21', matricula:'ABC7658', tipo_combustible:'Nafta',  litros:43.945, costo_total:3459.40, proveedor:'Marimar SA',                     km_actual:51418 },
  { fecha:'2025-07-22', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:41.54,  costo_total:1881.27, proveedor:'Barney Martínez - Melo',         km_actual:28482 },
  { fecha:'2025-07-23', matricula:'ABC7658', tipo_combustible:'Nafta',  litros:45.65,  costo_total:3593.60, proveedor:'GYF Ltda Vergara',               km_actual:51418 },
  { fecha:'2025-07-23', matricula:'CBC6787', tipo_combustible:'Nafta',  litros:31.844, costo_total:2506.80, proveedor:'Mividal 33',                     km_actual:43091 },
  { fecha:'2025-07-24', matricula:'SDD7216', tipo_combustible:'Gasoil', litros:53.15,  costo_total:2376.00, proveedor:'Marimar SA',                     km_actual:28757 },
]

async function run() {
  await conectarBD()
  const db = await getDb()

  let inserted = 0, skipped = 0

  for (const r of RECORDS) {
    const exists = await db.get(
      'SELECT id FROM fuel_records WHERE fecha = ? AND matricula = ? AND litros = ?',
      [r.fecha, r.matricula, r.litros]
    )
    if (exists) { skipped++; continue }

    const last = await db.get(
      'SELECT km_actual FROM fuel_records WHERE matricula = ? ORDER BY fecha ASC, id ASC',
      [r.matricula]
    )
    // For historical import, km_anterior and consumption are calculated via LAG at query time
    const costo_litro = r.costo_total && r.litros ? parseFloat((r.costo_total / r.litros).toFixed(4)) : null

    await db.run(
      `INSERT INTO fuel_records
         (matricula, fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [r.matricula, r.fecha, r.litros, r.km_actual,
       r.tipo_combustible, r.proveedor, costo_litro, r.costo_total]
    )
    inserted++
  }

  console.log(`Seed completado: ${inserted} registros insertados, ${skipped} ya existían.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
