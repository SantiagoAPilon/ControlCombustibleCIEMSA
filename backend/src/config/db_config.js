import mongoose from 'mongoose'
import bcrypt    from 'bcrypt'

export async function conectarBD() {
  if (mongoose.connection.readyState !== 0) return

  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB conectado ✓')

  await _seedIfEmpty()
}

async function _seedIfEmpty() {
  const { User }    = await import('../modelos/user.model.js')
  const { Vehicle } = await import('../modelos/vehicle.model.js')

  const userCount = await User.countDocuments()
  if (userCount === 0) {
    const seedUsers = [
      { usuario: process.env.ADMIN_USER || 'santiago', password: process.env.ADMIN_PASSWORD || 'santiago', rol: 'admin' },
      { usuario: 'ososa',    password: 'ososa',    rol: 'reportes' },
      { usuario: 'atechera', password: 'atechera', rol: 'reportes' },
    ]
    for (const u of seedUsers) {
      const password_hash = await bcrypt.hash(u.password, 10)
      await User.create({ usuario: u.usuario, password_hash, rol: u.rol })
    }
    console.log('Usuarios iniciales creados ✓')
  }

  const vehicleCount = await Vehicle.countDocuments()
  if (vehicleCount === 0) {
    const vehicles = [
      { matricula: 'SDE8297', conductor: 'Washington Bossi',        centro_costo: 'OM2204', modelo: 'Nissan Frontier Diesel' },
      { matricula: 'CBC4683', conductor: 'Marcelo Perrox',           centro_costo: 'OM2204', modelo: 'Chevrolet Onix' },
      { matricula: 'CBC4641', conductor: 'Marcos Pascual',           centro_costo: 'OM2204', modelo: 'Renault Oroch' },
      { matricula: 'CBC6561', conductor: 'Diego Garrone',            centro_costo: 'OM2204', modelo: 'Chevrolet Onix' },
      { matricula: 'SDE3683', conductor: 'Alfonso Moyano',           centro_costo: 'OM2204', modelo: 'Nissan New Versa' },
      { matricula: 'SDD7217', conductor: 'Javier Terra',             centro_costo: 'OM2404', modelo: 'JAC HFC1035' },
      { matricula: 'SDD7216', conductor: 'Richard Pereira',          centro_costo: 'OM2404', modelo: 'JAC HFC1035' },
      { matricula: 'CBC6787', conductor: 'Martin Silva',             centro_costo: 'OM2404', modelo: 'Renault Oroch' },
      { matricula: 'SDD7218', conductor: 'Jesus Rivera',             centro_costo: 'OM2404', modelo: 'JAC HFC1035' },
      { matricula: 'ABC7658', conductor: 'Jose Saus / Jesus Rivera', centro_costo: 'OM2404', modelo: 'Renault Oroch' },
      { matricula: 'CBC4624', conductor: 'Sergio Cesaro',            centro_costo: 'OM2404', modelo: 'Renault Oroch' },
      { matricula: 'CBC4640', conductor: 'Manuel Martinez',          centro_costo: 'OM2404', modelo: 'Renault Oroch' },
    ]
    await Vehicle.insertMany(vehicles)
    console.log('Vehículos iniciales creados ✓')

    // Crear un usuario conductor por cada vehículo (contraseña = matrícula en minúscula)
    for (const v of vehicles) {
      const existe = await User.exists({ usuario: v.matricula })
      if (existe) continue
      const password_hash = await bcrypt.hash(v.matricula.toLowerCase(), 10)
      await User.create({ usuario: v.matricula, password_hash, rol: 'conductor', vehiculo: v.matricula })
    }
    console.log('Usuarios conductores creados ✓')
  }
}

