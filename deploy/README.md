# 前端部署说明

## 目录

- `env/`
  - `dev.env`
  - `prod.env`
- `nginx/evaluation-manager.conf.template`
- `scripts/common.sh`
- `deploy.sh`
- `start.sh`
- `stop.sh`

## 用法

```bash
chmod +x deploy/*.sh deploy/scripts/*.sh

# 开发环境启动 Nuxt dev
./deploy/start.sh dev

# 停止开发环境
./deploy/stop.sh dev

# 生产环境构建、打包、发布并重载 nginx
./deploy/deploy.sh prod deploy

# 只构建
./deploy/deploy.sh prod build

# 只打包
./deploy/deploy.sh prod package

# 只发布静态文件并重载 nginx
./deploy/deploy.sh prod publish
```

## 说明

- 开发环境默认启动 Nuxt 开发服务器。
- 生产环境默认生成静态站点并发布到 nginx。
- nginx 配置会代理 `/em` 到后端服务。
