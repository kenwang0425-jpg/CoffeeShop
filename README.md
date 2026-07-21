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
    

## 🚀 專案部署規範：本機 IIS 守護執行 Node.js (實戰部署指南)

透過 `iisnode` 模組，讓 Windows 內建的 IIS 直接守護並運行 Node.js 服務，無需在背景手動維持 `npm start`。

### 1. 啟用 Windows 內建 IIS
1. 按下 `Win + R` 輸入 `optionalfeatures`。
2. 展開 `Internet Information Services` -> `全球資訊網服務` -> `應用程式開發功能`。
3. **⚠️ 關鍵：務必勾選「CGI」功能。**

### 2. 安裝核心雙寶套件
* **IIS URL Rewrite（網址重寫模組）**：[微軟官方下載](https://www.iis.net/downloads/microsoft/url-rewrite)（用來分配路由）。
* **iisnode-full (x64)**：[iisnode GitHub Releases](https://github.com/tjanczuk/iisnode/releases)（請選擇 `iisnode-full-v0.2.21-x64.msi` 版本安裝，相依元件最完整）。

### 3. 配置專案根目錄 `web.config`
在專案根目錄（與 `server.js` 同級）新增 `web.config`，引導 IIS 如何處理 Node.js 請求：

```xml
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

4. 建立 IIS 網站與設定權限
開啟 IIS 管理員（inetmgr），新增網站：

網站名稱：KAKAMA

實體路徑：指向你的 CoffeeShop 專案根目錄。

連接埠 (Port)：8080（避免與預設的 80 衝突）。

⚠️ 存取權限避坑大絕招：

在 CoffeeShop 專案資料夾按右鍵「內容」->「安全性」->「編輯」。

點選「新增」，輸入 IIS_IUSRS。

允許該群組擁有 「讀取和執行」、「列出資料夾內容」 及 「讀取」 權限，否則 IIS 將拋出 500.19 或 401 權限不足錯誤。

⚡ 部署實務避坑指南（精華備忘錄）
💡 1. 嚴格禁止重複監聽連接埠（Named Pipe 衝突）
在 iisnode 底下，PORT 變數會被 IIS 轉譯為一個動態分配的 Windows「命名管道（Named Pipe）」。
切記：在整個 server.js 的生命週期中，只能呼叫一次 app.listen()！

❌ 錯誤示範：在程式中途和底部的 startServer() 裡各寫了一次 app.listen(PORT)。這會導致第二次監聽時拋出連接埠已被佔用（EADDRINUSE），使 Node 靜默退出。

✅ 正確示範：

JavaScript
const PORT = process.env.PORT || 3000; // 必須嚴格注意變數大小寫一致！

async function startServer() {
  try {
    await db.initializeDB(); // 確保非同步資料庫初始化成功後...
    
    // 僅在此處監聽唯一一次！
    app.listen(PORT, () => {
      console.log(`🚀 [Server] 伺服器已啟動，監聽中: ${PORT}`);
    });
  } catch (error) {
    console.error("❌ 伺服器啟動失敗:", error);
  }
}
startServer();
🔓 2. IIS 全域解鎖處理常式（Error 500.19 / 0x80070021）
如果網站執行時彈出 <handlers> 區段在父層級被鎖定的錯誤，代表 IIS 預設不允許子網站的 web.config 覆蓋設定。

解決辦法：以 「系統管理員身分」 開啟命令提示字元（CMD），執行以下指令解鎖：

DOS
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/handlers
%windir%\system32\inetsrv\appcmd.exe unlock config -section:system.webServer/modules
完成後，執行 iisreset 重啟服務。

🤝 KAKAMA 專案 Debug 固定作業流程 (SOP)
為了保持程式庫的乾淨與高效率，往後進行 bug 排除時，我們嚴格遵守以下流程，拒絕沒有對齊 Context 的盲目通靈：

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. 提供案發現場  │ ──> │ 2. 提供關聯代碼  │ ──> │ 3. 定位核心衝突  │ ──> │ 4. 最小變動修復  │
│ (Log/Error/F12) │     │  (不看 Code 不動手)│     │  (尋找 Root Cause)│     │  (精簡重構防禦)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
提供案發現場：優先提供詳細的錯誤 Stack、F12 控制台截圖，或 iisnode 資料夾下 .txt 檔案中的底層輸出。

物理勘查，拒絕盲改：在動手前，必須完整對齊關聯檔案（如 server.js、db.js），先看過實體代碼再下結論。

定位核心衝突：釐清作業系統、IIS 與 Node.js 異步事件之間的交互邏輯，找出 Root Cause。

最小變動原則：精準修復、重構，拒絕大面積、無意義的覆寫，以維持 KAKAMA 系統的最優雅、最穩定狀態。

## 🛠️ 開發環境常遇到問題與排除 (Troubleshooting)

### 1. PowerShell 拒絕執行 `npm start` 腳本

#### ❌ 錯誤現象
在 Windows PowerShell 下執行 `npm start` 時，出現以下紅字錯誤警告：
> `npm : 因為這個系統上已停用指令碼執行，所以無法載入 C:\Program Files\nodejs\npm.ps1 檔案...`

#### 💡 原因說明
Windows 系統預設將 PowerShell 的指令碼執行策略（ExecutionPolicy）設為 `Restricted`，會將 `npm.ps1` 檔當成未知風險腳本封鎖。

#### 🔧 解決方案（二選一）

* **方案 A：本機權限一次性解鎖（強烈推薦 ⭐⭐⭐⭐⭐）**
  1. 在 Windows 搜尋列輸入 **PowerShell**，對其按右鍵選擇 **「以系統管理員身分執行」**。
  2. 輸入以下指令解鎖當前使用者的執行權限：
     ```powershell
     Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```
  3. 出現提示時輸入 `Y` 並按下 Enter 即可完畢。後續即可在 VS Code 終端機自由執行 `npm` 指令。

* **方案 B：切換終端機為 CMD**
  1. 在 VS Code 終端機分頁點擊右上方 `+` 號旁邊的下拉選單 `v`。
  2. 選擇 **`Command Prompt` (命令提示字元 / CMD)**。
  3. 於 CMD 終端機內即可正常執行 `npm start`。

### 2. Docker 服務連接埠 (Port) 衝突排解 (5432 轉 5433)

#### ❌ 錯誤現象
在 NAS (Synology Container Manager) 建立 PostgreSQL 容器或執行 Docker Compose 時，出現 Port 被佔用的錯誤，或是無法正常連線至資料庫。

#### 💡 原因說明
PostgreSQL 預設使用的外部連接埠為 `5432`。若 NAS 上已部署其他服務（例如 Immich 相片管理系統），該服務很可能已經佔用了預設的 `5432` Port，導致新的 PostgreSQL 容器無法順利綁定同一個 Port。

#### 🔧 解決方案（Port Mapping 連接埠映射）
保持容器內部的預設連接埠 `5432` 不變，僅將**對外曝露（Host 端）**的連接埠改為未被佔用的 **`5433`**。

* **Docker Compose 設定檔 (`docker-compose.yml`) 修改範例：**
  ```yaml
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

應用程式連線設定 (.env) 修改：
在 Node.js 或 GUI 管理工具（如 DBeaver）連線時，需將 Port 指定為對外開放的 5433：
DB_HOST=192.168.0.202
DB_PORT=5433
DB_USER=kakama_admin
DB_DATABASE=kakama_coffee
---

這段放進去之後，你筆記裡的「網路架構與除錯紀錄」就完全補齊了！以後如果又要在 NAS 上開新的資料庫容器，翻一下這段筆記就能一秒想起來 Port 映射的邏輯囉！👌☕

