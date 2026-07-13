require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const mysql   = require('mysql2/promise');
const path    = require('path');

const app  = express();

// ── Environment-driven config ───────────────────────────────
// Locally (XAMPP/dev): falls back to sensible defaults if .env is missing.
// On WebHostMost / Render / Railway: set these in the hosting panel's
// environment variables section — no code changes needed to deploy.
const PORT      = process.env.PORT || 3000;
const HOST      = process.env.HOST || '127.0.0.1'; // WebHostMost requires 127.0.0.1, not 0.0.0.0

const DB_HOST     = process.env.DB_HOST || 'localhost';
const DB_USER     = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME     = process.env.DB_NAME || 'vigenere_db';
const DB_PORT     = process.env.DB_PORT || 3306;
const DB_SSL      = process.env.DB_SSL === 'true'; // set DB_SSL=true if your host requires SSL (e.g. TiDB Cloud)

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MySQL Connection Pool ───────────────────────────────────
const poolConfig = {
  host:     DB_HOST,
  user:     DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port:     DB_PORT,
  waitForConnections: true,
  connectionLimit:    10,
};
if (DB_SSL) {
  poolConfig.ssl = { rejectUnauthorized: true };
}
const pool = mysql.createPool(poolConfig);

// ── Vigenère Cipher Logic (a–z, index 0–25) ────────────────
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA_LEN = ALPHABET.length; // 26

function sanitizeKey(key) {
  return key.toLowerCase().replace(/[^a-z]/g, '');
}

function vigenereEncrypt(plaintext, key) {
  const cleanKey = sanitizeKey(key);
  if (!cleanKey) throw new Error('Key must contain at least one letter a–z.');

  let result = '';
  let keyIndex = 0;

  for (const char of plaintext) {
    const lower = char.toLowerCase();
    const pos   = ALPHABET.indexOf(lower);

    if (pos === -1) {
      // Non-alpha character: pass through unchanged
      result += char;
    } else {
      const keyShift    = ALPHABET.indexOf(cleanKey[keyIndex % cleanKey.length]);
      const encryptedPos = (pos + keyShift) % ALPHA_LEN;
      const encryptedChar = ALPHABET[encryptedPos];
      // Preserve original case
      result    += char === char.toUpperCase() ? encryptedChar.toUpperCase() : encryptedChar;
      keyIndex++;
    }
  }
  return result;
}

function vigenereDecrypt(ciphertext, key) {
  const cleanKey = sanitizeKey(key);
  if (!cleanKey) throw new Error('Key must contain at least one letter a–z.');

  let result   = '';
  let keyIndex = 0;

  for (const char of ciphertext) {
    const lower = char.toLowerCase();
    const pos   = ALPHABET.indexOf(lower);

    if (pos === -1) {
      result += char;
    } else {
      const keyShift     = ALPHABET.indexOf(cleanKey[keyIndex % cleanKey.length]);
      const decryptedPos = (pos - keyShift + ALPHA_LEN) % ALPHA_LEN;
      const decryptedChar = ALPHABET[decryptedPos];
      result    += char === char.toUpperCase() ? decryptedChar.toUpperCase() : decryptedChar;
      keyIndex++;
    }
  }
  return result;
}

// ── Routes ──────────────────────────────────────────────────

// POST /api/encrypt
app.post('/api/encrypt', async (req, res) => {
  const { text, key } = req.body;

  if (!text || !key) {
    return res.status(400).json({ error: 'Both "text" and "key" are required.' });
  }

  try {
    const output = vigenereEncrypt(text, key);

    await pool.execute(
      'INSERT INTO cipher_history (mode, input_text, cipher_key, output_text) VALUES (?, ?, ?, ?)',
      ['encrypt', text, key, output]
    );

    res.json({ result: output, mode: 'encrypt' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/decrypt
app.post('/api/decrypt', async (req, res) => {
  const { text, key } = req.body;

  if (!text || !key) {
    return res.status(400).json({ error: 'Both "text" and "key" are required.' });
  }

  try {
    const output = vigenereDecrypt(text, key);

    await pool.execute(
      'INSERT INTO cipher_history (mode, input_text, cipher_key, output_text) VALUES (?, ?, ?, ?)',
      ['decrypt', text, key, output]
    );

    res.json({ result: output, mode: 'decrypt' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history  – last 20 records
app.get('/api/history', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cipher_history ORDER BY created_at DESC LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/history/:id
app.delete('/api/history/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM cipher_history WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, HOST, async () => {
  try {
    await pool.getConnection();
    console.log(`✅  MySQL connected — ${DB_NAME}`);
  } catch (err) {
    console.warn('⚠️   MySQL not connected. Check your environment variables.');
    console.warn('   ', err.message);
  }
  console.log(`🚀  Server running → http://${HOST}:${PORT}`);
});
