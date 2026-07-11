const mssql = require('mssql');
require('dotenv').config();

const dbEnabled = process.env.DB_ENABLED === 'true';

// ============================================================
// 記憶體模擬資料庫 - 支援三大商品類別
// ============================================================
let mockProducts = [
  // ─── 咖啡豆 ───
  {
    productID: 'CO135',
    category: '咖啡豆',
    origin: '衣索比亞',
    estate: '耶加雪菲 歌迪貝 艾瑞莎',
    name: null,
    processMethod: '日曬',
    brand: null,
    packageNotes: null,
    unit_1: '半磅', price_1: 380,
    unit_2: '一磅', price_2: 700,
    unit_3: '耳掛', price_3: 45,
    originalPrice: null,
    salePrice: null,
    flavorDescription: '藍莓、水蜜桃、茉莉花香、佛手柑與蜂蜜甜感，層次豐富明亮。',
    stock: 50,
    isLimited: false
  },
  {
    productID: 'CO246',
    category: '咖啡豆',
    origin: '巴拿馬',
    estate: '波奎特 翡翠莊園 藍標葛夏',
    name: null,
    processMethod: '水洗',
    brand: null,
    packageNotes: null,
    unit_1: '半磅', price_1: 950,
    unit_2: '一磅', price_2: 1800,
    unit_3: '耳掛', price_3: 100,
    originalPrice: null,
    salePrice: null,
    flavorDescription: '經典茉莉花香、檸檬、柑橘、白葡萄、佛手柑氣息，明亮多汁的酸質。',
    stock: 25,
    isLimited: false
  },
  {
    productID: 'CO379',
    category: '咖啡豆',
    origin: '哥倫比亞',
    estate: '聖芭芭拉莊園 模範生',
    name: null,
    processMethod: '水洗',
    brand: null,
    packageNotes: null,
    unit_1: '半磅', price_1: 320,
    unit_2: '一磅', price_2: 600,
    unit_3: '耳掛', price_3: 35,
    originalPrice: null,
    salePrice: null,
    flavorDescription: '榛果、焦糖甜感、可可風味、酸度圓潤低沉、餘韻悠長。',
    stock: 80,
    isLimited: false
  },
  // ─── 掛耳包組 ───
  {
    productID: 'DP001',
    category: '掛耳包組',
    origin: null, estate: null, name: null, processMethod: null,
    brand: '中烘焙',
    packageNotes: '10包/組，內含5種精品豆各2包',
    unit_1: '每組', price_1: 185,
    unit_2: null, price_2: null,
    unit_3: null, price_3: null,
    originalPrice: null,
    salePrice: null,
    flavorDescription: '綜合烘焙，堅果醇厚、焦糖甜感，適合喜愛濃醇口感的您。',
    stock: 30,
    isLimited: true
  },
  {
    productID: 'DP002',
    category: '掛耳包組',
    origin: null, estate: null, name: null, processMethod: null,
    brand: '中淺焙',
    packageNotes: '10包/組，內含5種精品豆各2包',
    unit_1: '每組', price_1: 195,
    unit_2: null, price_2: null,
    unit_3: null, price_3: null,
    originalPrice: null,
    salePrice: null,
    flavorDescription: '水果酸甜、優雅花香，適合喜愛清爽明亮口感的您。',
    stock: 20,
    isLimited: true
  },
  // ─── 周邊產品 ───
  {
    productID: 'ACC001',
    category: '周邊產品',
    origin: null, estate: null, name: null, processMethod: null,
    brand: 'KAKAMA COFFEE',
    packageNotes: null,
    unit_1: '個', price_1: 280,
    unit_2: null, price_2: null,
    unit_3: null, price_3: null,
    originalPrice: 350,
    salePrice: 280,
    flavorDescription: 'KAKAMA COFFEE 自家品牌濾紙，專為手沖設計，配合V60使用效果最佳。',
    stock: 100,
    isLimited: false
  }
];

// ============================================================
// SQL Server 連線設定
// ============================================================
const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrongPassword123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'ProductDB',
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

let pool = null;

// 初始化資料庫
async function initializeDB() {
  if (!dbEnabled) {
    console.log('⚠️ [Database] SQL Server 尚未啟用，使用「本地記憶體陣列」模擬資料庫。');
    return;
  }

  try {
    console.log(`🔌 [Database] 嘗試連接至 SQL Server (${sqlConfig.server}:${sqlConfig.port})...`);
    pool = await mssql.connect(sqlConfig);
    console.log('✅ [Database] SQL Server 連線成功！');

    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
      CREATE TABLE Products (
        ProductID        NVARCHAR(20)   NOT NULL PRIMARY KEY,
        Category         NVARCHAR(20)   NOT NULL,
        Origin           NVARCHAR(100)  NULL,
        Estate           NVARCHAR(255)  NULL,
        Name             NVARCHAR(255)  NULL,
        ProcessMethod    NVARCHAR(100)  NULL,
        Brand            NVARCHAR(255)  NULL,
        PackageNotes     NVARCHAR(500)  NULL,
        Unit_1           NVARCHAR(50)   NULL,
        Price_1          DECIMAL(10,0)  NULL,
        Unit_2           NVARCHAR(50)   NULL,
        Price_2          DECIMAL(10,0)  NULL,
        Unit_3           NVARCHAR(50)   NULL,
        Price_3          DECIMAL(10,0)  NULL,
        OriginalPrice    DECIMAL(10,0)  NULL,
        SalePrice        DECIMAL(10,0)  NULL,
        FlavorDescription NVARCHAR(MAX) NULL,
        Stock            INT            NOT NULL DEFAULT 0,
        IsLimited        BIT            NOT NULL DEFAULT 0
      )
    `;
    await pool.request().query(createTableQuery);
    console.log('📋 [Database] Products 資料表確認完畢（新版多類別 Schema）。');
  } catch (err) {
    console.error('❌ [Database] SQL Server 連線失敗，自動降級使用「本地記憶體陣列」模式。錯誤原因:', err.message);
    pool = null;
  }
}

// ─── helper: 將 SQL recordset 欄位名轉換為 camelCase ───
function mapRecord(r) {
  return {
    productID:         r.ProductID,
    category:          r.Category,
    origin:            r.Origin,
    estate:            r.Estate,
    name:              r.Name,
    processMethod:     r.ProcessMethod,
    brand:             r.Brand,
    packageNotes:      r.PackageNotes,
    unit_1:            r.Unit_1,  price_1: r.Price_1 !== null ? Number(r.Price_1) : null,
    unit_2:            r.Unit_2,  price_2: r.Price_2 !== null ? Number(r.Price_2) : null,
    unit_3:            r.Unit_3,  price_3: r.Price_3 !== null ? Number(r.Price_3) : null,
    originalPrice:     r.OriginalPrice !== null ? Number(r.OriginalPrice) : null,
    salePrice:         r.SalePrice !== null ? Number(r.SalePrice) : null,
    flavorDescription: r.FlavorDescription,
    stock:             r.Stock,
    isLimited:         !!r.IsLimited
  };
}

// 取得產品列表
async function getProducts() {
  if (pool) {
    try {
      const result = await pool.request().query('SELECT * FROM Products ORDER BY Category, ProductID');
      return result.recordset.map(mapRecord);
    } catch (err) {
      console.error('SQL Server 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  return [...mockProducts];
}

// 取得單一產品
async function getProductByID(productID) {
  if (pool) {
    try {
      const result = await pool.request()
        .input('productID', mssql.NVarChar(20), productID)
        .query('SELECT * FROM Products WHERE ProductID = @productID');
      return result.recordset[0] ? mapRecord(result.recordset[0]) : null;
    } catch (err) {
      console.error('SQL Server 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  return mockProducts.find(p => p.productID.toLowerCase() === productID.toLowerCase()) || null;
}

// 檢查產品編號是否已存在
async function isProductIDExists(productID) {
  return (await getProductByID(productID)) !== null;
}

// 新增產品
async function addProduct(product) {
  if (pool) {
    try {
      await pool.request()
        .input('productID',        mssql.NVarChar(20),         product.productID)
        .input('category',         mssql.NVarChar(20),         product.category)
        .input('origin',           mssql.NVarChar(100),        product.origin || null)
        .input('estate',           mssql.NVarChar(255),        product.estate || null)
        .input('name',             mssql.NVarChar(255),        product.name || null)
        .input('processMethod',    mssql.NVarChar(100),        product.processMethod || null)
        .input('brand',            mssql.NVarChar(255),        product.brand || null)
        .input('packageNotes',     mssql.NVarChar(500),        product.packageNotes || null)
        .input('unit_1',           mssql.NVarChar(50),         product.unit_1 || null)
        .input('price_1',          mssql.Decimal(10, 0),       product.price_1 || null)
        .input('unit_2',           mssql.NVarChar(50),         product.unit_2 || null)
        .input('price_2',          mssql.Decimal(10, 0),       product.price_2 || null)
        .input('unit_3',           mssql.NVarChar(50),         product.unit_3 || null)
        .input('price_3',          mssql.Decimal(10, 0),       product.price_3 || null)
        .input('originalPrice',    mssql.Decimal(10, 0),       product.originalPrice || null)
        .input('salePrice',        mssql.Decimal(10, 0),       product.salePrice || null)
        .input('flavorDescription',mssql.NVarChar(mssql.MAX),  product.flavorDescription || null)
        .input('stock',            mssql.Int,                  product.stock ?? 0)
        .input('isLimited',        mssql.Bit,                  product.isLimited ? 1 : 0)
        .query(`INSERT INTO Products
          (ProductID,Category,Origin,Estate,Name,ProcessMethod,Brand,PackageNotes,
           Unit_1,Price_1,Unit_2,Price_2,Unit_3,Price_3,
           OriginalPrice,SalePrice,FlavorDescription,Stock,IsLimited)
          VALUES
          (@productID,@category,@origin,@estate,@name,@processMethod,@brand,@packageNotes,
           @unit_1,@price_1,@unit_2,@price_2,@unit_3,@price_3,
           @originalPrice,@salePrice,@flavorDescription,@stock,@isLimited)`);
      return;
    } catch (err) {
      console.error('SQL Server 新增錯誤，寫入記憶體陣列代替:', err.message);
    }
  }
  mockProducts.push({ ...product });
}

// 修改產品
async function updateProduct(productID, updated) {
  if (pool) {
    try {
      const result = await pool.request()
        .input('productID',        mssql.NVarChar(20),         productID)
        .input('category',         mssql.NVarChar(20),         updated.category)
        .input('origin',           mssql.NVarChar(100),        updated.origin || null)
        .input('estate',           mssql.NVarChar(255),        updated.estate || null)
        .input('name',             mssql.NVarChar(255),        updated.name || null)
        .input('processMethod',    mssql.NVarChar(100),        updated.processMethod || null)
        .input('brand',            mssql.NVarChar(255),        updated.brand || null)
        .input('packageNotes',     mssql.NVarChar(500),        updated.packageNotes || null)
        .input('unit_1',           mssql.NVarChar(50),         updated.unit_1 || null)
        .input('price_1',          mssql.Decimal(10, 0),       updated.price_1 || null)
        .input('unit_2',           mssql.NVarChar(50),         updated.unit_2 || null)
        .input('price_2',          mssql.Decimal(10, 0),       updated.price_2 || null)
        .input('unit_3',           mssql.NVarChar(50),         updated.unit_3 || null)
        .input('price_3',          mssql.Decimal(10, 0),       updated.price_3 || null)
        .input('originalPrice',    mssql.Decimal(10, 0),       updated.originalPrice || null)
        .input('salePrice',        mssql.Decimal(10, 0),       updated.salePrice || null)
        .input('flavorDescription',mssql.NVarChar(mssql.MAX),  updated.flavorDescription || null)
        .input('stock',            mssql.Int,                  updated.stock ?? 0)
        .input('isLimited',        mssql.Bit,                  updated.isLimited ? 1 : 0)
        .query(`UPDATE Products SET
          Category=@category, Origin=@origin, Estate=@estate, Name=@name,
          ProcessMethod=@processMethod, Brand=@brand, PackageNotes=@packageNotes,
          Unit_1=@unit_1, Price_1=@price_1, Unit_2=@unit_2, Price_2=@price_2,
          Unit_3=@unit_3, Price_3=@price_3,
          OriginalPrice=@originalPrice, SalePrice=@salePrice,
          FlavorDescription=@flavorDescription, Stock=@stock, IsLimited=@isLimited
          WHERE ProductID=@productID`);
      return result.rowsAffected[0] > 0;
    } catch (err) {
      console.error('SQL Server 修改錯誤，修改記憶體陣列代替:', err.message);
    }
  }

  const idx = mockProducts.findIndex(p => p.productID.toLowerCase() === productID.toLowerCase());
  if (idx !== -1) {
    mockProducts[idx] = { productID, ...updated };
    return true;
  }
  return false;
}

// 刪除產品
async function deleteProduct(productID) {
  if (pool) {
    try {
      const result = await pool.request()
        .input('productID', mssql.NVarChar(20), productID)
        .query('DELETE FROM Products WHERE ProductID = @productID');
      return result.rowsAffected[0] > 0;
    } catch (err) {
      console.error('SQL Server 刪除錯誤，自記憶體陣列刪除代替:', err.message);
    }
  }
  const before = mockProducts.length;
  mockProducts = mockProducts.filter(p => p.productID.toLowerCase() !== productID.toLowerCase());
  return mockProducts.length < before;
}

module.exports = { initializeDB, getProducts, getProductByID, isProductIDExists, addProduct, updateProduct, deleteProduct };
