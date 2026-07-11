const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務 - 指向 public 資料夾
app.use(express.static(path.join(__dirname, 'public')));

// 載入 API 路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// 預設路由重導向 (首頁即登入頁)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器並初始化資料庫連線
async function startServer() {
  // 初始化資料庫 (若 DB_ENABLED=true 則連線 MSSQL，否則使用 Mock 陣列)
  await db.initializeDB();

  app.listen(PORT, () => {
    console.log(`🚀 [Server] 伺服器已啟動，正在監聽連接埠: ${PORT}`);
    console.log(`🔗 [Server] 本地網址: http://localhost:${PORT}`);
  });
}

startServer();
