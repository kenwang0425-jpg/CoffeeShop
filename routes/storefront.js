const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ─── GET /api/storefront/products ────────────────────────────────────────────
// 前台商品列表，可選 query: ?category=咖啡豆|掛耳包組|周邊產品
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    const validCategories = ['咖啡豆', '掛耳包組', '周邊產品'];
    const cat = validCategories.includes(category) ? category : null;
    const products = await db.getProductsByCategory(cat);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得商品列表失敗：' + err.message });
  }
});

// ─── GET /api/storefront/filters ─────────────────────────────────────────────
// 動態撈取咖啡豆的產區與處理法清單（GROUP BY）
router.get('/filters', async (req, res) => {
  try {
    const filters = await db.getCoffeeBeanFilters();
    res.json({ success: true, data: filters });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得篩選清單失敗：' + err.message });
  }
});

// ─── GET /api/storefront/business-hours ──────────────────────────────────────
// 前台讀取營業時間與臨時公告
router.get('/business-hours', async (req, res) => {
  try {
    const hours = await db.getBusinessHours();
    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得營業時間失敗：' + err.message });
  }
});

// ─── GET /api/storefront/ordering-guide ──────────────────────────────────────
// 前台讀取訂購步驟
router.get('/ordering-guide', async (req, res) => {
  try {
    const guide = await db.getOrderingGuide();
    res.json({ success: true, data: guide });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得訂購方式失敗：' + err.message });
  }
});

module.exports = router;
