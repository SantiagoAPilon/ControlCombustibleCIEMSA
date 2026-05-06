// node scripts/seed_conductor_users.js  (desde backend/)
// Crea un usuario conductor por cada vehículo registrado.
// Si el usuario ya existe lo omite (idempotente).
// Contraseña inicial = matrícula en minúscula (ej: "sde8297")
import 'dotenv/config'
import bcrypt           from 'bcrypt'
import { conectarBD }   from '../src/config/db_config.js'
import { User }         from '../src/modelos/user.model.js'
import { Vehicle }      from '../src/modelos/vehicle.model.js'

async function run() {
  await conectarBD()

  const vehicles = await Vehicle.find().lean()
  if (!vehicles.length) {
    console.log('No hay vehículos en la base de datos.')
    process.exit(0)
  }

  let creados = 0, omitidos = 0

  for (const v of vehicles) {
    const usuario  = v.matricula
    const password = v.matricula.toLowerCase()

    const existe = await User.exists({ usuario })
    if (existe) { omitidos++; continue }

    const password_hash = await bcrypt.hash(password, 10)
    await User.create({ usuario, password_hash, rol: 'conductor', vehiculo: v.matricula })
    console.log(`  ✓ ${usuario}  (contraseña inicial: ${password})`)
    creados++
  }

  console.log(`\nListo: ${creados} usuarios creados, ${omitidos} ya existían.`)
  console.log('Recordá cambiar las contraseñas desde el panel de administración.')
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
