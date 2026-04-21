const express  = require('express');
const cors     = require('cors');
const { getDb } = require('./db/database');

const app  = express();
const PORT = 8001;

app.use(cors({ origin: 'http://localhost:8000' }));
app.use(express.json());

app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/fuel',     require('./routes/fuel'));

getDb()
  .then(() => app.listen(PORT, () => console.log(`Backend CIEMSA → http://localhost:${PORT}`)))
  .catch(err => { console.error('Error iniciando DB:', err); process.exit(1); });
