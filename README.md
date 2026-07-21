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
