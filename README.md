# ☕ KAKAMA COFFEE 後台管理系統 (CoffeeShop)

本專案旨在展示全端（Frontend + Backend + Database）架構的完整連動開發，採用 Node.js (Express) 作為後端，並具備優雅的無縫切換 UI 與高質感的深色玻璃擬真風格設計 (Glassmorphism UI)。

---

## 🚀 技術棧與資料庫架構 (Tech Stack & Architecture)

- **前端 (Frontend)**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism UI), Bootstrap 5.3
- **後端 (Backend)**: Node.js, Express.js
- **資料庫 (Database)**: Synology NAS Docker 容器化 PostgreSQL (Port: 5433)
  - **雙重機制 (Fallback)**: 具備動態連線與自動降級機制。若 PostgreSQL 無法連線，系統將自動無縫切換至「記憶體陣列」模擬資料庫，確保系統在任何開發環境下皆能流暢執行。

---

## ✨ 已開發功能清單 (Completed Features)

### 1. 🔒 系統登入與權限管理
- 提供標準的帳號密碼登入頁面（預設測試帳號：admin / 密碼：password）。
- 使用 Session Storage 搭配 JWT token 進行路由阻擋，確保未登入者無法訪問後台主系統。

### 2. ☕ 商品管理 (Products)
- 支援完整的 CRUD (增刪改查) 操作與搜尋、類別篩選。
- 專屬動態欄位擴充：
  - 🫘 咖啡豆：可設定產區、莊園、處理法，系統自動組合商品名稱。
  - 👂 掛耳包組：動態擴充「配方組合設定」，提供 5 組下拉選單供管理員從現有咖啡豆中挑選（支援重複與防呆機制）。
  - 多規格/價格：單一商品支援最多 3 組規格（例如：半磅、一磅、耳掛），支援特價檢核機制。

### 3. 📝 訂購方式管理 (Ordering Guide)
- 獨立面板管理前台顯示的訂購流程。
- 主說明：提供大面積 Textarea 輸入前導文字。
- 動態步驟清單：可自由新增多組操作步驟（例如：請加 Line 訂購、選擇寄送方式），並支援一鍵移除功能。

### 4. 🕒 營業時間管理 (Business Hours)
- 臨時營運異動公告：彈性發布店內臨時異動公告。
- 星期一至星期日營業狀態：一鍵切換「營業/店休」狀態（店休時時間設定區域自動反灰鎖定）。
- 多段班時段設定：針對每日營業時間，可自由無限新增「開始時間 - 結束時間」區段（如 11:00-14:30 及 17:00-21:00）。

---

## 🛡️ KAKAMA 專案開發規範：Vibe Coding 三招防禦心法

在與 AI 協作開發 (Vibe Coding) 時，所有開發者與 AI 助手必須嚴格遵守以下三招防禦心法，避免區域改動造成全域污染：

### 1. 🎨 樣式徹底命名空間化 (Scoped CSS)
- 原則：嚴禁直接修改全域標籤（如 body, h1, button 等）的樣式。
- 作法：
  - 前台所有樣式封裝在 .client-portal 命名空間內。
  - 後台管理系統所有樣式封裝在 .admin-portal 命名空間內。
  - 共用元件獨立成 common.css 並保持極度克制。

### 2. ⚡ JS 模組化隔離與零全域污染 (No Global Pollution)
- 原則：前後台 JavaScript 徹底分流，嚴禁在 window 下建立衝突的全域變數。
- 作法：
  - 前台邏輯專屬 app.js，後台邏輯專屬 admin.js。
  - 使用 IIFE (立即執行函式) 或 ES Modules 進行封裝。
  - DOM 事件監聽必須先鎖定特定父容器（例如：document.querySelector('#admin-sidebar').addEventListener(...)）。

### 3. 📂 專案目錄與靜態資源嚴格分家 (Directory Isolation)
- 原則：結構上徹底隔離。
- 作法：
  - 前台靜態檔案置於 public/（如 index.html, style.css, app.js）。
  - 後台管理系統置於獨立目錄 public/admin/（如 admin.html, admin.css, admin.js）。

---

## 💻 本機開發環境啟動指南 (Local Development)

1. 安裝依賴套件:
   npm install

2. 環境變數設定 (.env):
   專案根目錄需建立 .env 檔，並填入 PostgreSQL 設定：
   DB_ENABLED=true
   DB_HOST=192.168.0.202
   DB_PORT=5433
   DB_USER=kakama_admin
   DB_PASSWORD=YOUR_PASSWORD
   DB_DATABASE=kakama_coffee

3. 啟動伺服器:
   npm start

   或開發模式：
   npm run dev

4. 開啟系統:
   請在瀏覽器前往 http://localhost:3000

---

## 🚀 專案部署規範：本機 IIS 守護執行 Node.js

透過 iisnode 模組，讓 Windows 內建的 IIS 直接守護並運行 Node.js 服務，無需在背景手動維持 npm start。

### 1. 啟用 Windows 內建 IIS
1. 按下 Win + R 輸入 optionalfeatures。
2. 展開 Internet Information Services -> 全球資訊網服務 -> 應用程式開發功能。
3. ⚠️ 關鍵：務必勾選「CGI」功能。

### 2. 安裝核心雙寶套件
- IIS URL Rewrite（網址重寫模組）：微軟官方下載
- iisnode-full (x64)：iisnode GitHub Releases（請選擇 iisnode-full-v0.2.21-x64.msi 版本）

### 3. 配置專案根目錄 web.config
在專案根目錄（與 server.js 同級）新增 web.config：

<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>

    <rewrite>
      <rules>
        <rule name="StaticContent">
          <action type="None" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" />
          </conditions>
          <match url=".*" />
        </rule>

        <rule name="DynamicContent">
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>

    <security>
      <requestFiltering>
        <hiddenSegments>
          <remove segment="bin"/>
          <add segment="node_modules" />
          <add segment="config" />
        </hiddenSegments>
      </requestFiltering>
    </security>

    <iisnode devErrorsEnabled="true" logDirectory="iisnode" />
  </system.webServer>
</configuration>

### 4. 建立 IIS 網站與權限設定
1. 開啟 IIS 管理員 (inetmgr)，新增網站 KAKAMA。
2. 實體路徑指向專案根目錄，連接埠設定為 8080。
3. 權限設定：專案資料夾右鍵「內容」->「安全性」->「編輯」，新增 IIS_IUSRS 群組並賦予「讀取和執行」、「列出資料夾內容」及「讀取」權限。

### ⚡ 部署避坑要點
- 禁止重複監聽 Ports：在 iisnode 底下，PORT 變數會被轉譯為 Windows 命名管道 (Named Pipe)，全域生命週期中只能呼叫一次 app.listen()。
- 全域解鎖處理常式：若出現 Error 500.19，請以系統管理員身分開啟 CMD 執行：
  %windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/handlers
  %windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/modules

---

## 🛠️ 開發環境常遇到問題與排除 (Troubleshooting)

### 1. PowerShell 拒絕執行 npm start 腳本

#### ❌ 錯誤現象
在 Windows PowerShell 下執行 npm start 時出現紅字錯誤：
> npm : 因為這個系統上已停用指令碼執行，所以無法載入 C:\Program Files\nodejs\npm.ps1 檔案...

#### 💡 原因說明
Windows 系統預設將 PowerShell 的指令碼執行策略 (ExecutionPolicy) 設為 Restricted，會將 npm.ps1 當成未知風險腳本封鎖。

#### 🔧 解決方案（二選一）
- 方案 A：本機權限一次性解鎖（強烈推薦 ⭐⭐⭐⭐⭐）
  1. 以系統管理員身分開啟 Windows PowerShell。
  2. 執行指令：Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
  3. 出現提示時輸入 Y 並按下 Enter 即可完畢。
- 方案 B：切換終端機為 CMD
  1. 在 VS Code 終端機分頁點擊右上方 + 號旁邊的下拉選單 v。
  2. 選擇 Command Prompt (CMD) 即可正常執行 npm start。

### 2. Docker 服務連接埠 (Port) 衝突排解 (5432 轉 5433)

#### ❌ 錯誤現象
在 NAS (Synology Container Manager) 建立 PostgreSQL 容器時出現 Port 被佔用或連線失敗。

#### 💡 原因說明
PostgreSQL 預設外部 Port 為 5432。若 NAS 上已部署其他服務（如 Immich），該服務會佔用 5432，導致新容器無法順利綁定。

#### 🔧 解決方案 (Port Mapping)
保持容器內部 Port 5432 不變，將 Host 端對外連接埠改為未被佔用的 5433。

- docker-compose.yml 設定範例：
  services:
    kakama-postgres:
      image: postgres:16.8-alpine
      container_name: kakama-postgres
      restart: always
      ports:
        - "5433:5432"  # 左側 5433 為對外實體 Port，右側 5432 為容器內部 Port
      environment:
        POSTGRES_USER: kakama_admin
        POSTGRES_PASSWORD: ${DB_PASSWORD}
        POSTGRES_DB: kakama_coffee
      volumes:
        - /volume1/docker/kakama-postgres-data:/var/lib/postgresql/data

---

## 🤝 KAKAMA 專案 Debug 固定作業流程 (SOP)

為保持程式庫乾淨與高效率，進行 Bug 排除時嚴格遵守以下流程：

1. 提供案發現場：優先提供詳細的錯誤 Stack、F12 控制台截圖，或 iisnode 底層輸出。
2. 物理勘查，拒絕盲改：在動手前，必須完整對齊關聯檔案，看過實體程式碼再下結論。
3. 定位核心衝突：釐清 OS、IIS 與 Node.js 異步事件之間的交互邏輯，找出 Root Cause。
4. 最小變動原則：精準修復、重構，拒絕大面積無意義的覆寫，以維持系統穩定。

---
*本專案由 Antigravity AI 協同開發，展示了從需求理解、架構規劃到 UI/UX 與後端 API 串接的高效完整流程。*

## 🚀 開發進度紀錄 (2026-08-02)

### 📦 1. 新增「進貨商管理 (Supplier Management)」模組
為了將後勤供應鏈納入系統管理，已完成「進貨商管理」後台模組的開發，支援全方位材料來源（生豆商、包材商、設備耗材商等）的 CRUD 操作與評鑑機制。

#### 核心功能與特點：
* **統一資料庫連線**：嚴格遵循 Singleton 模式，全模組統一引用現有 `config/db.js` 連線檔，確保 PostgreSQL 連線池（Connection Pool）一致性與穩定度。
* **供應商評鑑與自我評價**：支援 1~5 星級評鑑（⭐）與文字評價備註，作為未來進貨優先順序之參考。
* **智慧地址/官網識別**：在列表頁面自動判斷 `address_or_url` 欄位內容：
  * 若為 `http://` 或 `https://` 開頭，自動渲染為帶有 🔗 圖示的超連結，點擊可直接開啟新頁籤。
  * 若為實體地址，則自動加上 📍 圖示並呈現在列表，提升檢視效率。
* **資料庫 Seed 腳本**：建立 `seed-suppliers.js` 測試資料腳本，自動寫入 8 家涵蓋「生豆商、包材商、設備耗材商、其他」類別之擬真進貨商資料。

#### 相關檔案異動：
* **Database**: `suppliers` 資料表 (PostgreSQL)
* **Backend**: `routes/suppliers.js`, `config/db.js` (新增供應商 CRUD API 與 Mock 雙軌備援)
* **Frontend**: `public/dashboard.html`, `public/js/admin.js`, `public/css/admin.css`

---

### 📌 下階段開發規劃 (Pending / Next Steps)

#### ☕ 「進貨管理 (Purchase Management)」模組實作
目前已完成商業邏輯與資料庫 Schema 規劃，下一次開發重點如下：

1. **進貨單與明細表 (Header-Detail Structure)**：
   * 建立 `purchases` (進貨單主表) 與 `purchase_items` (進貨明細表)。
   * 支援 PostgreSQL Transaction (`BEGIN` / `COMMIT` / `ROLLBACK`) 確保多品項進貨時的一致性。

2. **生豆與包材動態欄位分流**：
   * **生豆類別**：包含生豆批號/產季 (`batch_no`，如 `C192`)、產區 (`origin`)、處理法 (`process_method`)，並設置預留庫存欄位 (`remaining_quantity`)。
   * **包材/耗材類別**：針對規格與數量做簡易進貨管理。

3. **預留「生豆出庫與烘焙紀錄 (Roasting Batches)」對接**：
   * 本模組之進貨生豆將獨立於前端購物車（熟豆銷售），未來將透過獨立的「生豆出庫/烘焙紀錄表」進行烘焙失重率計算與熟豆庫存轉換。


## 🚀 開發進度與架構規劃紀錄 (2026-08-03)

### ☕ 「進貨管理 (Purchase Management)」方案 A 升級規劃

為了讓生豆進貨資料能 100% 無縫連動至未來的「商品管理（上架新熟豆商品）」，並提供最順暢的打單體驗，進貨明細將採用 **「方案 A：多層式卡片明細 (Card-based Layout)」** 結構，實現一次輸入、全系統引用的效益。

---

### 🗄️ 1. 資料庫欄位擴充 (PostgreSQL `purchase_items`)
明細表將包含完整的生豆履歷與風味欄位：
* `item_code`：商品編號 / 生豆編號（例如：`BV-84N`）
* `item_name`：品項名稱（例如：`巴西 南米納斯 精品生豆`）
* `batch_no`：批號 / 產季（例如：`2025/2026`）
* `origin`：產地（例如：`巴西 南米納斯`）
* `variety`：品種 / 豆種（例如：`Red Catuai 卡杜艾`）
* `altitude`：海拔（例如：`1100m`）
* `process_method`：處理法（例如：`日曬`）
* `flavor_description`：風味描述（例如：`巧克力、焦糖、木瓜、桃子`）
* `quantity` / `unit` / `unit_price` / `subtotal` / `remaining_quantity`：數量與金額

---

### 🎨 2. UI 介面排版結構 (方案 A)
每一筆進貨明細採用卡片區塊呈現，避免橫向欄位過多擠壓：

* **第一行（進貨交易欄）**：
  `類型` | `商品編號` | `品項名稱` | `數量` | `單位` | `單價` | `小計` | `[🗑️ 刪除]`
* **第二行（生豆履歷欄 - 僅當類型 = 生豆時顯示）**：
  `批號/產季` | `產地` | `品種` | `海拔` | `處理法`
* **第三行（風味描述欄 - 僅當類型 = 生豆時顯示）**：
  `風味描述` (全寬度跨欄輸入框)
* **自動收合機制**：當類型切換為「包材/耗材/其他」時，自動隱藏第二與第三行，保持介面簡潔。

---

### 🤖 下次開發給 Agent 的 prompt（直接複製使用）：

> **任務目的**：將「進貨管理」明細改為「方案 A 多層卡片式排版」，並於資料庫與前端新增商品編號、品種、海拔、風味描述等生豆履歷欄位。
>
> **1. 資料庫 Schema 擴充 (`config/db.js`)**
> * 於 `purchase_items` 資料表中新增欄位：
>   * `item_code` VARCHAR(50) (商品編號)
>   * `variety` VARCHAR(100) (品種/豆種)
>   * `altitude` VARCHAR(50) (海拔)
>   * `flavor_description` TEXT (風味描述)
>
> **2. 明細 UI 改版為多層卡片式結構 (`public/dashboard.html` & `public/js/admin.js`)**
> * 重構進貨 Modal 中的明細清單渲染邏輯，每一筆品項改為獨立的暗色卡片區塊：
>   * **Row 1**：類型選單、商品編號、品項名稱、數量、單位、單價、小計、刪除按鈕。
>   * **Row 2 (僅類型為生豆時顯示)**：批號/產季、產地、品種、海拔、處理法。
>   * **Row 3 (僅類型為生豆時顯示)**：風味描述 Input（全寬呈現，預設 `$0` 小計與可編輯狀態）。
> * **新增與切換邏輯**：點擊「+ 新增品項」時，預設帶入生豆類別，並自動解鎖 Row 2 與 Row 3 所有欄位；類型切換為非生豆時自動隱藏 Row 2 與 Row 3。
>
> **3. API 寫入與讀取同步 (`routes/purchases.js`)**
> * 更新 `POST /api/purchases` 與 `GET /api/purchases`，確保上述新增欄位能正確寫入資料庫與回傳至前端檢視 Modal 中。

## 🚀 開發進度與架構更新 (2026-08-06)

### ☕ 「進貨管理 (Purchase Management)」方案 A 多層卡片式改版完成

成功實現 **「方案 A：多層卡片式排版 (Card-based Layout)」**，完成生豆履歷與風味描述欄位擴充，並修復物料類型切換與編輯儲存 Bug。

---

### 🗄️ 1. 資料庫 Schema 擴充與 API 同步
* **PostgreSQL `purchase_items` 明細表擴充欄位**：
  * `item_code`：商品編號 / 生豆編號（如 `BV-84N`、`K190`）
  * `variety`：品種 / 豆種（如 `Red Catuai`、`阿拉比卡`）
  * `altitude`：海拔（如 `1100m`、`1500m+`）
  * `flavor_description`：風味描述（全寬文字，紀錄完整杯測風味）
* **API 邏輯調整**：同步更新 `POST /api/purchases`、`GET /api/purchases` 與 `PUT /api/purchases/:id`，確保新欄位能完整寫入、讀取與更新。

---

### 🎨 2. UI 多層卡片式結構與動態收合
* **三層式卡片排版**：
  * **Row 1（交易資訊）**：物料類型選單、商品編號、品項名稱、數量、單位、單價、小計、$0 預設運算與刪除按鈕。
  * **Row 2（生豆履歷 - 僅類型為生豆時顯示）**：批號/產季、產地、品種、海拔、處理法。
  * **Row 3（風味描述 - 僅類型為生豆時顯示）**：風味描述全寬輸入框。
* **動態切換機制**：
  * 當切換為 **「包材 / 耗材 / 其他」** 時，自動隱藏 Row 2 與 Row 3，卡片縮回俐落單行，保持介面簡潔。
  * 當切換為 **「生豆」** 時，自動展開 Row 2 與 Row 3 履歷與風味欄位，預設為可直接打字狀態。

---

### 🔧 3. 系統 Bug 修復
* **修復 `PUT /api/purchases/:id` 編輯儲存 Bug**：解決先前編輯進貨單儲存時拋出 `Unexpected token '<', "<!DOCTYPE "... is not valid JSON` 的問題，編輯儲存與檢視功能恢復正常。

## 🚀 開發日誌：庫存與烘豆管理模組上線

**📅 日期：** 2026-08-07

### ✅ 今日完成進度 (Done)

* **資料庫結構擴充 (PostgreSQL)**：成功建立 `roast_records` (烘豆主表)、`roast_item_sources` (生豆扣減明細)、`material_usages` (包材耗材領用)、`stock_logs` (全物料庫存異動流水帳) 等關聯資料表。
* **嚴謹的交易邏輯 (DB Helper)**：升級 `addRoastRecord` 與 `addMaterialUsage` 函式，全面導入 `BEGIN...COMMIT` 交易保護。
* **庫存防呆攔截機制**：於資料庫層加入庫存檢核，若扣減數量大於當前剩餘庫存 (`remaining_quantity`)，系統將自動 `ROLLBACK` 並阻擋異常出庫。
* **後端 API 路由建置**：完成 `routes/inventory.js` 開發，提供生豆選單、包材選單、歷程查詢、扣減執行與庫存總覽等 RESTful API 接口。
* **後台介面整合 (Dashboard)**：於管理員側邊欄新增「庫存與烘豆管理」專屬模組，並完成前端 API 串接與畫面渲染。
* **庫存總覽實作 (Inventory Overview)**：建立即時庫存水位表，以顏色 Badge 區分生豆與包耗材，有效掌握當前各品項可用餘量。
* **烘豆出庫自動化**：實作烘豆紀錄表單，支援前端即時運算「失重率」，並根據異常數值（如 <10% 或 >25%）給予視覺警示。
* **包耗材領用與損耗追蹤**：實作包材與耗材的領用表單，支援標註正常領用、報廢損耗或盤點調整。
* **全自動庫存異動流水帳**：系統現可自動記錄所有物料的進、出、扣減歷程，確保庫存帳務具備完整的稽核軌跡。

---

### 📝 後續預計開發與優化工作 (To-Do)

* **庫存模組實機測試**：針對烘豆出庫、包材領用與防呆機制進行完整的 UI 操作與 End-to-End 流程測試。
* **進貨管理查詢 UI 升級**：於進貨列表新增「關鍵字搜尋框」，支援針對進貨單號、廠商名稱與品項明細的模糊查詢 (ILIKE)。
* **進貨單列表排序修正**：將進貨紀錄的預設排序依據由「系統建檔時間」修正為真實的「進貨日期」，優化找單體驗。
* **進貨明細智慧選單 (Item Master)**：將新增進貨單時的「品項名稱」欄位升級為「下拉選單 ＋ 手動輸入」複合元件，自動帶入歷史品項，避免打錯字造成庫存名稱分歧。
* **優化前端 Console 提示 (Optional)**：補上 `favicon.ico` 圖示檔案，消除開發者工具中無害的 404 報錯訊息。
   