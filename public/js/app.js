document.addEventListener('DOMContentLoaded', () => {
  // ============================================================
  // DOM References
  // ============================================================
  const userDisplayName   = document.getElementById('user-display-name');
  const headerWelcome     = document.getElementById('header-welcome');
  const userAvatar        = document.getElementById('user-avatar');
  const btnLogout         = document.getElementById('btn-logout');
  const btnLogoutMobile   = document.getElementById('btn-logout-mobile');
  const globalAlert       = document.getElementById('global-alert');
  const globalAlertMessage= document.getElementById('global-alert-message');
  const alertIcon         = document.getElementById('alert-icon');
  const searchInput       = document.getElementById('search-input');
  const btnAddProduct     = document.getElementById('btn-add-product');
  const loadingSpinner    = document.getElementById('loading-spinner');
  const tableContainer    = document.getElementById('table-container');
  const productListBody   = document.getElementById('product-list-body');
  const emptyState        = document.getElementById('empty-state');
  const filterTabs        = document.querySelectorAll('.filter-tab');

  // Modal
  const productModalEl    = document.getElementById('product-modal');
  const productForm       = document.getElementById('product-form');
  const productModalTitle = document.getElementById('product-modal-title');
  const btnSaveProduct    = document.getElementById('btn-save-product');
  const btnSaveText       = document.getElementById('btn-save-text');
  const btnSaveSpinner    = document.getElementById('btn-save-spinner');
  const codeHelpText      = document.getElementById('product-code-help');
  const deleteModalEl     = document.getElementById('delete-modal');
  const deleteTargetCodeEl= document.getElementById('delete-target-code');
  const btnConfirmDelete  = document.getElementById('btn-confirm-delete');

  // Form inputs
  const inputProductID      = document.getElementById('product-id');
  const inputCategory       = document.getElementById('product-category');
  const inputIsLimited      = document.getElementById('product-is-limited');
  // Coffee bean fields
  const inputOrigin         = document.getElementById('product-origin');
  const inputEstate         = document.getElementById('product-estate');
  const inputProcessMethod  = document.getElementById('product-process-method');
  const inputNamePreview    = document.getElementById('product-name-preview');
  // Brand fields
  const inputBrand          = document.getElementById('product-brand');
  const inputPackageNotes   = document.getElementById('product-package-notes');
  // Pricing
  const inputUnit1          = document.getElementById('product-unit-1');
  const inputPrice1         = document.getElementById('product-price-1');
  const inputUnit2          = document.getElementById('product-unit-2');
  const inputPrice2         = document.getElementById('product-price-2');
  const inputUnit3          = document.getElementById('product-unit-3');
  const inputPrice3         = document.getElementById('product-price-3');
  const inputOriginalPrice  = document.getElementById('product-original-price');
  const inputSalePrice      = document.getElementById('product-sale-price');
  const inputStock          = document.getElementById('product-stock');
  const inputFlavor         = document.getElementById('product-flavor');
  // Dynamic field sections
  const fieldsCoffeeBean    = document.getElementById('fields-coffee-bean');
  const fieldsBrand         = document.getElementById('fields-brand');
  const fieldPackageNotesWrap = document.getElementById('field-package-notes-wrap');

  // Bootstrap modals
  const productModal = new bootstrap.Modal(productModalEl);
  const deleteModal  = new bootstrap.Modal(deleteModalEl);

  // ============================================================
  // State
  // ============================================================
  let allProducts    = [];
  let displayedProducts = [];
  let isEditMode     = false;
  let deleteTargetID = null;
  let activeCategory = 'all';

  // ============================================================
  // Init
  // ============================================================
  function init() {
    const token    = sessionStorage.getItem('token');
    const userJson = sessionStorage.getItem('user');
    if (!token || !userJson) { window.location.href = '/login.html'; return; }

    const user = JSON.parse(userJson);
    userDisplayName.textContent = user.displayName || user.username;
    headerWelcome.textContent   = `歡迎回來，${user.displayName || user.username}`;
    userAvatar.textContent      = (user.displayName || user.username).charAt(0).toUpperCase();

    loadProducts();
    bindEvents();
  }

  // ============================================================
  // API
  // ============================================================
  async function loadProducts() {
    showLoading(true);
    try {
      const res = await fetch('/api/products');
      const result = await res.json();
      if (res.ok && result.success) {
        allProducts = result.data;
        applyFilterAndRender();
      } else {
        showGlobalAlert(result.message || '載入商品失敗', 'danger');
      }
    } catch (e) {
      showGlobalAlert('無法連線到後端 API。', 'danger');
    } finally {
      showLoading(false);
    }
  }

  // ============================================================
  // Render Table
  // ============================================================
  function applyFilterAndRender() {
    const query = searchInput.value.trim().toLowerCase();
    displayedProducts = allProducts.filter(p => {
      const catMatch = activeCategory === 'all' || p.category === activeCategory;
      const searchFields = [
        p.productID, p.category, p.origin, p.estate, p.processMethod,
        p.brand, p.packageNotes, p.flavorDescription
      ].filter(Boolean).join(' ').toLowerCase();
      const searchMatch = !query || searchFields.includes(query);
      return catMatch && searchMatch;
    });
    renderProducts(displayedProducts);
  }

  function renderProducts(list) {
    productListBody.innerHTML = '';
    if (list.length === 0) {
      tableContainer.classList.add('d-none');
      emptyState.classList.remove('d-none');
      return;
    }
    tableContainer.classList.remove('d-none');
    emptyState.classList.add('d-none');

    list.forEach(p => {
      // Build display name depending on category
      let displayName = '';
      if (p.category === '咖啡豆') {
        displayName = [p.origin, p.estate, p.processMethod].filter(Boolean).join(' ');
      } else {
        displayName = [p.brand, p.packageNotes].filter(Boolean).join(' — ');
      }

      // Category badge color
      const catColors = { '咖啡豆': 'success', '掛耳包組': 'warning text-dark', '周邊產品': 'info text-dark' };
      const catColor  = catColors[p.category] || 'secondary';

      // Prices display
      let priceHtml = '';
      if (p.unit_1 && p.price_1) priceHtml += `<div class="text-nowrap">${escapeHtml(p.unit_1)}: <strong class="text-success">NT$ ${Number(p.price_1).toLocaleString()}</strong></div>`;
      if (p.unit_2 && p.price_2) priceHtml += `<div class="text-nowrap">${escapeHtml(p.unit_2)}: <strong class="text-success">NT$ ${Number(p.price_2).toLocaleString()}</strong></div>`;
      if (p.unit_3 && p.price_3) priceHtml += `<div class="text-nowrap">${escapeHtml(p.unit_3)}: <strong class="text-success">NT$ ${Number(p.price_3).toLocaleString()}</strong></div>`;
      if (p.salePrice) priceHtml += `<div class="text-nowrap"><span class="badge bg-danger">特價 NT$ ${Number(p.salePrice).toLocaleString()}</span></div>`;

      const limitedBadge = p.isLimited ? '<span class="badge bg-danger ms-1">限量</span>' : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-monospace text-info">${escapeHtml(p.productID)}</td>
        <td><span class="badge bg-${catColor}">${escapeHtml(p.category)}</span>${limitedBadge}</td>
        <td class="fw-bold">${escapeHtml(displayName || '-')}</td>
        <td class="text-secondary text-truncate" style="max-width:200px;" title="${escapeHtml(p.flavorDescription || '')}">${escapeHtml(p.flavorDescription || '-')}</td>
        <td style="font-size:0.85rem;">${priceHtml || '-'}</td>
        <td class="text-center fw-semibold ${p.stock <= 0 ? 'text-danger' : 'text-success'}">${p.stock}</td>
        <td class="text-center">
          <button class="btn-action btn-action-edit me-2" data-id="${escapeHtml(p.productID)}" title="編輯"><i class="bi bi-pencil-fill"></i></button>
          <button class="btn-action btn-action-delete" data-id="${escapeHtml(p.productID)}" title="刪除"><i class="bi bi-trash-fill"></i></button>
        </td>
      `;
      productListBody.appendChild(tr);
    });
    bindTableActionBtns();
  }

  function bindTableActionBtns() {
    document.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id')));
    });
  }

  // ============================================================
  // Dynamic Form: Category switching
  // ============================================================
  function applyCategory(cat) {
    // Hide all dynamic sections first
    fieldsCoffeeBean.classList.add('d-none');
    fieldsBrand.classList.add('d-none');

    if (cat === '咖啡豆') {
      fieldsCoffeeBean.classList.remove('d-none');
      // Default price labels
      if (!inputUnit1.value) inputUnit1.value = '半磅';
      if (!inputUnit2.value) inputUnit2.value = '一磅';
      if (!inputUnit3.value) inputUnit3.value = '耳掛';
    } else if (cat === '掛耳包組') {
      fieldsBrand.classList.remove('d-none');
      fieldPackageNotesWrap.classList.remove('d-none');
      if (!inputUnit1.value) inputUnit1.value = '每組';
    } else if (cat === '周邊產品') {
      fieldsBrand.classList.remove('d-none');
      fieldPackageNotesWrap.classList.add('d-none');
      if (!inputUnit1.value) inputUnit1.value = '個';
    }
  }

  function updateNamePreview() {
    if (inputCategory.value !== '咖啡豆') return;
    const parts = [inputOrigin.value, inputEstate.value, inputProcessMethod.value].filter(s => s.trim());
    inputNamePreview.value = parts.join(' ');
  }

  // ============================================================
  // Modal Open/Close
  // ============================================================
  function openAddModal() {
    isEditMode = false;
    productModalTitle.textContent = '新增商品';
    productForm.reset();
    clearAllErrors();
    // Reset dynamic sections
    fieldsCoffeeBean.classList.add('d-none');
    fieldsBrand.classList.add('d-none');
    inputProductID.disabled = false;
    codeHelpText.textContent = '編號儲存後不可修改。';
    productModal.show();
  }

  function openEditModal(productID) {
    const p = allProducts.find(x => x.productID === productID);
    if (!p) return;
    isEditMode = true;
    productModalTitle.textContent = '編輯商品';
    clearAllErrors();

    // Fill basic fields
    inputProductID.value    = p.productID;
    inputProductID.disabled = true;
    codeHelpText.textContent = '修改模式下，商品編號不可修改。';
    inputCategory.value     = p.category;
    inputIsLimited.checked  = !!p.isLimited;

    // Fill category-specific fields
    inputOrigin.value        = p.origin || '';
    inputEstate.value        = p.estate || '';
    inputProcessMethod.value = p.processMethod || '';
    inputBrand.value         = p.brand || '';
    inputPackageNotes.value  = p.packageNotes || '';

    // Pricing
    inputUnit1.value  = p.unit_1 || '';
    inputPrice1.value = p.price_1 || '';
    inputUnit2.value  = p.unit_2 || '';
    inputPrice2.value = p.price_2 || '';
    inputUnit3.value  = p.unit_3 || '';
    inputPrice3.value = p.price_3 || '';
    inputOriginalPrice.value = p.originalPrice || '';
    inputSalePrice.value     = p.salePrice || '';
    inputStock.value         = p.stock ?? 0;
    inputFlavor.value        = p.flavorDescription || '';

    applyCategory(p.category);
    updateNamePreview();
    productModal.show();
  }

  function openDeleteModal(productID) {
    deleteTargetID = productID;
    deleteTargetCodeEl.textContent = productID;
    deleteModal.show();
  }

  // ============================================================
  // Form Submit
  // ============================================================
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const cat        = inputCategory.value;
    const idVal      = inputProductID.value.trim();
    const unit1Val   = inputUnit1.value.trim();
    const price1Val  = inputPrice1.value.trim();
    const price2Val  = inputPrice2.value.trim();
    const price3Val  = inputPrice3.value.trim();
    const origPrice  = inputOriginalPrice.value.trim();
    const salePrice  = inputSalePrice.value.trim();
    const stockVal   = inputStock.value.trim();

    let valid = true;

    if (!isEditMode && !idVal) { showInputError(inputProductID, '商品編號為必填。'); valid = false; }
    if (!cat) { showInputError(inputCategory, '請選擇商品類別。'); valid = false; }
    if (cat === '咖啡豆' && !inputOrigin.value.trim()) {
      showInputError(inputOrigin, '咖啡豆必須填寫產區。'); valid = false;
    }
    if (!unit1Val) { showInputError(inputUnit1, '規格一名稱為必填。'); valid = false; }
    if (!price1Val || Number(price1Val) <= 0) { showInputError(inputPrice1, '規格一價格必須大於 0。'); valid = false; }
    if (price2Val && Number(price2Val) <= 0) { showInputError(inputPrice2, '規格二價格必須大於 0。'); valid = false; }
    if (price3Val && Number(price3Val) <= 0) { showInputError(inputPrice3, '規格三價格必須大於 0。'); valid = false; }
    if (origPrice) {
      if (Number(origPrice) <= 0) { showInputError(inputOriginalPrice, '原價必須大於 0。'); valid = false; }
      else if (salePrice && (Number(salePrice) <= 0 || Number(salePrice) > Number(origPrice))) {
        showInputError(inputSalePrice, '特價必須 > 0 且不高於原價。'); valid = false;
      }
    }
    if (stockVal === '' || Number(stockVal) < 0 || !Number.isInteger(Number(stockVal))) {
      showInputError(inputStock, '庫存必須為 ≥ 0 的整數。'); valid = false;
    }
    if (!valid) return;

    setSaveLoading(true);
    const payload = {
      productID:        idVal,
      category:         cat,
      origin:           inputOrigin.value.trim() || null,
      estate:           inputEstate.value.trim() || null,
      processMethod:    inputProcessMethod.value.trim() || null,
      brand:            inputBrand.value.trim() || null,
      packageNotes:     inputPackageNotes.value.trim() || null,
      unit_1:           unit1Val || null,
      price_1:          price1Val ? Number(price1Val) : null,
      unit_2:           inputUnit2.value.trim() || null,
      price_2:          price2Val ? Number(price2Val) : null,
      unit_3:           inputUnit3.value.trim() || null,
      price_3:          price3Val ? Number(price3Val) : null,
      originalPrice:    origPrice ? Number(origPrice) : null,
      salePrice:        salePrice ? Number(salePrice) : null,
      flavorDescription:inputFlavor.value.trim() || null,
      stock:            Number(stockVal),
      isLimited:        inputIsLimited.checked
    };

    const url    = isEditMode ? `/api/products/${idVal}` : '/api/products';
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await res.json();
      if (res.ok && result.success) {
        productModal.hide();
        showGlobalAlert(isEditMode ? '商品修改成功！' : '商品新增成功！', 'success');
        loadProducts();
      } else {
        if (result.message && result.message.includes('編號')) showInputError(inputProductID, result.message);
        else showGlobalAlert(result.message || '儲存失敗', 'danger');
      }
    } catch (err) {
      showGlobalAlert('無法連線至伺服器。', 'danger');
    } finally {
      setSaveLoading(false);
    }
  });

  // Delete confirm
  btnConfirmDelete.addEventListener('click', async () => {
    if (!deleteTargetID) return;
    try {
      const res    = await fetch(`/api/products/${deleteTargetID}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok && result.success) {
        deleteModal.hide();
        showGlobalAlert(`商品 ${deleteTargetID} 刪除成功！`, 'success');
        loadProducts();
      } else {
        showGlobalAlert(result.message || '刪除失敗', 'danger');
      }
    } catch (err) {
      showGlobalAlert('無法連線至伺服器執行刪除。', 'danger');
    } finally {
      deleteTargetID = null;
    }
  });

  // ============================================================
  // Events Binding
  // ============================================================
  function bindEvents() {
    btnAddProduct.addEventListener('click', openAddModal);

    // Category select -> show/hide fields
    inputCategory.addEventListener('change', () => {
      applyCategory(inputCategory.value);
    });

    // Auto-preview name for coffee beans
    [inputOrigin, inputEstate, inputProcessMethod].forEach(el => {
      el.addEventListener('input', updateNamePreview);
    });

    // Search
    searchInput.addEventListener('input', applyFilterAndRender);

    // Category filter tabs
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.getAttribute('data-cat');
        applyFilterAndRender();
      });
    });

    // Logout
    const logout = () => { sessionStorage.removeItem('token'); sessionStorage.removeItem('user'); window.location.href = '/login.html'; };
    btnLogout.addEventListener('click', logout);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', logout);
  }

  // ============================================================
  // Helper Functions
  // ============================================================
  function showLoading(v) {
    if (v) {
      loadingSpinner.classList.remove('d-none');
      tableContainer.classList.add('d-none');
      emptyState.classList.add('d-none');
    } else {
      loadingSpinner.classList.add('d-none');
    }
  }

  function setSaveLoading(v) {
    btnSaveText.textContent   = v ? '儲存中...' : '儲存';
    btnSaveSpinner.classList.toggle('d-none', !v);
    btnSaveProduct.disabled   = v;
  }

  function showInputError(el, msg) {
    el.classList.add('is-invalid-custom');
    const fb = document.getElementById(`${el.id}-feedback`);
    if (fb) { fb.textContent = msg; fb.style.display = 'block'; }
  }

  function clearAllErrors() {
    document.querySelectorAll('.is-invalid-custom').forEach(el => el.classList.remove('is-invalid-custom'));
    document.querySelectorAll('.invalid-feedback-custom').forEach(el => { el.style.display = 'none'; });
  }

  function showGlobalAlert(msg, type = 'success') {
    globalAlertMessage.textContent = msg;
    globalAlert.className = `alert alert-${type} alert-dismissible fade show`;
    alertIcon.className   = type === 'success' ? 'bi bi-check-circle-fill me-2' : 'bi bi-exclamation-octagon-fill me-2';
    globalAlert.classList.remove('d-none');
    setTimeout(() => globalAlert.classList.add('d-none'), 5000);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  // Boot
  init();
});
