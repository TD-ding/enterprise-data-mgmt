# Enterprise Data Management System

企业数据管理系统，支持用户管理、业务数据管理和管理员面板功能。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus + Pinia + Vue Router
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken + bcryptjs)

## 目录结构

```
enterprise-data-mgmt/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── app.js          # Express 入口
│   │   ├── db.js           # SQLite 数据库连接
│   │   ├── init-db.js      # 数据库初始化 & 默认管理员
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT 认证 & 权限控制中间件
│   │   └── routes/
│   │       ├── auth.js     # 认证 & 用户管理 API
│   │       ├── data.js     # 业务数据 CRUD API
│   │       └── admin.js    # 管理员统计 & 批量操作 API
│   ├── .env                # 环境变量（需自行创建）
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/            # Axios 请求封装
│   │   ├── layouts/        # 布局组件
│   │   ├── router/         # 路由配置
│   │   ├── stores/         # Pinia 状态管理
│   │   └── views/          # 页面组件
│   │       ├── Login.vue       # 登录页
│   │       ├── Dashboard.vue  # 仪表盘
│   │       ├── UserManage.vue  # 用户管理（管理员）
│   │       ├── DataManage.vue  # 业务数据管理
│   │       └── Profile.vue     # 个人设置
│   └── package.json
└── README.md
```

## 如何运行

### 1. 后端

```bash
cd backend
npm install

# 创建 .env 文件
cp .env.example .env   # 或参照 .env 内容手动创建

# 初始化数据库（创建表 & 默认管理员）
npm run init-db

# 启动后端服务
npm run dev
```

后端默认运行在 `http://localhost:3000`。

默认管理员账号: `admin` / `admin123`

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，已配置代理将 `/api` 请求转发至后端。

### 3. 生产构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist/`，后端在 `NODE_ENV=production` 时会自动托管前端静态文件。

## API 概览

| 方法   | 路径                  | 说明             | 权限   |
|--------|-----------------------|------------------|--------|
| POST   | /api/auth/login       | 用户登录         | 公开   |
| GET    | /api/auth/profile     | 获取当前用户信息  | 登录   |
| GET    | /api/auth/users       | 用户列表         | 管理员 |
| POST   | /api/auth/users       | 创建用户         | 管理员 |
| PUT    | /api/auth/users/:id   | 更新用户         | 管理员 |
| DELETE | /api/auth/users/:id   | 删除用户         | 管理员 |
| GET    | /api/data             | 业务数据列表     | 登录   |
| POST   | /api/data             | 创建业务数据     | 登录   |
| PUT    | /api/data/:id         | 更新业务数据     | 登录   |
| DELETE | /api/data/:id         | 删除业务数据     | 登录   |
| GET    | /api/admin/stats      | 管理员统计面板   | 管理员 |
| PUT    | /api/admin/data/batch-status | 批量更新状态 | 管理员 |
