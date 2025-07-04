function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  const icon = type === 'success' ? 'check-circle' :
               type === 'error' ? 'exclamation-circle' :
               type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  toast.innerHTML = '<div class="flex items-center"><i class="fas fa-' + icon + ' mr-2"></i><span>' + message + '</span></div>';
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300);
  }, duration);
}

async function loadConfig() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    document.getElementById('adminUsername').value = config.ADMIN_USERNAME || '';
    document.getElementById('tgBotToken').value = config.TG_BOT_TOKEN || '';
    document.getElementById('tgChatId').value = config.TG_CHAT_ID || '';
    document.getElementById('notifyxApiKey').value = config.NOTIFYX_API_KEY || '';
    const notificationType = config.NOTIFICATION_TYPE || 'notifyx';
    document.querySelector('input[name="notificationType"][value="' + notificationType + '"]').checked = true;
    toggleNotificationConfig(notificationType);
  } catch (error) {
    console.error('加载配置失败:', error);
    showToast('加载配置失败，请刷新页面重试', 'error');
  }
}

function toggleNotificationConfig(type) {
  const telegramConfig = document.getElementById('telegramConfig');
  const notifyxConfig = document.getElementById('notifyxConfig');
  if (type === 'telegram') {
    telegramConfig.classList.remove('inactive');
    telegramConfig.classList.add('active');
    notifyxConfig.classList.remove('active');
    notifyxConfig.classList.add('inactive');
  } else if (type === 'notifyx') {
    telegramConfig.classList.remove('active');
    telegramConfig.classList.add('inactive');
    notifyxConfig.classList.remove('inactive');
    notifyxConfig.classList.add('active');
  }
}
document.querySelectorAll('input[name="notificationType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    toggleNotificationConfig(e.target.value);
  });
});
document.getElementById('configForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const config = {
    ADMIN_USERNAME: document.getElementById('adminUsername').value.trim(),
    TG_BOT_TOKEN: document.getElementById('tgBotToken').value.trim(),
    TG_CHAT_ID: document.getElementById('tgChatId').value.trim(),
    NOTIFYX_API_KEY: document.getElementById('notifyxApiKey').value.trim(),
    NOTIFICATION_TYPE: document.querySelector('input[name="notificationType"]:checked').value
  };
  const passwordField = document.getElementById('adminPassword');
  if (passwordField.value.trim()) {
    config.ADMIN_PASSWORD = passwordField.value.trim();
  }
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalContent = submitButton.innerHTML;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const result = await response.json();
    if (result.success) {
      showToast('配置保存成功', 'success');
      passwordField.value = '';
    } else {
      showToast('配置保存失败: ' + (result.message || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    showToast('保存配置失败，请稍后再试', 'error');
  } finally {
    submitButton.innerHTML = originalContent;
    submitButton.disabled = false;
  }
});
async function testNotification(type) {
  const button = document.getElementById(type === 'telegram' ? 'testTelegramBtn' : 'testNotifyXBtn');
  const originalContent = button.innerHTML;
  const serviceName = type === 'telegram' ? 'Telegram' : 'NotifyX';
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>测试中...';
  button.disabled = true;
  const config = {};
  if (type === 'telegram') {
    config.TG_BOT_TOKEN = document.getElementById('tgBotToken').value.trim();
    config.TG_CHAT_ID = document.getElementById('tgChatId').value.trim();
    if (!config.TG_BOT_TOKEN || !config.TG_CHAT_ID) {
      showToast('请先填写 Telegram Bot Token 和 Chat ID', 'warning');
      button.innerHTML = originalContent;
      button.disabled = false;
      return;
    }
  } else {
    config.NOTIFYX_API_KEY = document.getElementById('notifyxApiKey').value.trim();
    if (!config.NOTIFYX_API_KEY) {
      showToast('请先填写 NotifyX API Key', 'warning');
      button.innerHTML = originalContent;
      button.disabled = false;
      return;
    }
  }
  try {
    const response = await fetch('/api/test-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, ...config })
    });
    const result = await response.json();
    if (result.success) {
      showToast(serviceName + ' 通知测试成功！', 'success');
    } else {
      showToast(serviceName + ' 通知测试失败: ' + (result.message || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('测试通知失败:', error);
    showToast('测试失败，请稍后再试', 'error');
  } finally {
    button.innerHTML = originalContent;
    button.disabled = false;
  }
}
document.getElementById('testTelegramBtn').addEventListener('click', () => {
  testNotification('telegram');
});
document.getElementById('testNotifyXBtn').addEventListener('click', () => {
  testNotification('notifyx');
});
window.addEventListener('load', loadConfig); 