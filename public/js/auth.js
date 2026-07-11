document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');
  const btnLogin = document.getElementById('btnLogin');
  const btnLoginText = document.getElementById('btn-login-text');
  const btnLoginSpinner = document.getElementById('btn-login-spinner');

  // 1. 檢查是否已經登入，如果已登入則直接導入主畫面
  const token = sessionStorage.getItem('token');
  if (token) {
    window.location.href = '/dashboard.html';
    return;
  }

  // 2. 表單輸入框 Focus 時移除錯誤樣式
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid-custom');
      const feedback = document.getElementById(`${input.id}-feedback`);
      if (feedback) feedback.style.display = 'none';
      errorAlert.classList.add('d-none');
    });
  });

  // 3. 表單送出事件
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 隱藏之前的錯誤提示
    errorAlert.classList.add('d-none');
    
    // 前端基本檢核
    let isValid = true;
    
    if (!usernameInput.value.trim()) {
      showInputError(usernameInput, '請輸入您的帳號');
      isValid = false;
    }
    
    if (!passwordInput.value.trim()) {
      showInputError(passwordInput, '請輸入您的密碼');
      isValid = false;
    }
    
    if (!isValid) return;

    // 啟動 Loading 狀態
    setLoading(true);

    try {
      // 呼叫後端登入 API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usernameInput.value.trim(),
          password: passwordInput.value
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 登入成功，儲存 Token 與使用者資訊至 sessionStorage
        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        
        // 導向至儀表板主畫面
        window.location.href = '/dashboard.html';
      } else {
        // 登入失敗，顯示後端回傳的錯誤訊息
        showGeneralError(result.message || '登入失敗，請稍後再試。');
      }
    } catch (error) {
      console.error('Login Error:', error);
      showGeneralError('無法連線至伺服器，請檢查網路連線。');
    } finally {
      setLoading(false);
    }
  });

  // 顯示輸入欄位錯誤
  function showInputError(inputElement, msg) {
    inputElement.classList.add('is-invalid-custom');
    const feedback = document.getElementById(`${inputElement.id}-feedback`);
    if (feedback) {
      feedback.textContent = msg;
      feedback.style.display = 'block';
    }
  }

  // 顯示通用錯誤警報
  function showGeneralError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('d-none');
  }

  // 設定按鈕載入狀態
  function setLoading(isLoading) {
    if (isLoading) {
      btnLoginText.textContent = '登入中...';
      btnLoginSpinner.classList.remove('d-none');
      document.getElementById('btn-login').disabled = true;
    } else {
      btnLoginText.textContent = '登入系統';
      btnLoginSpinner.classList.add('d-none');
      document.getElementById('btn-login').disabled = false;
    }
  }
});
