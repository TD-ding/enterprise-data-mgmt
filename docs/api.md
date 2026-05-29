# API 接口文档

所有 API 路径前缀为 `/api`。需要认证的接口请在请求头携带 `Authorization: Bearer <token>`。

## 通用响应格式

### 成功响应

```json
{ "success": true, "data": { ... } }
```

### 分页响应

```json
{ "success": true, "total": 100, "page": 1, "pageSize": 10, "data": [ ... ] }
```

### 错误响应

```json
{ "success": false, "error": "错误信息" }
```

---

## 认证接口

### POST /api/auth/login

用户登录，返回 JWT Token。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "name": "System Admin",
      "email": "admin@enterprise.com"
    }
  }
}
```

### GET /api/auth/profile

获取当���登录用户信息。需要认证。

### PUT /api/auth/profile

更新当前用户资料。需要认证。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 姓名 |
| email | string | 否 | 邮箱 |
| oldPassword | string | 改密码时必填 | 旧密码 |
| newPassword | string | 否 | 新密码 |

---

## 用户管理接口（管理员）

### GET /api/auth/users

获取用户列表，支持分页和搜索。

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| search | string | '' | 搜索用户名/姓名/邮箱 |
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页数量 |

### POST /api/auth/users

创建用户。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（唯一） |
| password | string | 是 | 密码 |
| role | string | 否 | 角色，默认 'user' |
| name | string | 否 | 姓名 |
| email | string | 否 | 邮箱 |

### PUT /api/auth/users/:id

更新用户信息。可更新 name、email、role、status、password。

### DELETE /api/auth/users/:id

删除用户。默认管理员账号 (admin) 不可删除。删除用户时同时删除其创建的业务数据。

---

## 业务数据接口

### GET /api/data

获取业务数据列表，支持分页、搜索和过滤。

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| search | string | '' | 搜索标题/描述 |
| status | string | '' | 按状态过滤 |
| category | string | '' | 按类别过滤 |
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页数量 |

**权限说明：** 管理员可查看所有数据，普通用户仅查看自己创建的数据。

### GET /api/data/my-stats

获取当前用户的统计数据。需要认证。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "totalCount": 20,
    "pendingCount": 5,
    "approvedCount": 8,
    "completedCount": 4,
    "rejectedCount": 3,
    "totalAmount": 15000
  }
}
```

### GET /api/data/categories

获取所有已有类别列表。需要认证。

### GET /api/data/export

导出业务数据为 CSV 文件。需要认证。

**查询参数：** search, status, category（同列表接口）

**响应：** Content-Type 为 `text/csv; charset=utf-8`，文件含 BOM 头以支持中文。

### POST /api/data

创建业务数据。需要认证。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| category | string | 否 | 类别 |
| amount | number | 否 | 金额，默认 0 |
| status | string | 否 | 状态，默认 'pending' |
| description | string | 否 | 描述 |

### GET /api/data/:id

获取单条数据详情。需要认证，且仅管理员或数据创建者可访问。

### PUT /api/data/:id

更新业务数据。支持更新 title、category、amount、status、description、reject_reason。

### DELETE /api/data/:id

删除业务数据。需要认证，且仅管理员或数据创建者可操作。

---

## 管理员接口

以下接口均需管理员权限。

### GET /api/admin/stats

获取全局统计数据（用户数、各状态数据数、总金额）。

**响应示例：**

```json
{
  "success": true,
  "data": {
    "userCount": 5,
    "activeUsers": 4,
    "dataCount": 50,
    "pendingCount": 10,
    "approvedCount": 20,
    "completedCount": 15,
    "rejectedCount": 5,
    "totalAmount": 100000
  }
}
```

### PUT /api/admin/data/batch-status

批量更新数据状态。

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | number[] | 是 | 数据 ID 数组（最多 100 条） |
| status | string | 是 | 目标状态 (pending/approved/completed/rejected) |

**响应示例：**

```json
{
  "success": true,
  "data": { "message": "状态更新成功", "count": 5 }
}
```

### GET /api/admin/categories

获取所有类别列表（管理员）。

---

## 操作日志接口（管理员）

### GET /api/logs

获取操作日志列表，支持分页和过滤。

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页数量 |
| action | string | - | 按操作类型搜索 |
| username | string | - | 按用户名搜索 |

---

## 状态码说明

| HTTP 状态码 | 说明 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 / Token 过期 / 密码错误 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |

## 数据状态流转

```
pending (待处理) ──► approved (已审批) ──► completed (已完成)
     │                   │
     └───────────────────┘──► rejected (已驳回)
```

- `pending`: 新创建的默认状态
- `approved`: 审批通过
- `completed`: 流程完成
- `rejected`: 审批驳回，需填写驳回原因 (reject_reason)
