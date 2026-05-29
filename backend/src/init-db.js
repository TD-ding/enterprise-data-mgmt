const db = require('./db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS business_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT NOT NULL DEFAULT '',
    reject_reason TEXT NOT NULL DEFAULT '',
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER DEFAULT 0,
    detail TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_logs_user ON operation_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_logs_action ON operation_logs(action);
  CREATE INDEX IF NOT EXISTS idx_logs_created ON operation_logs(created_at);
`);

const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password, role, name, email)
    VALUES (?, ?, 'admin', 'System Admin', 'admin@enterprise.com')
  `).run('admin', hash);
  console.log('Default admin user created: admin / admin123');
}

const colCheck = db.prepare("PRAGMA table_info(business_data)").all();
if (!colCheck.find(c => c.name === 'reject_reason')) {
  db.exec("ALTER TABLE business_data ADD COLUMN reject_reason TEXT NOT NULL DEFAULT ''");
  console.log('Migration: added reject_reason column');
}

console.log('Database initialized successfully.');
