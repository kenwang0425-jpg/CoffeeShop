const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─── GET /api/customers/:phone ────────────────────────────────────────────────
// 依手機號碼查詢顧客資料
router.get('/:phone', async (req, res) => {
  const { phone } = req.params;

  // 基本格式驗證
  if (!phone || String(phone).trim() === '') {
    return res.status(400).json({ success: false, message: '手機號碼為必填欄位。' });
  }

  try {
    const customer = await db.getCustomerByPhone(String(phone).trim());

    if (!customer) {
      return res.status(404).json({ success: false, message: '查無此顧客資料' });
    }

    res.json({ success: true, customer });
  } catch (err) {
    console.error('❌ [GET /api/customers/:phone] 查詢顧客失敗:', err.message);
    res.status(500).json({ success: false, message: '查詢顧客資料時發生錯誤：' + err.message });
  }
});

module.exports = router;
