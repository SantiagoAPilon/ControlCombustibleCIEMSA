// node scripts/seed_ducsa.js  (desde backend/)
// Importa todas las cargas individuales de la hoja "DETALLE CARGAS" del Excel DUCSA.
import 'dotenv/config'
import { fileURLToPath } from 'url'
import { join, dirname }  from 'path'
import XLSX               from 'xlsx'
import { conectarBD }     from '../src/config/db_config.js'
import { FuelRecord }     from '../src/modelos/fuel.model.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE_PATH = join(__dirname, '../../Consumo_DUCSA_v15.xlsx')

// "DD/MM/YYYY HH:MM:SS" → "YYYY-MM-DD"
const parseDate = (raw) => {
  if (!raw) return null
  const part = raw.split(' ')[0]
  const [d, m, y] = part.split('/')
  if (!d || !m || !y) return null
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const mapProducto = (p = '') => {
  if (!p) return null
  return p.toUpperCase().includes('GASOIL') ? 'Gasoil' : 'Nafta'
}

async function run() {
  await conectarBD()

  const wb   = XLSX.readFile(FILE_PATH)
  const ws   = wb.Sheets['DETALLE CARGAS']
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })

  let inserted = 0, skipped = 0

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const matricula = row[3]
    if (!matricula || matricula === 'MATRICULA') { skipped++; continue }

    const fecha = parseDate(row[6])
    if (!fecha) { skipped++; continue }

    const litros = row[10]
    if (!litros || typeof litros !== 'number') { skipped++; continue }

    const proveedor       = row[7] || null
    const tipo_combustible = mapProducto(row[9])

    // Idempotencia: evitar duplicar por (fecha, matrícula, litros)
    const exists = await FuelRecord.exists({
      matricula,
      fecha,
      litros: { $gte: litros - 0.01, $lte: litros + 0.01 },
    })
    if (exists) { skipped++; continue }

    await FuelRecord.create({ matricula, fecha, litros, km_actual: null, tipo_combustible, proveedor })
    inserted++
  }

  console.log(`Seed DUCSA completado: ${inserted} cargas insertadas, ${skipped} omitidas.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
