const express = require('express');
const router = express.Router();
const db = require('../config/db');

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
    const { status } = req.query;
    const statusFilter = (status && VALID_ORDER_STATUSES.includes(status)) ? status : null;
    const orders = await db.getAdminOrders(statusFilter);
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

module.exports = router;
