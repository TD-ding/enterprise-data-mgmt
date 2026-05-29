# 测试说明

## 后端测试

使用 Jest + supertest 进行 API 集成测试。

### 运行测试

```bash
cd backend
npm test
```

### 测试配置

- 配置文件: `backend/jest.config.js`
- 测试目录: `backend/tests/`
- 测试数据库: 使用临时 SQLite 文件 (`data_test/test.db`)，测试结束后自动清理

### 环境变量

测试运行时自动设置以下环境变量，无需手动配置：

```
JWT_SECRET=test-secret-key
JWT_EXPIRES_IN=1h
DB_PATH=./data_test/test.db
```

### 测试覆盖范围

| 模块 | 测试数 | 覆盖内容 |
|------|--------|----------|
| Auth | 5 | 登录成功/失败、参数校验、Token 认证 |
| Data CRUD | 8 | 创建/列表/更新/删除、分类、统计、CSV 导出、参数校验 |
| Admin | 4 | 统计面板、批量状态、状态校验、分类 |
| User Management | 6 | 创建/列表/更新/删除用户、重名校验、默认管理员保护 |
| Operation Logs | 2 | 日志列表、非管理员权限拦截 |
| Profile | 2 | 资料更新、旧密码校验 |

**共计 27 个测试用例**

---

## 前端测试

使用 Vitest + @vue/test-utils 进行单元测试。

### 运行测试

```bash
cd frontend
npm test
```

### 测试配置

- 配置文件: `frontend/vitest.config.js`
- 测试目录: `frontend/tests/`
- 运行环境: jsdom

### 测试覆盖范围

| 模块 | 测试数 | 覆盖内容 |
|------|--------|----------|
| constants | 4 | STATUS_MAP 完整性、标签正确性、tagType 有效性、STATUS_OPTIONS 一致性 |

---

## CI 集成

GitHub Actions CI 配置在 `.github/workflows/ci.yml`，包含以下 Job：

| Job | 说明 | 依赖 |
|-----|------|------|
| backend-test | 后端测试 | 无 |
| frontend-test | 前端测试 | 无 |
| frontend-build | 前端构建验证 | frontend-test |
| docker-build | Docker 镜像构建验证 | backend-test, frontend-test |

触发条件：push 到 `main` 或 `agent/dev` 分支，以及对 `main` 的 Pull Request。
