const { open } = require('sqlite');
const sqlite3  = require('sqlite3');
const path     = require('path');
const fs       = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let _db;

async function getDb() {
  if (_db) return _db;

  _db = await open({
    filename: path.join(dataDir, 'combustible.db'),
    driver:   sqlite3.Database,
  });

  await _db.exec(`
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
      km_actual        INTEGER NOT NULL,
      km_anterior      INTEGER,
      km_recorridos    INTEGER,
      consumo_km_l     REAL,
      tipo_combustible TEXT,
      proveedor        TEXT,
      costo_litro      REAL,
      costo_total      REAL,
      FOREIGN KEY (matricula) REFERENCES vehicles(matricula)
    );
  `);

  const { c } = await _db.get('SELECT COUNT(*) AS c FROM vehicles');
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
    ];
    for (const row of seed) {
      await _db.run(
        'INSERT OR IGNORE INTO vehicles (matricula, conductor, centro_costo, modelo) VALUES (?, ?, ?, ?)',
        row
      );
    }
  }

  return _db;
}

module.exports = { getDb };
