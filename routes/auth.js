const express = require('express');
const router = express.Router();

// 預設的登入帳號密碼
const DEFAULT_USER = {
  username: 'admin',
  password: 'password'
};

// POST /api/auth/login - 登入驗證
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 基本欄位防呆
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '請輸入帳號與密碼！'
    });
  }

  // 驗證帳密
  if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
    // 登入成功，回傳模擬 Token
    return res.json({
      success: true,
      message: '登入成功！',
      token: 'mock-session-token-123456789',
      user: {
        username: username,
        displayName: '系統管理員'
      }
    });
  } else {
    // 登入失敗
    return res.status(401).json({
      success: false,
      message: '帳號或密碼錯誤！'
    });
  }
});

module.exports = router;
