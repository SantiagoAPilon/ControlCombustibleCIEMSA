const express  = require('express');
const router   = express.Router();
const { getDb } = require('../db/database');

// GET /api/fuel?matricula=&mes=&anio=
router.get('/', async (req, res) => {
  const { matricula, mes, anio } = req.query;
  try {
    const db = await getDb();

    let sql    = `
      SELECT f.*, v.conductor, v.centro_costo, v.modelo
      FROM fuel_records f
      JOIN vehicles v ON f.matricula = v.matricula
      WHERE 1=1
    `;
    const params = [];

    if (matricula && matricula !== 'all') {
      sql += ' AND f.matricula = ?';
      params.push(matricula);
    }
    if (mes) {
      sql += " AND strftime('%m', f.fecha) = ?";
      params.push(String(mes).padStart(2, '0'));
    }
    if (anio) {
      sql += " AND strftime('%Y', f.fecha) = ?";
      params.push(String(anio));
    }

    sql += ' ORDER BY f.fecha DESC, f.id DESC';

    const rows = await db.all(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fuel
router.post('/', async (req, res) => {
  const { matricula, fecha, litros, km_actual, tipo_combustible, proveedor, costo_litro, costo_total } = req.body;

  if (!matricula || !fecha || litros == null || km_actual == null) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const db   = await getDb();
    const last = await db.get(
      'SELECT km_actual FROM fuel_records WHERE matricula = ? ORDER BY fecha DESC, id DESC LIMIT 1',
      [matricula]
    );

    const km_anterior   = last ? last.km_actual : null;
    const km_recorridos = km_anterior !== null ? km_actual - km_anterior : null;
    const consumo_km_l  = km_recorridos && km_recorridos > 0 && litros > 0
      ? parseFloat((km_recorridos / litros).toFixed(2))
      : null;

    const result = await db.run(
      `INSERT INTO fuel_records
         (matricula, fecha, litros, km_actual, km_anterior, km_recorridos, consumo_km_l,
          tipo_combustible, proveedor, costo_litro, costo_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula, fecha, litros, km_actual, km_anterior, km_recorridos, consumo_km_l,
        tipo_combustible || null, proveedor || null,
        costo_litro != null ? parseFloat(costo_litro) : null,
        costo_total  != null ? parseFloat(costo_total)  : null,
      ]
    );

    const record = await db.get(
      `SELECT f.*, v.conductor, v.centro_costo, v.modelo
       FROM fuel_records f
       JOIN vehicles v ON f.matricula = v.matricula
       WHERE f.id = ?`,
      [result.lastID]
    );

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/fuel/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM fuel_records WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
