const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// 建立新訂單（顧客 UPSERT + 訂單主表 + 訂單明細，以 Transaction 確保一致性）
router.post('/', async (req, res) => {
  const { phone, name, address, items, note, totalAmount } = req.body;

  // ── 必填欄位驗證 ──────────────────────────────────────────────────────────
  const missingFields = [];
  if (!phone || String(phone).trim() === '')   missingFields.push('phone（手機號碼）');
  if (!name  || String(name).trim()  === '')   missingFields.push('name（顧客姓名）');
  if (!address || String(address).trim() === '') missingFields.push('address（收件地址）');
  if (totalAmount === undefined || totalAmount === null || totalAmount === '') {
    missingFields.push('totalAmount（訂單總金額）');
  }
  if (!Array.isArray(items) || items.length === 0) {
    missingFields.push('items（訂單項目，不可為空陣列）');
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `缺少必要欄位：${missingFields.join('、')}`
    });
  }

  // ── items 內容驗證 ────────────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productId || !item.name) {
      return res.status(400).json({
        success: false,
        message: `訂單項目第 ${i + 1} 筆缺少 productId 或 name。`
      });
    }
    if (isNaN(Number(item.price)) || Number(item.price) < 0) {
      return res.status(400).json({
        success: false,
        message: `訂單項目第 ${i + 1} 筆的 price 必須為非負數。`
      });
    }
    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: `訂單項目第 ${i + 1} 筆的 quantity 必須為大於 0 的整數。`
      });
    }
  }

  // ── 執行建立訂單 ──────────────────────────────────────────────────────────
  try {
    const orderId = await db.createOrder({
      phone:       String(phone).trim(),
      name:        String(name).trim(),
      address:     String(address).trim(),
      items,
      note:        note || null,
      totalAmount: Number(totalAmount)
    });

    console.log(`✅ [POST /api/orders] 訂單建立成功，訂單編號: ${orderId}`);
    res.status(201).json({ success: true, orderId });
  } catch (err) {
    console.error('❌ [POST /api/orders] 建立訂單失敗:', err.message);
    res.status(500).json({ success: false, message: '建立訂單時發生錯誤：' + err.message });
  }
});

// ─── GET /api/orders/customer/:phone ─────────────────────────────────────────
// 依手機號碼查詢顧客所有歷史訂單（含明細），由新到舊排序
router.get('/customer/:phone', async (req, res) => {
  const { phone } = req.params;

  if (!phone || String(phone).trim() === '') {
    return res.status(400).json({ success: false, message: '手機號碼為必填欄位。' });
  }

  try {
    // 使用 db.js 中已正確設定的連線池，避免重複建立 Pool 且連線參數錯誤
    const orders = await db.getOrdersByPhone(String(phone).trim());
    res.json({ success: true, orders });
  } catch (err) {
    console.error('❌ [GET /api/orders/customer/:phone] 查詢失敗:', err.message);
    res.status(500).json({ success: false, message: '查詢訂單時發生錯誤：' + err.message });
  }
});

module.exports = router;
