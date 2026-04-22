import { open }         from 'sqlite'
import sqlite3           from 'sqlite3'
import bcrypt            from 'bcrypt'
import path              from 'path'
import fs                from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir   = path.join(__dirname, '..', '..', 'data')

let _db

export async function conectarBD() {
  if (_db) return _db

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  _db = await open({
    filename: path.join(dataDir, 'combustible.db'),
    driver:   sqlite3.Database,
  })

  await _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario       TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol           TEXT NOT NULL DEFAULT 'usuario'
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula     TEXT UNIQUE NOT NULL,
      conductor     TEXT,
      centro_costo  TEXT,
      modelo        TEXT
    );
    CREATE TABLE IF NOT EXISTS fuel_records (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula        TEXT    NOT NULL,
      fecha            TEXT    NOT NULL,
      litros           REAL    NOT NULL,
      km_actual        INTEGER,
      km_anterior      INTEGER,
      km_recorridos    INTEGER,
      consumo_km_l     REAL,
      tipo_combustible TEXT,
      proveedor        TEXT,
      costo_litro      REAL,
      costo_total      REAL,
      FOREIGN KEY (matricula) REFERENCES vehicles(matricula)
    );
  `)

  // Migración: si km_actual tiene NOT NULL, recrear sin esa restricción
  const cols = await _db.all("PRAGMA table_info(fuel_records)")
  const kmCol = cols.find(c => c.name === 'km_actual')
  if (kmCol && kmCol.notnull === 1) {
    await _db.exec(`
      BEGIN TRANSACTION;
      ALTER TABLE fuel_records RENAME TO _fr_old;
      CREATE TABLE fuel_records (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        matricula        TEXT    NOT NULL,
        fecha            TEXT    NOT NULL,
        litros           REAL    NOT NULL,
        km_actual        INTEGER,
        km_anterior      INTEGER,
        km_recorridos    INTEGER,
        consumo_km_l     REAL,
        tipo_combustible TEXT,
        proveedor        TEXT,
        costo_litro      REAL,
        costo_total      REAL,
        FOREIGN KEY (matricula) REFERENCES vehicles(matricula)
      );
      INSERT INTO fuel_records SELECT * FROM _fr_old;
      DROP TABLE _fr_old;
      COMMIT;
    `)
    console.log('Migración BD: km_actual ahora permite NULL ✓')
  }

  const { c } = await _db.get('SELECT COUNT(*) AS c FROM vehicles')
  if (c === 0) {
    const seed = [
      ['SDE8297', 'Washington Bossi',        'OM2204', 'Nissan Frontier Diesel'],
      ['CBC4683', 'Marcelo Perrox',           'OM2204', 'Chevrolet Onix'],
      ['CBC4641', 'Marcos Pascual',           'OM2204', 'Renault Oroch'],
      ['CBC6561', 'Diego Garrone',            'OM2204', 'Chevrolet Onix'],
      ['SDE3683', 'Alfonso Moyano',           'OM2204', 'Nissan New Versa'],
      ['SDD7217', 'Javier Terra',             'OM2404', 'JAC HFC1035'],
      ['SDD7216', 'Richard Pereira',          'OM2404', 'JAC HFC1035'],
      ['CBC6787', 'Martin Silva',             'OM2404', 'Renault Oroch'],
      ['SDD7218', 'Jesus Rivera',             'OM2404', 'JAC HFC1035'],
      ['ABC7658', 'Jose Saus / Jesus Rivera', 'OM2404', 'Renault Oroch'],
      ['CBC4624', 'Sergio Cesaro',            'OM2404', 'Renault Oroch'],
      ['CBC4640', 'Manuel Martinez',          'OM2404', 'Renault Oroch'],
    ]
    for (const row of seed) {
      await _db.run(
        'INSERT OR IGNORE INTO vehicles (matricula, conductor, centro_costo, modelo) VALUES (?, ?, ?, ?)',
        row
      )
    }
  }

  // Seed de usuarios por defecto si la tabla está vacía
  const { uc } = await _db.get('SELECT COUNT(*) AS uc FROM users')
  if (uc === 0) {
    const seedUsers = [
      { usuario: process.env.ADMIN_USER || 'santiago', password: process.env.ADMIN_PASSWORD || 'santiago', rol: 'admin' },
      { usuario: 'ososa',    password: 'ososa',    rol: 'usuario' },
      { usuario: 'atechera', password: 'atechera', rol: 'usuario' },
    ]
    for (const u of seedUsers) {
      const hash = await bcrypt.hash(u.password, 10)
      await _db.run(
        'INSERT OR IGNORE INTO users (usuario, password_hash, rol) VALUES (?, ?, ?)',
        [u.usuario, hash, u.rol]
      )
    }
    console.log('Usuarios iniciales creados ✓')
  }

  console.log('SQLite conectado ✓')
  return _db
}

export async function getDb() {
  return _db || conectarBD()
}
