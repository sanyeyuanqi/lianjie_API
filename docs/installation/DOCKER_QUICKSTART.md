# Docker 快速部署指南

本文档用于将当前定制版本快速部署到 Linux 服务器。项目会从源码构建 Docker 镜像，因此包含本仓库中的全部界面和功能调整。

> 仓库地址：<https://github.com/sanyeyuanqi/lianjie_API>

## 1. 环境要求

- Linux 服务器，建议至少 2 核 CPU、2 GB 内存
- Docker 24 或更高版本
- Docker Compose v2
- 已开放对外访问端口，默认使用 `3000`

检查安装是否正常：

```bash
docker --version
docker compose version
```

## 2. 下载项目

```bash
git clone https://github.com/sanyeyuanqi/lianjie_API.git
cd lianjie_API
```

如果项目已经存在：

```bash
cd lianjie_API
git pull origin master
```

## 3. 创建生产配置

在项目根目录创建 `docker-compose.prod.yml`：

```yaml
services:
  new-api:
    build:
      context: .
      dockerfile: Dockerfile
    image: lianjie-api:latest
    container_name: lianjie-api
    restart: unless-stopped
    command: --log-dir /app/logs
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
      - ./logs:/app/logs
    environment:
      TZ: Asia/Shanghai
      SQL_DSN: postgresql://newapi:${DB_PASSWORD}@postgres:5432/newapi
      REDIS_CONN_STRING: redis://:${REDIS_PASSWORD}@redis:6379/0
      SESSION_SECRET: ${SESSION_SECRET}
      CRYPTO_SECRET: ${CRYPTO_SECRET}
      ERROR_LOG_ENABLED: "true"
      BATCH_UPDATE_ENABLED: "true"
      NODE_NAME: lianjie-api-1
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/api/status | grep -q '\"success\"'"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - lianjie-network

  postgres:
    image: postgres:15-alpine
    container_name: lianjie-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: newapi
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: newapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U newapi -d newapi"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lianjie-network

  redis:
    image: redis:7-alpine
    container_name: lianjie-redis
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes", "--requirepass", "${REDIS_PASSWORD}"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lianjie-network

volumes:
  postgres_data:
  redis_data:

networks:
  lianjie-network:
    driver: bridge
```

## 4. 设置密码和密钥

生成随机值：

```bash
openssl rand -hex 24
openssl rand -hex 24
openssl rand -hex 32
openssl rand -hex 32
```

在项目根目录创建 `.env`，将下面的示例值全部替换为刚生成的随机值：

```env
DB_PASSWORD=请替换为随机数据库密码
REDIS_PASSWORD=请替换为随机Redis密码
SESSION_SECRET=请替换为随机会话密钥
CRYPTO_SECRET=请替换为随机加密密钥
```

保护配置文件：

```bash
chmod 600 .env
```

> 不要将 `.env` 上传到 GitHub。项目的 `.gitignore` 已忽略该文件。

## 5. 构建并启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

首次构建需要下载前端和 Go 依赖，耗时取决于服务器网络。查看运行状态：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f new-api
```

浏览器访问：

```text
http://服务器IP:3000
```

首次打开后，按照页面提示完成管理员账户初始化。

## 6. 更新版本

```bash
cd lianjie_API
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

更新过程中 PostgreSQL、Redis 和应用数据不会被删除。

## 7. 停止或重启

```bash
# 停止服务
docker compose -f docker-compose.prod.yml stop

# 启动服务
docker compose -f docker-compose.prod.yml start

# 重启服务
docker compose -f docker-compose.prod.yml restart

# 删除容器但保留数据
docker compose -f docker-compose.prod.yml down
```

不要执行 `docker compose down -v`，该命令会同时删除数据库和 Redis 数据卷。

## 8. 数据备份

备份 PostgreSQL：

```bash
mkdir -p backups
docker exec lianjie-postgres pg_dump -U newapi -d newapi > backups/newapi-$(date +%F-%H%M%S).sql
```

恢复 PostgreSQL：

```bash
cat backups/备份文件.sql | docker exec -i lianjie-postgres psql -U newapi -d newapi
```

同时建议定期备份项目中的 `data`、`logs` 和 `.env`。

## 9. 常见问题

### 无法访问网页

检查容器、端口和防火墙：

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3000/api/status
sudo ufw allow 3000/tcp
```

云服务器还需要在安全组中放行 TCP `3000` 端口。

### 构建时内存不足

前端构建需要一定内存。建议使用至少 2 GB 内存的服务器，或先增加 Swap：

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 查看错误日志

```bash
docker compose -f docker-compose.prod.yml logs --tail=200 new-api
docker compose -f docker-compose.prod.yml logs --tail=200 postgres
docker compose -f docker-compose.prod.yml logs --tail=200 redis
```

## 10. 配置域名和 HTTPS

生产环境建议使用 Nginx 或 Caddy 将域名反向代理到 `127.0.0.1:3000`，并启用 HTTPS。配置反向代理后，可将端口映射改为：

```yaml
ports:
  - "127.0.0.1:3000:3000"
```

这样应用端口只允许服务器本机访问，对外流量统一经过 HTTPS 反向代理。
