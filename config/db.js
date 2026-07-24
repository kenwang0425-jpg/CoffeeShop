const { Pool } = require('pg');
require('dotenv').config();

// 動態檢查開關與讀取連線設定
const isDbEnabled = () => process.env.DB_ENABLED === 'true';

const getPgConfig = () => ({
  user: process.env.DB_USER || 'kakama_admin',
  password: process.env.DB_PASSWORD || 'Ac*927gf',
  host: process.env.DB_HOST || '192.168.0.202',
  database: process.env.DB_DATABASE || 'kakama_coffee',
  port: parseInt(process.env.DB_PORT || '5433'),
});

// ============================================================
// 記憶體模擬資料庫 - 支援三大商品類別 (Fallback 備援用)
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

let pool = null;

// 初始化資料庫
async function initializeDB() {
  if (!isDbEnabled()) {
    console.log('⚠️ [Database] PostgreSQL 尚未啟用，使用「本地記憶體陣列」模擬資料庫。');
    return;
  }

  const pgConfig = getPgConfig();

  try {
    console.log(`🔌 [Database] 嘗試連接至 PostgreSQL (${pgConfig.host}:${pgConfig.port})...`);
    pool = new Pool(pgConfig);

    // 測試連線
    const client = await pool.connect();
    console.log('✅ [Database] PostgreSQL 連線成功！');
    client.release();

    // 建立資料表 (PostgreSQL 語法)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS Products (
        ProductID         VARCHAR(20)   NOT NULL PRIMARY KEY,
        Category          VARCHAR(20)   NOT NULL,
        Origin            VARCHAR(100)  NULL,
        Estate            VARCHAR(255)  NULL,
        Name              VARCHAR(255)  NULL,
        ProcessMethod     VARCHAR(100)  NULL,
        Brand             VARCHAR(255)  NULL,
        PackageNotes      VARCHAR(500)  NULL,
        Unit_1            VARCHAR(50)   NULL,
        Price_1           NUMERIC(10,0) NULL,
        Unit_2            VARCHAR(50)   NULL,
        Price_2           NUMERIC(10,0) NULL,
        Unit_3            VARCHAR(50)   NULL,
        Price_3           NUMERIC(10,0) NULL,
        OriginalPrice     NUMERIC(10,0) NULL,
        SalePrice         NUMERIC(10,0) NULL,
        FlavorDescription TEXT          NULL,
        Stock             INT           NOT NULL DEFAULT 0,
        IsLimited         BOOLEAN       NOT NULL DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS DripBagRecipes (
        ParentProductID VARCHAR(20) NOT NULL,
        SubProductID    VARCHAR(20) NOT NULL,
        Quantity        INT NOT NULL DEFAULT 2,
        PRIMARY KEY (ParentProductID, SubProductID)
      );

      CREATE TABLE IF NOT EXISTS OrderingGuide (
        GuideID INT NOT NULL PRIMARY KEY,
        MainDescription TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS OrderingGuideItems (
        ItemID SERIAL PRIMARY KEY,
        StepNumber INT NOT NULL,
        Title VARCHAR(255) NULL,
        Content TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS BusinessAnnouncement (
        AnnouncementID INT NOT NULL PRIMARY KEY,
        Content TEXT NULL
      );

      CREATE TABLE IF NOT EXISTS BusinessHours (
        DayOfWeek INT NOT NULL PRIMARY KEY,
        IsOpen BOOLEAN NOT NULL DEFAULT TRUE
      );

      CREATE TABLE IF NOT EXISTS BusinessHourSlots (
        SlotID SERIAL PRIMARY KEY,
        DayOfWeek INT NOT NULL,
        StartTime VARCHAR(5) NOT NULL,
        EndTime VARCHAR(5) NOT NULL
      );
    `;
    await pool.query(createTableQuery);

    // 寫入預設測試資料 (若不存在)
    // 寫入預設測試資料 (若不存在)
    const initDataQuery = `
      -- 1. 寫入預設商品 (咖啡豆、掛耳包組、周邊)
      INSERT INTO Products (ProductID, Category, Origin, Estate, Name, ProcessMethod, Brand, PackageNotes, Unit_1, Price_1, Unit_2, Price_2, Unit_3, Price_3, OriginalPrice, SalePrice, FlavorDescription, Stock, IsLimited)
      VALUES 
      ('CO135', '咖啡豆', '衣索比亞', '耶加雪菲 歌迪貝 艾瑞莎', NULL, '日曬', NULL, NULL, '半磅', 380, '一磅', 700, '耳掛', 45, NULL, NULL, '藍莓、水蜜桃、茉莉花香、佛手柑與蜂蜜甜感，層次豐富明亮。', 50, FALSE),
      ('CO246', '咖啡豆', '巴拿馬', '波奎特 翡翠莊園 藍標葛夏', NULL, '水洗', NULL, NULL, '半磅', 950, '一磅', 1800, '耳掛', 100, NULL, NULL, '經典茉莉花香、檸檬、柑橘、白葡萄、佛手柑氣息，明亮多汁的酸質。', 25, FALSE),
      ('CO379', '咖啡豆', '哥倫比亞', '聖芭芭拉莊園 模範生', NULL, '水洗', NULL, NULL, '半磅', 320, '一磅', 600, '耳掛', 35, NULL, NULL, '榛果、焦糖甜感、可可風味、酸度圓潤低沉、餘韻悠長。', 80, FALSE),
      ('DP001', '掛耳包組', NULL, NULL, NULL, NULL, '中烘焙', '10包/組，內含5種精品豆各2包', '每組', 185, NULL, NULL, NULL, NULL, NULL, NULL, '綜合烘焙，堅果醇厚、焦糖甜感，適合喜愛濃醇口感的您。', 30, TRUE),
      ('DP002', '掛耳包組', NULL, NULL, NULL, NULL, '中淺焙', '10包/組，內含5種精品豆各2包', '每組', 195, NULL, NULL, NULL, NULL, NULL, NULL, '水果酸甜、優雅花香，適合喜愛清爽明亮口感的您。', 20, TRUE),
      ('ACC001', '周邊產品', NULL, NULL, NULL, NULL, 'KAKAMA COFFEE', NULL, '個', 280, NULL, NULL, NULL, NULL, 350, 280, 'KAKAMA COFFEE 自家品牌濾紙，專為手沖設計，配合V60使用效果最佳。', 100, FALSE)
      ON CONFLICT (ProductID) DO NOTHING;

      -- 2. 寫入掛耳包配方
      INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity)
      VALUES 
      ('DP001', 'CO135', 2),
      ('DP001', 'CO246', 2),
      ('DP001', 'CO379', 2)
      ON CONFLICT (ParentProductID, SubProductID) DO NOTHING;

      -- 3. 寫入訂購須知與營業時間預設資料
      INSERT INTO OrderingGuide (GuideID, MainDescription)
      VALUES (1, '桃子')
      ON CONFLICT (GuideID) DO NOTHING;

      INSERT INTO OrderingGuideItems (StepNumber, Title, Content)
      SELECT 1, '請加 line 訂購', 'Line id: goodcafe'
      WHERE NOT EXISTS (SELECT 1 FROM OrderingGuideItems WHERE StepNumber = 1);

      INSERT INTO BusinessAnnouncement (AnnouncementID, Content)
      VALUES (1, '')
      ON CONFLICT (AnnouncementID) DO NOTHING;

      INSERT INTO BusinessHours (DayOfWeek, IsOpen)
      VALUES (1, FALSE), (2, TRUE), (3, TRUE), (4, TRUE), (5, TRUE), (6, TRUE), (7, TRUE)
      ON CONFLICT (DayOfWeek) DO NOTHING;

      INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime)
      SELECT d, '11:00', '14:30' FROM generate_series(2, 7) AS d
      WHERE NOT EXISTS (SELECT 1 FROM BusinessHourSlots WHERE StartTime = '11:00' AND EndTime = '14:30');

      INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime)
      SELECT d, '17:00', '21:00' FROM generate_series(2, 7) AS d
      WHERE NOT EXISTS (SELECT 1 FROM BusinessHourSlots WHERE StartTime = '17:00' AND EndTime = '21:00');
    `;
    await pool.query(initDataQuery);

    console.log('📋 [Database] Products, DripBagRecipes, OrderingGuide & BusinessHours 資料表確認完畢。');
  } catch (err) {
    console.error('❌ [Database] PostgreSQL 連線失敗，自動降級使用「本地記憶體陣列」模式。錯誤原因:', err.message);
    pool = null;
  }
}

// ─── helper: 將 Postgres recordset 欄位名轉為 camelCase ───
function mapRecord(r) {
  return {
    productID: r.productid || r.ProductID,
    category: r.category || r.Category,
    origin: r.origin || r.Origin,
    estate: r.estate || r.Estate,
    name: r.name || r.Name,
    processMethod: r.processmethod || r.ProcessMethod,
    brand: r.brand || r.Brand,
    packageNotes: r.packagenotes || r.PackageNotes,
    unit_1: r.unit_1 || r.Unit_1, price_1: (r.price_1 ?? r.Price_1) !== null ? Number(r.price_1 ?? r.Price_1) : null,
    unit_2: r.unit_2 || r.Unit_2, price_2: (r.price_2 ?? r.Price_2) !== null ? Number(r.price_2 ?? r.Price_2) : null,
    unit_3: r.unit_3 || r.Unit_3, price_3: (r.price_3 ?? r.Price_3) !== null ? Number(r.price_3 ?? r.Price_3) : null,
    originalPrice: (r.originalprice ?? r.OriginalPrice) !== null ? Number(r.originalprice ?? r.OriginalPrice) : null,
    salePrice: (r.saleprice ?? r.SalePrice) !== null ? Number(r.saleprice ?? r.SalePrice) : null,
    flavorDescription: r.flavordescription || r.FlavorDescription,
    stock: r.stock ?? r.Stock,
    isLimited: Boolean(r.islimited ?? r.IsLimited)
  };
}

// 補齊配方並自動組裝 FlavorDescription
async function populateRecipes(products) {
  const dripBags = products.filter(p => p.category === '掛耳包組');
  if (dripBags.length === 0) return products;

  if (pool) {
    try {
      const parentIDs = dripBags.map(p => `'${p.productID}'`).join(',');
      const result = await pool.query(`
        SELECT r.ParentProductID, r.SubProductID, r.Quantity,
               p.Origin, p.Estate, p.Name, p.ProcessMethod, p.FlavorDescription
        FROM DripBagRecipes r
        JOIN Products p ON r.SubProductID = p.ProductID
        WHERE r.ParentProductID IN (${parentIDs})
      `);

      const recipeMap = {};
      result.rows.forEach(row => {
        const parentID = row.parentproductid || row.ParentProductID;
        if (!recipeMap[parentID]) recipeMap[parentID] = [];
        recipeMap[parentID].push({
          subProductID: row.subproductid || row.SubProductID,
          quantity: row.quantity || row.Quantity,
          origin: row.origin || row.Origin,
          estate: row.estate || row.Estate,
          name: row.name || row.Name,
          processMethod: row.processmethod || row.ProcessMethod,
          flavorDescription: row.flavordescription || row.FlavorDescription
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
      console.error('PostgreSQL 查詢 recipes 錯誤:', err.message);
    }
  }

  // Memory mode
  dripBags.forEach(p => {
    p.recipes = p.recipes || [];
    if (p.recipes.length > 0) {
      p.recipes = p.recipes.map(r => {
        const bean = mockProducts.find(m => m.productID === r.subProductID);
        return bean ? {
          subProductID: r.subProductID,
          quantity: r.quantity,
          origin: bean.origin,
          estate: bean.estate,
          name: bean.name,
          processMethod: bean.processMethod,
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
      const result = await pool.query('SELECT * FROM Products ORDER BY Category, ProductID');
      products = result.rows.map(mapRecord);
    } catch (err) {
      console.error('PostgreSQL 查詢錯誤，使用記憶體陣列代替:', err.message);
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
      const result = await pool.query('SELECT * FROM Products WHERE ProductID = $1', [productID]);
      if (result.rows[0]) {
        product = mapRecord(result.rows[0]);
      }
    } catch (err) {
      console.error('PostgreSQL 查詢錯誤，使用記憶體陣列代替:', err.message);
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
      const query = `
        INSERT INTO Products
        (ProductID, Category, Origin, Estate, Name, ProcessMethod, Brand, PackageNotes,
         Unit_1, Price_1, Unit_2, Price_2, Unit_3, Price_3,
         OriginalPrice, SalePrice, FlavorDescription, Stock, IsLimited)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `;
      const values = [
        product.productID,
        product.category,
        product.origin || null,
        product.estate || null,
        product.name || null,
        product.processMethod || null,
        product.brand || null,
        product.packageNotes || null,
        product.unit_1 || null,
        product.price_1 || null,
        product.unit_2 || null,
        product.price_2 || null,
        product.unit_3 || null,
        product.price_3 || null,
        product.originalPrice || null,
        product.salePrice || null,
        product.flavorDescription || null,
        product.stock ?? 0,
        Boolean(product.isLimited)
      ];
      await pool.query(query, values);

      // 新增 Recipe
      if (product.category === '掛耳包組' && product.recipes && product.recipes.length > 0) {
        for (const r of product.recipes) {
          await pool.query(
            `INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity) VALUES ($1, $2, $3)`,
            [product.productID, r.subProductID, r.quantity || 2]
          );
        }
      }
      return;
    } catch (err) {
      console.error('PostgreSQL 新增錯誤，寫入記憶體陣列代替:', err.message);
    }
  }
  mockProducts.push(JSON.parse(JSON.stringify(product)));
}

// 修改產品
async function updateProduct(productID, updated) {
  if (pool) {
    try {
      const query = `
        UPDATE Products SET
          Category=$1, Origin=$2, Estate=$3, Name=$4,
          ProcessMethod=$5, Brand=$6, PackageNotes=$7,
          Unit_1=$8, Price_1=$9, Unit_2=$10, Price_2=$11,
          Unit_3=$12, Price_3=$13,
          OriginalPrice=$14, SalePrice=$15,
          FlavorDescription=$16, Stock=$17, IsLimited=$18
        WHERE ProductID=$19
      `;
      const values = [
        updated.category,
        updated.origin || null,
        updated.estate || null,
        updated.name || null,
        updated.processMethod || null,
        updated.brand || null,
        updated.packageNotes || null,
        updated.unit_1 || null,
        updated.price_1 || null,
        updated.unit_2 || null,
        updated.price_2 || null,
        updated.unit_3 || null,
        updated.price_3 || null,
        updated.originalPrice || null,
        updated.salePrice || null,
        updated.flavorDescription || null,
        updated.stock ?? 0,
        Boolean(updated.isLimited),
        productID
      ];
      const result = await pool.query(query, values);

      // 更新 Recipe
      if (updated.category === '掛耳包組') {
        await pool.query(`DELETE FROM DripBagRecipes WHERE ParentProductID=$1`, [productID]);
        if (updated.recipes && updated.recipes.length > 0) {
          for (const r of updated.recipes) {
            await pool.query(
              `INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity) VALUES ($1, $2, $3)`,
              [productID, r.subProductID, r.quantity || 2]
            );
          }
        }
      }
      return result.rowCount > 0 || (updated.category === '掛耳包組');
    } catch (err) {
      console.error('PostgreSQL 修改錯誤，修改記憶體陣列代替:', err.message);
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
      await pool.query('DELETE FROM DripBagRecipes WHERE ParentProductID = $1 OR SubProductID = $1', [productID]);
      const result = await pool.query('DELETE FROM Products WHERE ProductID = $1', [productID]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('PostgreSQL 刪除錯誤，自記憶體陣列刪除代替:', err.message);
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
      const guideResult = await pool.query('SELECT MainDescription FROM OrderingGuide WHERE GuideID = 1');
      const itemsResult = await pool.query('SELECT StepNumber, Title, Content FROM OrderingGuideItems ORDER BY StepNumber ASC');

      return {
        mainDescription: guideResult.rows[0] ? (guideResult.rows[0].maindescription || guideResult.rows[0].MainDescription) : '',
        items: itemsResult.rows.map(row => ({
          stepNumber: row.stepnumber || row.StepNumber,
          title: row.title || row.Title,
          content: row.content || row.Content
        }))
      };
    } catch (err) {
      console.error('PostgreSQL OrderingGuide 查詢錯誤，使用記憶體變數代替:', err.message);
    }
  }
  return JSON.parse(JSON.stringify(mockOrderingGuide));
}

async function saveOrderingGuide(data) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 更新主說明
      await client.query(
        `INSERT INTO OrderingGuide (GuideID, MainDescription)
         VALUES (1, $1)
         ON CONFLICT (GuideID) DO UPDATE SET MainDescription = EXCLUDED.MainDescription`,
        [data.mainDescription || '']
      );

      // 2. 清除舊項目並寫入新項目
      await client.query('DELETE FROM OrderingGuideItems');

      if (data.items && Array.isArray(data.items)) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          await client.query(
            'INSERT INTO OrderingGuideItems (StepNumber, Title, Content) VALUES ($1, $2, $3)',
            [item.stepNumber || (i + 1), item.title || '', item.content || '']
          );
        }
      }

      await client.query('COMMIT');
      client.release();
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error('PostgreSQL OrderingGuide 更新錯誤，更新記憶體變數代替:', err.message);
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
      const annResult = await pool.query('SELECT Content FROM BusinessAnnouncement WHERE AnnouncementID = 1');
      const hoursResult = await pool.query('SELECT DayOfWeek, IsOpen FROM BusinessHours ORDER BY DayOfWeek ASC');
      const slotsResult = await pool.query('SELECT DayOfWeek, StartTime, EndTime FROM BusinessHourSlots ORDER BY DayOfWeek ASC, StartTime ASC');

      const announcement = annResult.rows[0] ? (annResult.rows[0].content || annResult.rows[0].Content || '') : '';
      const days = [];

      for (let i = 1; i <= 7; i++) {
        const hourRow = hoursResult.rows.find(r => (r.dayofweek || r.DayOfWeek) === i);
        const slotsRow = slotsResult.rows.filter(r => (r.dayofweek || r.DayOfWeek) === i);

        days.push({
          dayOfWeek: i,
          isOpen: hourRow ? Boolean(hourRow.isopen ?? hourRow.IsOpen) : false,
          slots: slotsRow.map(s => ({ startTime: s.starttime || s.StartTime, endTime: s.endtime || s.EndTime }))
        });
      }

      return { announcement, days };
    } catch (err) {
      console.error('PostgreSQL BusinessHours 查詢錯誤，使用記憶體變數代替:', err.message);
    }
  }
  return JSON.parse(JSON.stringify(mockBusinessHours));
}

async function saveBusinessHours(data) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 更新公告
      await client.query(
        `INSERT INTO BusinessAnnouncement (AnnouncementID, Content)
         VALUES (1, $1)
         ON CONFLICT (AnnouncementID) DO UPDATE SET Content = EXCLUDED.Content`,
        [data.announcement || '']
      );

      // 清除舊資料
      await client.query('DELETE FROM BusinessHours');
      await client.query('DELETE FROM BusinessHourSlots');

      if (data.days && Array.isArray(data.days)) {
        for (const day of data.days) {
          await client.query(
            'INSERT INTO BusinessHours (DayOfWeek, IsOpen) VALUES ($1, $2)',
            [day.dayOfWeek, Boolean(day.isOpen)]
          );

          if (day.isOpen && day.slots && Array.isArray(day.slots)) {
            for (const slot of day.slots) {
              if (slot.startTime && slot.endTime) {
                await client.query(
                  'INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime) VALUES ($1, $2, $3)',
                  [day.dayOfWeek, slot.startTime, slot.endTime]
                );
              }
            }
          }
        }
      }

      await client.query('COMMIT');
      client.release();
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      console.error('PostgreSQL BusinessHours 更新錯誤，更新記憶體變數代替:', err.message);
    }
  }
  mockBusinessHours = JSON.parse(JSON.stringify(data));
  return true;
}

// ============================================================
// Storefront 前台專用查詢
// ============================================================

async function getProductsByCategory(category) {
  let products = null;
  if (pool) {
    try {
      let query = 'SELECT * FROM Products';
      const params = [];
      if (category) {
        query += ' WHERE Category = $1';
        params.push(category);
      }
      query += ' ORDER BY Category, ProductID';
      const result = await pool.query(query, params);
      products = result.rows.map(mapRecord);
    } catch (err) {
      console.error('PostgreSQL getProductsByCategory 查詢錯誤，使用記憶體陣列代替:', err.message);
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

async function getCoffeeBeanFilters() {
  if (pool) {
    try {
      const originResult = await pool.query(
        `SELECT DISTINCT Origin FROM Products WHERE Category = '咖啡豆' AND Origin IS NOT NULL ORDER BY Origin`
      );
      const processResult = await pool.query(
        `SELECT DISTINCT ProcessMethod FROM Products WHERE Category = '咖啡豆' AND ProcessMethod IS NOT NULL ORDER BY ProcessMethod`
      );
      return {
        origins: originResult.rows.map(r => r.origin || r.Origin).filter(Boolean),
        processMethods: processResult.rows.map(r => r.processmethod || r.ProcessMethod).filter(Boolean)
      };
    } catch (err) {
      console.error('PostgreSQL getCoffeeBeanFilters 查詢錯誤，使用記憶體陣列代替:', err.message);
    }
  }

  // Memory mode
  const beans = mockProducts.filter(p => p.category === '咖啡豆');
  const origins = [...new Set(beans.map(p => p.origin).filter(Boolean))].sort();
  const processMethods = [...new Set(beans.map(p => p.processMethod).filter(Boolean))].sort();
  return { origins, processMethods };
}

// ============================================================
// Customers 顧客相關操作
// ============================================================

/**
 * 依電話號碼查詢顧客資料
 * @param {string} phone
 * @returns {{ phone, name, address } | null}
 */
async function getCustomerByPhone(phone) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法查詢顧客資料。');
  }
  try {
    const result = await pool.query(
      'SELECT phone, name, address FROM customers WHERE phone = $1',
      [phone]
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { phone: r.phone, name: r.name, address: r.address };
  } catch (err) {
    console.error('PostgreSQL getCustomerByPhone 查詢錯誤:', err.message);
    throw err;
  }
}

// ============================================================
// Orders 訂單相關操作
// ============================================================

/**
 * 依電話號碼查詢顧客所有歷史訂單（含明細），由新到舊排序
 * @param {string} phone
 * @returns {Array} 訂單陣列，每筆含 items 明細
 */
async function getOrdersByPhone(phone) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法查詢訂單。');
  }
  // 查詢主表（排除已取消訂單，顧客端不顯示）
  const ordersResult = await pool.query(
    `SELECT id, customer_phone, customer_name, shipping_address,
            total_amount, note, status, created_at
     FROM orders
     WHERE customer_phone = $1
       AND status != 'cancelled'
     ORDER BY created_at DESC`,
    [String(phone).trim()]
  );

  if (ordersResult.rows.length === 0) return [];

  // 批次查詢所有相關明細
  const orderIds = ordersResult.rows.map(r => r.id);
  const itemsResult = await pool.query(
    `SELECT order_id, product_id, product_name, price, quantity, options, subtotal
     FROM order_items
     WHERE order_id = ANY($1)`,
    [orderIds]
  );

  // 組裝明細 Map
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

  return ordersResult.rows.map(r => ({
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
}

/**
 * 後台：查詢訂單列表（依狀態篩選），含明細，由新到舊排序
 * @param {string|null} statusFilter  'pending'|'confirmed'|'shipped'|'completed'|'cancelled'|null(全部)
 * @returns {Array}
 */
async function getAdminOrders(statusFilter) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法查詢訂單。');
  }

  const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
  const useFilter = statusFilter && VALID_STATUSES.includes(statusFilter);

  // 查詢主表
  const ordersResult = useFilter
    ? await pool.query(
        `SELECT id, customer_phone, customer_name, shipping_address,
                total_amount, note, status, created_at
         FROM orders
         WHERE status = $1
         ORDER BY created_at DESC`,
        [statusFilter]
      )
    : await pool.query(
        `SELECT id, customer_phone, customer_name, shipping_address,
                total_amount, note, status, created_at
         FROM orders
         ORDER BY created_at DESC`
      );

  if (ordersResult.rows.length === 0) return [];

  // 批次查詢所有相關明細
  const orderIds = ordersResult.rows.map(r => r.id);
  const itemsResult = await pool.query(
    `SELECT order_id, product_id, product_name, price, quantity, options, subtotal
     FROM order_items
     WHERE order_id = ANY($1)`,
    [orderIds]
  );

  // 組裝明細 Map
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

  return ordersResult.rows.map(r => ({
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
}

/**
 * 後台：更新訂單狀態與備註
 * @param {string} orderId
 * @param {string} status
 * @param {string|null} note
 * @returns {boolean} 是否成功更新到至少一筆
 */
async function updateOrderStatus(orderId, status, note) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法更新訂單狀態。');
  }

  // 決定是否同時更新備註
  let result;
  if (note !== undefined && note !== null) {
    result = await pool.query(
      `UPDATE orders SET status = $1, note = $2 WHERE id = $3`,
      [status, note, orderId]
    );
  } else {
    result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2`,
      [status, orderId]
    );
  }

  return result.rowCount > 0;
}

/**
 * 建立新訂單（含 Transaction、顧客 UPSERT、主表與明細批次寫入）
 * @param {{ phone, name, address, items, note, totalAmount }} orderData
 * @returns {string} 訂單編號 orderId
 */
async function createOrder(orderData) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法建立訂單。');
  }

  const { phone, name, address, items, note, totalAmount } = orderData;

  // 產生唯一訂單編號：ORD + timestamp + 4位隨機數
  const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 顧客 UPSERT：有則更新姓名與地址，無則新增
    await client.query(
      `INSERT INTO customers (phone, name, address, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (phone) DO UPDATE
         SET name       = EXCLUDED.name,
             address    = EXCLUDED.address,
             updated_at = EXCLUDED.updated_at`,
      [phone, name, address]
    );

    // 2. 寫入訂單主表
    await client.query(
      `INSERT INTO orders
         (id, customer_phone, customer_name, shipping_address, total_amount, note, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, phone, name, address, totalAmount, note || null, 'pending']
    );

    // 3. 批次寫入訂單明細
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const subtotal = Number(item.price) * Number(item.quantity);
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, product_name, price, quantity, options, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            item.productId,
            item.name,
            Number(item.price),
            Number(item.quantity),
            item.options ? JSON.stringify(item.options) : null,
            subtotal
          ]
        );
      }
    }

    await client.query('COMMIT');
    return orderId;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PostgreSQL createOrder 交易失敗，已 ROLLBACK:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  initializeDB,
  getProducts, getProductByID, isProductIDExists, addProduct, updateProduct, deleteProduct,
  getOrderingGuide, saveOrderingGuide,
  getBusinessHours, saveBusinessHours,
  getProductsByCategory, getCoffeeBeanFilters,
  getCustomerByPhone, getOrdersByPhone, createOrder,
  getAdminOrders, updateOrderStatus
};
