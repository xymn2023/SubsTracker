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

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = field.parentElement.querySelector('.error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    field.classList.add('border-red-500');
  }
}

function clearFieldErrors() {
  document.querySelectorAll('.error-message').forEach(el => {
    el.classList.remove('show');
    el.textContent = '';
  });
  document.querySelectorAll('.border-red-500').forEach(el => {
    el.classList.remove('border-red-500');
  });
}

function validateForm() {
  clearFieldErrors();
  let isValid = true;
  const name = document.getElementById('name').value.trim();
  if (!name) {
    showFieldError('name', '请输入订阅名称');
    isValid = false;
  }
  const periodValue = document.getElementById('periodValue').value;
  if (!periodValue || periodValue < 1) {
    showFieldError('periodValue', '周期数值必须大于0');
    isValid = false;
  }
  const expiryDate = document.getElementById('expiryDate').value;
  if (!expiryDate) {
    showFieldError('expiryDate', '请选择到期日期');
    isValid = false;
  }
  const reminderDays = document.getElementById('reminderDays').value;
  if (reminderDays === '' || reminderDays < 0) {
    showFieldError('reminderDays', '提醒天数不能为负数');
    isValid = false;
  }
  return isValid;
}

async function loadSubscriptions() {
  try {
    const tbody = document.getElementById('subscriptionsBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>';
    const response = await fetch('/api/subscriptions');
    const data = await response.json();
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">没有订阅数据</td></tr>';
      return;
    }
    data.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    data.forEach(subscription => {
      const row = document.createElement('tr');
      row.className = subscription.isActive === false ? 'hover:bg-gray-50 bg-gray-100' : 'hover:bg-gray-50';
      const expiryDate = new Date(subscription.expiryDate);
      const now = new Date();
      const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      let statusHtml = '';
      if (!subscription.isActive) {
        statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-gray-500"><i class="fas fa-pause-circle mr-1"></i>已停用</span>';
      } else if (daysDiff < 0) {
        statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-red-500"><i class="fas fa-exclamation-circle mr-1"></i>已过期</span>';
      } else if (daysDiff <= (subscription.reminderDays || 7)) {
        statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-yellow-500"><i class="fas fa-exclamation-triangle mr-1"></i>即将到期</span>';
      } else {
        statusHtml = '<span class="px-2 py-1 text-xs font-medium rounded-full text-white bg-green-500"><i class="fas fa-check-circle mr-1"></i>正常</span>';
      }
      let periodText = '';
      if (subscription.periodValue && subscription.periodUnit) {
        const unitMap = { day: '天', month: '月', year: '年' };
        periodText = subscription.periodValue + ' ' + (unitMap[subscription.periodUnit] || subscription.periodUnit);
      }
      const autoRenewIcon = subscription.autoRenew !== false ? 
        '<i class="fas fa-sync-alt text-blue-500 ml-1" title="自动续订"></i>' : 
        '<i class="fas fa-ban text-gray-400 ml-1" title="不自动续订"></i>';
      row.innerHTML = 
        '<td class="px-6 py-4 whitespace-nowrap">' + 
          '<div class="text-sm font-medium text-gray-900">' + subscription.name + '</div>' +
          (subscription.notes ? '<div class="text-xs text-gray-500">' + subscription.notes + '</div>' : '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' + 
          '<div class="text-sm text-gray-900">' + 
            '<i class="fas fa-tag mr-1"></i>' + (subscription.customType || '其他') + 
          '</div>' +
          (periodText ? '<div class="text-xs text-gray-500">周期: ' + periodText + autoRenewIcon + '</div>' : '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' + 
          '<div class="text-sm text-gray-900">' + new Date(subscription.expiryDate).toLocaleDateString() + '</div>' +
          '<div class="text-xs text-gray-500">' + (daysDiff < 0 ? '已过期' + Math.abs(daysDiff) + '天' : '还剩' + daysDiff + '天') + '</div>' +
          (subscription.startDate ? '<div class="text-xs text-gray-500">开始: ' + new Date(subscription.startDate).toLocaleDateString() + '</div>' : '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + 
          '<div><i class="fas fa-bell mr-1"></i>提前' + (subscription.reminderDays || 0) + '天</div>' +
          (subscription.reminderDays === 0 ? '<div class="text-xs text-gray-500">仅到期日提醒</div>' : '') +
        '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap">' + statusHtml + '</td>' +
        '<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">' +
          '<div class="flex flex-wrap gap-1">' +
            '<button class="edit btn-primary text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-edit mr-1"></i>编辑</button>' +
            '<button class="test-notify btn-info text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-paper-plane mr-1"></i>测试</button>' +
            '<button class="delete btn-danger text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '"><i class="fas fa-trash-alt mr-1"></i>删除</button>' +
            (subscription.isActive ? 
              '<button class="toggle-status btn-warning text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="deactivate"><i class="fas fa-pause-circle mr-1"></i>停用</button>' : 
              '<button class="toggle-status btn-success text-white px-2 py-1 rounded text-xs" data-id="' + subscription.id + '" data-action="activate"><i class="fas fa-play-circle mr-1"></i>启用</button>') +
          '</div>' +
        '</td>';
      tbody.appendChild(row);
    });
    document.querySelectorAll('.edit').forEach(button => {
      button.addEventListener('click', editSubscription);
    });
    document.querySelectorAll('.delete').forEach(button => {
      button.addEventListener('click', deleteSubscription);
    });
    document.querySelectorAll('.toggle-status').forEach(button => {
      button.addEventListener('click', toggleSubscriptionStatus);
    });
    document.querySelectorAll('.test-notify').forEach(button => {
      button.addEventListener('click', testSubscriptionNotification);
    });
  } catch (error) {
    console.error('加载订阅失败:', error);
    const tbody = document.getElementById('subscriptionsBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-500"><i class="fas fa-exclamation-circle mr-2"></i>加载失败，请刷新页面重试</td></tr>';
    showToast('加载订阅列表失败', 'error');
  }
}

async function testSubscriptionNotification(e) {
  const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
  const id = button.dataset.id;
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>';
  button.disabled = true;
  try {
    const response = await fetch('/api/subscriptions/' + id + '/test-notify', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      showToast(result.message || '测试通知已发送', 'success');
    } else {
      showToast(result.message || '测试通知发送失败', 'error');
    }
  } catch (error) {
    console.error('测试通知失败:', error);
    showToast('发送测试通知时发生错误', 'error');
  } finally {
    button.innerHTML = originalContent;
    button.disabled = false;
  }
}

async function toggleSubscriptionStatus(e) {
  const id = e.target.dataset.id || e.target.parentElement.dataset.id;
  const action = e.target.dataset.action || e.target.parentElement.dataset.action;
  const isActivate = action === 'activate';
  const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (isActivate ? '启用中...' : '停用中...');
  button.disabled = true;
  try {
    const response = await fetch('/api/subscriptions/' + id + '/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: isActivate })
    });
    if (response.ok) {
      showToast((isActivate ? '启用' : '停用') + '成功', 'success');
      loadSubscriptions();
    } else {
      const error = await response.json();
      showToast((isActivate ? '启用' : '停用') + '失败: ' + (error.message || '未知错误'), 'error');
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  } catch (error) {
    console.error((isActivate ? '启用' : '停用') + '订阅失败:', error);
    showToast((isActivate ? '启用' : '停用') + '失败，请稍后再试', 'error');
    button.innerHTML = originalContent;
    button.disabled = false;
  }
}

document.getElementById('addSubscriptionBtn').addEventListener('click', () => {
  document.getElementById('modalTitle').textContent = '添加新订阅';
  document.getElementById('subscriptionModal').classList.remove('hidden');
  document.getElementById('subscriptionForm').reset();
  document.getElementById('subscriptionId').value = '';
  clearFieldErrors();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('reminderDays').value = '7';
  document.getElementById('isActive').checked = true;
  document.getElementById('autoRenew').checked = true;
  calculateExpiryDate();
  setupModalEventListeners();
});

function setupModalEventListeners() {
  document.getElementById('calculateExpiryBtn').removeEventListener('click', calculateExpiryDate);
  document.getElementById('calculateExpiryBtn').addEventListener('click', calculateExpiryDate);
  ['startDate', 'periodValue', 'periodUnit'].forEach(id => {
    const element = document.getElementById(id);
    element.removeEventListener('change', calculateExpiryDate);
    element.addEventListener('change', calculateExpiryDate);
  });
  document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('subscriptionModal').classList.add('hidden');
  });
}

function calculateExpiryDate() {
  const startDate = document.getElementById('startDate').value;
  const periodValue = parseInt(document.getElementById('periodValue').value);
  const periodUnit = document.getElementById('periodUnit').value;
  if (!startDate || !periodValue || !periodUnit) {
    return;
  }
  const start = new Date(startDate);
  const expiry = new Date(start);
  if (periodUnit === 'day') {
    expiry.setDate(start.getDate() + periodValue);
  } else if (periodUnit === 'month') {
    expiry.setMonth(start.getMonth() + periodValue);
  } else if (periodUnit === 'year') {
    expiry.setFullYear(start.getFullYear() + periodValue);
  }
  document.getElementById('expiryDate').value = expiry.toISOString().split('T')[0];
}
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('subscriptionModal').classList.add('hidden');
});
document.getElementById('subscriptionModal').addEventListener('click', (event) => {
  if (event.target === document.getElementById('subscriptionModal')) {
    document.getElementById('subscriptionModal').classList.add('hidden');
  }
});
document.getElementById('subscriptionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) {
    return;
  }
  const id = document.getElementById('subscriptionId').value;
  const subscription = {
    name: document.getElementById('name').value.trim(),
    customType: document.getElementById('customType').value.trim(),
    notes: document.getElementById('notes').value.trim() || '',
    isActive: document.getElementById('isActive').checked,
    autoRenew: document.getElementById('autoRenew').checked,
    startDate: document.getElementById('startDate').value,
    expiryDate: document.getElementById('expiryDate').value,
    periodValue: parseInt(document.getElementById('periodValue').value),
    periodUnit: document.getElementById('periodUnit').value,
    reminderDays: parseInt(document.getElementById('reminderDays').value) || 0
  };
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalContent = submitButton.innerHTML;
  submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>' + (id ? '更新中...' : '保存中...');
  submitButton.disabled = true;
  try {
    const url = id ? '/api/subscriptions/' + id : '/api/subscriptions';
    const method = id ? 'PUT' : 'POST';
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    const result = await response.json();
    if (result.success) {
      showToast((id ? '更新' : '添加') + '订阅成功', 'success');
      document.getElementById('subscriptionModal').classList.add('hidden');
      loadSubscriptions();
    } else {
      showToast((id ? '更新' : '添加') + '订阅失败: ' + (result.message || '未知错误'), 'error');
    }
  } catch (error) {
    console.error((id ? '更新' : '添加') + '订阅失败:', error);
    showToast((id ? '更新' : '添加') + '订阅失败，请稍后再试', 'error');
  } finally {
    submitButton.innerHTML = originalContent;
    submitButton.disabled = false;
  }
});
async function editSubscription(e) {
  const id = e.target.dataset.id || e.target.parentElement.dataset.id;
  try {
    const response = await fetch('/api/subscriptions/' + id);
    const subscription = await response.json();
    if (subscription) {
      document.getElementById('modalTitle').textContent = '编辑订阅';
      document.getElementById('subscriptionId').value = subscription.id;
      document.getElementById('name').value = subscription.name;
      document.getElementById('customType').value = subscription.customType || '';
      document.getElementById('notes').value = subscription.notes || '';
      document.getElementById('isActive').checked = subscription.isActive !== false;
      document.getElementById('autoRenew').checked = subscription.autoRenew !== false;
      document.getElementById('startDate').value = subscription.startDate ? subscription.startDate.split('T')[0] : '';
      document.getElementById('expiryDate').value = subscription.expiryDate ? subscription.expiryDate.split('T')[0] : '';
      document.getElementById('periodValue').value = subscription.periodValue || 1;
      document.getElementById('periodUnit').value = subscription.periodUnit || 'month';
      document.getElementById('reminderDays').value = subscription.reminderDays !== undefined ? subscription.reminderDays : 7;
      clearFieldErrors();
      document.getElementById('subscriptionModal').classList.remove('hidden');
      setupModalEventListeners();
    }
  } catch (error) {
    console.error('获取订阅信息失败:', error);
    showToast('获取订阅信息失败', 'error');
  }
}
async function deleteSubscription(e) {
  const id = e.target.dataset.id || e.target.parentElement.dataset.id;
  if (!confirm('确定要删除这个订阅吗？此操作不可恢复。')) {
    return;
  }
  const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
  const originalContent = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>删除中...';
  button.disabled = true;
  try {
    const response = await fetch('/api/subscriptions/' + id, {
      method: 'DELETE'
    });
    if (response.ok) {
      showToast('删除成功', 'success');
      loadSubscriptions();
    } else {
      const error = await response.json();
      showToast('删除失败: ' + (error.message || '未知错误'), 'error');
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  } catch (error) {
    console.error('删除订阅失败:', error);
    showToast('删除失败，请稍后再试', 'error');
    button.innerHTML = originalContent;
    button.disabled = false;
  }
}
window.addEventListener('load', loadSubscriptions); 