const express = require('express');
const router  = express.Router();
const { getDb } = require('../db/database');

router.get('/', async (_req, res) => {
  try {
    const db   = await getDb();
    const rows = await db.all('SELECT * FROM vehicles ORDER BY centro_costo, matricula');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
