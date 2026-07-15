# KAKAMA COFFEE 後台管理系統 (CoffeeShop)

本專案旨在展示全端（Frontend + Backend + Database）架構的完整連動開發，採用 Node.js (Express) 作為後端，並具備優雅的無縫切換 UI 與高質感的深色玻璃擬真風格設計。

## 🚀 技術棧 (Tech Stack)
- **前端 (Frontend)**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism UI), Bootstrap 5.3
- **後端 (Backend)**: Node.js, Express.js
- **資料庫 (Database)**: SQL Server (`mssql`) 
  - **特色**: 具備雙重運行模式，若無連線至 SQL Server，會自動降級採用「記憶體陣列」模擬資料庫，確保系統在任何環境下皆能流暢執行。

## ✨ 已開發功能清單 (Completed Features)

### 1. 🔒 系統登入與權限管理
- 提供標準的帳號密碼登入頁面（預設測試帳號：`admin` / 密碼：`password`）。
- 使用 Session Storage 搭配 JWT token（模擬）進行路由阻擋，確保未登入者無法訪問後台主系統。

### 2. ☕ 商品管理 (Products)
- 支援完整的 **CRUD (增刪改查)** 操作與搜尋、類別篩選。
- 專屬的動態欄位擴充：
  - **🫘 咖啡豆**：可設定產區、莊園、處理法，系統會自動組合商品名稱。
  - **👂 掛耳包組**：動態擴充「配方組合設定」，提供 5 組下拉選單供管理員從現有咖啡豆中挑選（支援重複與防呆機制）。
  - **多規格/價格**：單一商品支援最多 3 組規格（例如：半磅、一磅、耳掛），支援特價檢核機制。

### 3. 📝 訂購方式管理 (Ordering Guide)
- 獨立面板管理前台顯示的訂購流程。
- **主說明**：提供大面積 Textarea 輸入前導文字。
- **動態步驟清單**：可自由新增多組操作步驟（例如：請加 line 訂購、選擇寄送方式），並支援一鍵移除功能。

### 4. 🕒 營業時間管理 (Business Hours)
- **臨時營運異動公告**：彈性發布店內臨時異動。
- **星期一至星期日營業狀態**：一鍵切換「營業/店休」狀態。
  - 當設定為店休時，時間設定區域會自動反灰並鎖定。
- **多段班時段設定**：針對每日的營業時間，可自由無限新增「開始時間 - 結束時間」的區段（如 11:00-14:30 及 17:00-21:00），支援如 Google Map 般的靈活時間調整。

## 🛠️ 如何啟動專案

1. **安裝依賴套件**:
   ```bash
   npm install
   ```
2. **環境變數設定**:
   專案根目錄需包含 `.env` 檔，並設定對應的 `DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` 等連線字串。若未設定或 SQL Server 無法連線，系統將預設使用記憶體變數運作。
3. **啟動伺服器**:
   ```bash
   npm start
   ```
   或使用開發模式：
   ```bash
   npm run dev
   ```
4. **開啟系統**:
   請在瀏覽器前往 `http://localhost:3000`。

---
*本專案由 Antigravity AI 協同開發，展示了從需求理解、架構規劃到 UI/UX 與後端 API 串接的高效完整流程。*
## 🛡️ KAKAMA 專案開發規範：Vibe Coding 三招防禦心法

在享受 AI 高速編碼（Vibe Coding）的便利時，為避免 AI 因「區域上下文盲區」導致全域污染（例如：改前台卻改壞後台），所有開發者與 AI 協作時必須嚴格遵守以下三招防禦心法：

### 1. 🎨 樣式徹底命名空間化 (Scoped CSS)
* **原則**：嚴禁 AI 直接修改全域標籤（如 `body`、`h1`、`button`、`header` 等）的樣式。
* **作法**：
    * 前台所有樣式必須封裝在命名空間 `.client-portal`（或專屬前綴）內。
    * 後台管理系統所有樣式必須封裝在 `.admin-portal` 內。
    * 若有共用元件，需獨立成 `common.css` 並保持極度克制。

### 2. ⚡ JS 模組化隔離與零全域污染 (No Global Pollution)
* **原則**：前後台 JavaScript 必須徹底分流，嚴禁在 `window` 下建立衝突的全域變數或無範圍限制的 DOM 監聽器。
* **作法**：
    * 前台邏輯專屬 `app.js`，後台邏輯專屬 `admin.js`。
    * 使用 **IIFE (立即執行函式)** 或 **ES Modules (import/export)** 進行封裝。
    * 避免直接對 `document` 或通用 Class 名稱綁定全域事件，必須先鎖定父容器（例如：`document.querySelector('#admin-sidebar').addEventListener(...)`）。

### 3. 📂 專案目錄與靜態資源嚴格分家 (Directory Isolation)
* **原則**：結構上徹底隔離，老死不相往來。
* **作法**：
    * 前台靜態檔案置於 `public/`（如 `index.html`、`style.css`、`app.js`）。
    * 後台管理系統置於獨立子目錄 `public/admin/`（如 `admin.html`、`admin.css`、`admin.js`）。
    * 兩者在前端不共用任何 HTML 結構，確保路由與靜態資源載入完全獨立。
    