document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const button = e.target.querySelector('button');
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登录中...';
  button.disabled = true;
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const result = await response.json();
    if (result.success) {
      window.location.href = '/admin';
    } else {
      document.getElementById('errorMsg').textContent = result.message || '用户名或密码错误';
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  } catch (error) {
    document.getElementById('errorMsg').textContent = '发生错误，请稍后再试';
    button.innerHTML = originalContent;
    button.disabled = false;
  }
}); 