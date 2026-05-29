const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// User stats (for non-admin dashboard)
router.get('/my-stats', auth(), (req, res) => {
  const userId = req.user.id;
  const totalCount = db.prepare('SELECT COUNT(*) AS count FROM business_data WHERE created_by = ?').get(userId).count;
  const pendingCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE created_by = ? AND status = 'pending'").get(userId).count;
  const approvedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE created_by = ? AND status = 'approved'").get(userId).count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM business_data WHERE created_by = ?').get(userId).total;

  res.json({ totalCount, pendingCount, approvedCount, totalAmount });
});

// List business data
router.get('/', auth(), (req, res) => {
  const { search = '', category = '', status = '', page = 1, pageSize = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const conditions = [];
  const params = [];

  if (search) { conditions.push('(b.title LIKE ? OR b.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (category) { conditions.push('b.category = ?'); params.push(category); }
  if (status) { conditions.push('b.status = ?'); params.push(status); }

  // Non-admin users can only see their own data
  if (req.user.role !== 'admin') {
    conditions.push('b.created_by = ?');
    params.push(req.user.id);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS count FROM business_data b ${where}`).get(...params).count;
  const rows = db.prepare(`
    SELECT b.*, u.name AS creator_name
    FROM business_data b
    LEFT JOIN users u ON b.created_by = u.id
    ${where}
    ORDER BY b.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(pageSize), offset);

  res.json({ total, page: Number(page), pageSize: Number(pageSize), data: rows });
});

// Get single record
router.get('/:id', auth(), (req, res) => {
  const row = db.prepare(`
    SELECT b.*, u.name AS creator_name
    FROM business_data b
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: '数据不存在' });
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }
  res.json(row);
});

// Create business data
router.post('/', auth(), (req, res) => {
  const { title, category = '', amount = 0, status = 'pending', description = '' } = req.body;
  if (!title) return res.status(400).json({ error: '标题不能为空' });

  const result = db.prepare(
    'INSERT INTO business_data (title, category, amount, status, description, created_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, category, amount, status, description, req.user.id);

  res.json({ id: result.lastInsertRowid, title, category, amount, status, description, created_by: req.user.id });
});

// Update business data
router.put('/:id', auth(), (req, res) => {
  const row = db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '数据不存在' });
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }

  const { title, category, amount, status, description } = req.body;
  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (category !== undefined) { updates.push('category = ?'); values.push(category); }
  if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  updates.push('updated_at = datetime("now")');
  values.push(req.params.id);

  db.prepare(`UPDATE business_data SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id));
});

// Delete business data
router.delete('/:id', auth(), (req, res) => {
  const row = db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '数据不存在' });
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) {
    return res.status(403).json({ error: '权限不足' });
  }
  db.prepare('DELETE FROM business_data WHERE id = ?').run(req.params.id);
  res.json({ message: '数据已删除' });
});

module.exports = router;
