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

  // 內容區塊
  const sectionProducts      = $('section-products');
  const sectionOrdering      = $('section-ordering');
  const sectionBusinessHours = $('section-business-hours');

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
  const fldUnit2          = $('product-unit-2');
  const fldPrice2         = $('product-price-2');
  const fldUnit3          = $('product-unit-3');
  const fldPrice3         = $('product-price-3');
  const fldOriginalPrice  = $('product-original-price');
  const fldSalePrice      = $('product-sale-price');
  const fldStock          = $('product-stock');
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
  const businessAnnouncement = $('business-announcement');
  const businessDaysContainer = $('business-days-container');
  const btnSaveBusinessHours  = $('btn-save-business-hours');

  // Bootstrap Modal 實例
  let productModalBS = null;
  let deleteModalBS  = null;

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
    [sectionProducts, sectionOrdering, sectionBusinessHours].forEach(s => s.classList.add('d-none'));
    [menuProducts, menuOrdering, menuBusinessHours].forEach(m => m.classList.remove('active'));

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
    }
  }

  menuProducts.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('products'); });
  menuOrdering.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('ordering'); });
  menuBusinessHours.querySelector('a').addEventListener('click', e => { e.preventDefault(); switchSection('business-hours'); });

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

      tr.innerHTML = `
        <td class="fw-bold font-monospace">${escHtml(p.productID)}</td>
        <td><span class="badge bg-${catColor}">${escHtml(p.category)}</span>
          ${p.isLimited ? '<span class="badge bg-danger ms-1">限量</span>' : ''}
        </td>
        <td class="fw-bold">${escHtml(nameDisplay)}</td>
        <td><span class="text-secondary" style="font-size:0.83rem;font-style:italic;">${escHtml((p.flavorDescription || '—').slice(0, 50))}${(p.flavorDescription || '').length > 50 ? '…' : ''}</span></td>
        <td>${specHtml || '<span class="text-muted">—</span>'}</td>
        <td><span class="${p.stock <= 0 ? 'text-danger fw-bold' : 'text-success'}">${p.stock}</span></td>
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

      fldUnit1.value  = p.unit_1  || '';
      fldPrice1.value = p.price_1 || '';
      fldUnit2.value  = p.unit_2  || '';
      fldPrice2.value = p.price_2 || '';
      fldUnit3.value  = p.unit_3  || '';
      fldPrice3.value = p.price_3 || '';
      fldOriginalPrice.value = p.originalPrice || '';
      fldSalePrice.value     = p.salePrice || '';
      fldStock.value  = p.stock ?? 0;
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
      unit_2: fldUnit2.value.trim() || null,
      price_2: Number(fldPrice2.value) || null,
      unit_3: fldUnit3.value.trim() || null,
      price_3: Number(fldPrice3.value) || null,
      originalPrice: Number(fldOriginalPrice.value) || null,
      salePrice: Number(fldSalePrice.value) || null,
      stock: Number(fldStock.value) || 0,
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
    if (productModalEl) productModalBS = new bootstrap.Modal(productModalEl);
    if (deleteModalEl)  deleteModalBS  = new bootstrap.Modal(deleteModalEl);

    initUserInfo();
    loadProducts(); // 預設顯示商品管理
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
