// node scripts/reset_password.js <usuario> <nueva_password>  (desde backend/, con tu .env real)
// Resetea la contraseña de un usuario existente directamente en la base de datos.
// Útil cuando se perdió el acceso al panel y no hay otro admin disponible.
import 'dotenv/config'
import bcrypt         from 'bcrypt'
import { conectarBD } from '../src/config/db_config.js'
import { User }       from '../src/modelos/user.model.js'

async function run() {
  const [usuario, nuevaPassword] = process.argv.slice(2)

  if (!usuario || !nuevaPassword) {
    console.log('Uso: node scripts/reset_password.js <usuario> <nueva_password>')
    process.exit(1)
  }
  if (nuevaPassword.length < 4) {
    console.log('La contraseña debe tener al menos 4 caracteres.')
    process.exit(1)
  }

  await conectarBD()

  const user = await User.findOne({ usuario: { $regex: `^${usuario}$`, $options: 'i' } })
  if (!user) {
    console.log(`No existe ningún usuario "${usuario}".`)
    process.exit(1)
  }

  user.password_hash = await bcrypt.hash(nuevaPassword, 10)
  await user.save()

  console.log(`✓ Contraseña de "${user.usuario}" (rol: ${user.rol}) actualizada correctamente.`)
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
