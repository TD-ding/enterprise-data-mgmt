# 架构设计

## 系统架构

系统采用前后端分离架构：

```
Browser ──► Frontend (Vue 3 + Vite) ──proxy /api──► Backend (Express) ──► SQLite
              :5173 (dev)                          :3000
```

生产环境由 Nginx 托管前端静态文件并反向代理 API 请求至后端。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3 + Vite | 组合式 API (Composition API) |
| UI 库 | Element Plus | 中文本地化 (zh-cn) |
| 状态管理 | Pinia | Token 和用户信息持久化至 localStorage |
| 路由 | Vue Router 4 | 带导航守卫的角色鉴权 |
| HTTP 客户端 | Axios | 拦截器统一处理 Bearer Token 和 401 |
| 后端框架 | Express 4 | RESTful API |
| 数据库 | SQLite (better-sqlite3) | WAL 模式，外键约束开启 |
| 认证 | JWT + bcryptjs | Bearer Token，支持过期检测 |
| 容器化 | Docker + Docker Compose | 前端多阶段构建，后端数据卷持久化 |
| CI | GitHub Actions | 自动测试、构建、Docker 镜像验证 |

## 数据库设计

### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 用户 ID |
| username | TEXT | NOT NULL UNIQUE | 用户名 |
| password | TEXT | NOT NULL | bcrypt 哈希密码 |
| role | TEXT | NOT NULL DEFAULT 'user' | 角色 (admin/user) |
| name | TEXT | NOT NULL DEFAULT '' | 姓名 |
| email | TEXT | NOT NULL DEFAULT '' | 邮箱 |
| status | TEXT | NOT NULL DEFAULT 'active' | 状态 (active/disabled) |
| created_at | TEXT | DEFAULT datetime('now') | 创建时间 |
| updated_at | TEXT | DEFAULT datetime('now') | 更新时间 |

### business_data 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 数据 ID |
| title | TEXT | NOT NULL | 标题 |
| category | TEXT | DEFAULT '' | 类别 |
| amount | REAL | DEFAULT 0 | 金额 |
| status | TEXT | DEFAULT 'pending' | 状态 (pending/approved/completed/rejected) |
| description | TEXT | DEFAULT '' | 描述 |
| reject_reason | TEXT | DEFAULT '' | 驳回原因 |
| created_by | INTEGER | NOT NULL FK → users.id | 创建人 |
| created_at | TEXT | DEFAULT datetime('now') | 创建时间 |
| updated_at | TEXT | DEFAULT datetime('now') | 更新时间 |

### operation_logs 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 日志 ID |
| user_id | INTEGER | NOT NULL | 操作用户 ID |
| username | TEXT | NOT NULL | 操作用户名 |
| action | TEXT | NOT NULL | 操作类型 |
| target_type | TEXT | DEFAULT '' | 目标类型 |
| target_id | INTEGER | DEFAULT 0 | 目标 ID |
| detail | TEXT | DEFAULT '' | 操作详情 |
| ip | TEXT | DEFAULT '' | IP 地址 |
| created_at | TEXT | DEFAULT datetime('now') | 操作时间 |

索引：`idx_logs_user(user_id)`、`idx_logs_action(action)`、`idx_logs_created(created_at)`

## 认证与权限

### JWT 认证流程

1. 用户通过 `/api/auth/login` 登录，验证用户名密码
2. 签发 JWT Token（payload: id, username, role, name），返回给前端
3. 前端将 Token 存入 localStorage，后续请求通过 `Authorization: Bearer <token>` 携带
4. 后端 `auth()` 中间件验证 Token 有效性，解析后挂载到 `req.user`
5. Token 过期返回 401，前端拦截后跳转登录页

### 角色权限

- **admin**: 可访问所有功能，包括用户管理、操作日志、全局数据查看、批量状态操作
- **user**: 仅可查看和管理自己创建的业务数据，查看个人统计

### 前端路由守卫

- 未登录用户访问需认证页面 → 重定向至 `/login`
- 非管理员访问 `meta.role === 'admin'` 页面 → 重定向至 `/dashboard`

## 前端架构

### 目录结构

```
frontend/src/
├── api/index.js          # Axios 实例，拦截器
├── constants.js          # STATUS_MAP, STATUS_OPTIONS 等常量
├── layouts/MainLayout.vue # 侧边栏布局
├── router/index.js       # 路由定义 + beforeEach 守卫
├── stores/user.js        # Pinia 用户状态
├── main.js               # 应用入口
├── style.css             # 全局样式
├── App.vue               # 根组件
└── views/
    ├── Login.vue          # 登录
    ├── Dashboard.vue      # 仪表盘（管理员/普通用户）
    ├── DataManage.vue     # 业务数据管理
    ├── UserManage.vue     # 用户管理（管理员）
    ├── OperationLogs.vue  # 操作日志（管理员）
    └── Profile.vue        # 个人设置
```

### 状态管理

Pinia store (`stores/user.js`) 管理：
- `token`: JWT Token（持久化到 localStorage）
- `user`: 用户信息（id, username, role, name, email）
- `isAdmin`: 计算属性，判断是否为管理员
- `login()` / `logout()`: 登录登出操作

## 后端架构

### 中间件链

```
请求 → CORS → JSON Parser → 路由匹配 → auth() → 业务处理 → 响应
```

### 日志记录

`logAction(userId, username, action, targetType, targetId, detail)` 函数在以下操作中调用：
- 创建/更新/删除业务数据
- 批量更新状态
- 创建/更新/删除用户

### 工具函数 (`utils.js`)

- `success(res, data, status)`: 返回 `{ success: true, data }`
- `error(res, message, status)`: 返回 `{ success: false, error: message }`
- `paginate(res, { total, page, pageSize, data })`: 返回分页数据
- `buildUpdate(fields, body)`: 动态构建 UPDATE 语句的字段和参数
