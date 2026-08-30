const bcrypt = require('bcrypt');
const db = require('./config/db');

async function seedUsers() {
  console.log('🌱 開始初始化使用者資料庫...');
  
  // 初始化資料庫連線
  await db.initializeDB();

  try {
    // 檢查是否有使用者
    const res = await db.query('SELECT COUNT(*) as count FROM users');
    const count = parseInt(res.rows[0].count, 10);

    if (count === 0) {
      console.log('未偵測到任何使用者，開始建立預設管理員帳號...');
      
      const defaultPassword = 'mis2ShKe';
      const saltRounds = 10;
      const hash = await bcrypt.hash(defaultPassword, saltRounds);

      await db.query(
        `INSERT INTO users (username, password_hash, display_name, role, is_active) 
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', hash, '系統管理員', 'admin', true]
      );
      
      console.log('✅ 預設管理員帳號已建立 (admin / mis2ShKe)');
    } else {
      console.log(`已有 ${count} 筆使用者資料，跳過初始化建立。`);
    }

    console.log('✅ 使用者初始資料庫建立完成');
  } catch (err) {
    console.error('❌ 初始化使用者失敗:', err.message);
  } finally {
    await db.closePool();
    console.log('🔌 資料庫連線已安全關閉。');
  }
}

seedUsers();
