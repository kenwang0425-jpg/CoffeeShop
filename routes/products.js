const express = require('express');
const router = express.Router();
const db = require('../config/db');

const VALID_CATEGORIES = ['咖啡豆', '掛耳包組', '周邊產品'];

// ─── 共用驗證 helper ───
function validateProductPayload(body, isEdit = false) {
  const errors = [];
  const {
    productID, category,
    origin, price_1, unit_1,
    price_2, price_3,
    originalPrice, salePrice,
    stock
  } = body;

  // ProductID (只在新增時驗證)
  if (!isEdit) {
    if (!productID || String(productID).trim() === '') {
      errors.push('商品編號為必填欄位。');
    }
  }

  // Category
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`商品類別為必填，且必須為下列之一：${VALID_CATEGORIES.join('、')}。`);
  }

  // 咖啡豆必須填產區
  if (category === '咖啡豆') {
    if (!origin || String(origin).trim() === '') {
      errors.push('咖啡豆類別必須填寫「產區 (Origin)」。');
    }
  }

  // 至少要有規格 1 且價格 > 0
  if (!unit_1 || String(unit_1).trim() === '') {
    errors.push('至少需要填寫「規格一」的名稱。');
  }
  const numPrice1 = Number(price_1);
  if (price_1 === undefined || price_1 === null || price_1 === '' || isNaN(numPrice1) || numPrice1 <= 0) {
    errors.push('「規格一」的價格為必填且必須大於 0。');
  }

  // 規格 2、3 若有填價格則必須 > 0
  if (price_2 !== undefined && price_2 !== null && price_2 !== '') {
    const n = Number(price_2);
    if (isNaN(n) || n <= 0) errors.push('「規格二」的價格若填寫則必須大於 0。');
  }
  if (price_3 !== undefined && price_3 !== null && price_3 !== '') {
    const n = Number(price_3);
    if (isNaN(n) || n <= 0) errors.push('「規格三」的價格若填寫則必須大於 0。');
  }

  // 原價與特價
  if (originalPrice !== undefined && originalPrice !== null && originalPrice !== '') {
    const n = Number(originalPrice);
    if (isNaN(n) || n <= 0) errors.push('原價若填寫則必須大於 0。');
    if (salePrice !== undefined && salePrice !== null && salePrice !== '') {
      const s = Number(salePrice);
      if (isNaN(s) || s <= 0) errors.push('特價若填寫則必須大於 0。');
      else if (s > n) errors.push('特價不能高於原價。');
    }
  }

  // 規格庫存（各规格若有填寫則必須為整數 >= 0）
  const stockFields = [
    { key: 'stock_1', label: '規格一庫存' },
    { key: 'stock_2', label: '規格二庫存' },
    { key: 'stock_3', label: '規格三庫存' }
  ];
  for (const { key, label } of stockFields) {
    const v = body[key];
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v);
      if (isNaN(n) || !Number.isInteger(n) || n < 0) {
        errors.push(`「${label}」必須為大於等於 0 的整數。`);
      }
    }
  }

  // 掛耳包配方
  if (category === '掛耳包組' && body.recipes) {
    if (!Array.isArray(body.recipes)) {
      errors.push('配方必須為陣列格式。');
    } else {
      const subIDs = new Set();
      for (const r of body.recipes) {
        if (!r.subProductID) {
          errors.push('配方缺少咖啡豆編號。');
          break;
        }
        if (subIDs.has(r.subProductID)) {
          errors.push('配方中不可選擇重複的咖啡豆。');
          break;
        }
        subIDs.add(r.subProductID);
        
        const q = Number(r.quantity);
        if (isNaN(q) || !Number.isInteger(q) || q <= 0) {
          errors.push('配方數量必須為大於 0 的整數。');
          break;
        }
      }
    }
  }

  return errors;
}

// ─── 從 request body 建立乾淨的 product 物件 ───
function buildProductObject(body, productID) {
  const toNum   = v => (v !== undefined && v !== null && v !== '') ? Number(v) : null;
  const toStr   = v => (v !== undefined && v !== null && v !== '') ? String(v).trim() : null;
  const toBool  = v => v === true || v === 'true' || v === 1 || v === '1';
  const toStockInt = v => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : Math.max(0, Math.floor(n));
  };

  const obj = {
    productID:         productID || String(body.productID).trim(),
    category:          body.category,
    origin:            toStr(body.origin),
    estate:            toStr(body.estate),
    name:              toStr(body.name),
    processMethod:     toStr(body.processMethod),
    brand:             toStr(body.brand),
    packageNotes:      toStr(body.packageNotes),
    unit_1:            toStr(body.unit_1),  price_1: toNum(body.price_1),
    stock_1:           toStockInt(body.stock_1),
    stock_unit_1:      toStr(body.stock_unit_1),
    unit_2:            toStr(body.unit_2),  price_2: toNum(body.price_2),
    stock_2:           toStockInt(body.stock_2),
    stock_unit_2:      toStr(body.stock_unit_2),
    unit_3:            toStr(body.unit_3),  price_3: toNum(body.price_3),
    stock_3:           toStockInt(body.stock_3),
    stock_unit_3:      toStr(body.stock_unit_3),
    originalPrice:     toNum(body.originalPrice),
    salePrice:         toNum(body.salePrice),
    flavorDescription: toStr(body.flavorDescription),
    // 全域 stock 保留（從規格一庫存派生，骗走 fallback）
    stock:             toStockInt(body.stock_1) ?? 0,
    isLimited:         toBool(body.isLimited),
    recipes:           Array.isArray(body.recipes) ? body.recipes.map(r => ({
                         subProductID: toStr(r.subProductID),
                         quantity: toNum(r.quantity)
                       })) : []
  };
  return obj;
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得產品列表失敗：' + err.message });
  }
});

// GET /api/products/:productID
router.get('/:productID', async (req, res) => {
  try {
    const product = await db.getProductByID(req.params.productID);
    if (!product) return res.status(404).json({ success: false, message: `找不到商品編號 ${req.params.productID}` });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: '取得產品資料失敗：' + err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  const errors = validateProductPayload(req.body, false);
  if (errors.length > 0) return res.status(400).json({ success: false, message: errors[0], errors });

  const cleanID = String(req.body.productID).trim();

  try {
    if (await db.isProductIDExists(cleanID)) {
      return res.status(400).json({ success: false, message: `商品編號「${cleanID}」已存在，不可重複。` });
    }
    const newProduct = buildProductObject(req.body, cleanID);
    await db.addProduct(newProduct);
    res.status(201).json({ success: true, message: '商品新增成功！', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: '儲存商品時發生錯誤：' + err.message });
  }
});

// PUT /api/products/:productID
router.put('/:productID', async (req, res) => {
  const { productID } = req.params;
  const errors = validateProductPayload(req.body, true);
  if (errors.length > 0) return res.status(400).json({ success: false, message: errors[0], errors });

  try {
    if (!(await db.isProductIDExists(productID))) {
      return res.status(404).json({ success: false, message: `找不到商品編號 ${productID}，無法修改。` });
    }
    const updatedProduct = buildProductObject(req.body, productID);
    const success = await db.updateProduct(productID, updatedProduct);
    if (success) {
      res.json({ success: true, message: '商品修改成功！', data: updatedProduct });
    } else {
      res.status(500).json({ success: false, message: '商品修改失敗。' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '更新商品時發生錯誤：' + err.message });
  }
});

// DELETE /api/products/:productID
router.delete('/:productID', async (req, res) => {
  const { productID } = req.params;
  try {
    if (!(await db.isProductIDExists(productID))) {
      return res.status(404).json({ success: false, message: `找不到商品編號 ${productID}，無法刪除。` });
    }
    const success = await db.deleteProduct(productID);
    if (success) {
      res.json({ success: true, message: `商品 ${productID} 已成功刪除！` });
    } else {
      res.status(500).json({ success: false, message: '商品刪除失敗。' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: '刪除商品時發生錯誤：' + err.message });
  }
});

module.exports = router;
