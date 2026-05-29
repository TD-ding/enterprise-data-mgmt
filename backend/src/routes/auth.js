const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');
const { success, error, paginate, buildUpdate } = require('../utils');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return error(res, '用户名和密码不能为空', 400);

  const user = db.prepare('SELECT * FROM users WHERE username = ? AND status = "active"').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return error(res, '用户名或密码错误', 401);
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  success(res, {
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email }
  });
});

router.get('/profile', auth(), (req, res) => {
  const user = db.prepare('SELECT id, username, role, name, email, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return error(res, '用户不存在', 404);
  success(res, user);
});

router.put('/profile', auth(), (req, res) => {
  const { name, email, oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return error(res, '用户不存在', 404);

  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (email !== undefined) { updates.push('email = ?'); values.push(email); }

  if (newPassword) {
    if (!oldPassword) return error(res, '修改密码需提供旧密码', 400);
    if (!bcrypt.compareSync(oldPassword, user.password)) return error(res, '旧密码不正确', 401);
    updates.push('password = ?');
    values.push(bcrypt.hashSync(newPassword, 10));
  }

  if (!updates.length) return success(res, user);

  updates.push('updated_at = datetime("now")');
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  success(res, db.prepare('SELECT id, username, role, name, email, status, updated_at FROM users WHERE id = ?').get(req.user.id));
});

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

  paginate(res, { total, page, pageSize, data: rows });
});

router.post('/users', auth('admin'), (req, res) => {
  const { username, password, role = 'user', name = '', email = '' } = req.body;
  if (!username || !password) return error(res, '用户名和密码不能为空', 400);

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return error(res, '用户名已存在', 409);

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password, role, name, email) VALUES (?, ?, ?, ?, ?)').run(username, hash, role, name, email);
  success(res, { id: result.lastInsertRowid, username, role, name, email }, 201);
});

router.put('/users/:id', auth('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return error(res, '用户不存在', 404);

  const { updates, values } = buildUpdate(
    { name: 'name', email: 'email', role: 'role', status: 'status' },
    req.body
  );

  if (req.body.password) {
    updates.push('password = ?');
    values.push(bcrypt.hashSync(req.body.password, 10));
  }

  if (!updates.length) return success(res, user);

  updates.push('updated_at = datetime("now")');
  values.push(req.params.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  success(res, db.prepare('SELECT id, username, role, name, email, status, updated_at FROM users WHERE id = ?').get(req.params.id));
});

router.delete('/users/:id', auth('admin'), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return error(res, '用户不存在', 404);
  if (user.role === 'admin' && user.username === 'admin') return error(res, '不能删除默认管理员', 403);
  db.prepare('DELETE FROM business_data WHERE created_by = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  success(res, { message: '用户已删除' });
});

module.exports = router;
