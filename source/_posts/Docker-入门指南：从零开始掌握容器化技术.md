---
title: Docker 入门指南：从零开始掌握容器化技术
date: 2024-06-13 21:21:42
tags: [Docker, 容器化, DevOps]
---


# Docker 入门指南：从零开始掌握容器化技术

## 什么是 Docker？

Docker 是一个开源的容器化平台，它允许开发者将应用程序及其依赖项打包到一个轻量级、可移植的容器中，然后在任何支持 Docker 的环境中运行。简单来说，Docker 解决了"在我机器上能运行"的经典问题。

## 为什么选择 Docker？

*   **环境一致性**：开发、测试、生产环境完全一致
*   **快速部署**：秒级启动，比传统虚拟机快得多
*   **资源高效**：容器共享主机内核，占用资源少
*   **易于扩展**：轻松实现应用的水平扩展
*   **版本控制**：镜像可以像代码一样进行版本管理

## 核心概念

### 1. 镜像 (Image)

镜像是一个只读的模板，包含了运行应用所需的所有内容：代码、运行时、库、环境变量和配置文件。

### 2. 容器 (Container)

容器是镜像的运行实例。你可以创建、启动、停止、移动或删除容器。

### 3. Dockerfile

一个文本文件，包含了构建 Docker 镜像所需的所有指令。

### 4. Docker Hub

Docker 的官方镜像仓库，你可以在这里找到和分享镜像。

## 安装 Docker

### Windows/Mac

访问 [Docker Desktop](https://www.docker.com/products/docker-desktop) 下载并安装。

### Linux (Ubuntu)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

验证安装：

```bash
docker --version
```

## 基本命令

### 1. 拉取镜像

```bash
# 从 Docker Hub 拉取官方 nginx 镜像
docker pull nginx

# 拉取特定版本
docker pull nginx:1.21
```

### 2. 查看镜像

```bash
# 列出本地所有镜像
docker images

# 查看镜像详细信息
docker inspect nginx
```

### 3. 运行容器

```bash
# 运行一个简单的容器
docker run hello-world

# 运行 nginx 并映射端口
docker run -d -p 8080:80 --name my-nginx nginx

# 参数说明：
# -d: 后台运行
# -p: 端口映射 (主机端口:容器端口)
# --name: 给容器命名
```

### 4. 管理容器

```bash
# 查看运行中的容器
docker ps

# 查看所有容器（包括停止的）
docker ps -a

# 停止容器
docker stop my-nginx

# 启动容器
docker start my-nginx

# 重启容器
docker restart my-nginx

# 删除容器
docker rm my-nginx

# 强制删除运行中的容器
docker rm -f my-nginx
```

### 5. 容器交互

```bash
# 进入运行中的容器
docker exec -it my-nginx bash

# 查看容器日志
docker logs my-nginx

# 实时查看日志
docker logs -f my-nginx
```

### 6. 清理资源

```bash
# 删除所有停止的容器
docker container prune

# 删除未使用的镜像
docker image prune

# 删除所有未使用的资源
docker system prune -a
```

## 实战案例：运行一个 Node.js 应用

### 1. 创建应用文件

**app.js**

```javascript
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Docker!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

**package.json**

```json
{
  "name": "docker-node-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  },
  "scripts": {
    "start": "node app.js"
  }
}
```

### 2. 编写 Dockerfile

```dockerfile
# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

### 3. 构建和运行

```bash
# 构建镜像
docker build -t my-node-app .

# 运行容器
docker run -d -p 3000:3000 --name node-app my-node-app

# 访问应用
curl http://localhost:3000
```

## Docker Compose：管理多容器应用

当应用需要多个容器协同工作时（如前端 + 后端 + 数据库），使用 Docker Compose 可以简化管理。

**docker-compose.yml**

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    
  db:
    image: postgres:14
    environment:
      - POSTGRES_PASSWORD=secretpassword
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

运行多容器应用：

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

## 数据持久化：使用 Volume

容器删除后数据会丢失，使用 Volume 可以持久化数据：

```bash
# 创建 volume
docker volume create my-data

# 运行容器并挂载 volume
docker run -d -v my-data:/app/data --name my-app nginx

# 查看所有 volumes
docker volume ls

# 删除 volume
docker volume rm my-data
```

## 最佳实践

### 1. 优化镜像大小

*   使用轻量级基础镜像（如 alpine）
*   合并 RUN 指令减少层数
*   使用 `.dockerignore` 排除不必要的文件

**.dockerignore**

    node_modules
    npm-debug.log
    .git
    .env
    *.md

### 2. 多阶段构建

```dockerfile
# 构建阶段
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 3. 安全建议

*   不要以 root 用户运行容器
*   定期更新基础镜像
*   扫描镜像漏洞
*   不在镜像中存储敏感信息

### 4. 健康检查

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

## 常见问题

### 1. 端口已被占用

```bash
# 查看端口占用
netstat -ano | findstr :8080  # Windows
lsof -i :8080  # Linux/Mac

# 使用其他端口
docker run -p 8081:80 nginx
```

### 2. 容器无法访问

*   检查端口映射是否正确
*   确认防火墙规则
*   查看容器日志排查错误

### 3. 镜像构建慢

*   使用国内镜像源
*   优化 Dockerfile 层缓存
*   使用 BuildKit 加速

## 学习资源

*   [Docker 官方文档](https://docs.docker.com/)
*   [Docker Hub](https://hub.docker.com/)
*   [Play with Docker](https://labs.play-with-docker.com/) - 在线练习环境
*   [Docker Cheat Sheet](https://docs.docker.com/get-started/docker_cheatsheet.pdf)

## 总结

Docker 是现代应用开发和部署的必备工具。通过本文，你应该已经掌握了：

*   Docker 的核心概念
*   基本命令和操作
*   如何编写 Dockerfile
*   如何使用 Docker Compose
*   最佳实践和常见问题

