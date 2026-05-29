# Enterprise Data Management System

企业数据管理系统，支持用户管理、业务数据管理、审批流程和管理员面板功能。

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus + Pinia + Vue Router
- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **认证**: JWT (jsonwebtoken + bcryptjs)
- **测试**: Jest + supertest (后端), Vitest (前端)
- **部署**: Docker + Docker Compose
- **CI**: GitHub Actions

## 目录结构

```
enterprise-data-mgmt/
├── .github/workflows/
│   └── ci.yml                # GitHub Actions CI 配置
├── backend/
│   ├── src/
│   │   ├── app.js            # Express 入口
│   │   ├── db.js             # SQLite 数据库连接
│   │   ├── init-db.js        # 数据库初始化 & 默认管理员
│   │   ├── logAction.js      # 操作日志记录
│   │   ├── utils.js          # 工具函数
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT 认证 & 权限控制中间件
│   │   └── routes/
│   │       ├── auth.js       # 认证 & 用户管理 API
│   │       ├── data.js       # 业务数据 CRUD API
│   │       ├── admin.js      # 管理员统计 & 批量操作 API
│   │       └── logs.js       # 操作日志 API
│   ├── tests/
│   │   └── api.test.js       # 后端 API 测试
│   ├── Dockerfile            # 后端 Docker 镜像
│   ├── jest.config.js        # Jest 测试配置
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js      # Axios 请求封装
│   │   ├── constants.js      # 状态映射等常量
│   │   ├── layouts/          # 布局组件
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   └── views/            # 页面组件
│   ├── tests/
│   │   └── constants.test.js # 前端单元测试
│   ├── Dockerfile            # 前端 Docker 镜像（多阶段构建）
│   ├── nginx.conf            # Nginx 配置
│   ├── vitest.config.js      # Vitest 测试配置
│   └── package.json
├── docs/                     # 项目文档
│   ├── architecture.md       # 架构设计
│   ├── api.md                # API 接口文档
│   ├── deployment.md         # 部署指南
│   └── testing.md            # 测试说明
├── docker-compose.yml        # Docker Compose 编排
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 1. 配置后端环境变量

```bash
cd backend
cat > .env << 'EOF'
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
PORT=3000
DB_PATH=./data/enterprise.db
EOF
```

### 2. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端默认运行在 `http://localhost:3000`，首次启动自动初始化数据库。

默认管理员账号: `admin` / `admin123`

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`，已配置代理将 `/api` 请求转发至后端。

### 4. 运行测试

```bash
# 后端测试
cd backend && npm test

# 前端测试
cd frontend && npm test
```

## Docker 部署

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 更新重建
docker compose up -d --build
```

启动后前端访问 `http://localhost`，后端通过 Nginx 反代访问。

详见 [部署指南](docs/deployment.md)。

## API 概览

| 方法   | 路径                       | 说明             | 权限   |
|--------|----------------------------|------------------|--------|
| POST   | /api/auth/login            | 用户登录         | 公开   |
| GET    | /api/auth/profile          | 获取当前用户信息  | 登录   |
| PUT    | /api/auth/profile          | 更新个人资料      | 登录   |
| GET    | /api/auth/users            | 用户列表         | 管理员 |
| POST   | /api/auth/users            | 创建用户         | 管理员 |
| PUT    | /api/auth/users/:id        | 更新用户         | 管理员 |
| DELETE | /api/auth/users/:id        | 删除用户         | 管理员 |
| GET    | /api/data                  | 业务数据列表     | 登录   |
| GET    | /api/data/my-stats         | 当前用户统计     | 登录   |
| GET    | /api/data/categories       | 类别列表         | 登录   |
| GET    | /api/data/export           | 导出 CSV         | 登录   |
| POST   | /api/data                  | 创建业务数据     | 登录   |
| GET    | /api/data/:id              | 数据详情         | 登录   |
| PUT    | /api/data/:id              | 更新业务数据     | 登录   |
| DELETE | /api/data/:id              | 删除业务数据     | 登录   |
| GET    | /api/admin/stats           | 管理员统计面板   | 管理员 |
| PUT    | /api/admin/data/batch-status | 批量更新状态   | 管理员 |
| GET    | /api/admin/categories      | 类别列表（管理员）| 管理员 |
| GET    | /api/logs                  | 操作日志列表     | 管理员 |

完整接口文档详见 [API 文档](docs/api.md)。

## 功能特性

- JWT 认证 + 角色权限控制（admin / user）
- 用户管理 CRUD（管理员）
- 业务数据 CRUD + 搜索过滤 + 分页
- 审批流程：待处理 → 已审批 → 已完成 / 已驳回（附驳回原因）
- CSV 数据导出（BOM 头支持中文）
- 操作日志记录与查看
- 仪表盘统计图表（管理员/普通用户视图）
- 分类下拉选择（支持自定义输入）
- Docker 容器化部署
- GitHub Actions CI 自动测试与构建

## 文档

- [架构设计](docs/architecture.md)
- [API 接口文档](docs/api.md)
- [部署指南](docs/deployment.md)
- [测试说明](docs/testing.md)
