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
    isLimited: true,
    recipes: [
      { subProductID: 'CO135', quantity: 2 },
      { subProductID: 'CO246', quantity: 2 },
      { subProductID: 'CO379', quantity: 2 }
    ]
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
    isLimited: true,
    recipes: []
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

let mockOrderingGuide = {
  mainDescription: '可直接到店訂購(桃園市中壢區庄敬路811巷12號1樓)...',
  items: [
    { stepNumber: 1, title: '1.請加line訂購', content: 'Line id: goodcafe' },
    { stepNumber: 2, title: '2.選擇寄送方式', content: '可選擇超商店到店或宅配' },
    { stepNumber: 3, title: '3.確認訂單', content: '我們會與您確認訂單內容與金額' },
    { stepNumber: 4, title: '4.匯款後出貨', content: '請於確認後兩日內匯款' }
  ]
};

let mockBusinessHours = {
  announcement: '',
  days: [
    { dayOfWeek: 1, isOpen: false, slots: [] },
    { dayOfWeek: 2, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] },
    { dayOfWeek: 3, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] },
    { dayOfWeek: 4, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] },
    { dayOfWeek: 5, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] },
    { dayOfWeek: 6, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] },
    { dayOfWeek: 7, isOpen: true, slots: [{ startTime: '11:00', endTime: '14:30' }, { startTime: '17:00', endTime: '21:00' }] }
  ]
};

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
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DripBagRecipes' AND xtype='U')
      CREATE TABLE DripBagRecipes (
        ParentProductID VARCHAR(20) NOT NULL,
        SubProductID    VARCHAR(20) NOT NULL,
        Quantity        INT NOT NULL DEFAULT 2,
        PRIMARY KEY (ParentProductID, SubProductID)
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderingGuide' AND xtype='U')
      CREATE TABLE OrderingGuide (
        GuideID INT NOT NULL PRIMARY KEY,
        MainDescription NVARCHAR(MAX) NULL
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderingGuideItems' AND xtype='U')
      CREATE TABLE OrderingGuideItems (
        ItemID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        StepNumber INT NOT NULL,
        Title NVARCHAR(255) NULL,
        Content NVARCHAR(MAX) NULL
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessAnnouncement' AND xtype='U')
      CREATE TABLE BusinessAnnouncement (
        AnnouncementID INT NOT NULL PRIMARY KEY,
        Content NVARCHAR(MAX) NULL
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessHours' AND xtype='U')
      CREATE TABLE BusinessHours (
        DayOfWeek INT NOT NULL PRIMARY KEY,
        IsOpen BIT NOT NULL DEFAULT 1
      );

      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessHourSlots' AND xtype='U')
      CREATE TABLE BusinessHourSlots (
        SlotID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        DayOfWeek INT NOT NULL,
        StartTime VARCHAR(5) NOT NULL,
        EndTime VARCHAR(5) NOT NULL
      );
    `;
    await pool.request().query(createTableQuery);

    // 寫入預設測試資料 (若不存在)
    const initDataQuery = `
      IF NOT EXISTS (SELECT * FROM OrderingGuide WHERE GuideID = 1)
      BEGIN
        INSERT INTO OrderingGuide (GuideID, MainDescription)
        VALUES (1, N'桃子');

        INSERT INTO OrderingGuideItems (StepNumber, Title, Content)
        VALUES (1, N'請加 line 訂購', N'Line id: goodcafe');
      END

      IF NOT EXISTS (SELECT * FROM BusinessAnnouncement WHERE AnnouncementID = 1)
      BEGIN
        INSERT INTO BusinessAnnouncement (AnnouncementID, Content) VALUES (1, N'');
        INSERT INTO BusinessHours (DayOfWeek, IsOpen) VALUES (1, 0), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1);
        DECLARE @day INT = 2;
        WHILE @day <= 7
        BEGIN
          INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime) VALUES (@day, '11:00', '14:30'), (@day, '17:00', '21:00');
          SET @day = @day + 1;
        END
      END
    `;
    await pool.request().query(initDataQuery);

    console.log('📋 [Database] Products, DripBagRecipes, OrderingGuide & BusinessHours 資料表確認完畢。');
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

// 補齊配方並自動組裝FlavorDescription
async function populateRecipes(products) {
  const dripBags = products.filter(p => p.category === '掛耳包組');
  if (dripBags.length === 0) return products;

  if (pool) {
    try {
      const parentIDs = dripBags.map(p => `'${p.productID}'`).join(',');
      const result = await pool.request().query(`
        SELECT r.ParentProductID, r.SubProductID, r.Quantity,
               p.Origin, p.Estate, p.Name, p.ProcessMethod, p.FlavorDescription
        FROM DripBagRecipes r
        JOIN Products p ON r.SubProductID = p.ProductID
        WHERE r.ParentProductID IN (${parentIDs})
      `);
      
      const recipeMap = {};
      result.recordset.forEach(row => {
        if (!recipeMap[row.ParentProductID]) recipeMap[row.ParentProductID] = [];
        recipeMap[row.ParentProductID].push({
          subProductID:      row.SubProductID,
          quantity:          row.Quantity,
          origin:            row.Origin,
          estate:            row.Estate,
          name:              row.Name,
          processMethod:     row.ProcessMethod,
          flavorDescription: row.FlavorDescription
        });
      });

      dripBags.forEach(p => {
        p.recipes = recipeMap[p.productID] || [];
        if (p.recipes.length > 0) {
          const parts = p.recipes.map(r => {
            const beanName = [r.origin, r.estate, r.name, r.processMethod].filter(Boolean).join(' ');
            return `${beanName}(${r.quantity}包)`;
          });
          p.flavorDescription = `內含 ${parts.join('、')}`;
        }
      });
      return products;
    } catch (err) {
      console.error('SQL Server 查詢 recipes 錯誤:', err.message);
    }
  }

  // Memory mode
  dripBags.forEach(p => {
    p.recipes = p.recipes || [];
    if (p.recipes.length > 0) {
      p.recipes = p.recipes.map(r => {
        const bean = mockProducts.find(m => m.productID === r.subProductID);
        return bean ? {
          subProductID:      r.subProductID,
          quantity:          r.quantity,
          origin:            bean.origin,
          estate:            bean.estate,
          name:              bean.name,
          processMethod:     bean.processMethod,
          flavorDescription: bean.flavorDescription
        } : r;
      });
    }
  });

  return products;
}

// 取得產品列表
async function getProducts() {
  let products = null;
  if (pool) {
    try {
      const result = await pool.request().query('SELECT * FROM Products ORDER BY Category, ProductID');
      products = result.recordset.map(mapRecord);
    } catch (err) {
      console.error('SQL Server 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  if (!products) {
    products = JSON.parse(JSON.stringify(mockProducts));
  }
  return await populateRecipes(products);
}

// 取得單一產品
async function getProductByID(productID) {
  let product = null;
  if (pool) {
    try {
      const result = await pool.request()
        .input('productID', mssql.NVarChar(20), productID)
        .query('SELECT * FROM Products WHERE ProductID = @productID');
      if (result.recordset[0]) {
        product = mapRecord(result.recordset[0]);
      }
    } catch (err) {
      console.error('SQL Server 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  if (!product) {
    const mock = mockProducts.find(p => p.productID.toLowerCase() === productID.toLowerCase());
    if (mock) product = JSON.parse(JSON.stringify(mock));
  }

  if (product) {
    const populated = await populateRecipes([product]);
    return populated[0];
  }
  return null;
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
      
      // 新增 Recipe
      if (product.category === '掛耳包組' && product.recipes && product.recipes.length > 0) {
        for (const r of product.recipes) {
          await pool.request()
            .input('parentID', mssql.VarChar(20), product.productID)
            .input('subID', mssql.VarChar(20), r.subProductID)
            .input('qty', mssql.Int, r.quantity || 2)
            .query(`INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity) VALUES (@parentID, @subID, @qty)`);
        }
      }
      return;
    } catch (err) {
      console.error('SQL Server 新增錯誤，寫入記憶體陣列代替:', err.message);
    }
  }
  mockProducts.push(JSON.parse(JSON.stringify(product)));
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
      
      // 更新 Recipe
      if (updated.category === '掛耳包組') {
        // 刪除舊配方
        await pool.request()
          .input('parentID', mssql.VarChar(20), productID)
          .query(`DELETE FROM DripBagRecipes WHERE ParentProductID=@parentID`);
        // 新增新配方
        if (updated.recipes && updated.recipes.length > 0) {
          for (const r of updated.recipes) {
            await pool.request()
              .input('parentID', mssql.VarChar(20), productID)
              .input('subID', mssql.VarChar(20), r.subProductID)
              .input('qty', mssql.Int, r.quantity || 2)
              .query(`INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity) VALUES (@parentID, @subID, @qty)`);
          }
        }
      }
      return result.rowsAffected[0] > 0 || (updated.category === '掛耳包組'); // if only recipe updated
    } catch (err) {
      console.error('SQL Server 修改錯誤，修改記憶體陣列代替:', err.message);
    }
  }

  const idx = mockProducts.findIndex(p => p.productID.toLowerCase() === productID.toLowerCase());
  if (idx !== -1) {
    mockProducts[idx] = JSON.parse(JSON.stringify({ productID, ...updated }));
    return true;
  }
  return false;
}

// 刪除產品
async function deleteProduct(productID) {
  if (pool) {
    try {
      // 刪除關聯配方
      await pool.request()
        .input('productID', mssql.NVarChar(20), productID)
        .query('DELETE FROM DripBagRecipes WHERE ParentProductID = @productID OR SubProductID = @productID');

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

// ============================================================
// Ordering Guide 相關操作
// ============================================================

async function getOrderingGuide() {
  if (pool) {
    try {
      const guideResult = await pool.request().query('SELECT MainDescription FROM OrderingGuide WHERE GuideID = 1');
      const itemsResult = await pool.request().query('SELECT StepNumber, Title, Content FROM OrderingGuideItems ORDER BY StepNumber ASC');
      
      return {
        mainDescription: guideResult.recordset[0] ? guideResult.recordset[0].MainDescription : '',
        items: itemsResult.recordset.map(row => ({
          stepNumber: row.StepNumber,
          title: row.Title,
          content: row.Content
        }))
      };
    } catch (err) {
      console.error('SQL Server OrderingGuide 查詢錯誤，使用記憶體變數代替:', err.message);
    }
  }
  return JSON.parse(JSON.stringify(mockOrderingGuide));
}

async function saveOrderingGuide(data) {
  if (pool) {
    const transaction = new mssql.Transaction(pool);
    try {
      await transaction.begin();
      const req = transaction.request();
      
      // 1. 更新主說明
      await req.input('desc', mssql.NVarChar(mssql.MAX), data.mainDescription || '')
               .query(`
                 IF EXISTS (SELECT * FROM OrderingGuide WHERE GuideID = 1)
                   UPDATE OrderingGuide SET MainDescription = @desc WHERE GuideID = 1;
                 ELSE
                   INSERT INTO OrderingGuide (GuideID, MainDescription) VALUES (1, @desc);
               `);

      // 2. 清除舊項目並寫入新項目
      await req.query('DELETE FROM OrderingGuideItems');
      
      if (data.items && Array.isArray(data.items)) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          const insertReq = transaction.request();
          await insertReq
            .input('step', mssql.Int, item.stepNumber || (i + 1))
            .input('title', mssql.NVarChar(255), item.title || '')
            .input('content', mssql.NVarChar(mssql.MAX), item.content || '')
            .query('INSERT INTO OrderingGuideItems (StepNumber, Title, Content) VALUES (@step, @title, @content)');
        }
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error('SQL Server OrderingGuide 更新錯誤，更新記憶體變數代替:', err.message);
    }
  }
  mockOrderingGuide = JSON.parse(JSON.stringify(data));
  return true;
}

// ============================================================
// Business Hours 相關操作
// ============================================================

async function getBusinessHours() {
  if (pool) {
    try {
      const annResult = await pool.request().query('SELECT Content FROM BusinessAnnouncement WHERE AnnouncementID = 1');
      const hoursResult = await pool.request().query('SELECT DayOfWeek, IsOpen FROM BusinessHours ORDER BY DayOfWeek ASC');
      const slotsResult = await pool.request().query('SELECT DayOfWeek, StartTime, EndTime FROM BusinessHourSlots ORDER BY DayOfWeek ASC, StartTime ASC');
      
      const announcement = annResult.recordset[0] ? (annResult.recordset[0].Content || '') : '';
      const days = [];
      
      for (let i = 1; i <= 7; i++) {
        const hourRow = hoursResult.recordset.find(r => r.DayOfWeek === i);
        const slotsRow = slotsResult.recordset.filter(r => r.DayOfWeek === i);
        
        days.push({
          dayOfWeek: i,
          isOpen: hourRow ? hourRow.IsOpen : false,
          slots: slotsRow.map(s => ({ startTime: s.StartTime, endTime: s.EndTime }))
        });
      }
      
      return { announcement, days };
    } catch (err) {
      console.error('SQL Server BusinessHours 查詢錯誤，使用記憶體變數代替:', err.message);
    }
  }
  return JSON.parse(JSON.stringify(mockBusinessHours));
}

async function saveBusinessHours(data) {
  if (pool) {
    const transaction = new mssql.Transaction(pool);
    try {
      await transaction.begin();
      const req = transaction.request();
      
      // 更新公告
      await req.input('content', mssql.NVarChar(mssql.MAX), data.announcement || '')
               .query(`
                 IF EXISTS (SELECT * FROM BusinessAnnouncement WHERE AnnouncementID = 1)
                   UPDATE BusinessAnnouncement SET Content = @content WHERE AnnouncementID = 1;
                 ELSE
                   INSERT INTO BusinessAnnouncement (AnnouncementID, Content) VALUES (1, @content);
               `);

      // 清除舊資料
      await req.query('DELETE FROM BusinessHours');
      await req.query('DELETE FROM BusinessHourSlots');
      
      if (data.days && Array.isArray(data.days)) {
        for (const day of data.days) {
          const dayReq = transaction.request();
          await dayReq
            .input('day', mssql.Int, day.dayOfWeek)
            .input('isOpen', mssql.Bit, day.isOpen ? 1 : 0)
            .query('INSERT INTO BusinessHours (DayOfWeek, IsOpen) VALUES (@day, @isOpen)');
            
          if (day.isOpen && day.slots && Array.isArray(day.slots)) {
            for (const slot of day.slots) {
              if (slot.startTime && slot.endTime) {
                const slotReq = transaction.request();
                await slotReq
                  .input('day', mssql.Int, day.dayOfWeek)
                  .input('start', mssql.VarChar(5), slot.startTime)
                  .input('end', mssql.VarChar(5), slot.endTime)
                  .query('INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime) VALUES (@day, @start, @end)');
              }
            }
          }
        }
      }

      await transaction.commit();
      return true;
    } catch (err) {
      await transaction.rollback();
      console.error('SQL Server BusinessHours 更新錯誤，更新記憶體變數代替:', err.message);
    }
  }
  mockBusinessHours = JSON.parse(JSON.stringify(data));
  return true;
}

// ============================================================
// Storefront 前台專用查詢
// ============================================================

// 依大類撈取商品（category: '咖啡豆' | '掛耳包組' | '周邊產品' | null 回傳全部）
async function getProductsByCategory(category) {
  let products = null;
  if (pool) {
    try {
      let query = 'SELECT * FROM Products';
      const request = pool.request();
      if (category) {
        query += ' WHERE Category = @category';
        request.input('category', mssql.NVarChar(20), category);
      }
      query += ' ORDER BY Category, ProductID';
      const result = await request.query(query);
      products = result.recordset.map(mapRecord);
    } catch (err) {
      console.error('SQL Server getProductsByCategory 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  if (!products) {
    products = JSON.parse(JSON.stringify(mockProducts));
    if (category) {
      products = products.filter(p => p.category === category);
    }
  }
  return await populateRecipes(products);
}

// 動態撈取咖啡豆的 origin 與 processMethod 清單（GROUP BY）
async function getCoffeeBeanFilters() {
  if (pool) {
    try {
      const originResult = await pool.request().query(
        `SELECT DISTINCT Origin FROM Products WHERE Category = N'咖啡豆' AND Origin IS NOT NULL ORDER BY Origin`
      );
      const processResult = await pool.request().query(
        `SELECT DISTINCT ProcessMethod FROM Products WHERE Category = N'咖啡豆' AND ProcessMethod IS NOT NULL ORDER BY ProcessMethod`
      );
      return {
        origins: originResult.recordset.map(r => r.Origin).filter(Boolean),
        processMethods: processResult.recordset.map(r => r.ProcessMethod).filter(Boolean)
      };
    } catch (err) {
      console.error('SQL Server getCoffeeBeanFilters 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }
  // Memory mode
  const beans = mockProducts.filter(p => p.category === '咖啡豆');
  const origins = [...new Set(beans.map(p => p.origin).filter(Boolean))].sort();
  const processMethods = [...new Set(beans.map(p => p.processMethod).filter(Boolean))].sort();
  return { origins, processMethods };
}

module.exports = { 
  initializeDB, 
  getProducts, getProductByID, isProductIDExists, addProduct, updateProduct, deleteProduct,
  getOrderingGuide, saveOrderingGuide,
  getBusinessHours, saveBusinessHours,
  getProductsByCategory, getCoffeeBeanFilters
};
