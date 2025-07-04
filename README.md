# SubsTracker 订阅管理系统（Python Flask 版）使用说明

## 1. 环境要求

- Python 3.7 及以上
- pip 包管理器

## 2. 安装依赖

在项目根目录下执行：

```bash
pip install -r requirements.txt
```

## 3. 启动项目

在项目根目录下运行：

```bash
python app.py
```

首次启动会自动生成 `config.json` 和 `subscriptions.json` 数据文件。

## 4. 访问方式

- 登录页：http://localhost:5000/
- 管理后台：http://localhost:5000/admin
- 系统配置：http://localhost:5000/admin/config

## 5. 配置说明

- 管理员用户名/密码、通知方式等可在"系统配置"页面设置。
- 支持 NotifyX、Telegram 两种通知推送方式。

## 6. 订阅管理

- 可添加、编辑、删除订阅，支持周期续订、到期提醒、自动续期、启用/停用等功能。
- 支持单条订阅测试通知。

## 7. 定时任务

- 系统自动每小时检查一次订阅到期情况，并自动推送通知和续期（如设置了自动续订）。

## 8. Docker 部署（可选）

如需 Docker 部署：

```bash
docker build -t substracker .
docker run -d -p 5000:5000 --name substracker substracker
```

## 9. 依赖说明

- Flask：Web 框架
- PyJWT：JWT 登录认证
- requests：第三方 HTTP 请求（用于通知推送）
- APScheduler：定时任务调度

## 10. 数据文件

- `config.json`：系统配置（自动生成/保存）
- `subscriptions.json`：订阅数据（自动生成/保存）

---

如需二次开发或遇到问题，欢迎随时提问！ 