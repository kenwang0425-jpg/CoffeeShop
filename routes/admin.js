const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { validatePasswordComplexity } = require('../utils/validator');

// GET /api/admin/ordering-guide
router.get('/ordering-guide', async (req, res) => {
  try {
    const guide = await db.getOrderingGuide();
    res.json({ success: true, data: guide });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得訂購方式失敗：' + err.message });
  }
});

// POST /api/admin/ordering-guide
router.post('/ordering-guide', async (req, res) => {
  try {
    const payload = req.body;
    // Basic validation
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: '無效的資料格式' });
    }

    const success = await db.saveOrderingGuide(payload);
    if (success) {
      res.json({ success: true, message: '訂購方式設定已儲存成功！' });
    } else {
      res.status(500).json({ success: false, message: '儲存訂購方式失敗。' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '儲存訂購方式時發生錯誤：' + err.message });
  }
});

// GET /api/admin/business-hours
router.get('/business-hours', async (req, res) => {
  try {
    const hours = await db.getBusinessHours();
    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得營業時間失敗：' + err.message });
  }
});

// POST /api/admin/business-hours
router.post('/business-hours', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ success: false, message: '無效的資料格式' });
    }

    const success = await db.saveBusinessHours(payload);
    if (success) {
      res.json({ success: true, message: '營業時間設定已儲存成功！' });
    } else {
      res.status(500).json({ success: false, message: '儲存營業時間失敗。' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '儲存營業時間時發生錯誤：' + err.message });
  }
});

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
// 後台訂單列表，支援 ?status= 篩選，含完整明細，由新到舊排序
const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];

router.get('/orders', async (req, res) => {
  try {
    const { status, year, month } = req.query;
    const statusFilter = (status && VALID_ORDER_STATUSES.includes(status)) ? status : null;
    const orders = await db.getAdminOrders(statusFilter, year, month);
    res.json({ success: true, orders });
  } catch (err) {
    console.error('❌ [GET /api/admin/orders] 查詢失敗:', err.message);
    res.status(500).json({ success: false, message: '查詢訂單失敗：' + err.message });
  }
});

// ─── PATCH /api/admin/orders/:id/status ──────────────────────────────────────
// 變更訂單狀態（含可選的備註更新）
router.patch('/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status || !VALID_ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `狀態值無效，允許值為：${VALID_ORDER_STATUSES.join('、')}`
    });
  }

  try {
    const updated = await db.updateOrderStatus(id, status, note !== undefined ? note : null);
    if (!updated) {
      return res.status(404).json({ success: false, message: '找不到指定訂單。' });
    }
    console.log(`✅ [PATCH /api/admin/orders/${id}/status] 狀態更新為: ${status}`);
    res.json({ success: true, message: '訂單狀態已更新。' });
  } catch (err) {
    console.error(`❌ [PATCH /api/admin/orders/${id}/status] 更新失敗:`, err.message);
    res.status(500).json({ success: false, message: '更新訂單狀態失敗：' + err.message });
  }
});

// ─── 使用者管理 CRUD ──────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: '讀取使用者列表失敗：' + err.message });
  }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
  const { username, password, display_name, role } = req.body;
  if (!username || !password || !display_name) {
    return res.status(400).json({ success: false, message: '帳號、密碼與顯示名稱為必填' });
  }
  
  if (!validatePasswordComplexity(password)) {
    return res.status(400).json({ success: false, message: '密碼長度需至少 8 碼，並包含大寫英文、小寫英文、數字、特殊符號中至少三種' });
  }

  try {
    const existing = await db.getUserByUsername(username);
    if (existing) {
      return res.status(400).json({ success: false, message: '此帳號已存在' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = await db.createUser(username, hash, display_name, role || 'admin');
    res.json({ success: true, message: '使用者建立成功', data: { id: userId } });
  } catch (err) {
    if (err.message.includes('unique constraint')) {
      return res.status(400).json({ success: false, message: '此帳號已存在' });
    }
    res.status(500).json({ success: false, message: '建立使用者失敗：' + err.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const display_name = req.body.display_name || req.body.displayName;
  const role = req.body.role || 'admin';
  const is_active = req.body.is_active !== undefined ? req.body.is_active : (req.body.isActive !== undefined ? req.body.isActive : true);
  const new_password = req.body.new_password || req.body.newPassword || req.body.password;

  if (!display_name || !display_name.trim()) {
    return res.status(400).json({ success: false, message: '顯示名稱不可為空' });
  }

  try {
    let newHash = null;
    if (new_password && new_password.trim() !== '') {
      if (!validatePasswordComplexity(new_password)) {
        return res.status(400).json({ success: false, message: '密碼長度需至少 8 碼，並包含大寫英文、小寫英文、數字、特殊符號中至少三種' });
      }
      newHash = await bcrypt.hash(new_password, 10);
    }

    // 檢查停用狀態（若原本為 admin 且要改為非活躍或非 admin，需檢查是否為最後一個 admin）
    if (!is_active || role !== 'admin') {
      const user = await db.getUserById(id);
      if (user && user.role === 'admin' && user.is_active) {
        const adminCount = await db.getActiveAdminCount();
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: '至少需保留一位啟用中的管理員，不可停用或降級最後一位管理員。' });
        }
      }
    }

    const updated = await db.updateUser(id, display_name, role, is_active, newHash);
    if (updated) {
      res.json({ success: true, message: '使用者更新成功' });
    } else {
      res.status(404).json({ success: false, message: '找不到該使用者' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '更新使用者失敗：' + err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  const currentUsername = req.headers['x-username'];

  try {
    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: '找不到該使用者' });
    }

    if (user.username === currentUsername) {
      return res.status(400).json({ success: false, message: '不可刪除當前登入的使用者帳號' });
    }

    if (user.role === 'admin' && user.is_active) {
      const adminCount = await db.getActiveAdminCount();
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: '至少需保留一位啟用中的管理員，不可刪除最後一位管理員。' });
      }
    }

    const deleted = await db.deleteUser(id);
    if (deleted) {
      res.json({ success: true, message: '使用者已成功刪除（停用）' });
    } else {
      res.status(500).json({ success: false, message: '刪除失敗' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '刪除使用者失敗：' + err.message });
  }
});

module.exports = router;
