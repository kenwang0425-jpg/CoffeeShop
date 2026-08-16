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
    unit_1: '半磅', price_1: 380, stock_1: 50, stock_unit_1: '包',
    unit_2: '一磅', price_2: 700, stock_2: 25, stock_unit_2: '袋',
    unit_3: '耳掛', price_3: 45,  stock_3: 100, stock_unit_3: '包',
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
    unit_1: '半磅', price_1: 950,  stock_1: 25, stock_unit_1: '包',
    unit_2: '一磅', price_2: 1800, stock_2: 12, stock_unit_2: '袋',
    unit_3: '耳掛', price_3: 100,  stock_3: 50, stock_unit_3: '包',
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
    unit_1: '半磅', price_1: 320, stock_1: 80, stock_unit_1: '包',
    unit_2: '一磅', price_2: 600, stock_2: 40, stock_unit_2: '袋',
    unit_3: '耳掛', price_3: 35,  stock_3: 200, stock_unit_3: '包',
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
    unit_1: '每組', price_1: 185, stock_1: 30, stock_unit_1: '組',
    unit_2: null,   price_2: null, stock_2: null, stock_unit_2: null,
    unit_3: null,   price_3: null, stock_3: null, stock_unit_3: null,
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
    unit_1: '每組', price_1: 195, stock_1: 20, stock_unit_1: '組',
    unit_2: null,   price_2: null, stock_2: null, stock_unit_2: null,
    unit_3: null,   price_3: null, stock_3: null, stock_unit_3: null,
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
    unit_1: '個', price_1: 280, stock_1: 100, stock_unit_1: '個',
    unit_2: null,  price_2: null, stock_2: null, stock_unit_2: null,
    unit_3: null,  price_3: null, stock_3: null, stock_unit_3: null,
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

let mockSuppliers = [
  {
    id: 1,
    name: '精選生豆貿易',
    category: '生豆商',
    contact_person: '王大明',
    phone: '0912345678',
    email: 'wang@example.com',
    address_or_url: '台北市中山區...',
    rating: 4,
    evaluation_notes: '品質穩定，交期準確。',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    name: '豐潤生豆',
    category: '生豆商',
    contact_person: '陳先生',
    phone: '0988111222',
    email: 'fengrun@example.com',
    address_or_url: '台北市信義區...',
    rating: 5,
    evaluation_notes: '生豆品質極佳，批次齊全。',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    name: '佳廣包裝',
    category: '包材商',
    contact_person: '林小姐',
    phone: '0977333444',
    email: 'jiaguang@example.com',
    address_or_url: '新北市三重區...',
    rating: 4,
    evaluation_notes: '交期穩定，價格合理。',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }
];

let mockPurchases = [
  {
    id: 'PO20260803123',
    supplier_id: 2,
    supplier_name: '豐潤生豆',
    purchase_date: '2026-08-01',
    total_amount: 9000,
    status: 'completed',
    note: '測試種子生豆進貨單',
    created_at: new Date(),
    updated_at: new Date(),
    items: [
      { id: 101, purchase_id: 'PO20260803123', item_type: '生豆', item_name: '耶加雪菲 歌迪貝', batch_no: 'C192', origin: '衣索比亞', process_method: '日曬', quantity: 20, remaining_quantity: 20, unit: 'kg', unit_price: 450, subtotal: 9000 }
    ]
  },
  {
    id: 'PO20260803124',
    supplier_id: 3,
    supplier_name: '佳廣包裝',
    purchase_date: '2026-08-02',
    total_amount: 6400,
    status: 'completed',
    note: '測試種子包材進貨單',
    created_at: new Date(),
    updated_at: new Date(),
    items: [
      { id: 102, purchase_id: 'PO20260803124', item_type: '包材', item_name: '半磅咖啡袋', batch_no: null, origin: null, process_method: null, quantity: 500, remaining_quantity: 500, unit: '個', unit_price: 8, subtotal: 4000 },
      { id: 103, purchase_id: 'PO20260803124', item_type: '包材', item_name: '耳掛外盒', batch_no: null, origin: null, process_method: null, quantity: 200, remaining_quantity: 200, unit: '個', unit_price: 12, subtotal: 2400 }
    ]
  }
];

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
        IsLimited         BOOLEAN       NOT NULL DEFAULT FALSE,
        Stock_1           INT           NULL,
        StockUnit_1       VARCHAR(20)   NULL,
        Stock_2           INT           NULL,
        StockUnit_2       VARCHAR(20)   NULL,
        Stock_3           INT           NULL,
        StockUnit_3       VARCHAR(20)   NULL
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

      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        contact_person VARCHAR(50),
        phone VARCHAR(30),
        email VARCHAR(100),
        address_or_url VARCHAR(255),
        rating INT DEFAULT 3,
        evaluation_notes TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(30) PRIMARY KEY,
        supplier_id INT REFERENCES suppliers(id) ON DELETE SET NULL,
        supplier_name VARCHAR(100),
        purchase_date DATE NOT NULL,
        total_amount NUMERIC(12,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'completed',
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_items (
        id SERIAL PRIMARY KEY,
        purchase_id VARCHAR(30) REFERENCES purchases(id) ON DELETE CASCADE,
        item_type VARCHAR(30) NOT NULL,
        item_code VARCHAR(50) NULL,
        item_name VARCHAR(255) NOT NULL,
        batch_no VARCHAR(50) NULL,
        origin VARCHAR(100) NULL,
        variety VARCHAR(100) NULL,
        altitude VARCHAR(50) NULL,
        process_method VARCHAR(50) NULL,
        flavor_description TEXT NULL,
        quantity NUMERIC(10,2) NOT NULL,
        remaining_quantity NUMERIC(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL,
        subtotal NUMERIC(12,2) NOT NULL
      );

      -- 1. 烘豆紀錄主表 (Roast Records)
      CREATE TABLE IF NOT EXISTS roast_records (
        id SERIAL PRIMARY KEY,
        roast_batch_no VARCHAR(50) NOT NULL UNIQUE,
        roast_date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_green_weight NUMERIC(10,2) NOT NULL,
        roasted_weight NUMERIC(10,2) NOT NULL,
        weight_loss_rate NUMERIC(5,2) NOT NULL,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. 烘豆生豆扣減明細表 (Roast Item Sources)
      CREATE TABLE IF NOT EXISTS roast_item_sources (
        id SERIAL PRIMARY KEY,
        roast_id INT REFERENCES roast_records(id) ON DELETE CASCADE,
        purchase_item_id INT REFERENCES purchase_items(id) ON DELETE RESTRICT,
        used_weight NUMERIC(10,2) NOT NULL
      );

      -- 3. 包材與耗材領用紀錄表 (Material Usages)
      CREATE TABLE IF NOT EXISTS material_usages (
        id SERIAL PRIMARY KEY,
        purchase_item_id INT REFERENCES purchase_items(id) ON DELETE RESTRICT,
        usage_type VARCHAR(30) NOT NULL DEFAULT 'usage',
        quantity NUMERIC(10,2) NOT NULL,
        usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. 全物料庫存異動歷程流水帳 (Stock Logs)
      CREATE TABLE IF NOT EXISTS stock_logs (
        id SERIAL PRIMARY KEY,
        item_type VARCHAR(30) NOT NULL,
        purchase_item_id INT NULL REFERENCES purchase_items(id) ON DELETE SET NULL,
        item_name VARCHAR(255) NOT NULL,
        batch_no VARCHAR(50) NULL,
        change_type VARCHAR(30) NOT NULL,
        change_amount NUMERIC(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        note TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createTableQuery);

    // 安全遷移：為舊有資料表補上新欄位 (ADD COLUMN IF NOT EXISTS)
    const migrateQuery = `
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS Stock_1     INT         NULL;
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS StockUnit_1 VARCHAR(20) NULL;
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS Stock_2     INT         NULL;
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS StockUnit_2 VARCHAR(20) NULL;
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS Stock_3     INT         NULL;
      ALTER TABLE Products ADD COLUMN IF NOT EXISTS StockUnit_3 VARCHAR(20) NULL;

      ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS item_code VARCHAR(50) NULL;
      ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS variety VARCHAR(100) NULL;
      ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS altitude VARCHAR(50) NULL;
      ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS flavor_description TEXT NULL;

      -- 為舊有資料或預設商品的 NULL 庫存單位與數量進行回填
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 50), StockUnit_1 = '包' WHERE ProductID = 'CO135' AND StockUnit_1 IS NULL;
      UPDATE Products SET Stock_2 = COALESCE(Stock_2, 25), StockUnit_2 = '袋' WHERE ProductID = 'CO135' AND StockUnit_2 IS NULL;
      UPDATE Products SET Stock_3 = COALESCE(Stock_3, 100), StockUnit_3 = '包' WHERE ProductID = 'CO135' AND StockUnit_3 IS NULL;
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 25), StockUnit_1 = '包' WHERE ProductID = 'CO246' AND StockUnit_1 IS NULL;
      UPDATE Products SET Stock_2 = COALESCE(Stock_2, 12), StockUnit_2 = '袋' WHERE ProductID = 'CO246' AND StockUnit_2 IS NULL;
      UPDATE Products SET Stock_3 = COALESCE(Stock_3, 50), StockUnit_3 = '包' WHERE ProductID = 'CO246' AND StockUnit_3 IS NULL;
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 80), StockUnit_1 = '包' WHERE ProductID = 'CO379' AND StockUnit_1 IS NULL;
      UPDATE Products SET Stock_2 = COALESCE(Stock_2, 40), StockUnit_2 = '袋' WHERE ProductID = 'CO379' AND StockUnit_2 IS NULL;
      UPDATE Products SET Stock_3 = COALESCE(Stock_3, 200), StockUnit_3 = '包' WHERE ProductID = 'CO379' AND StockUnit_3 IS NULL;
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 30), StockUnit_1 = '組' WHERE ProductID = 'DP001' AND StockUnit_1 IS NULL;
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 20), StockUnit_1 = '組' WHERE ProductID = 'DP002' AND StockUnit_1 IS NULL;
      UPDATE Products SET Stock_1 = COALESCE(Stock_1, 100), StockUnit_1 = '個' WHERE ProductID = 'ACC001' AND StockUnit_1 IS NULL;
    `;
    await pool.query(migrateQuery);
    console.log('🔧 [Database] 規格庫存欄位遷移完成（Stock_1/2/3, StockUnit_1/2/3）。');

    // 寫入預設測試資料 (若不存在)
    // 寫入預設測試資料 (若不存在)
    const initDataQuery = `
      -- 1. 寫入預設商品 (咖啡豆、掛耳包組、周邊)
      INSERT INTO Products (ProductID, Category, Origin, Estate, Name, ProcessMethod, Brand, PackageNotes, Unit_1, Price_1, Stock_1, StockUnit_1, Unit_2, Price_2, Stock_2, StockUnit_2, Unit_3, Price_3, Stock_3, StockUnit_3, OriginalPrice, SalePrice, FlavorDescription, Stock, IsLimited)
      VALUES 
      ('CO135', '咖啡豆', '衣索比亞', '耶加雪菲 歌迪貝 艾瑞莎', NULL, '日曬', NULL, NULL, '半磅', 380, 50, '包', '一磅', 700, 25, '袋', '耳掛', 45, 100, '包', NULL, NULL, '藍莓、水蜜桃、茉莉花香、佛手柑與蜂蜜甜感，層次豐富明亮。', 50, FALSE),
      ('CO246', '咖啡豆', '巴拿馬', '波奎特 翡翠莊園 藍標葛夏', NULL, '水洗', NULL, NULL, '半磅', 950, 25, '包', '一磅', 1800, 12, '袋', '耳掛', 100, 50, '包', NULL, NULL, '經典茉莉花香、檸檬、柑橘、白葡萄、佛手柑氣息，明亮多汁的酸質。', 25, FALSE),
      ('CO379', '咖啡豆', '哥倫比亞', '聖芭芭拉莊園 模範生', NULL, '水洗', NULL, NULL, '半磅', 320, 80, '包', '一磅', 600, 40, '袋', '耳掛', 35, 200, '包', NULL, NULL, '榛果、焦糖甜感、可可風味、酸度圓潤低沉、餘韻悠長。', 80, FALSE),
      ('DP001', '掛耳包組', NULL, NULL, NULL, NULL, '中烘焙', '10包/組，內含5種精品豆各2包', '每組', 185, 30, '組', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '綜合烘焙，堅果醇厚、焦糖甜感，適合喜愛濃醇口感的您。', 30, TRUE),
      ('DP002', '掛耳包組', NULL, NULL, NULL, NULL, '中淺焙', '10包/組，內含5種精品豆各2包', '每組', 195, 20, '組', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '水果酸甜、優雅花香，適合喜愛清爽明亮口感的您。', 20, TRUE),
      ('ACC001', '周邊產品', NULL, NULL, NULL, NULL, 'KAKAMA COFFEE', NULL, '個', 280, 100, '個', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 350, 280, 'KAKAMA COFFEE 自家品牌濾紙，專為手沖設計，配合V60使用效果最佳。', 100, FALSE)
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
      SELECT d, s.StartTime, s.EndTime
      FROM generate_series(2, 7) AS d
      CROSS JOIN (
        SELECT '11:00' AS StartTime, '14:30' AS EndTime
        UNION ALL
        SELECT '17:00', '21:00'
      ) AS s
      WHERE NOT EXISTS (SELECT 1 FROM BusinessHourSlots);

      -- 4. 寫入進貨商預設資料
      INSERT INTO suppliers (id, name, category, contact_person, phone, email, address_or_url, rating, evaluation_notes, status)
      VALUES 
      (1, '精選生豆貿易', '生豆商', '王大明', '0912345678', 'wang@example.com', '台北市中山區...', 4, '品質穩定，交期準確。', 'active'),
      (2, '豐潤生豆', '生豆商', '陳先生', '0988111222', 'fengrun@example.com', '台北市信義區...', 5, '生豆品質極佳，批次齊全。', 'active'),
      (3, '佳廣包裝', '包材商', '林小姐', '0977333444', 'jiaguang@example.com', '新北市三重區...', 4, '交期穩定，價格合理。', 'active')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, category = EXCLUDED.category;

      -- 修復 suppliers 表的 SERIAL sequence，避免後續 INSERT 發生 duplicate key 錯誤
      SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers));

      -- 5. 寫入進貨單預設資料
      INSERT INTO purchases (id, supplier_id, supplier_name, purchase_date, total_amount, status, note)
      VALUES
      ('PO20260803123', 2, '豐潤生豆', '2026-08-01', 9000, 'completed', '測試種子生豆進貨單'),
      ('PO20260803124', 3, '佳廣包裝', '2026-08-02', 6400, 'completed', '測試種子包材進貨單')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO purchase_items (purchase_id, item_type, item_name, batch_no, origin, process_method, quantity, remaining_quantity, unit, unit_price, subtotal)
      SELECT 'PO20260803123', '生豆', '耶加雪菲 歌迪貝', 'C192', '衣索比亞', '日曬', 20, 20, 'kg', 450, 9000
      WHERE NOT EXISTS (SELECT 1 FROM purchase_items WHERE purchase_id = 'PO20260803123');

      INSERT INTO purchase_items (purchase_id, item_type, item_name, batch_no, origin, process_method, quantity, remaining_quantity, unit, unit_price, subtotal)
      SELECT 'PO20260803124', '包材', '半磅咖啡袋', NULL, NULL, NULL, 500, 500, '個', 8, 4000
      WHERE NOT EXISTS (SELECT 1 FROM purchase_items WHERE purchase_id = 'PO20260803124' AND item_name = '半磅咖啡袋');

      INSERT INTO purchase_items (purchase_id, item_type, item_name, batch_no, origin, process_method, quantity, remaining_quantity, unit, unit_price, subtotal)
      SELECT 'PO20260803124', '包材', '耳掛外盒', NULL, NULL, NULL, 200, 200, '個', 12, 2400
      WHERE NOT EXISTS (SELECT 1 FROM purchase_items WHERE purchase_id = 'PO20260803124' AND item_name = '耳掛外盒');
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
  const toN = v => (v !== null && v !== undefined) ? Number(v) : null;
  return {
    productID: r.productid || r.ProductID,
    category: r.category || r.Category,
    origin: r.origin || r.Origin,
    estate: r.estate || r.Estate,
    name: r.name || r.Name,
    processMethod: r.processmethod || r.ProcessMethod,
    brand: r.brand || r.Brand,
    packageNotes: r.packagenotes || r.PackageNotes,
    unit_1: r.unit_1 || r.Unit_1,
    price_1: toN(r.price_1 ?? r.Price_1),
    stock_1: (r.stock_1 ?? r.Stock_1) !== null && (r.stock_1 ?? r.Stock_1) !== undefined ? Number(r.stock_1 ?? r.Stock_1) : null,
    stock_unit_1: r.stock_unit_1 || r.stockunit_1 || r.StockUnit_1 || null,
    unit_2: r.unit_2 || r.Unit_2,
    price_2: toN(r.price_2 ?? r.Price_2),
    stock_2: (r.stock_2 ?? r.Stock_2) !== null && (r.stock_2 ?? r.Stock_2) !== undefined ? Number(r.stock_2 ?? r.Stock_2) : null,
    stock_unit_2: r.stock_unit_2 || r.stockunit_2 || r.StockUnit_2 || null,
    unit_3: r.unit_3 || r.Unit_3,
    price_3: toN(r.price_3 ?? r.Price_3),
    stock_3: (r.stock_3 ?? r.Stock_3) !== null && (r.stock_3 ?? r.Stock_3) !== undefined ? Number(r.stock_3 ?? r.Stock_3) : null,
    stock_unit_3: r.stock_unit_3 || r.stockunit_3 || r.StockUnit_3 || null,
    originalPrice: toN(r.originalprice ?? r.OriginalPrice),
    salePrice: toN(r.saleprice ?? r.SalePrice),
    flavorDescription: r.flavordescription || r.FlavorDescription,
    stock: r.stock ?? r.Stock ?? 0,
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
         OriginalPrice, SalePrice, FlavorDescription, Stock, IsLimited,
         Stock_1, StockUnit_1, Stock_2, StockUnit_2, Stock_3, StockUnit_3)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      `;
      const values = [
        product.productID,
        product.category,
        product.origin   || null,
        product.estate   || null,
        product.name     || null,
        product.processMethod || null,
        product.brand    || null,
        product.packageNotes || null,
        product.unit_1   || null,
        product.price_1  ?? null,
        product.unit_2   || null,
        product.price_2  ?? null,
        product.unit_3   || null,
        product.price_3  ?? null,
        product.originalPrice ?? null,
        product.salePrice     ?? null,
        product.flavorDescription || null,
        product.stock ?? 0,
        Boolean(product.isLimited),
        product.stock_1    ?? null,
        product.stock_unit_1 || null,
        product.stock_2    ?? null,
        product.stock_unit_2 || null,
        product.stock_3    ?? null,
        product.stock_unit_3 || null
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
          FlavorDescription=$16, Stock=$17, IsLimited=$18,
          Stock_1=$19, StockUnit_1=$20,
          Stock_2=$21, StockUnit_2=$22,
          Stock_3=$23, StockUnit_3=$24
        WHERE ProductID=$25
      `;
      const values = [
        updated.category,
        updated.origin   || null,
        updated.estate   || null,
        updated.name     || null,
        updated.processMethod || null,
        updated.brand    || null,
        updated.packageNotes || null,
        updated.unit_1   || null,
        updated.price_1  ?? null,
        updated.unit_2   || null,
        updated.price_2  ?? null,
        updated.unit_3   || null,
        updated.price_3  ?? null,
        updated.originalPrice ?? null,
        updated.salePrice     ?? null,
        updated.flavorDescription || null,
        updated.stock ?? 0,
        Boolean(updated.isLimited),
        updated.stock_1    ?? null,
        updated.stock_unit_1 || null,
        updated.stock_2    ?? null,
        updated.stock_unit_2 || null,
        updated.stock_3    ?? null,
        updated.stock_unit_3 || null,
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
        const hourRow = hoursResult.rows.find(r => Number(r.dayofweek ?? r.DayOfWeek) === i);
        const slotsRow = slotsResult.rows.filter(r => Number(r.dayofweek ?? r.DayOfWeek) === i);

        days.push({
          dayOfWeek: i,
          isOpen: hourRow ? Boolean(hourRow.isopen ?? hourRow.IsOpen) : false,
          slots: slotsRow.map(s => ({ startTime: s.starttime || s.StartTime, endTime: s.endtime || s.EndTime }))
        });
      }

      // 同步更新記憶體變數，確保快取與資料庫一致
      mockBusinessHours = { announcement, days };
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

      // 清除舊時段，但對 BusinessHours 執行 UPDATE/INSERT (UPSERT)
      await client.query('DELETE FROM BusinessHourSlots');

      if (data.days && Array.isArray(data.days)) {
        for (const day of data.days) {
          await client.query(
            `INSERT INTO BusinessHours (DayOfWeek, IsOpen) VALUES ($1, $2)
             ON CONFLICT (DayOfWeek) DO UPDATE SET IsOpen = EXCLUDED.IsOpen`,
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
      // 同步更新記憶體變數，確保快取與資料庫保持一致
      mockBusinessHours = JSON.parse(JSON.stringify(data));
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
 * 依電話號碼查詢顧客所有歷史訂單（依年月篩選，含明細），由新到舊排序
 * @param {string} phone
 * @param {string|number|null} year
 * @param {string|number|null} month
 * @returns {Array} 訂單陣列，每筆含 items 明細
 */
async function getOrdersByPhone(phone, year, month) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法查詢訂單。');
  }

  const conditions = ['customer_phone = $1', "status != 'cancelled'"];
  const params = [String(phone).trim()];

  if (year !== undefined && year !== null && year !== '' && month !== undefined && month !== null && month !== '') {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      const mStr = String(m).padStart(2, '0');
      const startDate = `${y}-${mStr}-01`;
      const nextY = m === 12 ? y + 1 : y;
      const nextM = m === 12 ? 1 : m + 1;
      const nextMStr = String(nextM).padStart(2, '0');
      const endDate = `${nextY}-${nextMStr}-01`;

      params.push(startDate);
      conditions.push(`created_at >= $${params.length}`);
      params.push(endDate);
      conditions.push(`created_at < $${params.length}`);
    }
  } else if (year !== undefined && year !== null && year !== '') {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      const startDate = `${y}-01-01`;
      const endDate = `${y + 1}-01-01`;
      params.push(startDate);
      conditions.push(`created_at >= $${params.length}`);
      params.push(endDate);
      conditions.push(`created_at < $${params.length}`);
    }
  }

  // 查詢主表（排除已取消訂單，顧客端不顯示）
  const ordersResult = await pool.query(
    `SELECT id, customer_phone, customer_name, shipping_address,
            total_amount, note, status, created_at
     FROM orders
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC`,
    params
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
 * 後台：查詢訂單列表（依狀態、年月篩選），含明細，由新到舊排序
 * @param {string|null} statusFilter  'pending'|'confirmed'|'shipped'|'completed'|'cancelled'|null(全部)
 * @param {string|number|null} year   年份（例如 2026）
 * @param {string|number|null} month  月份（例如 7 或 "07"）
 * @returns {Array}
 */
async function getAdminOrders(statusFilter, year, month) {
  if (!pool) {
    throw new Error('資料庫未啟用，無法查詢訂單。');
  }

  const VALID_STATUSES = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'];
  const useFilter = statusFilter && VALID_STATUSES.includes(statusFilter);

  const conditions = [];
  const params = [];

  if (useFilter) {
    params.push(statusFilter);
    conditions.push(`status = $${params.length}`);
  }

  if (year !== undefined && year !== null && year !== '' && month !== undefined && month !== null && month !== '') {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      const mStr = String(m).padStart(2, '0');
      const startDate = `${y}-${mStr}-01`;
      const nextY = m === 12 ? y + 1 : y;
      const nextM = m === 12 ? 1 : m + 1;
      const nextMStr = String(nextM).padStart(2, '0');
      const endDate = `${nextY}-${nextMStr}-01`;

      params.push(startDate);
      conditions.push(`created_at >= $${params.length}`);
      params.push(endDate);
      conditions.push(`created_at < $${params.length}`);
    }
  } else if (year !== undefined && year !== null && year !== '') {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      const startDate = `${y}-01-01`;
      const endDate = `${y + 1}-01-01`;
      params.push(startDate);
      conditions.push(`created_at >= $${params.length}`);
      params.push(endDate);
      conditions.push(`created_at < $${params.length}`);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const querySql = `
    SELECT id, customer_phone, customer_name, shipping_address,
           total_amount, note, status, created_at
    FROM orders
    ${whereClause}
    ORDER BY created_at DESC
  `;

  // 查詢主表
  const ordersResult = await pool.query(querySql, params);

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

// ============================================================
// 進貨商 Supplier 相關操作
// ============================================================

async function getSuppliers(category, keyword) {
  if (pool) {
    try {
      let query = 'SELECT * FROM suppliers WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (category && category !== 'all' && category !== '全部') {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }
      
      if (keyword) {
        query += ` AND (name ILIKE $${paramIndex} OR contact_person ILIKE $${paramIndex})`;
        params.push(`%${keyword}%`);
        paramIndex++;
      }
      
      query += ' ORDER BY created_at DESC';
      const result = await pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getSuppliers 錯誤:', err.message);
    }
  }
  
  let result = [...mockSuppliers];
  if (category && category !== 'all' && category !== '全部') {
    result = result.filter(s => s.category === category);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(s => 
      (s.name && s.name.toLowerCase().includes(kw)) || 
      (s.contact_person && s.contact_person.toLowerCase().includes(kw))
    );
  }
  return result;
}

async function getSupplierByID(id) {
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('PostgreSQL getSupplierByID 錯誤:', err.message);
    }
  }
  return mockSuppliers.find(s => String(s.id) === String(id)) || null;
}

async function addSupplier(data) {
  if (pool) {
    try {
      const query = `
        INSERT INTO suppliers 
        (name, category, contact_person, phone, email, address_or_url, rating, evaluation_notes, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;
      const values = [
        data.name, data.category, data.contact_person, data.phone,
        data.email, data.address_or_url, data.rating || 3, data.evaluation_notes, data.status || 'active'
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('PostgreSQL addSupplier 錯誤:', err.message);
    }
  }
  
  const newSupplier = {
    id: Date.now(), // mock id
    ...data,
    created_at: new Date(),
    updated_at: new Date()
  };
  mockSuppliers.unshift(newSupplier);
  return newSupplier;
}

async function updateSupplier(id, data) {
  if (pool) {
    try {
      const query = `
        UPDATE suppliers SET
          name = $1, category = $2, contact_person = $3, phone = $4,
          email = $5, address_or_url = $6, rating = $7, evaluation_notes = $8, status = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `;
      const values = [
        data.name, data.category, data.contact_person, data.phone,
        data.email, data.address_or_url, data.rating, data.evaluation_notes, data.status,
        id
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (err) {
      console.error('PostgreSQL updateSupplier 錯誤:', err.message);
    }
  }
  
  const idx = mockSuppliers.findIndex(s => String(s.id) === String(id));
  if (idx !== -1) {
    mockSuppliers[idx] = { ...mockSuppliers[idx], ...data, updated_at: new Date() };
    return mockSuppliers[idx];
  }
  return null;
}

async function deleteSupplier(id) {
  if (pool) {
    try {
      const result = await pool.query('DELETE FROM suppliers WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('PostgreSQL deleteSupplier 錯誤:', err.message);
    }
  }
  
  const initialLength = mockSuppliers.length;
  mockSuppliers = mockSuppliers.filter(s => String(s.id) !== String(id));
  return mockSuppliers.length < initialLength;
}

// ============================================================
// 進貨管理 Purchase 相關操作
// ============================================================

async function getPurchases(startDate, endDate, supplierId, supplierName) {
  let sql = `
    SELECT 
      p.id,
      p.supplier_id,
      p.supplier_name,
      TO_CHAR(p.purchase_date, 'YYYY-MM-DD') AS purchase_date,
      p.total_amount,
      p.status,
      p.note,
      p.created_at
    FROM purchases p
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    params.push(startDate);
    sql += ` AND p.purchase_date >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    sql += ` AND p.purchase_date <= $${params.length}`;
  }
  if (supplierId && supplierId !== 'all' && supplierId !== '') {
    params.push(supplierId);
    sql += ` AND p.supplier_id = $${params.length}`;
  }

  sql += ` ORDER BY p.purchase_date DESC, p.created_at DESC`;

  const result = await pool.query(sql, params);
  return result.rows;
}

async function getPurchaseByID(id) {
  if (pool) {
    try {
      const result = await pool.query("SELECT *, to_char(purchase_date, 'YYYY-MM-DD') AS purchase_date FROM purchases WHERE id = $1", [id]);
      const purchase = result.rows[0];
      if (purchase) {
        const itemsResult = await pool.query('SELECT * FROM purchase_items WHERE purchase_id = $1', [id]);
        purchase.items = itemsResult.rows;
      }
      return purchase || null;
    } catch (err) {
      console.error('PostgreSQL getPurchaseByID 錯誤:', err.message);
    }
  }
  return mockPurchases.find(p => p.id === id) || null;
}

async function createPurchase(purchaseData) {
  const { supplier_id, supplier_name, purchase_date, total_amount, status, note, items } = purchaseData;
  const purchaseId = `PO${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let final_supplier_name = supplier_name ? supplier_name.trim() : null;
      if (supplier_id) {
        const supRes = await client.query('SELECT name FROM suppliers WHERE id = $1', [supplier_id]);
        if (supRes.rows.length > 0) {
          final_supplier_name = supRes.rows[0].name.trim();
        }
      }
      
      await client.query(
        `INSERT INTO purchases (id, supplier_id, supplier_name, purchase_date, total_amount, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [purchaseId, supplier_id || null, final_supplier_name, purchase_date, total_amount, status || 'completed', note]
      );
      
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO purchase_items 
             (purchase_id, item_type, item_name, item_code, batch_no, origin, variety, altitude, process_method, flavor_description, quantity, remaining_quantity, unit, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              purchaseId, item.item_type, item.item_name, item.item_code || null, item.batch_no || null,
              item.origin || null, item.variety || null, item.altitude || null, item.process_method || null, 
              item.flavor_description || null, item.quantity, item.quantity, item.unit, item.unit_price, item.subtotal
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      return purchaseId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL createPurchase 交易失敗，已 ROLLBACK:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
  
  // Mock fallback
  const itemsWithRemaining = (items || []).map((item, idx) => ({
    id: Date.now() + idx,
    purchase_id: purchaseId,
    ...item,
    remaining_quantity: item.quantity
  }));
  
  let final_mock_supplier_name = supplier_name ? supplier_name.trim() : null;
  if (supplier_id) {
    const mockSup = mockSuppliers.find(s => String(s.id) === String(supplier_id));
    if (mockSup) final_mock_supplier_name = mockSup.name.trim();
  }

  const newPurchase = {
    id: purchaseId,
    supplier_id, supplier_name: final_mock_supplier_name, purchase_date, total_amount, status: status || 'completed', note,
    created_at: new Date(), updated_at: new Date(),
    items: itemsWithRemaining
  };
  mockPurchases.unshift(newPurchase);
  return purchaseId;
}

async function updatePurchase(id, purchaseData) {
  const { supplier_id, supplier_name, purchase_date, total_amount, status, note, items } = purchaseData;
  
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      let final_supplier_name = supplier_name ? supplier_name.trim() : null;
      if (supplier_id) {
        const supRes = await client.query('SELECT name FROM suppliers WHERE id = $1', [supplier_id]);
        if (supRes.rows.length > 0) {
          final_supplier_name = supRes.rows[0].name.trim();
        }
      }
      
      await client.query(
        `UPDATE purchases SET 
           supplier_id = $1, supplier_name = $2, purchase_date = $3, 
           total_amount = $4, status = $5, note = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [supplier_id || null, final_supplier_name, purchase_date, total_amount, status || 'completed', note, id]
      );
      
      await client.query('DELETE FROM purchase_items WHERE purchase_id = $1', [id]);
      
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO purchase_items 
             (purchase_id, item_type, item_name, item_code, batch_no, origin, variety, altitude, process_method, flavor_description, quantity, remaining_quantity, unit, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
              id, item.item_type, item.item_name, item.item_code || null, item.batch_no || null,
              item.origin || null, item.variety || null, item.altitude || null, item.process_method || null, 
              item.flavor_description || null, item.quantity, item.quantity, item.unit, item.unit_price, item.subtotal
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL updatePurchase 交易失敗，已 ROLLBACK:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
  
  const idx = mockPurchases.findIndex(p => p.id === id);
  if (idx !== -1) {
    const itemsWithRemaining = (items || []).map((item, index) => ({
      id: Date.now() + index,
      purchase_id: id,
      ...item,
      remaining_quantity: item.quantity
    }));
    
    let final_mock_supplier_name = supplier_name ? supplier_name.trim() : null;
    if (supplier_id) {
      const mockSup = mockSuppliers.find(s => String(s.id) === String(supplier_id));
      if (mockSup) final_mock_supplier_name = mockSup.name.trim();
    }
    
    mockPurchases[idx] = {
      ...mockPurchases[idx],
      supplier_id, supplier_name: final_mock_supplier_name, purchase_date, total_amount, status: status || 'completed', note,
      updated_at: new Date(),
      items: itemsWithRemaining
    };
    return true;
  }
  return false;
}

async function updatePurchaseStatus(id, status) {
  if (pool) {
    try {
      const result = await pool.query(
        'UPDATE purchases SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('PostgreSQL updatePurchaseStatus 錯誤:', err.message);
    }
  }
  
  const idx = mockPurchases.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockPurchases[idx].status = status;
    mockPurchases[idx].updated_at = new Date();
    return mockPurchases[idx];
  }
  return null;
}

async function deletePurchase(id) {
  if (pool) {
    try {
      const result = await pool.query('DELETE FROM purchases WHERE id = $1', [id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('PostgreSQL deletePurchase 錯誤:', err.message);
    }
  }
  
  const initialLength = mockPurchases.length;
  mockPurchases = mockPurchases.filter(p => p.id !== id);
  return mockPurchases.length < initialLength;
}

// ============================================================
// Roast Records (烘豆紀錄)
// ============================================================
async function getRoastRecords(year, month) {
  if (pool) {
    try {
      let query = `
        SELECT r.*,
               TO_CHAR(r.roast_date, 'YYYY-MM-DD') AS roast_date,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'purchase_item_id', s.purchase_item_id,
                     'used_weight', s.used_weight,
                     'item_name', pi.item_name,
                     'batch_no', pi.batch_no
                   )
                 ) FILTER (WHERE s.id IS NOT NULL),
                 '[]'
               ) AS sources
        FROM roast_records r
        LEFT JOIN roast_item_sources s ON r.id = s.roast_id
        LEFT JOIN purchase_items pi ON s.purchase_item_id = pi.id
        WHERE 1=1
      `;
      const params = [];

      if (year && month) {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          const mStr = String(m).padStart(2, '0');
          const startDate = `${y}-${mStr}-01`;
          const nextY = m === 12 ? y + 1 : y;
          const nextM = m === 12 ? 1 : m + 1;
          const nextMStr = String(nextM).padStart(2, '0');
          const endDate = `${nextY}-${nextMStr}-01`;
          params.push(startDate);
          query += ` AND r.roast_date >= $${params.length}`;
          params.push(endDate);
          query += ` AND r.roast_date < $${params.length}`;
        }
      }

      query += `
        GROUP BY r.id
        ORDER BY r.roast_date DESC, r.created_at DESC
      `;

      const result = await pool.query(query, params);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getRoastRecords 錯誤:', err.message);
    }
  }
  return [];
}

async function addRoastRecord(data) {
  const { roast_batch_no, roast_date, total_green_weight, roasted_weight, weight_loss_rate, note, sources } = data;
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertRecordQuery = `
        INSERT INTO roast_records (roast_batch_no, roast_date, total_green_weight, roasted_weight, weight_loss_rate, note)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      const recordResult = await client.query(insertRecordQuery, [roast_batch_no, roast_date, total_green_weight, roasted_weight, weight_loss_rate, note]);
      const roastId = recordResult.rows[0].id;

      if (Array.isArray(sources) && sources.length > 0) {
        for (const src of sources) {
          // 1. 查詢生豆庫存
          const itemRes = await client.query(
            'SELECT item_name, batch_no, unit, remaining_quantity FROM purchase_items WHERE id = $1',
            [src.purchase_item_id]
          );
          
          if (itemRes.rows.length === 0) {
            throw new Error(`找不到生豆項目 ID: ${src.purchase_item_id}`);
          }
          
          const { item_name, batch_no, unit, remaining_quantity } = itemRes.rows[0];
          const used_weight = Number(src.used_weight);
          const remaining = Number(remaining_quantity);

          // 2. 防呆檢查
          if (remaining < used_weight) {
            throw new Error(`生豆「${item_name}」庫存不足 (剩餘 ${remaining})，無法扣減！`);
          }

          // 3. 扣減剩餘量
          await client.query(
            'UPDATE purchase_items SET remaining_quantity = remaining_quantity - $1 WHERE id = $2',
            [used_weight, src.purchase_item_id]
          );

          // 4. 寫入明細
          await client.query(
            `INSERT INTO roast_item_sources (roast_id, purchase_item_id, used_weight) VALUES ($1, $2, $3)`,
            [roastId, src.purchase_item_id, used_weight]
          );

          // 5. 寫入流水帳 (生豆扣減)
          await client.query(
            `INSERT INTO stock_logs (item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            ['生豆', src.purchase_item_id, item_name, batch_no, 'roast_out', -used_weight, unit, `烘豆扣減 (批號: ${roast_batch_no})`]
          );
        }
      }
      
      // 6. 寫入熟豆產出流水帳
      await client.query(
        `INSERT INTO stock_logs (item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['熟豆', null, `烘焙熟豆批次`, roast_batch_no, 'roast_in', Number(roasted_weight), 'g', `烘豆產出熟豆 (批號: ${roast_batch_no})`]
      );

      await client.query('COMMIT');
      return roastId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL addRoastRecord 交易失敗，已 ROLLBACK:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
  return null;
}

// ============================================================
// Material Usages (包材/耗材領用紀錄)
// ============================================================
async function getMaterialUsages() {
  if (pool) {
    try {
      const result = await pool.query(`
        SELECT m.*, p.item_name, p.unit
        FROM material_usages m
        LEFT JOIN purchase_items p ON m.purchase_item_id = p.id
        ORDER BY m.created_at DESC
      `);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getMaterialUsages 錯誤:', err.message);
    }
  }
  return [];
}

async function addMaterialUsage(data) {
  const { purchase_item_id, usage_type, quantity, usage_date, note } = data;
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. 查詢庫存
      const itemRes = await client.query(
        'SELECT item_type, item_name, batch_no, unit, remaining_quantity FROM purchase_items WHERE id = $1',
        [purchase_item_id]
      );
      
      if (itemRes.rows.length === 0) {
        throw new Error(`找不到物料項目 ID: ${purchase_item_id}`);
      }

      const { item_type, item_name, batch_no, unit, remaining_quantity } = itemRes.rows[0];
      const used_qty = Number(quantity);
      const remaining = Number(remaining_quantity);

      // 2. 防呆檢查
      if (remaining < used_qty) {
        throw new Error(`物料「${item_name}」庫存不足，無法領用！`);
      }

      // 3. 扣減剩餘量
      await client.query(
        'UPDATE purchase_items SET remaining_quantity = remaining_quantity - $1 WHERE id = $2',
        [used_qty, purchase_item_id]
      );

      // 4. 寫入 material_usages 表
      const insertRecordQuery = `
        INSERT INTO material_usages (purchase_item_id, usage_type, quantity, usage_date, note)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      const recordResult = await client.query(insertRecordQuery, [purchase_item_id, usage_type, used_qty, usage_date, note]);
      const usageId = recordResult.rows[0].id;

      // 5. 寫入流水帳
      let noteStr = `包材/耗材領用 (${usage_type})`;
      
      await client.query(
        `INSERT INTO stock_logs (item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [item_type, purchase_item_id, item_name, batch_no, 'material_out', -used_qty, unit, noteStr]
      );

      await client.query('COMMIT');
      return usageId;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('PostgreSQL addMaterialUsage 交易失敗，已 ROLLBACK:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }
  return null;
}

// ============================================================
// Stock Logs (全物料庫存異動歷程)
// ============================================================
async function getStockLogs() {
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM stock_logs ORDER BY created_at DESC');
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getStockLogs 錯誤:', err.message);
    }
  }
  return [];
}

async function addStockLog(data) {
  const { item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note } = data;
  if (pool) {
    try {
      const query = `
        INSERT INTO stock_logs (item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `;
      const result = await pool.query(query, [item_type, purchase_item_id, item_name, batch_no, change_type, change_amount, unit, note]);
      return result.rows[0].id;
    } catch (err) {
      console.error('PostgreSQL addStockLog 錯誤:', err.message);
      throw err;
    }
  }
  return null;
}

// ============================================================
// 可用物料查詢 (Dropdowns)
// ============================================================
async function getAvailableGreenBeans() {
  if (pool) {
    try {
      const query = `
        SELECT pi.*, p.purchase_date, p.supplier_name
        FROM purchase_items pi
        LEFT JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.item_type = '生豆' AND pi.remaining_quantity > 0
        ORDER BY p.purchase_date DESC, pi.id DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getAvailableGreenBeans 錯誤:', err.message);
    }
  }
  return [];
}

async function getAvailableMaterials() {
  if (pool) {
    try {
      const query = `
        SELECT pi.*, p.purchase_date, p.supplier_name
        FROM purchase_items pi
        LEFT JOIN purchases p ON pi.purchase_id = p.id
        WHERE pi.item_type IN ('包材', '耗材') AND pi.remaining_quantity > 0
        ORDER BY p.purchase_date DESC, pi.id DESC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getAvailableMaterials 錯誤:', err.message);
    }
  }
  return [];
}

async function getInventoryOverview() {
  if (pool) {
    try {
      const query = `
        SELECT item_type, item_name, unit, SUM(remaining_quantity) as total_remaining
        FROM purchase_items
        WHERE remaining_quantity > 0
        GROUP BY item_type, item_name, unit
        ORDER BY 
          CASE item_type WHEN '生豆' THEN 1 WHEN '包材' THEN 2 WHEN '耗材' THEN 3 ELSE 4 END,
          item_name
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL getInventoryOverview 錯誤:', err.message);
    }
  }
  return [];
}

module.exports = {
  initializeDB,
  getProducts, getProductByID, isProductIDExists, addProduct, updateProduct, deleteProduct,
  getOrderingGuide, saveOrderingGuide,
  getBusinessHours, saveBusinessHours,
  getProductsByCategory, getCoffeeBeanFilters,
  getCustomerByPhone, getOrdersByPhone, createOrder,
  getAdminOrders, updateOrderStatus,
  getSuppliers, getSupplierByID, addSupplier, updateSupplier, deleteSupplier,
  getPurchases, getPurchaseByID, createPurchase, updatePurchase, updatePurchaseStatus, deletePurchase,
  getRoastRecords, addRoastRecord,
  getMaterialUsages, addMaterialUsage,
  getStockLogs, addStockLog,
  getAvailableGreenBeans, getAvailableMaterials,
  getInventoryOverview
};
