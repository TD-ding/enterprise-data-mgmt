const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(auth('admin'));

// Dashboard statistics
router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const activeUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get().count;
  const dataCount = db.prepare('SELECT COUNT(*) AS count FROM business_data').get().count;
  const pendingCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'pending'").get().count;
  const approvedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'approved'").get().count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM business_data').get().total;

  res.json({ userCount, activeUsers, dataCount, pendingCount, approvedCount, totalAmount });
});

// Batch update data status
router.put('/data/batch-status', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length || !status) {
    return res.status(400).json({ error: '参数错误' });
  }

  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE business_data SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`).run(status, ...ids);
  res.json({ message: '状态更新成功' });
});

// Get all categories
router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM business_data WHERE category != "" ORDER BY category').all();
  res.json(rows.map(r => r.category));
});

module.exports = router;
