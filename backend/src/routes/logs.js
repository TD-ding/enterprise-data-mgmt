const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth('admin'), (req, res) => {
  const { page = 1, pageSize = 20, action, username } = req.query;
  const conditions = [];
  const params = [];

  if (action) { conditions.push('action LIKE ?'); params.push(`%${action}%`); }
  if (username) { conditions.push('username LIKE ?'); params.push(`%${username}%`); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) AS total FROM operation_logs ${where}`).get(...params).total;
  const offset = (Number(page) - 1) * Number(pageSize);
  const rows = db.prepare(`SELECT * FROM operation_logs ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);

  res.json({ success: true, total, page: Number(page), pageSize: Number(pageSize), data: rows });
});

module.exports = router;
