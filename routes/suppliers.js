const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/suppliers
router.get('/', async (req, res) => {
  const { category, keyword } = req.query;
  try {
    const suppliers = await db.getSuppliers(category, keyword);
    res.json({ success: true, data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得進貨商列表失敗：' + err.message });
  }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ success: false, message: '進貨商名稱和類別為必填' });
  }
  try {
    const newSupplier = await db.addSupplier(req.body);
    res.status(201).json({ success: true, message: '進貨商新增成功！', data: newSupplier });
  } catch (err) {
    res.status(500).json({ success: false, message: '新增進貨商失敗：' + err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ success: false, message: '進貨商名稱和類別為必填' });
  }
  try {
    const updatedSupplier = await db.updateSupplier(id, req.body);
    if (updatedSupplier) {
      res.json({ success: true, message: '進貨商修改成功！', data: updatedSupplier });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨商' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '修改進貨商失敗：' + err.message });
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteSupplier(id);
    if (success) {
      res.json({ success: true, message: '進貨商刪除成功！' });
    } else {
      res.status(404).json({ success: false, message: '找不到指定的進貨商' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '刪除進貨商失敗：' + err.message });
  }
});

module.exports = router;
