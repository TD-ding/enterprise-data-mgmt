const db = require('./db');

function logAction(userId, username, action, targetType = '', targetId = 0, detail = '') {
  db.prepare(
    'INSERT INTO operation_logs (user_id, username, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, username, action, targetType, targetId, detail);
}

module.exports = logAction;
