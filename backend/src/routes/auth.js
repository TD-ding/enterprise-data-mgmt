const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = "active"').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
  });
});

// Get current user profile
router.get('/profile', auth(), (req, res) => {
  const user = db.prepare('SELECT id, username, role, name, email, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

// ---- User CRUD ----

// List users (admin only)
router.get('/users', auth('admin'), (req, res) => {
  const { search = '', page = 1, pageSize = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = '';
  const params = [];
  if (search) {
    where = 'WHERE username LIKE ? OR name LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT id, username, role, name, email, status, created_at, updated_at FROM users ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);

  res.json({ total, page: Number(page), pageSize: Number(pageSize), data: rows });
});

// Create user (admin only)
router.post('/users', auth('admin'), (req, res) => {
  const { username, password, role = 'user', name = '', email = '' } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '用户名已存在' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)').run(username, hash, role, name, email);
  res.json({ id: result.lastInsertRowid, username, role, name, email });
});

// Update user (admin only)
router.put('/users/:id', auth('admin'), (req, res) => {
  const { name, email, role, status, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const updates = [];
  const values = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }
  if (role !== undefined) { updates.push('role = ?'); values.push(role); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (password) { updates.push('password = ?'); values.push(bcrypt.hashSync(password, 10)); }
  updates.push('updated_at = datetime("now")');
  values.push(req.params.id);

  if (updates.length <= 1) return res.json(user);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  res.json(db.prepare('SELECT id, username, role, name, email, status, updated_at FROM users WHERE id = ?').get(req.params.id));
});

// Delete user (admin only)
router.delete('/users/:id', auth('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.role === 'admin' && user.username === 'admin') return res.status(403).json({ error: '不能删除默认管理员' });
  db.prepare('DELETE FROM business_data WHERE created_by = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '用户已删除' });
});

module.exports = router;