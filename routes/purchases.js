const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/purchases
router.get('/', async (req, res) => {
  const { startDate, endDate, supplierId } = req.query;
  try {
    const purchases = await db.getPurchases(startDate, endDate, supplierId);
    res.json({ success: true, data: purchases });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得進貨單列表失敗：' + err.message });
  }
});

// GET /api/purchases/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const purchase = await db.getPurchaseByID(id);
    if (purchase) {
      res.json({ success: true, data: purchase });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨單' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '取得進貨單失敗：' + err.message });
  }
});

// POST /api/purchases
router.post('/', async (req, res) => {
  const { supplier_id, supplier_name, purchase_date, total_amount, status, note, items } = req.body;
  if (!purchase_date) {
    return res.status(400).json({ success: false, message: '進貨日期為必填' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: '必須包含至少一筆進貨明細' });
  }
  
  try {
    const purchaseId = await db.createPurchase(req.body);
    res.status(201).json({ success: true, message: '進貨單建立成功！', purchaseId });
  } catch (err) {
    res.status(500).json({ success: false, message: '建立進貨單失敗：' + err.message });
  }
});

// PUT /api/purchases/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { purchase_date, items } = req.body;
  
  if (!purchase_date) {
    return res.status(400).json({ success: false, message: '進貨日期為必填' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: '必須包含至少一筆進貨明細' });
  }
  
  try {
    const success = await db.updatePurchase(id, req.body);
    if (success) {
      res.json({ success: true, message: '進貨單更新成功！' });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨單' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/purchases/:id/status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: '進貨單狀態為必填' });
  }
  try {
    const updated = await db.updatePurchaseStatus(id, status);
    if (updated) {
      res.json({ success: true, message: '狀態更新成功！', data: updated });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨單' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '更新狀態失敗：' + err.message });
  }
});

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deletePurchase(id);
    if (success) {
      res.json({ success: true, message: '進貨單刪除成功！' });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨單' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '刪除進貨單失敗：' + err.message });
  }
});

module.exports = router;
