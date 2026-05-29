const jwt = require('jsonwebtoken');

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
    } catch {
      res.status(401).json({ error: '令牌无效或已过期' });
    }
  };
}

module.exports = auth;
