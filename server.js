const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

// CORS - allow localhost dev and GitHub Pages placeholder (replace with your real URL)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://Future950.github.io'
  ],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

// Initialize DB
const DB_PATH = path.join(__dirname, 'payments.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error(err);
  else console.log('Connected to SQLite database at', DB_PATH);
});

// Create tables if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    start_date TEXT,
    total_fee REAL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    date TEXT,
    amount REAL,
    method TEXT,
    notes TEXT,
    FOREIGN KEY(patient_id) REFERENCES patients(id)
  )`);
});

// Routes
app.get('/patients', (req, res) => {
  db.all(`SELECT * FROM patients ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/patients', (req, res) => {
  const { name, contact, start_date, total_fee } = req.body;
  db.run(`INSERT INTO patients (name, contact, start_date, total_fee) VALUES (?, ?, ?, ?)`,
    [name, contact, start_date, total_fee],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

app.get('/patients/:id/payments', (req, res) => {
  db.all(`SELECT * FROM payments WHERE patient_id = ? ORDER BY id ASC`, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/patients/:id/payments', (req, res) => {
  const { date, amount, method, notes } = req.body;
  db.run(`INSERT INTO payments (patient_id, date, amount, method, notes) VALUES (?, ?, ?, ?, ?)`,
    [req.params.id, date, amount, method, notes],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
});

// simple healthcheck
app.get('/_health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://Future950.github.io'
  ],
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));
