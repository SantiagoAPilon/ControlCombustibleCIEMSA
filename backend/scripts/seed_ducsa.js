// node scripts/seed_ducsa.js  (desde backend/)
// Importa todas las cargas individuales de la hoja "DETALLE CARGAS" del Excel DUCSA.
// Borra primero los resúmenes mensuales (km_actual IS NULL) que ya no son necesarios.
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { join, dirname }  from 'path'
import XLSX               from 'xlsx'
import { conectarBD, getDb } from '../src/config/db_config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE_PATH = join(__dirname, '../../Consumo_DUCSA_v15.xlsx')

// "DD/MM/YYYY HH:MM:SS" → "YYYY-MM-DD"
const parseDate = (raw) => {
  if (!raw) return null
  const part = raw.split(' ')[0]          // "DD/MM/YYYY"
  const [d, m, y] = part.split('/')
  if (!d || !m || !y) return null
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const mapProducto = (p = '') => {
  if (!p) return null
  const u = p.toUpperCase()
  if (u.includes('GASOIL')) return 'Gasoil'
  return 'Nafta'
}

async function run() {
  await conectarBD()
  const db = await getDb()

  // 1. Borrar resúmenes mensuales DUCSA (km_actual IS NULL) que fueron la carga anterior
  const { changes: borrados } = await db.run(
    `DELETE FROM fuel_records WHERE km_actual IS NULL AND proveedor = 'DUCSA'`
  )
  console.log(`Resúmenes mensuales eliminados: ${borrados}`)

  // 2. Leer hoja DETALLE CARGAS
  const wb   = XLSX.readFile(FILE_PATH)
  const ws   = wb.Sheets['DETALLE CARGAS']
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  let inserted = 0, skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    // Filtrar filas de encabezado o separador (sin matrícula válida)
    const matricula = row[3]
    if (!matricula || matricula === 'MATRICULA') { skipped++; continue }

    const fechaRaw = row[6]
    const fecha    = parseDate(fechaRaw)
    if (!fecha) { skipped++; continue }

    const litros = row[10]
    if (!litros || typeof litros !== 'number') { skipped++; continue }

    const proveedor      = row[7] || null
    const tipo_combustible = mapProducto(row[9])

    // Idempotencia: evitar duplicar si ya existe (fecha + matrícula + litros redondeados)
    const { cnt } = await db.get(
      `SELECT COUNT(*) AS cnt FROM fuel_records
        WHERE matricula = ? AND fecha = ? AND ROUND(litros,2) = ROUND(?,2)`,
      [matricula, fecha, litros]
    )
    if (cnt > 0) { skipped++; continue }

    await db.run(
      `INSERT INTO fuel_records (matricula, fecha, litros, km_actual, tipo_combustible, proveedor)
       VALUES (?, ?, ?, NULL, ?, ?)`,
      [matricula, fecha, litros, tipo_combustible, proveedor]
    )
    inserted++
  }

  console.log(`Seed DUCSA completado: ${inserted} cargas insertadas, ${skipped} omitidas.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
