/**
 * KAKAMA COFFEE — 前台核心邏輯 (app.js)
 * 負責：
 *   A. 即時營業狀態燈 (Business Status)
 *   B. 臨時公告 Banner
 *   C. 商品展示 — 三 Tab + 雙層動態篩選 + 卡片渲染
 *   D. 訂購方式 Timeline
 *   E. 營業時間表
 *   F. 購物車抽屜（加入/修改/清空）
 *   G. 導覽列滾動效果 + 漢堡選單
 */

(function () {
  'use strict';

  // ════════════════════════════════════════════════════
  //  State
  // ════════════════════════════════════════════════════
  let allProducts   = [];        // 當前大類別所有商品
  let activeOrigin  = 'all';     // 選中產區
  let activeProcess = 'all';     // 選中處理法
  let activeCategory = '咖啡豆'; // 當前大分類
  let cart = [];                 // 購物車

  // ════════════════════════════════════════════════════
  //  DOM References
  // ════════════════════════════════════════════════════
  const $ = id => document.getElementById(id);

  const navbar        = $('sf-navbar');
  const hamburger     = $('sf-hamburger');
  const navLinks      = $('sf-nav-links');
  const statusDot     = $('status-dot');
  const statusLabel   = $('status-label');
  const annSection    = $('announcement-section');
  const annText       = $('announcement-text');
  const btnCloseAnn   = $('btn-close-announcement');
  const categoryTabs  = document.querySelectorAll('.sf-tab');
  const filterPanel   = $('filter-panel');
  const originBtns    = $('origin-filter-btns');
  const processBtns   = $('process-filter-btns');
  const catalogLoad   = $('catalog-loading');
  const productGrid   = $('product-grid');
  const catalogEmpty  = $('catalog-empty');
  const orderTimeline = $('ordering-timeline');
  const orderDesc     = $('ordering-main-desc');
  const hoursGrid     = $('hours-grid');
  const btnCart       = $('btn-cart');
  const cartBadge     = $('cart-badge');
  const cartOverlay   = $('cart-overlay');
  const cartDrawer    = $('cart-drawer');
  const btnCloseCart  = $('btn-close-cart');
  const cartBody      = $('cart-items-container');
  const cartSubtotal  = $('cart-subtotal');
  const btnCheckout   = $('btn-checkout');
  const btnClearCart  = $('btn-clear-cart');
  const toastArea     = $('sf-toast-area');

  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

  // ════════════════════════════════════════════════════
  //  初始化
  // ════════════════════════════════════════════════════
  async function init() {
    loadCartFromSession();
    initNavbar();
    // 並行載入所有 API 資料
    await Promise.all([
      loadBusinessStatus(),
      loadCatalogTab('咖啡豆'),
      loadOrderingGuide(),
      loadBusinessHours()
    ]);
  }

  // ════════════════════════════════════════════════════
  //  G: 導覽列
  // ════════════════════════════════════════════════════
  function initNavbar() {
    // 滾動變色
    window.addEventListener('scroll', () => {
      if (window.scrollY > 60) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    }, { passive: true });

    // 漢堡選單
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });

    // 平滑導航：點連結後關閉行動選單
    navLinks.querySelectorAll('.sf-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  // ════════════════════════════════════════════════════
  //  A + B: 業務狀態 + 公告
  // ════════════════════════════════════════════════════
  async function loadBusinessStatus() {
    try {
      const res  = await fetch('/api/storefront/business-hours');
      const json = await res.json();
      if (!json.success) return;

      const { announcement, days } = json.data;

      // B: 臨時公告
      if (announcement && announcement.trim()) {
        annText.textContent = `臨時公告：${announcement.trim()}`;
        annSection.classList.remove('d-none');
      }

      // A: 即時營業狀態
      updateBusinessStatus(days);
    } catch (e) {
      console.warn('[BusinessStatus] 無法載入:', e.message);
    }
  }

  function updateBusinessStatus(days) {
    const now     = new Date();
    const jsDay   = now.getDay();               // 0=日 ~ 6=六
    const apiDay  = jsDay === 0 ? 7 : jsDay;    // API: 1=一 ~ 7=日
    const curMin  = now.getHours() * 60 + now.getMinutes();

    const todayData = days.find(d => d.dayOfWeek === apiDay);
    let isOpen = false;

    if (todayData && todayData.isOpen && todayData.slots && todayData.slots.length) {
      isOpen = todayData.slots.some(slot => {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        const start = sh * 60 + sm;
        const end   = eh * 60 + em;
        return curMin >= start && curMin <= end;
      });
    }

    statusDot.className = 'sf-status-dot ' + (isOpen ? 'open' : 'closed');
    statusLabel.textContent = isOpen ? '🟢 營業中' : '🌙 休息中';
  }

  // 關閉公告
  btnCloseAnn.addEventListener('click', () => {
    annSection.classList.add('d-none');
  });

  // ════════════════════════════════════════════════════
  //  C: 商品展示 — Tab 切換
  // ════════════════════════════════════════════════════
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      if (category === activeCategory) return;
      activeCategory = category;

      // 更新 Tab 樣式
      categoryTabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab);
      });

      // 篩選面板：只在咖啡豆時顯示
      if (category === '咖啡豆') {
        filterPanel.classList.remove('d-none');
      } else {
        filterPanel.classList.add('d-none');
        activeOrigin = 'all';
        activeProcess = 'all';
      }

      loadCatalogTab(category);
    });
  });

  // ────────────────────────────────────────────────────
  //  載入指定分類的商品 (含動態篩選器)
  // ────────────────────────────────────────────────────
  async function loadCatalogTab(category) {
    showCatalogLoading(true);
    try {
      // 商品列表
      const res  = await fetch(`/api/storefront/products?category=${encodeURIComponent(category)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      allProducts = json.data;

      // 若為咖啡豆，載入動態篩選器
      if (category === '咖啡豆') {
        await loadFilters();
      }

      renderProducts();
    } catch (e) {
      console.error('[Catalog] 載入失敗:', e.message);
      showCatalogLoading(false);
      showCatalogEmpty();
    }
  }

  // ────────────────────────────────────────────────────
  //  載入動態篩選器
  // ────────────────────────────────────────────────────
  async function loadFilters() {
    try {
      const res  = await fetch('/api/storefront/filters');
      const json = await res.json();
      if (!json.success) return;

      const { origins, processMethods } = json.data;
      renderFilterBtns(originBtns, origins, 'origin');
      renderFilterBtns(processBtns, processMethods, 'process');
    } catch (e) {
      console.warn('[Filters] 無法載入篩選器:', e.message);
    }
  }

  function renderFilterBtns(container, values, type) {
    // 保留「全部」按鈕，清除舊動態按鈕
    const allBtn = container.querySelector(`[data-${type}="all"]`);
    container.innerHTML = '';
    container.appendChild(allBtn);

    values.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'sf-filter-btn';
      btn.setAttribute(`data-${type}`, val);
      btn.textContent = val;
      btn.setAttribute('id', `filter-${type}-${val.replace(/\s+/g, '-')}`);
      btn.addEventListener('click', () => handleFilterClick(btn, type));
      container.appendChild(btn);
    });

    // 確保「全部」按鈕有事件
    allBtn.onclick = () => handleFilterClick(allBtn, type);
    // 重置 active 狀態
    setActiveFilterBtn(container, type === 'origin' ? activeOrigin : activeProcess, type);
  }

  function handleFilterClick(clickedBtn, type) {
    const val = clickedBtn.getAttribute(`data-${type}`);
    if (type === 'origin')  activeOrigin  = val;
    if (type === 'process') activeProcess = val;

    const container = type === 'origin' ? originBtns : processBtns;
    setActiveFilterBtn(container, val, type);
    renderProducts();
  }

  function setActiveFilterBtn(container, val, type) {
    container.querySelectorAll('.sf-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute(`data-${type}`) === val);
    });
  }

  // ────────────────────────────────────────────────────
  //  渲染商品卡片
  // ────────────────────────────────────────────────────
  function renderProducts() {
    showCatalogLoading(false);
    let list = allProducts;

    // 前端即時篩選（只對咖啡豆有效）
    if (activeCategory === '咖啡豆') {
      if (activeOrigin !== 'all') {
        list = list.filter(p => p.origin === activeOrigin);
      }
      if (activeProcess !== 'all') {
        list = list.filter(p => p.processMethod === activeProcess);
      }
    }

    if (list.length === 0) {
      productGrid.classList.add('d-none');
      showCatalogEmpty();
      return;
    }

    catalogEmpty.classList.add('d-none');
    productGrid.innerHTML = '';

    // 掛耳包組 → Flex 置中雙欄佈局
    if (activeCategory === '掛耳包組') {
      productGrid.classList.add('sf-drip-grid');
    } else {
      productGrid.classList.remove('sf-drip-grid');
    }

    list.forEach((product, idx) => {
      const card = buildProductCard(product, idx);
      productGrid.appendChild(card);
    });

    productGrid.classList.remove('d-none');
  }

  function buildProductCard(p, idx) {
    const isOutOfStock = p.stock <= 0;
    const isLimited    = !!p.isLimited;
    const isDripBag    = p.category === '掛耳包組';

    // ── 卡片主標題
    let displayTitle = '';
    if (p.category === '咖啡豆') {
      displayTitle = [p.origin, p.estate, p.processMethod].filter(Boolean).join(' ');
    } else if (isDripBag) {
      // 例：「中烘焙 綜合掛耳包」
      displayTitle = p.brand ? p.brand : '掛耳包組';
    } else {
      displayTitle = p.name || p.brand || '周邊產品';
    }

    // ── Badge
    let badgeHtml = '';
    if (isOutOfStock) {
      badgeHtml = `<span class="sf-card-badge sf-badge-soldout">已售完</span>`;
    } else if (isLimited) {
      badgeHtml = `<span class="sf-card-badge sf-badge-limited">🔥 限量</span>`;
    } else if (p.processMethod) {
      badgeHtml = `<span class="sf-card-badge sf-badge-process">${escHtml(p.processMethod)}</span>`;
    }

    // ── 產區（只有咖啡豆顯示）
    const originHtml = (!isDripBag && p.origin)
      ? `<p class="sf-card-origin">${escHtml(p.origin)}</p>` : '';

    // ── 掛耳包：副標說明（取 packageNotes，移除包數相關文字）
    let dripSubtitleHtml = '';
    if (isDripBag) {
      // 去掉「各N包」「(N包)」「N包/組」之類的字樣
      const cleanNotes = (p.packageNotes || '')
        .replace(/各?\d+包\/組/g, '')
        .replace(/各?\d+包/g, '')
        .replace(/，$/g, '')
        .trim();
      if (cleanNotes) {
        dripSubtitleHtml = `<p class="sf-drip-subtitle">${escHtml(cleanNotes)}</p>`;
      }
    }

    // ── 掛耳包：職人風味清單（☕ SubID 豆名 — 風味前20字）
    let recipesHtml = '';
    if (isDripBag && p.recipes && p.recipes.length > 0) {
      const items = p.recipes.map(r => {
        const beanName = [r.origin, r.estate, r.name]
          .filter(Boolean).join(' ') || r.subProductID;
        const flavorRaw = (r.flavorDescription || '').trim();
        const flavorShort = flavorRaw.length > 22
          ? flavorRaw.slice(0, 22) + '…'
          : flavorRaw;
        const flavorPart = flavorShort
          ? ` <span class="sf-drip-item-flavor">— ${escHtml(flavorShort)}</span>`
          : '';
        return `
          <li class="sf-drip-item">
            <span class="sf-drip-item-icon">☕</span>
            <span class="sf-drip-item-body">
              <span class="sf-drip-item-id">${escHtml(r.subProductID)}</span>
              <span class="sf-drip-item-name">${escHtml(beanName)}</span>${flavorPart}
            </span>
          </li>`;
      }).join('');
      recipesHtml = `
        <div class="sf-drip-recipe-block">
          <p class="sf-drip-recipe-label">本組咖啡豆</p>
          <ul class="sf-drip-recipe-list">${items}</ul>
        </div>`;
    }

    // ── 一般商品風味（掛耳包不使用 flavorDescription）
    const flavorHtml = (!isDripBag && p.flavorDescription)
      ? `<p class="sf-card-flavor">${escHtml(p.flavorDescription)}</p>`
      : '';

    // ── 庫存
    const stockHtml = isOutOfStock
      ? `<p class="sf-card-stock sf-stock-none">補貨中</p>`
      : `<p class="sf-card-stock sf-stock-ok">庫存 ${p.stock} 件</p>`;

    // ── 規格價格
    const specs = [];
    if (p.unit_1 && p.price_1) specs.push({ unit: p.unit_1, price: p.price_1 });
    if (p.unit_2 && p.price_2) specs.push({ unit: p.unit_2, price: p.price_2 });
    if (p.unit_3 && p.price_3) specs.push({ unit: p.unit_3, price: p.price_3 });

    const priceRowsHtml = specs.map(s => {
      const priceDisplay = p.salePrice && specs.length === 1
        ? `<span class="sf-price-original">NT$ ${fmtN(p.originalPrice)}</span>
           <span class="sf-price-value sf-price-sale">NT$ ${fmtN(p.salePrice)}</span>`
        : `<span class="sf-price-value">NT$ ${fmtN(s.price)}</span>`;

      return `
        <div class="sf-price-row">
          <span class="sf-price-spec">${escHtml(s.unit)}</span>
          <div style="display:flex;align-items:center;gap:0.5rem;">
            ${priceDisplay}
            <button class="sf-btn-add-to-cart"
              data-id="${escHtml(p.productID)}"
              data-name="${escHtml(displayTitle)}"
              data-size="${escHtml(s.unit)}"
              data-price="${s.price}"
              ${isOutOfStock ? 'disabled' : ''}>
              + 選購
            </button>
          </div>
        </div>`;
    }).join('');

    const card = document.createElement('article');
    card.className = `sf-product-card${isDripBag ? ' sf-drip-card' : ''}${isOutOfStock ? ' out-of-stock' : ''}`;
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="sf-card-header">
        ${badgeHtml}
        <span class="sf-card-id">${escHtml(p.productID)}</span>
      </div>
      <div class="sf-card-body">
        ${originHtml}
        <h3 class="sf-card-title">${escHtml(displayTitle)}</h3>
        ${dripSubtitleHtml}
        ${flavorHtml}
        ${recipesHtml}
        ${stockHtml}
      </div>
      <div class="sf-card-price-box">
        ${priceRowsHtml}
      </div>
    `;

    return card;
  }

  // ════════════════════════════════════════════════════
  //  D: 訂購方式 Timeline
  // ════════════════════════════════════════════════════
  async function loadOrderingGuide() {
    try {
      const res  = await fetch('/api/storefront/ordering-guide');
      const json = await res.json();
      if (!json.success) return;

      const { mainDescription, items } = json.data;

      if (mainDescription && mainDescription.trim()) {
        orderDesc.textContent = mainDescription.trim();
      }

      if (!items || items.length === 0) {
        orderTimeline.innerHTML = '<p style="color:var(--sf-muted);text-align:center;">訂購方式資訊暫無資料</p>';
        return;
      }

      orderTimeline.innerHTML = '';
      items.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = 'sf-timeline-item';
        el.style.animationDelay = `${idx * 0.1}s`;
        el.innerHTML = `
          <div class="sf-timeline-step">${item.stepNumber}</div>
          <div class="sf-timeline-body">
            <h3 class="sf-timeline-title">${escHtml(item.title || '')}</h3>
            <p class="sf-timeline-content">${escHtml(item.content || '')}</p>
          </div>
        `;
        orderTimeline.appendChild(el);
      });
    } catch (e) {
      console.error('[OrderingGuide] 載入失敗:', e.message);
      orderTimeline.innerHTML = '<p style="color:var(--sf-danger);text-align:center;">無法載入訂購資訊</p>';
    }
  }

  // ════════════════════════════════════════════════════
  //  E: 營業時間表
  // ════════════════════════════════════════════════════
  async function loadBusinessHours() {
    try {
      const res  = await fetch('/api/storefront/business-hours');
      const json = await res.json();
      if (!json.success) return;

      const { days } = json.data;
      renderHoursGrid(days);
    } catch (e) {
      console.error('[BusinessHours] 載入失敗:', e.message);
    }
  }

  function renderHoursGrid(days) {
    if (!days || days.length === 0) return;

    const now      = new Date();
    const jsDay    = now.getDay();              // 0=日 ~ 6=六
    const todayAPI = jsDay === 0 ? 7 : jsDay;  // API: 1=一 ~ 7=日

    // API: 1=一, 2=二, …, 7=日 → 顯示順序：一二三四五六日
    const dayLabel = { 1:'星期一', 2:'星期二', 3:'星期三', 4:'星期四', 5:'星期五', 6:'星期六', 7:'星期日' };

    hoursGrid.innerHTML = '';

    days.forEach((day, idx) => {
      const isToday = day.dayOfWeek === todayAPI;
      const card = document.createElement('div');
      card.className = `sf-hours-card${isToday ? ' today' : ''}${!day.isOpen ? ' closed' : ''}`;
      card.style.animationDelay = `${idx * 0.06}s`;

      const todayTag = isToday ? `<span class="sf-today-tag">今天</span>` : '';

      let slotsHtml = '';
      if (!day.isOpen) {
        slotsHtml = `<span class="sf-hours-closed">🚫 公休/店休</span>`;
      } else if (day.slots && day.slots.length > 0) {
        slotsHtml = day.slots.map(s =>
          `<div class="sf-hours-slot">${escHtml(s.startTime)} – ${escHtml(s.endTime)}</div>`
        ).join('');
      } else {
        slotsHtml = `<span class="sf-hours-slot" style="color:var(--sf-muted);">時間待確認</span>`;
      }

      card.innerHTML = `
        <div class="sf-hours-day">${dayLabel[day.dayOfWeek] || ''}${todayTag}</div>
        <div class="sf-hours-slots">${slotsHtml}</div>
      `;
      hoursGrid.appendChild(card);
    });
  }

  // ════════════════════════════════════════════════════
  //  F: 購物車
  // ════════════════════════════════════════════════════
  function loadCartFromSession() {
    try {
      const saved = sessionStorage.getItem('kakama_cart');
      cart = saved ? JSON.parse(saved) : [];
    } catch { cart = []; }
    updateCartUI();
  }

  function saveCart() {
    sessionStorage.setItem('kakama_cart', JSON.stringify(cart));
  }

  function addToCart(id, name, size, price) {
    const existing = cart.find(i => i.id === id && i.size === size);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, name, size, price: Number(price), qty: 1 });
    }
    saveCart();
    updateCartUI();
    openCartDrawer();
    showToast(`已加入：${name} (${size})`, 'success');
  }

  function updateCartUI() {
    const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
    const totalPrice = cart.reduce((acc, i) => acc + i.price * i.qty, 0);

    // Badge
    if (totalItems > 0) {
      cartBadge.textContent = totalItems;
      cartBadge.classList.remove('d-none');
    } else {
      cartBadge.classList.add('d-none');
    }

    // 小計
    cartSubtotal.textContent = `NT$ ${fmtN(totalPrice)}`;
    btnCheckout.disabled = cart.length === 0;

    // 商品列表
    cartBody.innerHTML = '';
    if (cart.length === 0) {
      cartBody.innerHTML = `
        <div class="sf-cart-empty">
          <i class="bi bi-bag2"></i>
          <p>購物車是空的</p>
        </div>`;
      return;
    }

    cart.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'sf-cart-item';
      div.innerHTML = `
        <div class="sf-cart-item-info">
          <div class="sf-cart-item-name" title="${escHtml(item.name)}">${escHtml(item.name)}</div>
          <div class="sf-cart-item-meta">
            <span class="sf-cart-item-size">${escHtml(item.size)}</span>
            <span class="sf-cart-item-price">NT$ ${fmtN(item.price)}</span>
          </div>
        </div>
        <div class="sf-cart-qty-ctrl">
          <button class="sf-qty-btn" data-action="decrease" data-idx="${idx}" aria-label="減少數量">−</button>
          <span class="sf-qty-num">${item.qty}</span>
          <button class="sf-qty-btn" data-action="increase" data-idx="${idx}" aria-label="增加數量">+</button>
          <button class="sf-del-btn" data-action="delete" data-idx="${idx}" aria-label="刪除品項">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      `;
      cartBody.appendChild(div);
    });
  }

  // 購物車操作：事件代理
  cartBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const idx    = Number(btn.dataset.idx);

    if (action === 'increase') {
      cart[idx].qty++;
    } else if (action === 'decrease') {
      if (cart[idx].qty > 1) cart[idx].qty--;
      else cart.splice(idx, 1);
    } else if (action === 'delete') {
      cart.splice(idx, 1);
    }
    saveCart();
    updateCartUI();
  });

  // 加入購物車：全局事件代理（支援動態渲染的按鈕）
  document.addEventListener('click', e => {
    const btn = e.target.closest('.sf-btn-add-to-cart');
    if (!btn || btn.disabled) return;
    const { id, name, size, price } = btn.dataset;
    addToCart(id, name, size, price);
  });

  // 購物車抽屜開關
  btnCart.addEventListener('click', openCartDrawer);
  btnCloseCart.addEventListener('click', closeCartDrawer);
  cartOverlay.addEventListener('click', closeCartDrawer);

  function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('active');
    cartOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('active');
    cartOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btnClearCart.addEventListener('click', () => {
    cart = [];
    saveCart();
    updateCartUI();
  });

  btnCheckout.addEventListener('click', () => {
    showToast('🎉 感謝您的訂購！我們將盡快與您聯繫確認。', 'success');
    cart = [];
    saveCart();
    updateCartUI();
    closeCartDrawer();
  });

  // ════════════════════════════════════════════════════
  //  輔助 UI 函式
  // ════════════════════════════════════════════════════
  function showCatalogLoading(on) {
    if (on) {
      catalogLoad.classList.remove('d-none');
      productGrid.classList.add('d-none');
      catalogEmpty.classList.add('d-none');
    } else {
      catalogLoad.classList.add('d-none');
    }
  }

  function showCatalogEmpty() {
    catalogEmpty.classList.remove('d-none');
    productGrid.classList.add('d-none');
  }

  function showToast(msg, type = '') {
    const el = document.createElement('div');
    el.className = `sf-toast${type ? ' ' + type : ''}`;
    el.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${escHtml(msg)}`;
    toastArea.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toast-out 0.3s ease both';
      setTimeout(() => el.remove(), 320);
    }, 3000);
  }

  // ════════════════════════════════════════════════════
  //  工具函式
  // ════════════════════════════════════════════════════
  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function fmtN(n) {
    return Number(n || 0).toLocaleString('zh-TW');
  }

  // ════════════════════════════════════════════════════
  //  啟動
  // ════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
