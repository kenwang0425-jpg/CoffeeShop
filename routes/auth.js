const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { validatePasswordComplexity } = require('../utils/validator');

// POST /api/auth/login - 登入驗證
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 基本欄位防呆
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '請輸入帳號與密碼！'
    });
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤！'
      });
    }

    // 驗證密碼
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (isValid) {
      // 登入成功，回傳模擬 Token
      return res.json({
        success: true,
        message: '登入成功！',
        token: 'mock-session-token-123456789',
        user: {
          username: user.username,
          displayName: user.display_name,
          role: user.role
        }
      });
    } else {
      // 登入失敗
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤！'
      });
    }
  } catch (err) {
    console.error('登入時發生錯誤:', err.message);
    res.status(500).json({ success: false, message: '伺服器內部錯誤' });
  }
});

// POST /api/auth/change-password - 變更密碼
router.post('/change-password', async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '請提供帳號、舊密碼與新密碼。' });
  }

  try {
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(404).json({ success: false, message: '找不到該使用者。' });
    }

    const isValidOld = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValidOld) {
      return res.status(401).json({ success: false, message: '舊密碼不正確！' });
    }

    if (!validatePasswordComplexity(newPassword)) {
      return res.status(400).json({
        success: false,
        message: '密碼長度需至少 8 碼，並包含大寫英文、小寫英文、數字或符號中至少三種'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const updated = await db.updateUserPassword(username, newHash);

    if (updated) {
      res.json({ success: true, message: '密碼變更成功！請重新登入。' });
    } else {
      res.status(500).json({ success: false, message: '密碼變更失敗，請稍後再試。' });
    }
  } catch (err) {
    console.error('變更密碼發生錯誤:', err.message);
    res.status(500).json({ success: false, message: '伺服器內部錯誤' });
  }
});

module.exports = router;
