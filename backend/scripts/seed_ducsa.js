// node scripts/seed_ducsa.js  (desde backend/)
// Importa el resumen mensual DUCSA. Inserta UN registro por vehículo × mes con los
// litros DUCSA totales del mes. km_actual = 0 (sin datos de km en este resumen).
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { join, dirname }  from 'path'
import XLSX                 from 'xlsx'
import { conectarBD, getDb } from '../src/config/db_config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE_PATH = join(__dirname, '../../Consumo_DUCSA_v15.xlsx')

// Mes → [mesAnio, fechaUltimoDia]
const MONTHS = [
  ['2025-01', '2025-01-31'],
  ['2025-02', '2025-02-28'],
  ['2025-03', '2025-03-31'],
  ['2025-04', '2025-04-30'],
  ['2025-05', '2025-05-31'],
  ['2025-06', '2025-06-30'],
  ['2025-07', '2025-07-31'],
  ['2025-08', '2025-08-31'],
  ['2025-09', '2025-09-30'],
  ['2025-10', '2025-10-31'],
  ['2025-11', '2025-11-30'],
  ['2025-12', '2025-12-31'],
  ['2026-01', '2026-01-31'],
  ['2026-02', '2026-02-28'],
  ['2026-03', '2026-03-31'],
]

const combustiblePorModelo = (modelo = '') => {
  const m = modelo.toLowerCase()
  if (m.includes('onix') || m.includes('versa')) return 'Nafta'
  if (m.includes('jac') || m.includes('frontier') || m.includes('diesel')) return 'Gasoil'
  return 'Nafta' // Oroch y resto en la flota usan nafta según datos existentes
}

// Filas de datos en la hoja (0-indexado): 4-8 OM2204, 10-16 OM2404
const DATA_ROWS = [4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16]

async function run() {
  await conectarBD()
  const db = await getDb()

  const wb   = XLSX.readFile(FILE_PATH)
  const ws   = wb.Sheets['DATOS']
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  let inserted = 0, skipped = 0

  for (const rowIdx of DATA_ROWS) {
    const row = rows[rowIdx]
    if (!row || !row[2]) continue

    const matricula   = row[2]
    const modelo      = row[3] || ''
    const combustible = combustiblePorModelo(modelo)

    for (let mi = 0; mi < MONTHS.length; mi++) {
      const [mesAnio, fecha] = MONTHS[mi]

      // Columnas: cada mes ocupa 3 cols (KM_REC, LIT_DUCSA, LIT_UE) a partir de col 4
      const colBase  = 4 + mi * 3
      const litDucsa = row[colBase + 1]

      if (!litDucsa) { skipped++; continue }

      // Idempotencia: saltar si ya existe cualquier registro para ese vehículo/mes
      // (evita doble conteo con cargas individuales)
      const { cnt } = await db.get(
        `SELECT COUNT(*) AS cnt FROM fuel_records
          WHERE matricula = ? AND strftime('%Y-%m', fecha) = ?`,
        [matricula, mesAnio]
      )
      if (cnt > 0) { skipped++; continue }

      // km_actual = NULL indica resumen mensual sin lectura de odómetro
      await db.run(
        `INSERT INTO fuel_records
           (matricula, fecha, litros, km_actual, tipo_combustible, proveedor)
         VALUES (?, ?, ?, NULL, ?, 'DUCSA')`,
        [matricula, fecha, litDucsa, combustible]
      )
      inserted++
    }
  }

  console.log(`Seed DUCSA completado: ${inserted} insertados, ${skipped} omitidos.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
