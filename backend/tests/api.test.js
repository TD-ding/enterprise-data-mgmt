const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Use a temp DB for tests
const TEST_DB_DIR = path.join(__dirname, '..', 'data_test');
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test.db');

// Set env before requiring app
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DB_PATH = TEST_DB_PATH;
process.env.PORT = '0'; // random port

// Ensure test DB directory exists
if (!fs.existsSync(TEST_DB_DIR)) {
  fs.mkdirSync(TEST_DB_DIR, { recursive: true });
}

const db = require('../src/db');
require('../src/init-db');
const app = require('../src/app');

// Helper: get a valid JWT token
function getToken(username = 'admin') {
  const jwt = require('jsonwebtoken');
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

// Clean up after all tests
afterAll(() => {
  db.close();
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
  if (fs.existsSync(TEST_DB_DIR)) fs.rmSync(TEST_DB_DIR, { recursive: true });
});

// ─── Auth Routes ────────────────────────────────────────

describe('Auth', () => {
  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('admin');
  });

  test('POST /api/auth/login - wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: '' });
    expect(res.status).toBe(400);
  });

  test('GET /api/auth/profile - with token', async () => {
    const token = getToken();
    const res = await request(app)
      .get('/api/auth/profile')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('admin');
  });

  test('GET /api/auth/profile - no token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });
});

// ─── Data Routes ────────────────────────────────────────

describe('Data CRUD', () => {
  let token;

  beforeAll(() => {
    token = getToken();
  });

  test('POST /api/data - create', async () => {
    const res = await request(app)
      .post('/api/data')
      .set(authHeader(token))
      .send({ title: 'Test Data', category: '测试', amount: 100, description: 'desc' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Data');
  });

  test('GET /api/data - list', async () => {
    const res = await request(app)
      .get('/api/data')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/data/categories', async () => {
    const res = await request(app)
      .get('/api/data/categories')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/data/my-stats', async () => {
    const res = await request(app)
      .get('/api/data/my-stats')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.data.totalCount).toBeDefined();
  });

  test('PUT /api/data/:id - update', async () => {
    // Create first
    const created = await request(app)
      .post('/api/data')
      .set(authHeader(token))
      .send({ title: 'Update Me', amount: 50 });
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/data/${id}`)
      .set(authHeader(token))
      .send({ title: 'Updated', amount: 99 });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated');
  });

  test('DELETE /api/data/:id', async () => {
    const created = await request(app)
      .post('/api/data')
      .set(authHeader(token))
      .send({ title: 'Delete Me' });
    const id = created.body.data.id;

    const res = await request(app)
      .delete(`/api/data/${id}`)
      .set(authHeader(token));
    expect(res.status).toBe(200);
  });

  test('POST /api/data - missing title', async () => {
    const res = await request(app)
      .post('/api/data')
      .set(authHeader(token))
      .send({ category: 'test' });
    expect(res.status).toBe(400);
  });

  test('GET /api/data/export - CSV export', async () => {
    const res = await request(app)
      .get('/api/data/export')
      .set(authHeader(token));
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
});

// ─── Admin Routes ───────────────────────────────────────

describe('Admin', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = getToken('admin');
  });

  test('GET /api/admin/stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.userCount).toBeDefined();
    expect(res.body.data.dataCount).toBeDefined();
  });

  test('PUT /api/admin/data/batch-status', async () => {
    // Create data first
    const d1 = await request(app).post('/api/data').set(authHeader(adminToken)).send({ title: 'B1', amount: 10 });
    const d2 = await request(app).post('/api/data').set(authHeader(adminToken)).send({ title: 'B2', amount: 20 });

    const res = await request(app)
      .put('/api/admin/data/batch-status')
      .set(authHeader(adminToken))
      .send({ ids: [d1.body.data.id, d2.body.data.id], status: 'approved' });
    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(2);
  });

  test('PUT /api/admin/data/batch-status - invalid status', async () => {
    const res = await request(app)
      .put('/api/admin/data/batch-status')
      .set(authHeader(adminToken))
      .send({ ids: [1], status: 'invalid' });
    expect(res.status).toBe(400);
  });

  test('GET /api/admin/categories', async () => {
    const res = await request(app)
      .get('/api/admin/categories')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ─── User Management (Admin) ───────────────────────────

describe('User Management', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = getToken('admin');
  });

  test('POST /api/auth/users - create user', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set(authHeader(adminToken))
      .send({ username: 'testuser', password: 'pass123', name: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.data.username).toBe('testuser');
  });

  test('POST /api/auth/users - duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/users')
      .set(authHeader(adminToken))
      .send({ username: 'testuser', password: 'pass123' });
    expect(res.status).toBe(409);
  });

  test('GET /api/auth/users - list', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PUT /api/auth/users/:id - update', async () => {
    const user = db.prepare("SELECT * FROM users WHERE username = 'testuser'").get();
    const res = await request(app)
      .put(`/api/auth/users/${user.id}`)
      .set(authHeader(adminToken))
      .send({ name: 'Updated Test' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Test');
  });

  test('DELETE /api/auth/users/:id', async () => {
    const user = db.prepare("SELECT * FROM users WHERE username = 'testuser'").get();
    const res = await request(app)
      .delete(`/api/auth/users/${user.id}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
  });

  test('DELETE default admin - forbidden', async () => {
    const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    const res = await request(app)
      .delete(`/api/auth/users/${admin.id}`)
      .set(authHeader(adminToken));
    expect(res.status).toBe(403);
  });
});

// ─── Logs Routes ────────────────────────────────────────

describe('Operation Logs', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = getToken('admin');
  });

  test('GET /api/logs - list', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/logs - non-admin forbidden', async () => {
    // Create a regular user
    await request(app)
      .post('/api/auth/users')
      .set(authHeader(adminToken))
      .send({ username: 'regularuser', password: 'pass123', role: 'user' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'regularuser', password: 'pass123' });

    const userToken = loginRes.body.data.token;
    const res = await request(app)
      .get('/api/logs')
      .set(authHeader(userToken));
    expect(res.status).toBe(403);
  });
});

// ─── Profile Update ─────────────────────────────────────

describe('Profile Update', () => {
  let adminToken;

  beforeAll(() => {
    adminToken = getToken('admin');
  });

  test('PUT /api/auth/profile - update name/email', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeader(adminToken))
      .send({ name: 'Admin Updated', email: 'new@admin.com' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Admin Updated');
  });

  test('PUT /api/auth/profile - change password with wrong old', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set(authHeader(adminToken))
      .send({ oldPassword: 'wrong', newPassword: 'newpass' });
    expect(res.status).toBe(401);
  });
});
