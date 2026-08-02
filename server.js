// 🛡️ 強制監聽所有未捕獲的致命錯誤，並列印出來
process.on('uncaughtException', (err) => {
  console.error('【致命錯誤-未捕獲異常】:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('【致命錯誤-未處理的 Rejection】:', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 【這裡原本有 app.listen，已被安全移至最底下，避免重複監聽 Named Pipe】

// 中間件設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務 - 指向 public 資料夾
app.use(express.static(path.join(__dirname, 'public')));

// 載入 API 路由
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const storefrontRoutes = require('./routes/storefront');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const supplierRoutes = require('./routes/suppliers');
const purchaseRoutes = require('./routes/purchases');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);

// 預設路由重導向 (首頁即登入頁)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器並初始化資料庫連線
async function startServer() {
  try {
    console.log("=== 🗄️ 正在初始化資料庫連線... ===");
    // 初始化資料庫 (若 DB_ENABLED=true 則連線 MSSQL，否則使用 Mock 陣列)
    await db.initializeDB();
    console.log("=== 🗄️ 資料庫初始化成功！ ===");

    // 只有在這裡監聽一次！
    app.listen(PORT, () => {
      console.log(`🚀 [Server] 伺服器已啟動，正在監聽連接埠: ${PORT}`);
      console.log(`🔗 [Server] 本地網址: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ [Server] 啟動伺服器失敗，錯誤原因:", error);
  }
}

startServer();
