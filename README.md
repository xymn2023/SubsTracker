# SubsTracker 订阅管理系统（Python Flask 版）使用说明

![image](https://github.com/user-attachments/assets/22ff1592-7836-4f73-aa13-24e9d43d7064)

系统配置,修改账号密码,以及配置tg通知的信息

![image](https://github.com/user-attachments/assets/f6db2089-28a1-439d-9de0-412ee4b2807f)

配置完成可以点击测试通知,查看是否能够正常通知,然后就可以正常添加订阅使用了!

![image](https://github.com/user-attachments/assets/af530379-332c-4482-9e6e-229a9e24775e)

## ✨ 特性

- 🔔 **自动提醒**: 在订阅到期前自动发送Telegram通知
- 📊 **订阅管理**: 直观的Web界面管理所有订阅
- 🔄 **周期计算**: 智能计算循环订阅的下一个周期
- 📱 **响应式设计**: 完美适配移动端和桌面设备

✅ 订阅列表按到期日期升序排序 

✅ 修复了提醒天数逻辑（reminderDays: 0 只在到期日提醒） 

✅ 添加了自动续费切换功能（autoRenew 字段） 

✅ 增强了测试通知功能（在配置页面独立测试按钮） 

✅ 实现了Toast通知系统 

✅ 表单验证和错误处理 

✅ 安全配置（不返回敏感信息） 



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


