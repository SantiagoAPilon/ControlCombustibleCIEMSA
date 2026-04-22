// Script de migración: SQLite → MongoDB
// Ejecutar UNA sola vez: node migrate.js

import 'dotenv/config'
import { open }      from 'sqlite'
import sqlite3       from 'sqlite3'
import mongoose      from 'mongoose'
import path          from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Schemas mínimos para la migración ───────────────────────────
const User = mongoose.model('User', new mongoose.Schema({
  usuario:       String,
  password_hash: String,
  rol:           String,
}))

const Vehicle = mongoose.model('Vehicle', new mongoose.Schema({
  matricula:    String,
  conductor:    String,
  centro_costo: String,
  modelo:       String,
}))

const FuelRecord = mongoose.model('FuelRecord', new mongoose.Schema({
  matricula:        String,
  fecha:            String,
  litros:           Number,
  km_actual:        Number,
  tipo_combustible: String,
  proveedor:        String,
  costo_litro:      Number,
  costo_total:      Number,
}))

async function migrate() {
  // Conectar SQLite
  const sqlite = await open({
    filename: path.join(__dirname, 'data', 'combustible.db'),
    driver:   sqlite3.Database,
  })
  console.log('SQLite abierto ✓')

  // Conectar MongoDB
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB conectado ✓')

  // ── Usuarios ────────────────────────────────────────────────────
  const sqlUsers = await sqlite.all('SELECT * FROM users')
  if (sqlUsers.length > 0) {
    await User.deleteMany({})
    await User.insertMany(sqlUsers.map(u => ({
      usuario:       u.usuario,
      password_hash: u.password_hash,
      rol:           u.rol,
    })))
    console.log(`Usuarios migrados: ${sqlUsers.length}`)
  } else {
    console.log('Sin usuarios en SQLite, se omite.')
  }

  // ── Vehículos ───────────────────────────────────────────────────
  const sqlVehicles = await sqlite.all('SELECT * FROM vehicles')
  if (sqlVehicles.length > 0) {
    await Vehicle.deleteMany({})
    await Vehicle.insertMany(sqlVehicles.map(v => ({
      matricula:    v.matricula,
      conductor:    v.conductor,
      centro_costo: v.centro_costo,
      modelo:       v.modelo,
    })))
    console.log(`Vehículos migrados: ${sqlVehicles.length}`)
  }

  // ── Registros de combustible ────────────────────────────────────
  const sqlFuel = await sqlite.all('SELECT * FROM fuel_records ORDER BY fecha ASC, id ASC')
  if (sqlFuel.length > 0) {
    await FuelRecord.deleteMany({})
    await FuelRecord.insertMany(sqlFuel.map(r => ({
      matricula:        r.matricula,
      fecha:            r.fecha,
      litros:           r.litros,
      km_actual:        r.km_actual  ?? null,
      tipo_combustible: r.tipo_combustible || null,
      proveedor:        r.proveedor        || null,
      costo_litro:      r.costo_litro != null ? parseFloat(r.costo_litro) : null,
      costo_total:      r.costo_total  != null ? parseFloat(r.costo_total)  : null,
    })))
    console.log(`Registros de combustible migrados: ${sqlFuel.length}`)
  }

  await sqlite.close()
  await mongoose.disconnect()
  console.log('\nMigración completada ✓')
}

migrate().catch(err => {
  console.error('Error en migración:', err.message)
  process.exit(1)
})
