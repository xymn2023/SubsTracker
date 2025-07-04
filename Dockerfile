# 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件和项目代码
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# 设置环境变量（Flask生产模式）
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_ENV=production

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["flask", "run"] 