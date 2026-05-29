# 部署指南

## 开发环境

### 环境要求

- Node.js >= 18
- npm >= 9

### 启动步骤

#### 1. 配置后端环境变量

```bash
cd backend
cat > .env << 'EOF'
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
PORT=3000
DB_PATH=./data/enterprise.db
EOF
```

#### 2. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端启动时自动初始化数据库，创建默认管理员账号 `admin / admin123`。

#### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，开发模式下 `/api` 请求自动代理至后端。

---

## Docker 部署

### 构建并启动

```bash
docker compose up -d
```

启动后：
- 前端：`http://localhost`
- 后端：`http://localhost:3000`（通常通过前端 Nginx 反代访问）

### 环境变量

在项目根目录创建 `.env` 文件设置以下变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| JWT_SECRET | change-me-in-production | JWT 签名密钥，**生产环境务必修改** |

### 数据持久化

Docker 部署使用 `backend-data` 命名卷存储 SQLite 数据库文件，容器重建后数据不丢失。

查看数据卷位置：

```bash
docker volume inspect enterprise-data-mgmt_backend-data
```

### 常用命令

```bash
# 查看日志
docker compose logs -f

# 重建镜像（代码更新后）
docker compose up -d --build

# 停止服务
docker compose down

# 停止并删除数据卷（慎用，会清除数据库）
docker compose down -v
```

---

## 生产部署

### 手动部署

#### 1. 构建前端

```bash
cd frontend
npm ci
npm run build
```

产物生成在 `frontend/dist/`。

#### 2. 配置后端环境变量

```bash
cd backend
cat > .env << 'EOF'
JWT_SECRET=<生产密钥，至少32字符随机字符串>
JWT_EXPIRES_IN=24h
PORT=3000
DB_PATH=./data/enterprise.db
NODE_ENV=production
EOF
```

#### 3. 启动后端

```bash
cd backend
npm ci --omit=dev
node src/app.js
```

生产模式下，Express 自动托管 `frontend/dist/` 静态文件，只需暴露 3000 端口即可。

#### 4. 推荐使用进程管理器

```bash
# 使用 pm2
npm install -g pm2
pm2 start src/app.js --name enterprise-api
pm2 save
pm2 startup
```

### Nginx 反向代理（可选）

如果需要单独部署前端和后端，可使用 Nginx 反代：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 安全注意事项

1. **JWT_SECRET**: 生产环境必须使用强随机密钥，不要使用默认值
2. **HTTPS**: 生产环境建议在 Nginx 层配置 SSL/TLS
3. **CORS**: 后端默认允许 localhost:5173 访问，生产环境需配置 `FRONTEND_ORIGIN` 环境变量
4. **默认管理员**: 首次部署后建议修改 admin 密码
5. **数据库备份**: 定期备份 `data/enterprise.db` 文件
