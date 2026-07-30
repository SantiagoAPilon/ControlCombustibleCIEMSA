// node scripts/create_user.js <usuario> <password> <rol> [vehiculo]  (desde backend/, con tu .env real)
// Crea un usuario nuevo directamente en la base de datos.
// rol: admin | conductor | reportes  (conductor requiere <vehiculo> = matrícula existente)
import 'dotenv/config'
import bcrypt         from 'bcrypt'
import { conectarBD } from '../src/config/db_config.js'
import { User }       from '../src/modelos/user.model.js'

const ROLES = ['admin', 'conductor', 'reportes']

async function run() {
  const [usuario, password, rol, vehiculo] = process.argv.slice(2)

  if (!usuario || !password || !rol) {
    console.log('Uso: node scripts/create_user.js <usuario> <password> <rol> [vehiculo]')
    console.log(`rol debe ser uno de: ${ROLES.join(', ')}`)
    process.exit(1)
  }
  if (!ROLES.includes(rol)) {
    console.log(`Rol inválido "${rol}". Debe ser uno de: ${ROLES.join(', ')}`)
    process.exit(1)
  }
  if (password.length < 4) {
    console.log('La contraseña debe tener al menos 4 caracteres.')
    process.exit(1)
  }
  if (rol === 'conductor' && !vehiculo) {
    console.log('El rol conductor necesita una matrícula: node scripts/create_user.js <usuario> <password> conductor <matricula>')
    process.exit(1)
  }

  await conectarBD()

  const existe = await User.findOne({ usuario: { $regex: `^${usuario}$`, $options: 'i' } })
  if (existe) {
    console.log(`Ya existe un usuario "${existe.usuario}" (rol: ${existe.rol}). Usá reset_password.js si querés cambiarle la contraseña.`)
    process.exit(1)
  }

  const password_hash = await bcrypt.hash(password, 10)
  const user = await User.create({
    usuario,
    password_hash,
    rol,
    vehiculo: rol === 'conductor' ? vehiculo.toUpperCase().trim() : null,
  })

  console.log(`✓ Usuario "${user.usuario}" creado con rol "${user.rol}"${user.vehiculo ? ` (vehículo: ${user.vehiculo})` : ''}.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
