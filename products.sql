-- ============================================================
-- KAKAMA COFFEE - 全能商品資料表 DDL (SQL Server)
-- 支援：咖啡豆 / 掛耳包組 / 周邊產品 三大類別
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
BEGIN
  CREATE TABLE Products (
    -- 主鍵與類別
    ProductID    NVARCHAR(20)   NOT NULL PRIMARY KEY,     -- 如 CO135, DP001, ACC001
    Category     NVARCHAR(20)   NOT NULL,                 -- 咖啡豆 / 掛耳包組 / 周邊產品

    -- ─── 咖啡豆專用欄位 ───
    Origin         NVARCHAR(100)  NULL,   -- 產區 (國家)，如：衣索比亞
    Estate         NVARCHAR(255)  NULL,   -- 處理莊園，如：耶加雪菲 歌迪貝 艾瑞莎
    Name           NVARCHAR(255)  NULL,   -- 咖啡命名/品種，如：藝伎、日曬
    ProcessMethod  NVARCHAR(100)  NULL,   -- 處理法，如：日曬、水洗、蜜處理

    -- ─── 掛耳包/周邊專用欄位 ───
    Brand          NVARCHAR(255)  NULL,   -- 品牌或烘焙度描述，如：中烘焙
    PackageNotes   NVARCHAR(500)  NULL,   -- 內容物包數說明，如：10包/組，內含5種精品豆各2包

    -- ─── 彈性多規格價格 (最多 3 組) ───
    Unit_1   NVARCHAR(50)   NULL,         -- 規格名稱，如：半磅、每組、每個
    Price_1  DECIMAL(10, 0) NULL,         -- 對應價格
    Unit_2   NVARCHAR(50)   NULL,
    Price_2  DECIMAL(10, 0) NULL,
    Unit_3   NVARCHAR(50)   NULL,
    Price_3  DECIMAL(10, 0) NULL,

    -- ─── 特價機制 ───
    OriginalPrice  DECIMAL(10, 0) NULL,   -- 原價（未折扣價）
    SalePrice      DECIMAL(10, 0) NULL,   -- 特價 / 推廣價

    -- ─── 共用欄位 ───
    FlavorDescription  NVARCHAR(MAX)  NULL, -- 風味描述 / 商品說明
    Stock              INT            NOT NULL DEFAULT 0,
    IsLimited          BIT            NOT NULL DEFAULT 0  -- 是否限量
  );
END
GO

-- ─── 範例資料 ───
-- 精品咖啡豆 (CO135)
INSERT INTO Products
  (ProductID, Category, Origin, Estate, Name, ProcessMethod, Unit_1, Price_1, Unit_2, Price_2, Unit_3, Price_3, FlavorDescription, Stock, IsLimited)
VALUES
  ('CO135', N'咖啡豆', N'衣索比亞', N'耶加雪菲 歌迪貝 艾瑞莎', NULL, N'日曬',
   N'半磅', 380, N'一磅', 700, N'耳掛', 45,
   N'藍莓、水蜜桃、茉莉花香、佛手柑與蜂蜜甜感，層次豐富明亮。', 50, 0);

-- 掛耳包組 (DP001)
INSERT INTO Products
  (ProductID, Category, Brand, PackageNotes, Unit_1, Price_1, FlavorDescription, Stock, IsLimited)
VALUES
  ('DP001', N'掛耳包組', N'中烘焙', N'10包/組，內含5種精品豆各2包',
   N'每組', 185,
   N'綜合烘焙，堅果醇厚、焦糖甜感，適合喜愛濃醇口感的您。', 30, 1);

-- 周邊產品 (ACC001)
INSERT INTO Products
  (ProductID, Category, Brand, Unit_1, Price_1, OriginalPrice, SalePrice, FlavorDescription, Stock, IsLimited)
VALUES
  ('ACC001', N'周邊產品', N'KAKAMA COFFEE', N'個', 280, 350, 280,
   N'KAKAMA COFFEE 自家品牌濾紙，專為手沖設計，配合V60使用效果最佳。', 100, 0);
GO

-- ============================================================
-- 掛耳包配方表 (DripBagRecipes)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DripBagRecipes' AND xtype='U')
BEGIN
  CREATE TABLE DripBagRecipes (
    ParentProductID VARCHAR(20) NOT NULL,
    SubProductID    VARCHAR(20) NOT NULL,
    Quantity        INT NOT NULL DEFAULT 2,
    PRIMARY KEY (ParentProductID, SubProductID)
  );
END
GO

-- 範例配方 (DP001 包含 CO135)
INSERT INTO DripBagRecipes (ParentProductID, SubProductID, Quantity)
VALUES ('DP001', 'CO135', 2);
GO

-- ============================================================
-- 訂購方式管理 (Ordering Guide)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderingGuide' AND xtype='U')
BEGIN
  CREATE TABLE OrderingGuide (
    GuideID INT NOT NULL PRIMARY KEY,
    MainDescription NVARCHAR(MAX) NULL
  );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderingGuideItems' AND xtype='U')
BEGIN
  CREATE TABLE OrderingGuideItems (
    ItemID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    StepNumber INT NOT NULL,
    Title NVARCHAR(255) NULL,
    Content NVARCHAR(MAX) NULL
  );
END
GO

-- 預設測試資料 (Ordering Guide)
IF NOT EXISTS (SELECT * FROM OrderingGuide WHERE GuideID = 1)
BEGIN
  INSERT INTO OrderingGuide (GuideID, MainDescription)
  VALUES (1, N'桃子');

  INSERT INTO OrderingGuideItems (StepNumber, Title, Content)
  VALUES (1, N'請加 line 訂購', N'Line id: goodcafe');
END
GO

-- ============================================================
-- 營業時間管理 (Business Hours)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessAnnouncement' AND xtype='U')
BEGIN
  CREATE TABLE BusinessAnnouncement (
    AnnouncementID INT NOT NULL PRIMARY KEY,
    Content NVARCHAR(MAX) NULL
  );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessHours' AND xtype='U')
BEGIN
  CREATE TABLE BusinessHours (
    DayOfWeek INT NOT NULL PRIMARY KEY,
    IsOpen BIT NOT NULL DEFAULT 1
  );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='BusinessHourSlots' AND xtype='U')
BEGIN
  CREATE TABLE BusinessHourSlots (
    SlotID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    DayOfWeek INT NOT NULL,
    StartTime VARCHAR(5) NOT NULL,
    EndTime VARCHAR(5) NOT NULL
  );
END
GO

-- 預設測試資料 (Business Hours)
IF NOT EXISTS (SELECT * FROM BusinessAnnouncement WHERE AnnouncementID = 1)
BEGIN
  INSERT INTO BusinessAnnouncement (AnnouncementID, Content)
  VALUES (1, N'');

  -- 星期一至星期日 (1-7)
  INSERT INTO BusinessHours (DayOfWeek, IsOpen) VALUES 
  (1, 0), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1);

  -- 預設時段 (二到日，僅在無任何時段設定時才寫入)
  IF NOT EXISTS (SELECT * FROM BusinessHourSlots)
  BEGIN
    DECLARE @day INT = 2;
    WHILE @day <= 7
    BEGIN
      INSERT INTO BusinessHourSlots (DayOfWeek, StartTime, EndTime)
      VALUES (@day, '11:00', '14:30'), (@day, '17:00', '21:00');
      SET @day = @day + 1;
    END
  END
END
GO
