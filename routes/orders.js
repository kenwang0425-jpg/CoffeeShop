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
    const { Pool } = require('pg');
    // 直接使用 db 模組底層的 pool（透過 db.js 尚未暴露 pool，改用 env 直連）
    const pool = new (require('pg').Pool)({
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host:     process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      port:     parseInt(process.env.DB_PORT || '5433')
    });

    // 查主表
    const ordersResult = await pool.query(
      `SELECT id, customer_phone, customer_name, shipping_address,
              total_amount, note, status, created_at
       FROM orders
       WHERE customer_phone = $1
       ORDER BY created_at DESC`,
      [String(phone).trim()]
    );

    if (ordersResult.rows.length === 0) {
      await pool.end();
      return res.json({ success: true, orders: [] });
    }

    // 批次查詢所有相關明細
    const orderIds = ordersResult.rows.map(r => r.id);
    const itemsResult = await pool.query(
      `SELECT order_id, product_id, product_name, price, quantity, options, subtotal
       FROM order_items
       WHERE order_id = ANY($1)`,
      [orderIds]
    );
    await pool.end();

    // 組裝
    const itemsMap = {};
    itemsResult.rows.forEach(item => {
      if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
      itemsMap[item.order_id].push({
        productId:   item.product_id,
        productName: item.product_name,
        price:       Number(item.price),
        quantity:    Number(item.quantity),
        options:     item.options || null,
        subtotal:    Number(item.subtotal)
      });
    });

    const orders = ordersResult.rows.map(r => ({
      id:              r.id,
      customerPhone:   r.customer_phone,
      customerName:    r.customer_name,
      shippingAddress: r.shipping_address,
      totalAmount:     Number(r.total_amount),
      note:            r.note,
      status:          r.status,
      createdAt:       r.created_at,
      items:           itemsMap[r.id] || []
    }));

    res.json({ success: true, orders });
  } catch (err) {
    console.error('❌ [GET /api/orders/customer/:phone] 查詢失敗:', err.message);
    res.status(500).json({ success: false, message: '查詢訂單時發生錯誤：' + err.message });
  }
});

module.exports = router;
