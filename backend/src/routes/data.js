const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { success, error, paginate, buildUpdate } = require('../utils');

const router = express.Router();

router.get('/my-stats', auth(), (req, res) => {
  const userId = req.user.id;
  const totalCount = db.prepare('SELECT COUNT(*) AS count FROM business_data WHERE created_by = ?').get(userId).count;
  const pendingCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE created_by = ? AND status = 'pending'").get(userId).count;
  const approvedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE created_by = ? AND status = 'approved'").get(userId).count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM business_data WHERE created_by = ?').get(userId).total;
  success(res, { totalCount, pendingCount, approvedCount, totalAmount });
});

router.get('/', auth(), (req, res) => {
  const { search = '', category = '', status = '', page = 1, pageSize = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const conditions = [];
  const params = [];

  if (search) { conditions.push('(b.title LIKE ? OR b.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (category) { conditions.push('b.category = ?'); params.push(category); }
  if (status) { conditions.push('b.status = ?'); params.push(status); }
  if (req.user.role !== 'admin') { conditions.push('b.created_by = ?'); params.push(req.user.id); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) AS count FROM business_data b ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT b.*, u.name AS creator_name FROM business_data b LEFT JOIN users u ON b.created_by = u.id ${where} ORDER BY b.id DESC LIMIT ? OFFSET ?`).all(...params, Number(pageSize), offset);

  paginate(res, { total, page, pageSize, data: rows });
});

router.get('/:id', auth(), (req, res) => {
  const row = db.prepare(`SELECT b.*, u.name AS creator_name FROM business_data b LEFT JOIN users u ON b.created_by = u.id WHERE b.id = ?`).get(req.params.id);
  if (!row) return error(res, '数据不存在', 404);
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) return error(res, '权限不足', 403);
  success(res, row);
});

router.post('/', auth(), (req, res) => {
  const { title, category = '', amount = 0, status = 'pending', description = '' } = req.body;
  if (!title) return error(res, '标题不能为空', 400);
  const result = db.prepare('INSERT INTO business_data (title, category, amount, status, description, created_by) VALUES (?, ?, ?, ?, ?, ?)').run(title, category, amount, status, description, req.user.id);
  success(res, { id: result.lastInsertRowid, title, category, amount, status, description, created_by: req.user.id }, 201);
});

router.put('/:id', auth(), (req, res) => {
  const row = db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id);
  if (!row) return error(res, '数据不存在', 404);
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) return error(res, '权限不足', 403);

  const { updates, values } = buildUpdate(
    { title: 'title', category: 'category', amount: 'amount', status: 'status', description: 'description' },
    req.body
  );

  if (!updates.length) return success(res, row);

  updates.push('updated_at = datetime("now")');
  values.push(req.params.id);
  db.prepare(`UPDATE business_data SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  success(res, db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id));
});

router.delete('/:id', auth(), (req, res) => {
  const row = db.prepare('SELECT * FROM business_data WHERE id = ?').get(req.params.id);
  if (!row) return error(res, '数据不存在', 404);
  if (req.user.role !== 'admin' && row.created_by !== req.user.id) return error(res, '权限不足', 403);
  db.prepare('DELETE FROM business_data WHERE id = ?').run(req.params.id);
  success(res, { message: '数据已删除' });
});

module.exports = router;
