const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. 取得可用生豆清單
router.get('/green-beans', async (req, res) => {
  try {
    const data = await db.getAvailableGreenBeans();
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得可用生豆失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// 2. 取得可用包耗材清單
router.get('/materials', async (req, res) => {
  try {
    const data = await db.getAvailableMaterials();
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得可用包耗材失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// 3. 取得歷史烘豆紀錄
router.get('/roasts', async (req, res) => {
  try {
    const { year, month } = req.query;
    const data = await db.getRoastRecords(year, month);
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得烘豆紀錄失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// 4. 建立烘豆紀錄並扣減生豆
router.post('/roasts', async (req, res) => {
  try {
    const roastId = await db.addRoastRecord(req.body);
    res.json({ success: true, message: '烘豆紀錄建立成功！', roastId });
  } catch (err) {
    console.error('建立烘豆紀錄失敗:', err);
    res.status(400).json({ success: false, message: err.message || '建立烘豆紀錄失敗' });
  }
});

// 5. 取得包耗材領用紀錄
router.get('/usages', async (req, res) => {
  try {
    const { year, month } = req.query;
    const data = await db.getMaterialUsages(year, month);
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得領用紀錄失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// 6. 建立包耗材領用扣減
router.post('/usages', async (req, res) => {
  try {
    const usageId = await db.addMaterialUsage(req.body);
    res.json({ success: true, message: '領用扣減成功！', usageId });
  } catch (err) {
    console.error('領用扣減失敗:', err);
    res.status(400).json({ success: false, message: err.message || '領用扣減失敗' });
  }
});

// 7. 取得全物料庫存異動歷程
router.get('/logs', async (req, res) => {
  try {
    const { year, month } = req.query;
    const data = await db.getStockLogs(year, month);
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得庫存歷程失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// 8. 取得庫存總覽
router.get('/overview', async (req, res) => {
  try {
    const data = await db.getInventoryOverview();
    res.json({ success: true, data });
  } catch (err) {
    console.error('取得庫存總覽失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

module.exports = router;
