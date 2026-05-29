const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Refusing to start.');
  process.exit(1);
}

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = payload;

      if (requiredRole && payload.role !== requiredRole && payload.role !== 'admin') {
        return res.status(403).json({ error: '权限不足' });
      }
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '登录已过期，请重新登录' });
      }
      res.status(401).json({ error: '认证令牌无效' });
    }
  };
}

module.exports = auth;
