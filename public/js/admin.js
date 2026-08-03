/**
 * KAKAMA COFFEE — 後台管理系統 (admin.js)
 * 功能：商品 CRUD、掛耳包配方、訂購方式、營業時間
 * 與前台 app.js 完全隔離，互不干擾
 */

(function () {
  'use strict';

  // ════════════════════════════════════════════════════
  //  認證檢查
  // ════════════════════════════════════════════════════
  const token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '/login.html'; return; }

  // ════════════════════════════════════════════════════
  //  DOM 參照
  // ════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);

  // Sidebar 選單
  const menuProducts      = $('menu-products');
  const menuOrdering      = $('menu-ordering');
  const menuBusinessHours = $('menu-business-hours');
  const menuOrders        = $('menu-orders');
  const menuSuppliers     = $('menu-suppliers');
  const menuPurchases     = $('menu-purchases');

  // 內容區塊
  const sectionProducts      = $('section-products');
  const sectionOrdering      = $('section-ordering');
  const sectionBusinessHours = $('section-business-hours');
  const sectionOrders        = $('section-orders');
  const sectionSuppliers     = $('section-suppliers');
  const sectionPurchases     = $('section-purchases');

  // 標題
  const pageTitle    = document.querySelector('.page-title');
  const headerWelcome = $('header-welcome');

  // 商品管理
  const searchInput     = $('search-input');
  const productListBody = $('product-list-body');
  const tableContainer  = $('table-container');
  const loadingSpinner  = $('loading-spinner');
  const emptyState      = $('empty-state');
  const btnAddProduct   = $('btn-add-product');
  const filterTabs      = document.querySelectorAll('.filter-tab');

  // 商品表單 (Modal)
  const productForm       = $('product-form');
  const productModalTitle = $('product-modal-title');
  const btnSaveProduct    = $('btn-save-product');
  const btnSaveText       = $('btn-save-text');
  const btnSaveSpinner    = $('btn-save-spinner');

  const fldProductId      = $('product-id');
  const fldCategory       = $('product-category');
  const fldOrigin         = $('product-origin');
  const fldEstate         = $('product-estate');
  const fldProcessMethod  = $('product-process-method');
  const fldNamePreview    = $('product-name-preview');
  const fldBrand          = $('product-brand');
  const fldPackageNotes   = $('product-package-notes');
  const fldUnit1          = $('product-unit-1');
  const fldPrice1         = $('product-price-1');
  const fldStock1         = $('product-stock-1');
  const fldStockUnit1     = $('product-stock-unit-1');
  const fldUnit2          = $('product-unit-2');
  const fldPrice2         = $('product-price-2');
  const fldStock2         = $('product-stock-2');
  const fldStockUnit2     = $('product-stock-unit-2');
  const fldUnit3          = $('product-unit-3');
  const fldPrice3         = $('product-price-3');
  const fldStock3         = $('product-stock-3');
  const fldStockUnit3     = $('product-stock-unit-3');
  const fldOriginalPrice  = $('product-original-price');
  const fldSalePrice      = $('product-sale-price');
  const fldFlavor         = $('product-flavor');
  const fldIsLimited      = $('product-is-limited');
  const recipeContainer   = $('recipe-list-container');

  // 刪除 Modal
  const deleteTargetCode = $('delete-target-code');
  const btnConfirmDelete = $('btn-confirm-delete');

  // 全域訊息
  const globalAlert   = $('global-alert');
  const alertMessage  = $('global-alert-message');
  const alertIcon     = $('alert-icon');

  // 登出
  const btnLogout       = $('btn-logout');
  const btnLogoutMobile = $('btn-logout-mobile');

  // 訂購方式
  const orderingMainDesc   = $('ordering-main-desc');
  const orderingContainer  = $('ordering-items-container');
  const btnAddOrderingItem = $('btn-add-ordering-item');
  const btnSaveOrdering    = $('btn-save-ordering');

  // 營業時間
  const businessAnnouncement  = $('business-announcement');
  const businessDaysContainer = $('business-days-container');
  const btnSaveBusinessHours  = $('btn-save-business-hours');

  // 訂單管理 DOM
  const sidebarPendingBadge = $('sidebar-pending-badge');
  const orderPendingCount   = $('order-pending-count');
  const btnRefreshOrders    = $('btn-refresh-orders');
  const orderCardsContainer = $('order-cards-container');
  const orderLoadingEl      = $('order-loading');
  const orderEmptyEl        = $('order-empty');
  const orderTabsEl         = $('order-tabs');
  const orderMonthSwitcher  = $('order-month-switcher');
  const btnPrevMonth        = $('btn-prev-month');
  const btnNextMonth        = $('btn-next-month');
  const monthDisplayText    = $('month-display-text');
  const monthPickerInput    = $('month-picker-input');

  // 烘豆備料單 DOM
  const btnPrepSheet    = $('btn-prep-sheet');
  const btnPrintRoast   = $('btn-print-roast');
  const roastContent    = $('roast-content');
  const roastLoadingEl  = $('roast-loading');

  // Bootstrap Modal 實例
  let productModalBS = null;
  let deleteModalBS  = null;
  let roastModalBS   = null;
  let supplierModalBS = null;
  let purchaseModalBS = null;

  // ════════════════════════════════════════════════════
  //  State
  // ════════════════════════════════════════════════════
  let allProducts        = [];
  let filteredProducts   = [];
  let currentEditID      = null;   // null = 新增, string = 編輯
  let pendingDeleteID    = null;
  let activeCategoryFilter = 'all';
  let searchQuery        = '';
  let allCoffeeBeans     = [];     // 用於掛耳包配方下拉

  // 訂單管理 State
  let activeOrderStatus = '';      // 空字串 = 全部
  let orderPollTimer    = null;    // 30 秒輪詢計時器
  let currentOrderYear  = new Date().getFullYear();
  let currentOrderMonth = new Date().getMonth() + 1; // 1-12

  const DAY_NAMES = { 1: '星期一', 2: '星期二', 3: '星期三', 4: '星期四', 5: '星期五', 6: '星期六', 7: '星期日' };


  // ════════════════════════════════════════════════════
  //  API helpers
  // ════════════════════════════════════════════════════
  async function apiFetch(url, options = {}) {
    const resp = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.message || '伺服器錯誤');
    return json;
  }

  // ════════════════════════════════════════════════════
  //  全域訊息
  // ════════════════════════════════════════════════════
  function showAlert(message, type = 'success') {
    globalAlert.className = `alert alert-${type} alert-dismissible fade show`;
    alertMessage.textContent = message;
    alertIcon.className = type === 'success'
      ? 'bi bi-check-circle-fill me-2'
      : 'bi bi-exclamation-triangle-fill me-2';
    globalAlert.classList.remove('d-none');
    setTimeout(() => globalAlert.classList.add('d-none'), 4000);
  }

  // ════════════════════════════════════════════════════
  //  Sidebar 導覽切換
  // ════════════════════════════════════════════════════
  function switchSection(section) {
    // 隱藏全部區塊
    [sectionProducts, sectionOrdering, sectionBusinessHours, sectionOrders, sectionSuppliers, sectionPurchases]
      .forEach(s => { if (s) s.classList.add('d-none'); });
    [menuProducts, menuOrdering, menuBusinessHours, menuOrders, menuSuppliers, menuPurchases]
      .forEach(m => { if (m) m.classList.remove('active'); });

    // 離開訂單頁時停止輪詢
    if (section !== 'orders') stopOrderPolling();

    if (section === 'products') {
      sectionProducts.classList.remove('d-none');
      menuProducts.classList.add('active');
      if (pageTitle) pageTitle.textContent = '商品管理';
      loadProducts();
    } else if (section === 'ordering') {
      sectionOrdering.classList.remove('d-none');
      menuOrdering.classList.add('active');
      if (pageTitle) pageTitle.textContent = '訂購方式管理';
      loadOrderingGuide();
    } else if (section === 'business-hours') {
      sectionBusinessHours.classList.remove('d-none');
      menuBusinessHours.classList.add('active');
      if (pageTitle) pageTitle.textContent = '營業時間管理';
      loadBusinessHours();
    } else if (section === 'orders') {
      sectionOrders.classList.remove('d-none');
      menuOrders.classList.add('active');
      if (pageTitle) pageTitle.textContent = '訂單管理';
      loadOrders(activeOrderStatus);
      startOrderPolling();
    } else if (section === 'suppliers') {
      if (sectionSuppliers) sectionSuppliers.classList.remove('d-none');
      if (menuSuppliers) menuSuppliers.classList.add('active');
      if (pageTitle) pageTitle.textContent = '進貨商管理';
      loadSuppliers();
    } else if (section === 'purchases') {
      if (sectionPurchases) sectionPurchases.classList.remove('d-none');
      if (menuPurchases) menuPurchases.classList.add('active');
      if (pageTitle) pageTitle.textContent = '進貨管理';
      
      const sdInput = $('purchase-start-date');
      const edInput = $('purchase-end-date');
      const supInput = $('purchase-supplier-filter');
      
      if (sdInput && edInput && !sdInput.value && !edInput.value) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const firstDay = `${y}-${m}-01`;
        
        const lastDayObj = new Date(y, now.getMonth() + 1, 0);
        const lastDay = `${y}-${m}-${String(lastDayObj.getDate()).padStart(2, '0')}`;
        
        sdInput.value = firstDay;
        edInput.value = lastDay;
      }
      if (supInput) supInput.value = '';
      
      loadPurchases();
    }
  }

  menuProducts.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('products'); });
  menuOrdering.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('ordering'); });
  menuBusinessHours.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('business-hours'); });
  if (menuOrders) menuOrders.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('orders'); });
  if (menuSuppliers) menuSuppliers.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('suppliers'); });
  if (menuPurchases) menuPurchases.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('purchases'); });

  // ════════════════════════════════════════════════════
  //  登出
  // ════════════════════════════════════════════════════
  function doLogout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    window.location.href = '/login.html';
  }
  if (btnLogout)       btnLogout.addEventListener('click', doLogout);
  if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', doLogout);

  // ════════════════════════════════════════════════════
  //  使用者名稱顯示
  // ════════════════════════════════════════════════════
  function initUserInfo() {
    const username = sessionStorage.getItem('username') || 'Admin';
    const initial  = username.charAt(0).toUpperCase();
    const avatar   = $('user-avatar');
    const displayName = $('user-display-name');
    if (avatar) avatar.textContent = initial;
    if (displayName) displayName.textContent = username;
    if (headerWelcome) headerWelcome.textContent = `歡迎回來，${username}`;
  }

  // ════════════════════════════════════════════════════
  //  ─── 商品管理 ───
  // ════════════════════════════════════════════════════

  // 載入商品列表
  async function loadProducts() {
    showTableLoading(true);
    try {
      const json = await apiFetch('/api/products');
      allProducts = json.data || [];
      allCoffeeBeans = allProducts.filter(p => p.category === '咖啡豆');
      applyFilter();
    } catch (e) {
      showAlert('載入商品資料失敗：' + e.message, 'danger');
      showTableLoading(false);
    }
  }

  function showTableLoading(on) {
    if (on) {
      loadingSpinner.classList.remove('d-none');
      tableContainer.classList.add('d-none');
      emptyState.classList.add('d-none');
    } else {
      loadingSpinner.classList.add('d-none');
    }
  }

  function applyFilter() {
    let list = allProducts;
    if (activeCategoryFilter !== 'all') {
      list = list.filter(p => p.category === activeCategoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        (p.productID || '').toLowerCase().includes(q) ||
        (p.origin || '').toLowerCase().includes(q) ||
        (p.estate || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.flavorDescription || '').toLowerCase().includes(q)
      );
    }
    filteredProducts = list;
    renderProductTable();
  }

  function renderProductTable() {
    showTableLoading(false);

    if (filteredProducts.length === 0) {
      tableContainer.classList.add('d-none');
      emptyState.classList.remove('d-none');
      return;
    }

    tableContainer.classList.remove('d-none');
    emptyState.classList.add('d-none');
    productListBody.innerHTML = '';

    filteredProducts.forEach(p => {
      const tr = document.createElement('tr');

      // 商品名稱組合
      let nameDisplay = '';
      if (p.category === '咖啡豆') {
        nameDisplay = [p.origin, p.estate, p.processMethod].filter(Boolean).join(' ');
      } else if (p.category === '掛耳包組') {
        nameDisplay = p.brand || p.packageNotes || '—';
      } else {
        nameDisplay = p.name || p.brand || '—';
      }

      // 規格價格顯示
      const specs = [];
      if (p.unit_1 && p.price_1) specs.push(`${p.unit_1} NT$${Number(p.price_1).toLocaleString()}`);
      if (p.unit_2 && p.price_2) specs.push(`${p.unit_2} NT$${Number(p.price_2).toLocaleString()}`);
      if (p.unit_3 && p.price_3) specs.push(`${p.unit_3} NT$${Number(p.price_3).toLocaleString()}`);
      const specHtml = specs.map(s => `<div class="text-nowrap">${escHtml(s)}</div>`).join('');

      // 類別 Badge
      const catColor = p.category === '咖啡豆' ? 'success' :
                       p.category === '掛耳包組' ? 'warning' : 'info';

        // 庫存摘要：顯示各規格庫存
        const stockParts = [];
        if (p.unit_1) {
          const sv = p.stock_1 !== null && p.stock_1 !== undefined ? p.stock_1 : '—';
          const sc = (typeof p.stock_1 === 'number' && p.stock_1 <= 0) ? 'text-danger fw-bold' : (typeof p.stock_1 === 'number' ? 'text-success' : 'text-muted');
          stockParts.push(`<span class="${sc}">${escHtml(p.unit_1)}:${sv}</span>`);
        }
        if (p.unit_2) {
          const sv = p.stock_2 !== null && p.stock_2 !== undefined ? p.stock_2 : '—';
          const sc = (typeof p.stock_2 === 'number' && p.stock_2 <= 0) ? 'text-danger fw-bold' : (typeof p.stock_2 === 'number' ? 'text-success' : 'text-muted');
          stockParts.push(`<span class="${sc}">${escHtml(p.unit_2)}:${sv}</span>`);
        }
        if (p.unit_3) {
          const sv = p.stock_3 !== null && p.stock_3 !== undefined ? p.stock_3 : '—';
          const sc = (typeof p.stock_3 === 'number' && p.stock_3 <= 0) ? 'text-danger fw-bold' : (typeof p.stock_3 === 'number' ? 'text-success' : 'text-muted');
          stockParts.push(`<span class="${sc}">${escHtml(p.unit_3)}:${sv}</span>`);
        }
        const stockDisplayHtml = stockParts.length ? stockParts.join('<br>') : `<span class="text-muted">—</span>`;
        tr.innerHTML = `
        <td class="fw-bold font-monospace">${escHtml(p.productID)}</td>
        <td><span class="badge bg-${catColor}">${escHtml(p.category)}</span>
          ${p.isLimited ? '<span class="badge bg-danger ms-1">限量</span>' : ''}
        </td>
        <td class="fw-bold">${escHtml(nameDisplay)}</td>
        <td><span class="text-secondary" style="font-size:0.83rem;font-style:italic;">${escHtml((p.flavorDescription || '—').slice(0, 50))}${(p.flavorDescription || '').length > 50 ? '…' : ''}</span></td>
        <td>${specHtml || '<span class="text-muted">—</span>'}</td>
        <td style="font-size:0.82rem;line-height:1.7;">${stockDisplayHtml}</td>
        <td class="text-center">
          <div class="d-flex gap-1 justify-content-center">
            <button class="btn-action btn-action-edit" data-id="${escHtml(p.productID)}" title="編輯">
              <i class="bi bi-pencil-fill"></i>
            </button>
            <button class="btn-action btn-action-delete" data-id="${escHtml(p.productID)}" title="刪除">
              <i class="bi bi-trash3-fill"></i>
            </button>
          </div>
        </td>
      `;
      productListBody.appendChild(tr);
    });

    // 綁定操作按鈕
    productListBody.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    productListBody.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
    });
  }

  // 搜尋輸入
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilter();
    });
  }

  // 類別快速篩選
  filterTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      filterTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategoryFilter = btn.dataset.cat;
      applyFilter();
    });
  });

  // ════════════════════════════════════════════════════
  //  新增/編輯商品 Modal
  // ════════════════════════════════════════════════════

  function openAddModal() {
    currentEditID = null;
    productModalTitle.textContent = '新增商品';
    productForm.reset();
    clearAllFeedback();
    toggleCategoryFields('');
    fldProductId.disabled = false;
    fldProductId.classList.remove('is-invalid-custom');
    $('product-code-help').textContent = '編號儲存後不可修改。';
    renderRecipeRows([]);
    if (productModalBS) productModalBS.show();
  }

  async function openEditModal(productID) {
    currentEditID = productID;
    productModalTitle.textContent = `編輯商品：${productID}`;
    productForm.reset();
    clearAllFeedback();

    try {
      const json = await apiFetch(`/api/products/${productID}`);
      const p = json.data;

      fldProductId.value    = p.productID;
      fldProductId.disabled = true;
      $('product-code-help').textContent = '商品編號不可修改。';

      fldCategory.value     = p.category;
      toggleCategoryFields(p.category);

      if (p.category === '咖啡豆') {
        fldOrigin.value        = p.origin || '';
        fldEstate.value        = p.estate || '';
        fldProcessMethod.value = p.processMethod || '';
        updateNamePreview();
      } else {
        fldBrand.value        = p.brand || '';
        fldPackageNotes.value = p.packageNotes || '';
      }

      const getUnitFallback = (u, def) => {
        if (!u) return '';
        if (u.includes('半磅') || u.includes('耳掛') || u.includes('濾掛')) return '包';
        if (u.includes('一磅') || u.includes('1磅')) return '袋';
        if (u.includes('組')) return '組';
        if (u.includes('個')) return '個';
        return def || '件';
      };

      fldUnit1.value  = p.unit_1  || '';
      fldPrice1.value = p.price_1 || '';
      if (fldStock1) fldStock1.value = (p.stock_1 !== null && p.stock_1 !== undefined) ? p.stock_1 : '';
      if (fldStockUnit1) fldStockUnit1.value = p.stock_unit_1 || p.stockunit_1 || p.StockUnit_1 || getUnitFallback(p.unit_1, '包');
      fldUnit2.value  = p.unit_2  || '';
      fldPrice2.value = p.price_2 || '';
      if (fldStock2) fldStock2.value = (p.stock_2 !== null && p.stock_2 !== undefined) ? p.stock_2 : '';
      if (fldStockUnit2) fldStockUnit2.value = p.stock_unit_2 || p.stockunit_2 || p.StockUnit_2 || (p.unit_2 ? getUnitFallback(p.unit_2, '袋') : '');
      fldUnit3.value  = p.unit_3  || '';
      fldPrice3.value = p.price_3 || '';
      if (fldStock3) fldStock3.value = (p.stock_3 !== null && p.stock_3 !== undefined) ? p.stock_3 : '';
      if (fldStockUnit3) fldStockUnit3.value = p.stock_unit_3 || p.stockunit_3 || p.StockUnit_3 || (p.unit_3 ? getUnitFallback(p.unit_3, '包') : '');
      fldOriginalPrice.value = p.originalPrice || '';
      fldSalePrice.value     = p.salePrice || '';
      fldFlavor.value = p.flavorDescription || '';
      fldIsLimited.checked = !!p.isLimited;

      if (p.category === '掛耳包組') {
        renderRecipeRows(p.recipes || []);
      }

      if (productModalBS) productModalBS.show();
    } catch (e) {
      showAlert('載入商品資料失敗：' + e.message, 'danger');
    }
  }

  // 類別切換顯示欄位
  function toggleCategoryFields(category) {
    const beanFields   = $('fields-coffee-bean');
    const brandFields  = $('fields-brand');
    const recipeFields = $('fields-dripbag-recipes');

    beanFields.classList.add('d-none');
    brandFields.classList.add('d-none');
    recipeFields.classList.add('d-none');

    if (category === '咖啡豆') {
      beanFields.classList.remove('d-none');
    } else if (category === '掛耳包組') {
      brandFields.classList.remove('d-none');
      recipeFields.classList.remove('d-none');
      renderRecipeRows([]);
    } else if (category === '周邊產品') {
      brandFields.classList.remove('d-none');
    }
  }

  fldCategory.addEventListener('change', () => {
    toggleCategoryFields(fldCategory.value);
  });

  // 商品名稱預覽
  function updateNamePreview() {
    const name = [fldOrigin.value.trim(), fldEstate.value.trim(), fldProcessMethod.value.trim()]
      .filter(Boolean).join(' ');
    fldNamePreview.value = name;
  }
  [fldOrigin, fldEstate, fldProcessMethod].forEach(el => {
    el.addEventListener('input', updateNamePreview);
  });

  // ── 掛耳包配方 ──
  function renderRecipeRows(existingRecipes) {
    recipeContainer.innerHTML = '';
    const count = Math.max(existingRecipes.length, 1);
    for (let i = 0; i < count; i++) {
      addRecipeRow(existingRecipes[i] || null);
    }
  }

  function addRecipeRow(preset = null) {
    const idx = recipeContainer.children.length;
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center recipe-row';

    // 建立咖啡豆選項
    const options = allCoffeeBeans.map(b => {
      const label = [b.origin, b.estate, b.processMethod].filter(Boolean).join(' ');
      const selected = preset && preset.subProductID === b.productID ? 'selected' : '';
      return `<option value="${escHtml(b.productID)}" ${selected}>${escHtml(b.productID)} — ${escHtml(label)}</option>`;
    }).join('');

    row.innerHTML = `
      <div class="col-6">
        <select class="form-select form-control-custom recipe-bean-select">
          <option value="">── 選擇咖啡豆 ──</option>
          ${options}
        </select>
      </div>
      <div class="col-3">
        <div class="input-group">
          <input type="number" class="form-control form-control-custom recipe-qty-input"
            value="${preset ? preset.quantity : 2}" min="1" placeholder="數量">
          <span class="input-group-text bg-dark border-secondary text-secondary">包</span>
        </div>
      </div>
      <div class="col-3">
        <button type="button" class="btn btn-outline-danger btn-sm btn-remove-recipe">
          <i class="bi bi-x-lg"></i> 移除
        </button>
      </div>
    `;
    row.querySelector('.btn-remove-recipe').addEventListener('click', () => row.remove());
    recipeContainer.appendChild(row);
  }

  if (btnAddOrderingItem) {
    // 訂購方式新增說明項目（在 ordering 區塊）
    btnAddOrderingItem.addEventListener('click', () => addOrderingItem());
  }

  // 加入購物車圖示（後台的配方「新增一行」）
  const btnAddRecipeInModal = document.createElement('button');
  btnAddRecipeInModal.type = 'button';
  btnAddRecipeInModal.className = 'btn btn-sm btn-outline-info mt-2';
  btnAddRecipeInModal.innerHTML = '<i class="bi bi-plus-lg me-1"></i>新增配方豆';
  btnAddRecipeInModal.addEventListener('click', () => addRecipeRow(null));
  // 插入到 recipe-list-container 後面
  if (recipeContainer && recipeContainer.parentNode) {
    recipeContainer.parentNode.insertBefore(btnAddRecipeInModal, recipeContainer.nextSibling);
  }

  // ── 表單送出 ──
  if (productForm) {
    productForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validateProductForm()) return;

      setSavingState(true);
      try {
        const payload = buildPayload();
        if (currentEditID) {
          await apiFetch(`/api/products/${currentEditID}`, { method: 'PUT', body: JSON.stringify(payload) });
          showAlert(`商品 ${currentEditID} 已成功更新！`);
        } else {
          await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
          showAlert(`商品 ${payload.productID} 已成功新增！`);
        }
        if (productModalBS) productModalBS.hide();
        loadProducts();
      } catch (e) {
        showAlert(e.message, 'danger');
      } finally {
        setSavingState(false);
      }
    });
  }

  function buildPayload() {
    const category = fldCategory.value;
    const payload = {
      category,
      unit_1: fldUnit1.value.trim(),
      price_1: Number(fldPrice1.value) || null,
      stock_1: fldStock1 && fldStock1.value !== '' ? Number(fldStock1.value) : null,
      stock_unit_1: fldStockUnit1 ? fldStockUnit1.value.trim() || null : null,
      unit_2: fldUnit2.value.trim() || null,
      price_2: Number(fldPrice2.value) || null,
      stock_2: fldStock2 && fldStock2.value !== '' ? Number(fldStock2.value) : null,
      stock_unit_2: fldStockUnit2 ? fldStockUnit2.value.trim() || null : null,
      unit_3: fldUnit3.value.trim() || null,
      price_3: Number(fldPrice3.value) || null,
      stock_3: fldStock3 && fldStock3.value !== '' ? Number(fldStock3.value) : null,
      stock_unit_3: fldStockUnit3 ? fldStockUnit3.value.trim() || null : null,
      originalPrice: Number(fldOriginalPrice.value) || null,
      salePrice: Number(fldSalePrice.value) || null,
      flavorDescription: fldFlavor.value.trim() || null,
      isLimited: fldIsLimited.checked
    };

    if (!currentEditID) payload.productID = fldProductId.value.trim();

    if (category === '咖啡豆') {
      payload.origin        = fldOrigin.value.trim();
      payload.estate        = fldEstate.value.trim() || null;
      payload.processMethod = fldProcessMethod.value.trim() || null;
    } else if (category === '掛耳包組') {
      payload.brand        = fldBrand.value.trim() || null;
      payload.packageNotes = fldPackageNotes.value.trim() || null;
      payload.recipes = [];
      recipeContainer.querySelectorAll('.recipe-row').forEach(row => {
        const beanID = row.querySelector('.recipe-bean-select').value;
        const qty    = parseInt(row.querySelector('.recipe-qty-input').value, 10);
        if (beanID && qty > 0) payload.recipes.push({ subProductID: beanID, quantity: qty });
      });
    } else {
      payload.brand        = fldBrand.value.trim() || null;
      payload.packageNotes = fldPackageNotes.value.trim() || null;
    }

    return payload;
  }

  function setSavingState(on) {
    btnSaveProduct.disabled = on;
    btnSaveText.textContent = on ? '儲存中...' : '儲存';
    if (on) btnSaveSpinner.classList.remove('d-none');
    else    btnSaveSpinner.classList.add('d-none');
  }

  // ── 前端驗證 ──
  function validateProductForm() {
    let valid = true;
    clearAllFeedback();

    if (!currentEditID && !fldProductId.value.trim()) {
      showFieldError('product-id', 'product-id-feedback', '商品編號為必填。');
      valid = false;
    }

    if (!fldCategory.value) {
      showFieldError('product-category', 'product-category-feedback', '請選擇商品類別。');
      valid = false;
    }

    if (fldCategory.value === '咖啡豆' && !fldOrigin.value.trim()) {
      showFieldError('product-origin', 'product-origin-feedback', '咖啡豆必須填寫產區。');
      valid = false;
    }

    if (!fldUnit1.value.trim()) {
      showFieldError('product-unit-1', 'product-unit-1-feedback', '規格一名稱為必填。');
      valid = false;
    }

    const p1 = Number(fldPrice1.value);
    if (!fldPrice1.value || isNaN(p1) || p1 <= 0) {
      showFieldError('product-price-1', 'product-price-1-feedback', '規格一價格必須 > 0。');
      valid = false;
    }

    return valid;
  }

  function showFieldError(fieldId, feedbackId, message) {
    const field    = $(fieldId);
    const feedback = $(feedbackId);
    if (field)    field.classList.add('is-invalid-custom');
    if (feedback) { feedback.textContent = message; feedback.style.display = 'block'; }
  }

  function clearAllFeedback() {
    document.querySelectorAll('.is-invalid-custom').forEach(el => el.classList.remove('is-invalid-custom'));
    document.querySelectorAll('.invalid-feedback-custom').forEach(el => { el.style.display = 'none'; });
  }

  // ── 刪除 ──
  function openDeleteModal(productID) {
    pendingDeleteID = productID;
    deleteTargetCode.textContent = productID;
    if (deleteModalBS) deleteModalBS.show();
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (!pendingDeleteID) return;
      try {
        await apiFetch(`/api/products/${pendingDeleteID}`, { method: 'DELETE' });
        showAlert(`商品 ${pendingDeleteID} 已成功刪除！`);
        if (deleteModalBS) deleteModalBS.hide();
        loadProducts();
      } catch (e) {
        showAlert(e.message, 'danger');
      }
      pendingDeleteID = null;
    });
  }

  if (btnAddProduct) {
    btnAddProduct.addEventListener('click', openAddModal);
  }

  // ════════════════════════════════════════════════════
  //  ─── 訂購方式管理 ───
  // ════════════════════════════════════════════════════
  async function loadOrderingGuide() {
    try {
      const json = await apiFetch('/api/admin/ordering-guide');
      const data = json.data;
      orderingMainDesc.value = data.mainDescription || '';
      orderingContainer.innerHTML = '';
      (data.items || []).forEach(item => addOrderingItem(item));
    } catch (e) {
      showAlert('載入訂購方式失敗：' + e.message, 'danger');
    }
  }

  function addOrderingItem(preset = null) {
    const existingItems = orderingContainer.querySelectorAll('.ordering-item-row');
    const stepNum = existingItems.length + 1;
    const div = document.createElement('div');
    div.className = 'ordering-item-row mb-3 p-3 border border-secondary rounded';
    div.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong class="text-info">步驟 ${stepNum}</strong>
        <button type="button" class="btn btn-sm btn-outline-danger btn-remove-ordering-item">
          <i class="bi bi-trash3"></i> 移除
        </button>
      </div>
      <div class="mb-2">
        <input type="text" class="form-control form-control-custom ordering-item-title"
          placeholder="步驟標題（如: 請加Line訂購）" value="${escHtml(preset?.title || '')}">
      </div>
      <div>
        <textarea class="form-control form-control-custom ordering-item-content" rows="3"
          placeholder="步驟詳細說明">${escHtml(preset?.content || '')}</textarea>
      </div>
    `;
    div.querySelector('.btn-remove-ordering-item').addEventListener('click', () => {
      div.remove();
      reIndexOrderingItems();
    });
    orderingContainer.appendChild(div);
  }

  function reIndexOrderingItems() {
    orderingContainer.querySelectorAll('.ordering-item-row').forEach((row, idx) => {
      const strong = row.querySelector('strong');
      if (strong) strong.textContent = `步驟 ${idx + 1}`;
    });
  }

  if (btnSaveOrdering) {
    btnSaveOrdering.addEventListener('click', async () => {
      const items = [];
      orderingContainer.querySelectorAll('.ordering-item-row').forEach((row, idx) => {
        items.push({
          stepNumber: idx + 1,
          title:   row.querySelector('.ordering-item-title').value.trim(),
          content: row.querySelector('.ordering-item-content').value.trim()
        });
      });
      try {
        await apiFetch('/api/admin/ordering-guide', {
          method: 'POST',
          body: JSON.stringify({ mainDescription: orderingMainDesc.value.trim(), items })
        });
        showAlert('訂購方式已成功儲存！');
      } catch (e) {
        showAlert(e.message, 'danger');
      }
    });
  }

  // ════════════════════════════════════════════════════
  //  ─── 營業時間管理 ───
  // ════════════════════════════════════════════════════
  async function loadBusinessHours() {
    try {
      const json = await apiFetch('/api/admin/business-hours');
      const data = json.data;
      businessAnnouncement.value = data.announcement || '';
      renderBusinessDays(data.days || []);
    } catch (e) {
      showAlert('載入營業時間失敗：' + e.message, 'danger');
    }
  }

  function renderBusinessDays(days) {
    businessDaysContainer.innerHTML = '';
    const ordered = [1, 2, 3, 4, 5, 6, 7];
    ordered.forEach(dayNum => {
      const day = days.find(d => d.dayOfWeek === dayNum) || { dayOfWeek: dayNum, isOpen: false, slots: [] };
      const card = document.createElement('div');
      card.className = 'mb-3 p-3 border border-secondary rounded day-card';
      card.dataset.day = dayNum;

      const slotsHtml = (day.slots || []).map((s, idx) => buildSlotHtml(idx, s.startTime, s.endTime)).join('');

      card.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-2">
          <div class="d-flex align-items-center gap-3">
            <strong class="text-info">${DAY_NAMES[dayNum]}</strong>
            <div class="form-check form-switch mb-0">
              <input class="form-check-input day-is-open" type="checkbox" ${day.isOpen ? 'checked' : ''}>
              <label class="form-check-label text-secondary day-open-label">${day.isOpen ? '營業' : '休息'}</label>
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline-info btn-add-slot" ${!day.isOpen ? 'disabled' : ''}>
            <i class="bi bi-plus-lg"></i> 新增時段
          </button>
        </div>
        <div class="slots-container">${slotsHtml}</div>
      `;

      // Toggle isOpen
      const toggle = card.querySelector('.day-is-open');
      const label  = card.querySelector('.day-open-label');
      const addBtn = card.querySelector('.btn-add-slot');
      const slotsContainer = card.querySelector('.slots-container');

      toggle.addEventListener('change', () => {
        const open = toggle.checked;
        label.textContent = open ? '營業' : '休息';
        addBtn.disabled = !open;
        slotsContainer.querySelectorAll('input').forEach(inp => inp.disabled = !open);
        slotsContainer.querySelectorAll('button').forEach(btn => btn.disabled = !open);
      });

      addBtn.addEventListener('click', () => {
        const idx = slotsContainer.querySelectorAll('.slot-row').length;
        slotsContainer.insertAdjacentHTML('beforeend', buildSlotHtml(idx, '', ''));
        bindSlotRemove(slotsContainer);
      });

      bindSlotRemove(slotsContainer);
      businessDaysContainer.appendChild(card);
    });
  }

  function buildSlotHtml(idx, start, end) {
    return `
      <div class="slot-row d-flex align-items-center gap-2 mb-2">
        <input type="time" class="form-control form-control-custom slot-start" value="${start}" style="max-width:140px;">
        <span class="text-secondary">—</span>
        <input type="time" class="form-control form-control-custom slot-end" value="${end}" style="max-width:140px;">
        <button type="button" class="btn btn-sm btn-outline-danger btn-remove-slot">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
  }

  function bindSlotRemove(container) {
    container.querySelectorAll('.btn-remove-slot').forEach(btn => {
      btn.onclick = () => btn.closest('.slot-row').remove();
    });
  }

  if (btnSaveBusinessHours) {
    btnSaveBusinessHours.addEventListener('click', async () => {
      const days = [];
      businessDaysContainer.querySelectorAll('.day-card').forEach(card => {
        const dayNum = Number(card.dataset.day);
        const isOpen = card.querySelector('.day-is-open').checked;
        const slots  = [];
        card.querySelectorAll('.slot-row').forEach(row => {
          const s = row.querySelector('.slot-start').value;
          const e = row.querySelector('.slot-end').value;
          if (s && e) slots.push({ startTime: s, endTime: e });
        });
        days.push({ dayOfWeek: dayNum, isOpen, slots });
      });

      try {
        await apiFetch('/api/admin/business-hours', {
          method: 'POST',
          body: JSON.stringify({
            announcement: businessAnnouncement.value.trim(),
            days
          })
        });
        showAlert('營業時間已成功儲存！');
      } catch (e) {
        showAlert(e.message, 'danger');
      }
    });
  }

  // ════════════════════════════════════════════════════
  //  ─── 訂單管理 ───
  // ════════════════════════════════════════════════════

  const STATUS_LABEL = {
    pending:   '⏳ 待確認',
    confirmed: '✅ 已確認',
    shipped:   '📦 已出貨',
    completed: '🎉 已完成',
    cancelled: '❌ 已取消'
  };

  /** 更新待處理計數 Badge */
  function updatePendingBadge(n) {
    if (orderPendingCount) orderPendingCount.textContent = n;
    if (sidebarPendingBadge) {
      sidebarPendingBadge.textContent = n;
      sidebarPendingBadge.classList.toggle('d-none', n === 0);
    }
  }

  /** 查詢並更新待處理計數 Badge */
  async function fetchPendingCount() {
    try {
      const json = await apiFetch('/api/admin/orders?status=pending');
      const count = (json.orders || []).length;
      updatePendingBadge(count);
    } catch (e) {
      console.error('更新待處理訂單筆數失敗:', e);
    }
  }

  /** 輪詢控制 */
  function startOrderPolling() {
    stopOrderPolling();
    orderPollTimer = setInterval(() => loadOrders(activeOrderStatus, true), 30000);
  }
  function stopOrderPolling() {
    if (orderPollTimer) { clearInterval(orderPollTimer); orderPollTimer = null; }
  }

  /** 載入訂單列表 */
  async function loadOrders(status, silent) {
    if (!silent) {
      if (orderLoadingEl) orderLoadingEl.classList.remove('d-none');
      if (orderEmptyEl)   orderEmptyEl.classList.add('d-none');
      if (orderCardsContainer) orderCardsContainer.innerHTML = '';
    }
    updateMonthSwitcherDisplay();
    try {
      let url = '/api/admin/orders';
      const queryParams = [];
      if (status) {
        queryParams.push('status=' + encodeURIComponent(status));
      }
      if (status === 'completed' || status === 'cancelled' || (orderMonthSwitcher && !orderMonthSwitcher.classList.contains('d-none'))) {
        queryParams.push('year=' + encodeURIComponent(currentOrderYear));
        queryParams.push('month=' + encodeURIComponent(currentOrderMonth));
      }
      if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
      }
      const json = await apiFetch(url);
      const orders = json.orders || [];

      // 無篩選時可準確計算待確認數；若有篩選，也主動查詢更新待處理訂單筆數
      if (!status) {
        const pCount = orders.filter(function(o) { return o.status === 'pending'; }).length;
        updatePendingBadge(pCount);
      } else {
        fetchPendingCount();
      }

      if (orderLoadingEl) orderLoadingEl.classList.add('d-none');
      if (orders.length === 0) {
        if (orderEmptyEl) orderEmptyEl.classList.remove('d-none');
      } else {
        renderOrderCards(orders);
      }
    } catch (err) {
      if (orderLoadingEl) orderLoadingEl.classList.add('d-none');
      showAlert('載入訂單失敗：' + err.message, 'danger');
    }
  }

  /** 渲染訂單卡片 */
  function renderOrderCards(orders) {
    if (!orderCardsContainer) return;
    orderCardsContainer.innerHTML = '';

    orders.forEach(function(order, idx) {
      var card = document.createElement('div');
      card.className = 'order-card';
      card.style.animationDelay = (idx * 0.04) + 's';

      var dateStr = '';
      if (order.createdAt) {
        dateStr = new Date(order.createdAt).toLocaleString('zh-TW', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
      }

      var itemRows = (order.items || []).map(function(it) {
        var size = (it.options && it.options.size) ? ' (' + escHtml(it.options.size) + ')' : '';
        return '<tr>' +
          '<td>' + escHtml(it.productName) + size + '</td>' +
          '<td class="text-right">x' + it.quantity + '</td>' +
          '<td class="text-right">NT$ ' + fmtNum(it.price) + '</td>' +
          '<td class="text-right">NT$ ' + fmtNum(it.subtotal) + '</td>' +
          '</tr>';
      }).join('');

      var statusSel = '';
      ['pending','confirmed','shipped','completed','cancelled'].forEach(function(s) {
        statusSel += '<option value="' + s + '"' + (order.status === s ? ' selected' : '') + '>'
          + (STATUS_LABEL[s] || s) + '</option>';
      });

      card.innerHTML =
        '<div class="order-card-header">' +
          '<span class="order-id">' + escHtml(order.id) + '</span>' +
          '<span class="order-time">' + escHtml(dateStr) + '</span>' +
          '<span class="order-status-badge ' + escHtml(order.status) + '" id="badge-' + escHtml(order.id) + '">' +
            (STATUS_LABEL[order.status] || order.status) +
          '</span>' +
        '</div>' +
        '<div class="order-customer-row">' +
          '<span><span class="label">姓名</span>' + escHtml(order.customerName || '—') + '</span>' +
          '<span><span class="label">手機</span>' +
            '<a href="tel:' + escHtml(order.customerPhone) + '">' + escHtml(order.customerPhone) + '</a>' +
          '</span>' +
          '<span><span class="label">地址</span>' + escHtml(order.shippingAddress || '—') + '</span>' +
        '</div>' +
        '<table class="order-items-table">' +
          '<thead><tr><th>品項</th><th class="text-right">數量</th><th class="text-right">單價</th><th class="text-right">小計</th></tr></thead>' +
          '<tbody>' + itemRows + '</tbody>' +
        '</table>' +
        '<div class="order-total-row">' +
          '<span class="total-label">訂單總額</span>' +
          '<span class="total-amount">NT$ ' + fmtNum(order.totalAmount) + '</span>' +
        '</div>' +
        '<div class="order-action-row">' +
          '<div class="order-action-group" style="max-width:185px;">' +
            '<span class="order-action-label">變更狀態</span>' +
            '<select class="order-status-select" id="status-sel-' + escHtml(order.id) + '" data-order-id="' + escHtml(order.id) + '">' +
              statusSel +
            '</select>' +
          '</div>' +
          '<div class="order-action-group" style="flex:2;">' +
            '<span class="order-action-label">備註 / 物流單號</span>' +
            '<textarea class="order-note-input" rows="1" ' +
              'id="note-inp-' + escHtml(order.id) + '" ' +
              'data-order-id="' + escHtml(order.id) + '" ' +
              'placeholder="可填寫物流單號或備註...">' +
              escHtml(order.note || '') +
            '</textarea>' +
          '</div>' +
          '<button class="btn-save-order-note" data-order-id="' + escHtml(order.id) + '" id="note-btn-' + escHtml(order.id) + '">' +
            '<i class="bi bi-save me-1"></i>儲存備註' +
          '</button>' +
        '</div>';

      orderCardsContainer.appendChild(card);
    });

    // 狀態 Select 事件
    orderCardsContainer.querySelectorAll('.order-status-select').forEach(function(sel) {
      sel.dataset.prevStatus = sel.value;
      sel.addEventListener('change', async function() {
        var orderId   = sel.dataset.orderId;
        var newStatus = sel.value;
        try {
          await apiFetch('/api/admin/orders/' + encodeURIComponent(orderId) + '/status', {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
          });
          var badge = $('badge-' + orderId);
          if (badge) {
            badge.className = 'order-status-badge ' + newStatus;
            badge.textContent = STATUS_LABEL[newStatus] || newStatus;
          }
          sel.dataset.prevStatus = newStatus;
          showAlert('訂單狀態已更新');
          fetchPendingCount();
          // 若有篩選且狀態改變，重新載入以移除該卡片
          if (activeOrderStatus && newStatus !== activeOrderStatus) {
            loadOrders(activeOrderStatus);
          }
        } catch (err) {
          showAlert('狀態更新失敗：' + err.message, 'danger');
          sel.value = sel.dataset.prevStatus;
        }
      });
    });

    // 備註儲存事件
    orderCardsContainer.querySelectorAll('.btn-save-order-note').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var orderId = btn.dataset.orderId;
        var noteEl  = $('note-inp-' + orderId);
        var selEl   = $('status-sel-' + orderId);
        if (!noteEl || !selEl) return;
        try {
          await apiFetch('/api/admin/orders/' + encodeURIComponent(orderId) + '/status', {
            method: 'PATCH',
            body: JSON.stringify({ status: selEl.value, note: noteEl.value.trim() })
          });
          showAlert('備註已儲存');
          fetchPendingCount();
        } catch (err) {
          showAlert('備註儲存失敗：' + err.message, 'danger');
        }
      });
    });
  }

  /** 更新年月切換器顯示與狀態 */
  function updateMonthSwitcherDisplay() {
    if (monthDisplayText) {
      const mStr = String(currentOrderMonth).padStart(2, '0');
      monthDisplayText.textContent = `${currentOrderYear} 年 ${mStr} 月`;
    }
    if (monthPickerInput) {
      const mStr = String(currentOrderMonth).padStart(2, '0');
      monthPickerInput.value = `${currentOrderYear}-${mStr}`;
    }
    if (orderMonthSwitcher) {
      if (activeOrderStatus === 'completed' || activeOrderStatus === 'cancelled') {
        orderMonthSwitcher.classList.remove('d-none');
      } else {
        orderMonthSwitcher.classList.add('d-none');
      }
    }
  }

  // Tab 切換
  if (orderTabsEl) {
    orderTabsEl.addEventListener('click', function(e) {
      var tab = e.target.closest('.order-tab');
      if (!tab) return;
      orderTabsEl.querySelectorAll('.order-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      activeOrderStatus = tab.dataset.status || '';
      
      // 當切換至「已完成」或「已取消」頁籤時，預設帶入當前年月
      if (activeOrderStatus === 'completed' || activeOrderStatus === 'cancelled') {
        const now = new Date();
        currentOrderYear = now.getFullYear();
        currentOrderMonth = now.getMonth() + 1;
      }
      
      loadOrders(activeOrderStatus);
    });
  }

  // 年月切換控制按鈕
  if (btnPrevMonth) {
    btnPrevMonth.addEventListener('click', function() {
      currentOrderMonth--;
      if (currentOrderMonth < 1) {
        currentOrderMonth = 12;
        currentOrderYear--;
      }
      loadOrders(activeOrderStatus);
    });
  }

  if (btnNextMonth) {
    btnNextMonth.addEventListener('click', function() {
      currentOrderMonth++;
      if (currentOrderMonth > 12) {
        currentOrderMonth = 1;
        currentOrderYear++;
      }
      loadOrders(activeOrderStatus);
    });
  }

  if (monthPickerInput) {
    monthPickerInput.addEventListener('change', function(e) {
      const val = e.target.value;
      if (val) {
        const parts = val.split('-');
        if (parts.length === 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(y) && !isNaN(m)) {
            currentOrderYear = y;
            currentOrderMonth = m;
            loadOrders(activeOrderStatus);
          }
        }
      }
    });
  }

  // 立即刷新按鈕
  if (btnRefreshOrders) {
    btnRefreshOrders.addEventListener('click', function() { loadOrders(activeOrderStatus); });
  }

  /** 數字格式化 */
  function fmtNum(n) {
    return Number(n || 0).toLocaleString('zh-TW');
  }

  // ════════════════════════════════════════════════════
  //  ─── 烘豆備料單 ───
  // ════════════════════════════════════════════════════

  /**
   * 規格關鍵字 → 磅數換算表
   * 半磅 = 0.5 lb, 一磅 / 整磅 = 1 lb, 其他預設 0（只計組數不計磅）
   */
  var POUND_MAP = [
    { keywords: ['半磅', '1/2lb', '0.5lb', '半 磅'],  lbs: 0.5 },
    { keywords: ['一磅', '1lb', '1 lb', '整磅', '一 磅'], lbs: 1   },
    { keywords: ['二磅', '2lb', '2 lb'],                lbs: 2   }
  ];

  function guessLbs(productName, options) {
    var target = ((productName || '') + ' ' + ((options && options.size) || '')).toLowerCase();
    for (var i = 0; i < POUND_MAP.length; i++) {
      var entry = POUND_MAP[i];
      for (var j = 0; j < entry.keywords.length; j++) {
        if (target.indexOf(entry.keywords[j].toLowerCase()) !== -1) {
          return entry.lbs;
        }
      }
    }
    return null; // 無法對應磅數，歸為「其他/掛耳」
  }

  /**
   * 從 confirmed 訂單聚合統計
   * @returns {{ beans: Object, others: Object, orderCount: number }}
   */
  function buildPrepSheet(orders) {
    var beans  = {};   // key: "品名|規格" → { name, size, qty, totalLbs }
    var others = {};   // key: "品名|規格" → { name, size, qty }

    orders.forEach(function(order) {
      (order.items || []).forEach(function(it) {
        var size   = (it.options && it.options.size) ? it.options.size : '';
        var key    = it.productName + (size ? ' | ' + size : '');
        var lbs    = guessLbs(it.productName, it.options);
        var isBean = lbs !== null;

        if (isBean) {
          if (!beans[key]) beans[key] = { name: it.productName, size: size, qty: 0, totalLbs: 0 };
          beans[key].qty      += it.quantity;
          beans[key].totalLbs += it.quantity * lbs;
        } else {
          if (!others[key]) others[key] = { name: it.productName, size: size, qty: 0 };
          others[key].qty += it.quantity;
        }
      });
    });

    return { beans: beans, others: others, orderCount: orders.length };
  }

  /** 渲染統計表格（用於 Modal 內容） */
  function renderRoastModal(orders) {
    if (!roastContent) return;
    var data = buildPrepSheet(orders);
    var now  = new Date().toLocaleString('zh-TW', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    var beanKeys  = Object.keys(data.beans);
    var otherKeys = Object.keys(data.others);

    // ── 咖啡豆彙整 ──
    var beanRows = '';
    var totalLbs = 0;
    beanKeys.sort().forEach(function(k) {
      var r = data.beans[k];
      totalLbs += r.totalLbs;
      beanRows +=
        '<tr>' +
          '<td>' + escHtml(r.name) + '</td>' +
          '<td>' + escHtml(r.size || '—') + '</td>' +
          '<td class="num">' + r.qty + ' 袋</td>' +
          '<td class="num">' + r.totalLbs.toFixed(1) + ' 磅</td>' +
        '</tr>';
    });
    if (!beanRows) {
      beanRows = '<tr><td colspan="4" class="roast-empty-hint">目前無待烘焙咖啡豆訂單</td></tr>';
    }
    var beanFooter = beanKeys.length
      ? '<tfoot><tr>' +
          '<td colspan="2"><strong>合計</strong></td>' +
          '<td class="num"><strong>' + beanKeys.reduce(function(s,k){ return s + data.beans[k].qty; }, 0) + ' 袋</strong></td>' +
          '<td class="num"><strong>' + totalLbs.toFixed(1) + ' 磅</strong></td>' +
        '</tr></tfoot>'
      : '';

    var beanSection =
      '<div class="roast-section">' +
        '<div class="roast-section-title">🔥 待烘焙咖啡豆彙整</div>' +
        '<table class="roast-table">' +
          '<thead><tr>' +
            '<th>品名</th>' +
            '<th>規格</th>' +
            '<th class="num">袋數</th>' +
            '<th class="num">總磅數</th>' +
          '</tr></thead>' +
          '<tbody>' + beanRows + '</tbody>' +
          beanFooter +
        '</table>' +
        (beanKeys.length ? '<div class="roast-note">換算依據：半磅 = 0.5 磅、一磅 = 1 磅（若商品名稱含「半磅」或「一磅」字樣自動判斷；如規格顯示「—」請人工核對磅數）。</div>' : '') +
      '</div>';

    // ── 掛耳包 / 其他品項彙整 ──
    var otherRows = '';
    var totalOtherQty = 0;
    otherKeys.sort().forEach(function(k) {
      var r = data.others[k];
      totalOtherQty += r.qty;
      otherRows +=
        '<tr>' +
          '<td>' + escHtml(r.name) + '</td>' +
          '<td>' + escHtml(r.size || '—') + '</td>' +
          '<td class="num">' + r.qty + ' 組/件</td>' +
        '</tr>';
    });
    if (!otherRows) {
      otherRows = '<tr><td colspan="3" class="roast-empty-hint">目前無掛耳包 / 配件訂單</td></tr>';
    }
    var otherFooter = otherKeys.length
      ? '<tfoot><tr>' +
          '<td colspan="2"><strong>合計</strong></td>' +
          '<td class="num"><strong>' + totalOtherQty + ' 組/件</strong></td>' +
        '</tr></tfoot>'
      : '';

    var otherSection =
      '<div class="roast-section">' +
        '<div class="roast-section-title">📦 掛耳包 / 配件備貨彙整</div>' +
        '<table class="roast-table">' +
          '<thead><tr>' +
            '<th>品名</th>' +
            '<th>規格</th>' +
            '<th class="num">組數 / 件數</th>' +
          '</tr></thead>' +
          '<tbody>' + otherRows + '</tbody>' +
          otherFooter +
        '</table>' +
      '</div>';

    // ── 組合 HTML ──
    roastContent.innerHTML =
      '<div class="roast-sheet">' +
        '<div class="roast-print-title">KAKAMA COFFEE ── 烘豆與備料統計清單</div>' +
        '<div class="roast-meta">' +
          '<span>統計基礎：<strong>已確認 (confirmed) 訂單</strong></span>' +
          '<span>訂單筆數：<strong>' + data.orderCount + ' 筆</strong></span>' +
          '<span>產出時間：<strong>' + escHtml(now) + '</strong></span>' +
        '</div>' +
        beanSection +
        otherSection +
      '</div>';
  }

  /** 開啟備料單 Modal */
  async function openPrepSheet() {
    if (!roastModalBS) return;
    if (roastContent)   roastContent.innerHTML = '';
    if (roastLoadingEl) roastLoadingEl.classList.remove('d-none');
    roastModalBS.show();
    try {
      var json   = await apiFetch('/api/admin/orders?status=confirmed');
      var orders = json.orders || [];
      if (roastLoadingEl) roastLoadingEl.classList.add('d-none');
      renderRoastModal(orders);
    } catch (err) {
      if (roastLoadingEl) roastLoadingEl.classList.add('d-none');
      if (roastContent) roastContent.innerHTML =
        '<div class="roast-sheet"><p style="color:#e85d5d;padding:1rem;">載入失敗：' + escHtml(err.message) + '</p></div>';
    }
  }

  // 「烘豆備料單」按鈕事件
  if (btnPrepSheet) {
    btnPrepSheet.addEventListener('click', function() { openPrepSheet(); });
  }

  // 「列印備料單」按鈕事件
  if (btnPrintRoast) {
    btnPrintRoast.addEventListener('click', function() { window.print(); });
  }

  // ════════════════════════════════════════════════════
  //  ─── 進貨商管理 ───
  // ════════════════════════════════════════════════════

  let allSuppliers = [];
  let currentSupplierEditID = null;
  let activeSupplierCategory = 'all';

  async function loadSuppliers() {
    const loading = $('supplier-loading-spinner');
    const tbody = $('supplier-list-body');
    const empty = $('supplier-empty-state');
    
    if (loading) loading.classList.remove('d-none');
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.classList.add('d-none');
    
    try {
      const kw = $('supplier-search-input') ? $('supplier-search-input').value.trim() : '';
      let url = '/api/suppliers?';
      if (activeSupplierCategory !== 'all') url += `category=${encodeURIComponent(activeSupplierCategory)}&`;
      if (kw) url += `keyword=${encodeURIComponent(kw)}`;
      
      const json = await apiFetch(url);
      allSuppliers = json.data || [];
      renderSuppliers(allSuppliers);
    } catch (err) {
      showAlert('取得進貨商列表失敗：' + err.message, 'danger');
    } finally {
      if (loading) loading.classList.add('d-none');
    }
  }

  function renderSuppliers(list) {
    const tbody = $('supplier-list-body');
    const empty = $('supplier-empty-state');
    const tableContainer = $('supplier-table-container');
    if (!tbody || !empty || !tableContainer) return;

    if (list.length === 0) {
      empty.classList.remove('d-none');
      tableContainer.classList.add('d-none');
      return;
    }
    
    empty.classList.add('d-none');
    tableContainer.classList.remove('d-none');
    tbody.innerHTML = '';

    list.forEach(item => {
      let catColor = 'secondary';
      if (item.category === '生豆商') catColor = 'success';
      else if (item.category === '包材商') catColor = 'info';
      else if (item.category === '設備耗材商') catColor = 'warning';

      let statusBadge = item.status === 'active' 
        ? `<span class="badge bg-primary">合作中</span>`
        : `<span class="badge bg-secondary">暫停合作</span>`;

      let stars = '';
      for (let i=1; i<=5; i++) {
        stars += i <= item.rating 
          ? `<i class="bi bi-star-fill text-warning"></i>` 
          : `<i class="bi bi-star text-warning"></i>`;
      }

      let addressOrUrlHtml = '<span class="text-muted">-</span>';
      if (item.address_or_url && item.address_or_url.trim() !== '') {
        const val = item.address_or_url.trim();
        if (val.startsWith('http://') || val.startsWith('https://')) {
          addressOrUrlHtml = `<a href="${val}" target="_blank" rel="noopener noreferrer" class="text-info text-decoration-none d-inline-block text-truncate" style="max-width: 180px;" title="${escHtml(val)}"><i class="bi bi-link-45deg me-1"></i>${escHtml(val)}</a>`;
        } else {
          addressOrUrlHtml = `<span><i class="bi bi-geo-alt me-1 text-muted"></i>${escHtml(val)}</span>`;
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold align-middle">${escHtml(item.name)}</td>
        <td class="align-middle"><span class="badge bg-${catColor} text-dark">${escHtml(item.category)}</span></td>
        <td class="align-middle">
          <div><i class="bi bi-person me-1"></i>${escHtml(item.contact_person || '無')}</div>
          <div><i class="bi bi-telephone me-1"></i>${escHtml(item.phone || '無')}</div>
        </td>
        <td class="align-middle">
          <div class="mb-1">${stars}</div>
          <small class="text-muted text-truncate d-block" style="max-width: 200px;" title="${escHtml(item.evaluation_notes)}">
            ${escHtml(item.evaluation_notes || '無備註')}
          </small>
        </td>
        <td class="align-middle">${addressOrUrlHtml}</td>
        <td class="align-middle">${statusBadge}</td>
        <td class="align-middle text-center">
          <button class="btn btn-sm btn-outline-info me-1 btn-edit-supplier" data-id="${item.id}" title="編輯">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-delete-supplier" data-id="${item.id}" title="刪除">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // 綁定編輯與刪除按鈕
    document.querySelectorAll('.btn-edit-supplier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openSupplierModal(id);
      });
    });

    document.querySelectorAll('.btn-delete-supplier').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const supplier = allSuppliers.find(s => String(s.id) === String(id));
        if (supplier && confirm(`確認要刪除進貨商「${supplier.name}」嗎？`)) {
          doDeleteSupplier(id);
        }
      });
    });
  }

  function openSupplierModal(id = null) {
    const form = $('supplier-form');
    const title = $('supplier-modal-title');
    if (!form || !supplierModalBS) return;

    form.reset();
    form.classList.remove('was-validated');
    
    // reset stars
    setSupplierRating(3);

    currentSupplierEditID = id;

    if (id) {
      const supplier = allSuppliers.find(s => String(s.id) === String(id));
      if (!supplier) return;
      title.innerHTML = '<i class="bi bi-pencil-square me-2"></i>編輯進貨商';
      
      $('supplier-name').value = supplier.name;
      $('supplier-category').value = supplier.category;
      $('supplier-contact').value = supplier.contact_person || '';
      $('supplier-phone').value = supplier.phone || '';
      $('supplier-email').value = supplier.email || '';
      $('supplier-address-url').value = supplier.address_or_url || '';
      $('supplier-status').value = supplier.status || 'active';
      $('supplier-notes').value = supplier.evaluation_notes || '';
      setSupplierRating(supplier.rating || 3);
    } else {
      title.innerHTML = '<i class="bi bi-plus-circle me-2"></i>新增進貨商';
    }

    supplierModalBS.show();
  }

  function setSupplierRating(val) {
    const input = $('supplier-rating');
    if (input) input.value = val;
    document.querySelectorAll('#supplier-rating-input .star-select').forEach(star => {
      const starVal = parseInt(star.getAttribute('data-val'), 10);
      if (starVal <= val) {
        star.classList.replace('bi-star', 'bi-star-fill');
      } else {
        star.classList.replace('bi-star-fill', 'bi-star');
      }
    });
  }

  async function saveSupplier(e) {
    e.preventDefault();
    const form = $('supplier-form');
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    const payload = {
      name: $('supplier-name').value.trim(),
      category: $('supplier-category').value,
      contact_person: $('supplier-contact').value.trim(),
      phone: $('supplier-phone').value.trim(),
      email: $('supplier-email').value.trim(),
      address_or_url: $('supplier-address-url').value.trim(),
      rating: parseInt($('supplier-rating').value, 10),
      status: $('supplier-status').value,
      evaluation_notes: $('supplier-notes').value.trim()
    };

    const btnText = $('btn-save-supplier-text');
    const spinner = $('btn-save-supplier-spinner');
    if (btnText) btnText.textContent = '處理中...';
    if (spinner) spinner.classList.remove('d-none');

    try {
      let res;
      if (currentSupplierEditID) {
        res = await apiFetch(`/api/suppliers/${currentSupplierEditID}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showAlert('進貨商修改成功！', 'success');
      } else {
        res = await apiFetch('/api/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showAlert('進貨商新增成功！', 'success');
      }
      supplierModalBS.hide();
      loadSuppliers();
    } catch (err) {
      showAlert(err.message, 'danger');
    } finally {
      if (btnText) btnText.textContent = '儲存';
      if (spinner) spinner.classList.add('d-none');
    }
  }

  async function doDeleteSupplier(id) {
    try {
      await apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      showAlert('進貨商刪除成功！', 'success');
      loadSuppliers();
    } catch (err) {
      showAlert('刪除失敗：' + err.message, 'danger');
    }
  }

  // 綁定事件
  if ($('btn-add-supplier')) {
    $('btn-add-supplier').addEventListener('click', () => openSupplierModal(null));
  }
  
  if ($('supplier-form')) {
    $('supplier-form').addEventListener('submit', saveSupplier);
  }

  if ($('supplier-search-input')) {
    let searchTimeout;
    $('supplier-search-input').addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadSuppliers, 500);
    });
  }

  document.querySelectorAll('.supplier-filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.supplier-filter-tab').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeSupplierCategory = e.currentTarget.getAttribute('data-cat');
      loadSuppliers();
    });
  });

  document.querySelectorAll('#supplier-rating-input .star-select').forEach(star => {
    star.addEventListener('click', (e) => {
      const val = parseInt(e.currentTarget.getAttribute('data-val'), 10);
      setSupplierRating(val);
    });
  });

  // ════════════════════════════════════════════════════
  //  ─── 進貨管理 ───
  // ════════════════════════════════════════════════════
  let allPurchases = [];
  
  async function loadPurchases() {
    const loading = $('purchase-loading-spinner');
    const tbody = $('purchase-list-body');
    const empty = $('purchase-empty-state');
    
    if (loading) loading.classList.remove('d-none');
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.classList.add('d-none');
    
    try {
      let url = '/api/purchases?';
      const sd = $('purchase-start-date') ? $('purchase-start-date').value : '';
      const ed = $('purchase-end-date') ? $('purchase-end-date').value : '';
      const sid = $('purchase-supplier-filter') ? $('purchase-supplier-filter').value : '';
      
      if (sd) url += `startDate=${encodeURIComponent(sd)}&`;
      if (ed) url += `endDate=${encodeURIComponent(ed)}&`;
      if (sid) url += `supplierId=${encodeURIComponent(sid)}`;
      
      const json = await apiFetch(url);
      allPurchases = json.data || [];
      renderPurchases(allPurchases);
    } catch (err) {
      showAlert('取得進貨單列表失敗：' + err.message, 'danger');
    } finally {
      if (loading) loading.classList.add('d-none');
    }
  }

  function renderPurchases(list) {
    const tbody = $('purchase-list-body');
    const empty = $('purchase-empty-state');
    const tableContainer = $('purchase-table-container');
    if (!tbody || !empty || !tableContainer) return;

    if (list.length === 0) {
      empty.classList.remove('d-none');
      tableContainer.classList.add('d-none');
      return;
    }
    
    empty.classList.add('d-none');
    tableContainer.classList.remove('d-none');
    tbody.innerHTML = '';

    list.forEach(p => {
      let statusBadge = p.status === 'completed' 
        ? `<span class="badge bg-success">已入庫</span>`
        : `<span class="badge bg-warning text-dark">待到貨</span>`;
        
      const items = p.items || [];
      const types = Array.from(new Set(items.map(i => i.item_type))).join(', ');
      const totalAmount = Number(p.total_amount).toLocaleString();

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold align-middle">${escHtml(p.id)}</td>
        <td class="align-middle">${escHtml(p.purchase_date.substring(0, 10))}</td>
        <td class="align-middle">${escHtml(p.supplier_name || '無')}</td>
        <td class="align-middle"><span class="badge bg-secondary text-light">${escHtml(types || '無')}</span></td>
        <td class="align-middle fw-bold">${items.length} 項</td>
        <td class="align-middle text-warning fw-bold">$${totalAmount}</td>
        <td class="align-middle">${statusBadge}</td>
        <td class="align-middle text-center">
          <button class="btn btn-sm btn-outline-primary me-1 btn-view-purchase" data-id="${p.id}" title="檢視明細">
            <i class="bi bi-eye-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-info me-1 btn-toggle-purchase-status" data-id="${p.id}" data-status="${p.status}" title="切換狀態">
            <i class="bi bi-arrow-repeat"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger btn-delete-purchase" data-id="${p.id}" title="刪除">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-view-purchase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openViewPurchaseModal(id);
      });
    });

    document.querySelectorAll('.btn-toggle-purchase-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const currentStatus = e.currentTarget.getAttribute('data-status');
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
          await apiFetch(`/api/purchases/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
          showAlert('狀態切換成功！', 'success');
          loadPurchases();
        } catch (err) {
          showAlert('狀態切換失敗：' + err.message, 'danger');
        }
      });
    });

    document.querySelectorAll('.btn-delete-purchase').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm(`確認要刪除進貨單「${id}」嗎？這將連同所有明細一併刪除。`)) {
          try {
            await apiFetch(`/api/purchases/${id}`, { method: 'DELETE' });
            showAlert('進貨單刪除成功！', 'success');
            loadPurchases();
          } catch (err) {
            showAlert('刪除失敗：' + err.message, 'danger');
          }
        }
      });
    });
  }

  async function loadSupplierOptions() {
    const sel1 = $('purchase-supplier-filter');
    const sel2 = $('modal-purchase-supplier');
    try {
      const json = await apiFetch('/api/suppliers');
      const suppliers = json.data || [];
      
      if (sel1) {
        sel1.innerHTML = '<option value="">全部進貨商</option>';
        suppliers.forEach(s => sel1.innerHTML += `<option value="${s.id}">${escHtml(s.name)}</option>`);
      }
      if (sel2) {
        sel2.innerHTML = '<option value="">── 請選擇進貨商 ──</option>';
        suppliers.forEach(s => sel2.innerHTML += `<option value="${s.id}">${escHtml(s.name)}</option>`);
      }
    } catch(err) {
      console.error('載入進貨商選項失敗:', err);
    }
  }

  function openPurchaseModal() {
    const form = $('purchase-form');
    if (!form || !purchaseModalBS) return;

    form.reset();
    form.classList.remove('was-validated');
    
    // Reset view mode states
    const btnSave = $('btn-save-purchase');
    const btnAdd = $('btn-add-purchase-item');
    if (btnSave) btnSave.classList.remove('d-none');
    if (btnAdd) btnAdd.classList.remove('d-none');
    $('purchase-modal-title').textContent = '新增進貨單';
    
    // Re-enable inputs
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(el => el.disabled = false);

    const today = new Date().toISOString().substring(0, 10);
    if ($('modal-purchase-date')) $('modal-purchase-date').value = today;
    
    $('purchase-items-body').innerHTML = '';
    $('purchase-total-amount').textContent = '0';
    $('purchase-items-empty').classList.remove('d-none');
    
    loadSupplierOptions();
    purchaseModalBS.show();
  }

  async function openViewPurchaseModal(id) {
    const form = $('purchase-form');
    if (!form || !purchaseModalBS) return;

    form.reset();
    form.classList.remove('was-validated');
    $('purchase-items-body').innerHTML = '';
    $('purchase-items-empty').classList.add('d-none');
    
    // Hide save button and add item button for view mode
    const btnSave = $('btn-save-purchase');
    const btnAdd = $('btn-add-purchase-item');
    if (btnSave) btnSave.classList.add('d-none');
    if (btnAdd) btnAdd.classList.add('d-none');
    $('purchase-modal-title').innerHTML = `<i class="bi bi-eye me-2"></i>檢視進貨單 - ${escHtml(id)}`;

    await loadSupplierOptions();
    
    try {
      const res = await apiFetch(`/api/purchases/${id}`);
      const p = res.data;
      
      if ($('modal-purchase-supplier')) $('modal-purchase-supplier').value = p.supplier_id || '';
      if ($('modal-purchase-date')) $('modal-purchase-date').value = p.purchase_date.substring(0, 10);
      if ($('modal-purchase-status')) $('modal-purchase-status').value = p.status;
      if ($('modal-purchase-note')) $('modal-purchase-note').value = p.note || '';

      if (p.items && p.items.length > 0) {
        p.items.forEach(item => {
          addPurchaseItemRow(item);
        });
      } else {
        $('purchase-items-empty').classList.remove('d-none');
      }
      
      // Make all inputs and remove buttons disabled for view mode
      const inputs = form.querySelectorAll('input, select, button.btn-remove-item');
      inputs.forEach(el => el.disabled = true);
      
      purchaseModalBS.show();
    } catch(err) {
      showAlert('無法載入進貨單資料：' + err.message, 'danger');
    }
  }

  function addPurchaseItemRow(itemData = null) {
    // If called directly from an event listener, itemData will be the Event object
    if (itemData && itemData instanceof Event) {
      itemData = null;
    }
    
    $('purchase-items-empty').classList.add('d-none');
    const tbody = $('purchase-items-body');
    const tr = document.createElement('tr');
    tr.className = 'purchase-item-row';
    
    const isBean = itemData ? (itemData.item_type === '生豆') : true;
    const itemType = itemData ? escHtml(itemData.item_type) : '生豆';
    
    tr.innerHTML = `
      <td>
        <select class="form-select form-control-custom item-type" required>
          <option value="生豆" ${itemType === '生豆' ? 'selected' : ''}>生豆</option>
          <option value="包材" ${itemType === '包材' ? 'selected' : ''}>包材</option>
          <option value="耗材" ${itemType === '耗材' ? 'selected' : ''}>耗材</option>
          <option value="其他" ${itemType === '其他' ? 'selected' : ''}>其他</option>
        </select>
      </td>
      <td><input type="text" class="form-control form-control-custom item-name" required placeholder="品項名稱" value="${itemData ? escHtml(itemData.item_name) : ''}"></td>
      <td><input type="text" class="form-control form-control-custom item-batch bean-field" placeholder="批號" value="${itemData && itemData.batch_no ? escHtml(itemData.batch_no) : ''}" ${!isBean ? 'disabled' : ''}></td>
      <td><input type="text" class="form-control form-control-custom item-origin bean-field" placeholder="產地" value="${itemData && itemData.origin ? escHtml(itemData.origin) : ''}" ${!isBean ? 'disabled' : ''}></td>
      <td><input type="text" class="form-control form-control-custom item-process bean-field" placeholder="處理法" value="${itemData && itemData.process_method ? escHtml(itemData.process_method) : ''}" ${!isBean ? 'disabled' : ''}></td>
      <td><input type="number" class="form-control form-control-custom item-quantity" step="0.01" min="0" required value="${itemData ? itemData.quantity : 0}"></td>
      <td><input type="text" class="form-control form-control-custom item-unit" required value="${itemData ? escHtml(itemData.unit) : 'kg'}"></td>
      <td><input type="number" class="form-control form-control-custom item-price" step="0.01" min="0" required value="${itemData ? itemData.unit_price : 0}"></td>
      <td class="text-warning fw-bold item-subtotal">${itemData ? '$' + itemData.subtotal : '$0'}</td>
      <td><button type="button" class="btn btn-sm btn-outline-danger btn-remove-item"><i class="bi bi-trash"></i></button></td>
    `;
    
    tbody.appendChild(tr);
    
    tr.querySelector('.item-type').addEventListener('change', (e) => {
      const isBean = e.target.value === '生豆';
      tr.querySelectorAll('.bean-field').forEach(el => {
        el.disabled = !isBean;
        if (!isBean) el.value = '';
      });
    });
    
    // 初始化時手動觸發一次，確保欄位鎖定狀態與選單預設值完全同步
    tr.querySelector('.item-type').dispatchEvent(new Event('change'));
    
    const calc = () => {
      const q = parseFloat(tr.querySelector('.item-quantity').value) || 0;
      const p = parseFloat(tr.querySelector('.item-price').value) || 0;
      const sub = Math.round(q * p);
      tr.querySelector('.item-subtotal').textContent = '$' + sub;
      calcPurchaseTotal();
    };
    tr.querySelector('.item-quantity').addEventListener('input', calc);
    tr.querySelector('.item-price').addEventListener('input', calc);
    
    if (itemData) calcPurchaseTotal();
    
    tr.querySelector('.btn-remove-item').addEventListener('click', () => {
      tr.remove();
      calcPurchaseTotal();
      if (tbody.children.length === 0) $('purchase-items-empty').classList.remove('d-none');
    });
  }

  function calcPurchaseTotal() {
    let total = 0;
    document.querySelectorAll('.purchase-item-row').forEach(tr => {
      const text = tr.querySelector('.item-subtotal').textContent.replace('$', '');
      total += parseInt(text, 10) || 0;
    });
    $('purchase-total-amount').textContent = total.toLocaleString();
    return total;
  }

  async function savePurchase(e) {
    e.preventDefault();
    const form = $('purchase-form');
    if (!form.checkValidity()) {
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }
    
    const itemRows = document.querySelectorAll('.purchase-item-row');
    if (itemRows.length === 0) {
      showAlert('請至少新增一個進貨品項', 'warning');
      return;
    }

    const items = [];
    itemRows.forEach(tr => {
      items.push({
        item_type: tr.querySelector('.item-type').value,
        item_name: tr.querySelector('.item-name').value.trim(),
        batch_no: tr.querySelector('.item-batch').value.trim(),
        origin: tr.querySelector('.item-origin').value.trim(),
        process_method: tr.querySelector('.item-process').value.trim(),
        quantity: parseFloat(tr.querySelector('.item-quantity').value) || 0,
        unit: tr.querySelector('.item-unit').value.trim(),
        unit_price: parseFloat(tr.querySelector('.item-price').value) || 0,
        subtotal: parseFloat(tr.querySelector('.item-subtotal').textContent.replace('$', '')) || 0
      });
    });
    
    const supplierSelect = $('modal-purchase-supplier');
    const supplier_name = supplierSelect.options[supplierSelect.selectedIndex].text;

    const payload = {
      supplier_id: supplierSelect.value,
      supplier_name,
      purchase_date: $('modal-purchase-date').value,
      status: $('modal-purchase-status').value,
      note: $('modal-purchase-note').value.trim(),
      total_amount: calcPurchaseTotal(),
      items
    };

    const btnText = $('btn-save-purchase-text');
    const spinner = $('btn-save-purchase-spinner');
    if (btnText) btnText.textContent = '處理中...';
    if (spinner) spinner.classList.remove('d-none');

    try {
      await apiFetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showAlert('進貨單建立成功！', 'success');
      purchaseModalBS.hide();
      loadPurchases();
    } catch (err) {
      showAlert(err.message, 'danger');
    } finally {
      if (btnText) btnText.textContent = '儲存進貨單';
      if (spinner) spinner.classList.add('d-none');
    }
  }

  if ($('btn-search-purchases')) $('btn-search-purchases').addEventListener('click', loadPurchases);
  if ($('btn-clear-purchase-dates')) {
    $('btn-clear-purchase-dates').addEventListener('click', () => {
      if ($('purchase-start-date')) $('purchase-start-date').value = '';
      if ($('purchase-end-date')) $('purchase-end-date').value = '';
      if ($('purchase-supplier-filter')) $('purchase-supplier-filter').value = '';
      loadPurchases();
    });
  }
  if ($('btn-add-purchase')) $('btn-add-purchase').addEventListener('click', openPurchaseModal);
  if ($('btn-add-purchase-item')) $('btn-add-purchase-item').addEventListener('click', addPurchaseItemRow);
  if ($('purchase-form')) $('purchase-form').addEventListener('submit', savePurchase);

  // ════════════════════════════════════════════════════
  //  工具函式
  // ════════════════════════════════════════════════════
  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ════════════════════════════════════════════════════
  //  啟動
  // ════════════════════════════════════════════════════
  function init() {
    // Bootstrap Modal 初始化
    const productModalEl = $('product-modal');
    const deleteModalEl  = $('delete-modal');
    const roastModalEl   = $('roast-modal');
    const supplierModalEl = $('supplier-modal');
    const purchaseModalEl = $('purchase-modal');
    if (productModalEl) productModalBS = new bootstrap.Modal(productModalEl);
    if (deleteModalEl)  deleteModalBS  = new bootstrap.Modal(deleteModalEl);
    if (roastModalEl)   roastModalBS   = new bootstrap.Modal(roastModalEl);
    if (supplierModalEl) supplierModalBS = new bootstrap.Modal(supplierModalEl);
    if (purchaseModalEl) purchaseModalBS = new bootstrap.Modal(purchaseModalEl);

    initUserInfo();
    loadProducts(); // 預設顯示商品管理

    // 頁面啟動時先載入待確認數量，更新 sidebar badge
    fetchPendingCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();

  }

  // 日期輸入框點擊自動展開月曆
  document.addEventListener('click', (e) => {
    if (e.target && e.target.type === 'date') {
      if (typeof e.target.showPicker === 'function') {
        try {
          e.target.showPicker();
        } catch (err) {
          // Ignore error (e.g. if picker is already showing)
        }
      }
    }
  });

})();
