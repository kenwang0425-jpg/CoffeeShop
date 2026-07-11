document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const catalogLoading = document.getElementById('catalog-loading');
  const catalogGrid = document.getElementById('catalog-grid');
  const catalogEmpty = document.getElementById('catalog-empty');
  const searchBeansInput = document.getElementById('search-beans');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  // Cart DOM Elements
  const btnCart = document.getElementById('btn-cart');
  const cartBadge = document.getElementById('cart-badge');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartDrawerOverlay = document.getElementById('cart-drawer-overlay');
  const btnCloseCart = document.getElementById('btn-close-cart');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const btnCheckout = document.getElementById('btn-checkout');
  const btnClearCart = document.getElementById('btn-clear-cart');

  // --- State Variables ---
  let products = [];
  let cart = [];
  let activeFilter = 'all';
  let searchQuery = '';

  // --- Initialize ---
  function init() {
    // 載入購物車暫存
    loadCartFromSession();
    
    // 載入商品列表
    loadProducts();

    // 綁定事件監聽器
    bindEvents();
  }

  // --- API Functions ---
  async function loadProducts() {
    showLoading(true);
    try {
      const response = await fetch('/api/products');
      const result = await response.json();
      
      if (response.ok && result.success) {
        products = result.data;
        renderCatalog();
      } else {
        console.error('Failed to load products:', result.message);
        showErrorState();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showErrorState();
    } finally {
      showLoading(false);
    }
  }

  // --- UI Functions ---
  function showLoading(isLoading) {
    if (isLoading) {
      catalogLoading.classList.remove('d-none');
      catalogGrid.classList.add('d-none');
      catalogEmpty.classList.add('d-none');
    } else {
      catalogLoading.classList.add('d-none');
    }
  }

  function showErrorState() {
    catalogGrid.classList.add('d-none');
    catalogEmpty.classList.remove('d-none');
    catalogEmpty.querySelector('h4').textContent = '載入精品咖啡豆失敗';
    catalogEmpty.querySelector('p').textContent = '目前無法連線到伺服器，請稍後再試。';
  }

  // 渲染前台商品網格
  function renderCatalog() {
    catalogGrid.innerHTML = '';
    
    // 進行搜尋與分類篩選
    const filteredProducts = products.filter(p => {
      // 1. 關鍵字搜尋
      const combinedSearchText = `${p.country} ${p.estate} ${p.processMethod} ${p.flavorDescription} ${p.productID}`.toLowerCase();
      const matchesSearch = combinedSearchText.includes(searchQuery);

      // 2. 處理法分類篩選
      let matchesFilter = true;
      if (activeFilter !== 'all') {
        if (activeFilter === '蜜處理') {
          // 蜜處理按鈕涵蓋蜜處理、厭氧、或其他特殊處理
          matchesFilter = p.processMethod.includes('蜜') || p.processMethod.includes('厭氧') || (!p.processMethod.includes('日曬') && !p.processMethod.includes('水洗'));
        } else {
          matchesFilter = p.processMethod === activeFilter;
        }
      }

      return matchesSearch && matchesFilter;
    });

    if (filteredProducts.length === 0) {
      catalogGrid.classList.add('d-none');
      catalogEmpty.classList.remove('d-none');
      return;
    }

    catalogGrid.classList.remove('d-none');
    catalogEmpty.classList.add('d-none');

    filteredProducts.forEach(product => {
      const cardCol = document.createElement('div');
      cardCol.className = 'col-12 col-md-6 col-lg-4 d-flex';

      // 組合商品名稱
      const combinedName = [product.country, product.estate, product.processMethod].filter(Boolean).join(' ');
      const isOutOfStock = product.stock <= 0;

      // 價格規格渲染
      let priceRowsHtml = '';
      
      // 規格 1: 半磅價 (必填)
      priceRowsHtml += createPriceRow(product, combinedName, '半磅', product.price_HalfPound, isOutOfStock);
      
      // 規格 2: 一磅價 (選填)
      if (product.price_OnePound && product.price_OnePound > 0) {
        priceRowsHtml += createPriceRow(product, combinedName, '一磅', product.price_OnePound, isOutOfStock);
      }
      
      // 規格 3: 耳掛價 (選填)
      if (product.price_DripBag && product.price_DripBag > 0) {
        priceRowsHtml += createPriceRow(product, combinedName, '耳掛', product.price_DripBag, isOutOfStock);
      }

      cardCol.innerHTML = `
        <div class="card coffee-card w-100 flex-column d-flex justify-content-between position-relative ${isOutOfStock ? 'out-of-stock-card' : ''}">
          ${isOutOfStock ? '<span class="badge bg-danger position-absolute top-0 start-0 m-3 px-3 py-2 fw-bold text-uppercase fs-7 shadow">已售完</span>' : ''}
          <div class="card-body p-4 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-dark-amber text-warning px-2 py-1 fs-8 rounded">${escapeHtml(product.processMethod || '其他處理')}</span>
                <span class="text-secondary font-monospace fs-8">${escapeHtml(product.productID)}</span>
              </div>
              <h3 class="card-title h5 text-dark fw-bold mb-3">${escapeHtml(combinedName)}</h3>
              <p class="card-text text-secondary italic-flavor mb-4">
                風味描述：${escapeHtml(product.flavorDescription || '優雅細緻的咖啡香氣。')}
              </p>
            </div>
            
            <div class="price-spec-box mt-auto">
              <div class="spec-header text-secondary mb-2 fs-8 text-uppercase tracking-wider">規格選擇 & 價格</div>
              <div class="d-flex flex-column gap-2">
                ${priceRowsHtml}
              </div>
            </div>
          </div>
          <div class="card-footer bg-transparent border-0 px-4 pb-4 pt-0">
            <div class="d-flex justify-content-between align-items-center">
              <small class="text-secondary">
                庫存狀態: 
                <span class="${isOutOfStock ? 'text-danger' : 'text-success-custom'} fw-bold">
                  ${isOutOfStock ? '補貨中' : `在庫 ${product.stock} 包`}
                </span>
              </small>
            </div>
          </div>
        </div>
      `;
      catalogGrid.appendChild(cardCol);
    });

    // 重新綁定「加入購物車」按鈕點擊事件
    bindAddToCartBtns();
  }

  // 輔助函式：建立價格項目行
  function createPriceRow(product, name, size, price, isOutOfStock) {
    return `
      <div class="d-flex align-items-center justify-content-between py-2 border-bottom border-light-subtle">
        <div class="d-flex align-items-center">
          <span class="fw-semibold text-secondary me-2 fs-7">${size}</span>
          <span class="text-warning-custom fw-bold">NT$ ${Number(price).toLocaleString()}</span>
        </div>
        <button class="btn btn-warning-custom btn-xs px-2.5 py-1 text-dark fw-bold btn-add-to-cart" 
                data-id="${escapeHtml(product.productID)}" 
                data-name="${escapeHtml(name)}" 
                data-size="${size}" 
                data-price="${price}"
                ${isOutOfStock ? 'disabled' : ''}>
          <i class="bi bi-cart-plus-fill me-1"></i>選購
        </button>
      </div>
    `;
  }

  // --- Shopping Cart Functions ---

  // 載入 sessionStorage 購物車資料
  function loadCartFromSession() {
    const savedCart = sessionStorage.getItem('coffee_cart');
    if (savedCart) {
      try {
        cart = JSON.parse(savedCart);
      } catch (e) {
        cart = [];
      }
    }
    updateCartUI();
  }

  // 儲存購物車資料至 sessionStorage
  function saveCartToSession() {
    sessionStorage.setItem('coffee_cart', JSON.stringify(cart));
  }

  // 新增商品至購物車
  function addToCart(id, name, size, price) {
    const existingItem = cart.find(item => item.productID === id && item.size === size);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productID: id,
        name: name,
        size: size,
        price: Number(price),
        quantity: 1
      });
    }

    saveCartToSession();
    updateCartUI();

    // 微動畫與自動開啟抽屜回饋
    openCartDrawer();
  }

  // 更新購物車畫面與 Badge 狀態
  function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    
    let totalItems = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x text-secondary" style="font-size: 3rem;"></i>
          <p class="text-secondary mt-3">您的購物車是空的</p>
        </div>
      `;
      cartBadge.classList.add('d-none');
      btnCheckout.disabled = true;
    } else {
      cartBadge.classList.remove('d-none');
      btnCheckout.disabled = false;

      cart.forEach((item, index) => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-light-subtle';
        cartItem.innerHTML = `
          <div class="me-2 flex-grow-1">
            <h6 class="text-dark fw-bold mb-1 fs-7 text-truncate" style="max-width: 170px;" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h6>
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-secondary fs-9">${escapeHtml(item.size)}</span>
              <span class="text-warning-custom fw-semibold fs-8">NT$ ${item.price.toLocaleString()}</span>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <!-- 數量控制 -->
            <button class="btn btn-outline-secondary btn-xxs cart-qty-btn decrease-qty" data-index="${index}">-</button>
            <span class="text-dark px-1 font-monospace fs-7">${item.quantity}</span>
            <button class="btn btn-outline-secondary btn-xxs cart-qty-btn increase-qty" data-index="${index}">+</button>
            
            <!-- 刪除按鈕 -->
            <button class="btn btn-link text-danger p-1 ms-1 delete-cart-item" data-index="${index}">
              <i class="bi bi-trash3-fill fs-7"></i>
            </button>
          </div>
        `;
        cartItemsContainer.appendChild(cartItem);
      });

      cartBadge.textContent = totalItems;
    }

    cartSubtotal.textContent = `NT$ ${totalPrice.toLocaleString()}`;

    // 重新綁定購物車內的操作按鈕
    bindCartActionListeners();
  }

  // 購物車數量與刪除事件綁定
  function bindCartActionListeners() {
    // 增加數量
    document.querySelectorAll('.increase-qty').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        cart[index].quantity += 1;
        saveCartToSession();
        updateCartUI();
      });
    });

    // 減少數量
    document.querySelectorAll('.decrease-qty').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        if (cart[index].quantity > 1) {
          cart[index].quantity -= 1;
        } else {
          cart.splice(index, 1);
        }
        saveCartToSession();
        updateCartUI();
      });
    });

    // 刪除品項
    document.querySelectorAll('.delete-cart-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        cart.splice(index, 1);
        saveCartToSession();
        updateCartUI();
      });
    });
  }

  // --- Drawer Display Helpers ---
  function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartDrawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // 鎖定背景捲動
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartDrawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // --- Event Bindings ---
  function bindEvents() {
    // 購物車開關
    btnCart.addEventListener('click', openCartDrawer);
    btnCloseCart.addEventListener('click', closeCartDrawer);
    cartDrawerOverlay.addEventListener('click', closeCartDrawer);

    // 關鍵字搜尋
    searchBeansInput.addEventListener('input', () => {
      searchQuery = searchBeansInput.value.trim().toLowerCase();
      renderCatalog();
    });

    // 處理法過濾
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 切換 active 樣式
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        activeFilter = btn.getAttribute('data-method');
        renderCatalog();
      });
    });

    // 清空購物車
    btnClearCart.addEventListener('click', () => {
      cart = [];
      saveCartToSession();
      updateCartUI();
    });

    // 模擬結帳
    btnCheckout.addEventListener('click', () => {
      // 顯示結帳成功 Toast 訊息
      const toastEl = document.getElementById('checkout-toast');
      const toast = new bootstrap.Toast(toastEl);
      toast.show();

      // 清空購物車與關閉抽屜
      cart = [];
      saveCartToSession();
      updateCartUI();
      closeCartDrawer();
    });
  }

  // 綁定「加入購物車」按鈕 (使用事件代理以支援動態與靜態按鈕，並避免重複綁定)
  function bindAddToCartBtns() {
    // 移除舊有實作，改在 init 或外層綁定，這裡保留空函式或直接在此綁定一次
    // 為了安全起見，我們將在 body 上綁定一次事件代理
  }

  // 事件代理：處理所有加入購物車按鈕點擊
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-to-cart');
    if (btn && !btn.disabled) {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const size = btn.getAttribute('data-size');
      const price = btn.getAttribute('data-price');
      
      addToCart(id, name, size, price);
    }
  });

  // HTML 跳脫防範 XSS
  function escapeHtml(string) {
    return String(string).replace(/[&<>"']/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[s];
    });
  }

  // 執行初始化
  init();
});
