const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const logAction = require('../logAction');
const { success, error } = require('../utils');

const BATCH_LIMIT = 100;

const router = express.Router();

router.use(auth('admin'));

router.get('/stats', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const activeUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'active'").get().count;
  const dataCount = db.prepare('SELECT COUNT(*) AS count FROM business_data').get().count;
  const pendingCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'pending'").get().count;
  const approvedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'approved'").get().count;
  const completedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'completed'").get().count;
  const rejectedCount = db.prepare("SELECT COUNT(*) AS count FROM business_data WHERE status = 'rejected'").get().count;
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM business_data').get().total;
  success(res, { userCount, activeUsers, dataCount, pendingCount, approvedCount, completedCount, rejectedCount, totalAmount });
});

router.put('/data/batch-status', (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length || !status) return error(res, '参数错误', 400);
  if (ids.length > BATCH_LIMIT) return error(res, `单次最多操作 ${BATCH_LIMIT} 条记录`, 400);

  const validStatuses = ['pending', 'approved', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) return error(res, '无效的状态值', 400);

  const placeholders = ids.map(() => '?').join(',');
  db.prepare(`UPDATE business_data SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`).run(status, ...ids);

  const statusLabel = { pending: '待处理', approved: '已审批', completed: '已完成', rejected: '已驳回' }[status] || status;
  logAction(req.user.id, req.user.username, '批量更新状态', 'business_data', 0, `将 ${ids.length} 条数据状态改为「${statusLabel}」, ID: [${ids.join(',')}]`);

  success(res, { message: '状态更新成功', count: ids.length });
});

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM business_data WHERE category != "" ORDER BY category').all();
  success(res, rows.map(r => r.category));
});

module.exports = router;
