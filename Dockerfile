# 使用輕量版 Node.js 基礎鏡像
FROM node:18-alpine

# 設定容器內的工作目錄
WORKDIR /app

# 複製 package 檔案並安裝依賴
COPY package*.json ./
RUN npm install --production

# 複製所有專案原始碼（含 public, routes, server.js 等）
COPY . .

# 暴露埠號 (搭配 server.js 預設的 PORT，例如 8080 或 3000)
EXPOSE 3000

# 啟動 Node.js 伺服器
CMD ["node", "server.js"]
