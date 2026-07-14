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

module.exports = router;
