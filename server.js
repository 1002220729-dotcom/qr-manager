const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || './qr.db';

// ── Database setup ──────────────────────────────────────────────────────────
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    code      TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    dest      TEXT NOT NULL,
    active    INTEGER NOT NULL DEFAULT 1,
    created   INTEGER NOT NULL,
    updated   INTEGER NOT NULL,
    hits      INTEGER NOT NULL DEFAULT 0
  )
`);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Redirect endpoint ────────────────────────────────────────────────────────
app.get('/r/:code', (req, res) => {
  const row = db.prepare('SELECT * FROM links WHERE code = ?').get(req.params.code);

  if (!row) {
    return res.status(404).send('קישור לא נמצא');
  }
  if (!row.active) {
    return res.status(410).send('קישור זה אינו פעיל');
  }

  db.prepare('UPDATE links SET hits = hits + 1 WHERE code = ?').run(row.code);
  res.redirect(302, row.dest);
});

// ── API ───────────────────────────────────────────────────────────────────────
app.get('/api/links', (req, res) => {
  const rows = db.prepare('SELECT * FROM links ORDER BY created DESC').all();
  res.json(rows.map(r => ({ ...r, active: !!r.active })));
});

app.post('/api/links', (req, res) => {
  const { name, dest, active = true } = req.body;
  if (!name || !dest) {
    return res.status(400).json({ error: 'name and dest are required' });
  }

  const code = crypto.randomBytes(3).toString('hex');
  const now = Date.now();

  db.prepare(
    'INSERT INTO links (code, name, dest, active, created, updated) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(code, name.trim(), dest.trim(), active ? 1 : 0, now, now);

  res.status(201).json(db.prepare('SELECT * FROM links WHERE code = ?').get(code));
});

app.put('/api/links/:code', (req, res) => {
  const { name, dest, active } = req.body;
  const row = db.prepare('SELECT * FROM links WHERE code = ?').get(req.params.code);
  if (!row) return res.status(404).json({ error: 'not found' });

  const updated = {
    name:   name   !== undefined ? name.trim()   : row.name,
    dest:   dest   !== undefined ? dest.trim()   : row.dest,
    active: active !== undefined ? (active ? 1 : 0) : row.active,
  };

  db.prepare(
    'UPDATE links SET name = ?, dest = ?, active = ?, updated = ? WHERE code = ?'
  ).run(updated.name, updated.dest, updated.active, Date.now(), row.code);

  const saved = db.prepare('SELECT * FROM links WHERE code = ?').get(row.code);
  res.json({ ...saved, active: !!saved.active });
});

app.delete('/api/links/:code', (req, res) => {
  const info = db.prepare('DELETE FROM links WHERE code = ?').run(req.params.code);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`QR Manager running → http://localhost:${PORT}`);
});
