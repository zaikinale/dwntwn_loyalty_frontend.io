<template>
  <div class="nav-container">
    <div class="select-wrapper">
      <select 
        id="admin-nav" 
        v-model="activeTab" 
        @change="switchTab($event.target.value)" 
        class="admin-select"
      >
        <option value="staff-mode">Рабочее место</option>
        <option value="staff">Персонал</option>
        <option value="notifications">Новости</option>
        <option value="gifts">Подарки</option>
        <option value="history">История</option>
        <option value="audit">Аудит</option>
        <option value="broadcast">Рассылка</option>
      </select>
    </div>
  </div>

  <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <!-- Рабочее место -->
  <div v-if="activeTab === 'staff-mode'" class="tab active">  
    <div class="card">
      <h3>Рабочее место</h3>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="(DTLC-XXXXXX)/(+7...)"
        />
        <button class="search-btn" @click="searchClient" :disabled="loading">Найти</button>
      </div>

      <button @click="scanQR" class="btn-scan">
        {{ isScanning ? 'Остановить сканирование' : 'Сканировать QR' }}
      </button>

      <div id="qr-reader" style="display: none;"></div>

      <div v-if="client" class="client-result">
        <h4>{{ client.name }}</h4>
        <p>Баллы: {{ client.points }} ({{ client.level }})</p>
        <!-- Начисление -->
        <div class="form-group">
          <input 
            v-model.number="purchaseAmount" 
            type="number" 
            placeholder="Сумма покупки" 
            min="1" 
            max="2500"
          />
          <button @click="addPoints" :disabled="loading || !purchaseAmount">
            {{ loading ? 'Обработка...' : 'Начислить' }}
          </button>
        </div>
        <!-- Подарок -->
        <div class="form-group">
          <select v-model="selectedGift">
            <option value="">Выберите подарок</option>
            <option v-for="g in giftsForRedeem" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.points_cost }} баллов)
            </option>
          </select>
          <button @click="redeemGift" :disabled="loading || !selectedGift">
            {{ loading ? 'Обработка...' : 'Выдать подарок' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Персонал -->
  <div v-if="activeTab === 'staff'" class="tab active">
    <div class="card">
      <div class="card-head">
        <h3>Добавить сотрудника</h3>
        <button class="expandable-btn" @click="isFormExpanded = !isFormExpanded">
          {{ isFormExpanded ? '←' : '→' }}
        </button>
      </div>
      <div v-if="isFormExpanded" class="form-expandable">
        <div class="form-group">
          <input v-model.number="newStaff.telegram_id" type="number" placeholder="Telegram ID" />
        </div>
        <div class="form-group">
          <input v-model="newStaff.name" placeholder="ФИО" />
        </div>
        <div class="form-group">
          <select v-model="newStaff.role">
            <option value="staff">Сотрудник</option>
            <option value="admin">Админ</option>
          </select>
        </div>
        <button @click="addStaff" class="btn" :disabled="!newStaff.telegram_id || !newStaff.name.trim()">
          Добавить
        </button>
      </div>
    </div>
    <div class="card">
      <h3>Сотрудники</h3>
      <div v-if="staffList.length === 0" class="empty">Нет сотрудников</div>
      <div v-for="s in staffList" :key="s.id" class="staff-item">
        <div><strong>{{ s.name }}</strong> ({{ s.role }})</div>
        <button v-if="s.role !== 'admin'" @click="removeStaff(s.id)" class="btn-delete">Удалить</button>
        <span v-else class="admin-tag">Админ</span>
      </div>
    </div>
    <div class="card">
      <h3>Клиенты (для выбора)</h3>
      <div v-if="clientList.length === 0" class="empty">Нет клиентов</div>
      <div v-for="c in clientList" :key="c.telegram_id" class="client-item">
        <div>
          <strong>{{ c.first_name }} {{ c.last_name }}</strong> ({{ c.level }})
          <br /><small>Telegram ID: {{ c.telegram_id }}</small>
        </div>
        <button @click="selectClient(c)" class="btn-select">Выбрать</button>
      </div>
    </div>
  </div>

  <!-- Уведомления -->
<div v-if="activeTab === 'notifications'" class="tab active">
  <!-- Форма добавления -->
  <div class="card">
    <div class="card-head">
      <h3>Добавить новость</h3>
      <button class="expandable-btn" @click="isFormExpanded = !isFormExpanded">
        {{ isFormExpanded ? '←' : '→' }}
      </button>
    </div>
    <div v-if="isFormExpanded" class="form-expandable">
    <div class="form-group">
      <select v-model="newNotification.type">
        <option value="promotion">Акция</option>
        <option value="novelty">Новинка</option>
        <option value="announcement">Объявление</option>
      </select>
    </div>
    <div class="form-group">
      <input v-model="newNotification.title" placeholder="Заголовок" />
    </div>
    <div class="form-group">
      <textarea v-model="newNotification.description" placeholder="Описание" rows="3"></textarea>
    </div>
    <div class="form-group">
      <input v-model="newNotification.image_url" placeholder="Ссылка на фото (необязательно)" />
    </div>
    <div class="form-group">
      <input v-model.number="newNotification.days" type="number" placeholder="Дней действия" min="1" />
    </div>
    <button @click="addNotification" class="btn" :disabled="loading">
      {{ loading ? 'Создание...' : 'Добавить' }}
    </button>
    </div>
  </div>

  <!-- Текущие уведомления -->
  <div class="card">
    <h3>Текущая стена новостей</h3>

    <!-- Объявление -->
    <div class="notification-section">
      <h4>📢 Объявление</h4>
      <div v-if="currentNotifications.announcement" class="notification-item">
        <div class="notification-content">
          <h5>{{ currentNotifications.announcement.title }}</h5>
          <p>{{ currentNotifications.announcement.description }}</p>
          <small>До: {{ formatDateTime(currentNotifications.announcement.expires_at) }}</small>
        </div>
        <button @click="deleteNotification(currentNotifications.announcement.id)" class="btn-delete-notific">Удалить</button>
      </div>
      <div v-else class="empty">Нет активного объявления</div>
    </div>

    <!-- Новинки -->
    <div class="notification-section">
      <h4>🆕 Новинки</h4>
      <div v-for="n in currentNotifications.novelty" :key="n.id" class="notification-item">
        <div class="notification-content">
          <h5>{{ n.title }}</h5>
          <p>{{ n.description }}</p>
          <small>До: {{ formatDateTime(n.expires_at) }}</small>
        </div>
        <button @click="deleteNotification(n.id)" class="btn-delete-notific">Удалить</button>
      </div>
      <div v-if="currentNotifications.novelty.length === 0" class="empty">Нет новинок</div>
    </div>

    <!-- Акции -->
    <div class="notification-section">
      <h4>🎁 Акции</h4>
      <div v-for="n in currentNotifications.promotion" :key="n.id" class="notification-item">
        <div class="notification-content">
          <h5>{{ n.title }}</h5>
          <p>{{ n.description }}</p>
          <small>До: {{ formatDateTime(n.expires_at) }}</small>
        </div>
        <button @click="deleteNotification(n.id)" class="btn-delete-notific">Удалить</button>
      </div>
      <div v-if="currentNotifications.promotion.length === 0" class="empty">Нет акций</div>
    </div>
  </div>
</div>

  <!-- Подарки -->
  <div v-if="activeTab === 'gifts'" class="tab active">
    <div class="card">
      <div class="card-head">
        <h3>Добавить подарок</h3>
        <button class="expandable-btn" @click="isFormExpanded = !isFormExpanded">
          {{ isFormExpanded ? '←' : '→' }}
        </button>
      </div>
      <div v-if="isFormExpanded" class="form-expandable">
      <div class="form-group">
        <input v-model="newGift.name" placeholder="Название" />
      </div>
      <div class="form-group">
        <input v-model.number="newGift.points" type="number" placeholder="Стоимость в баллах" min="1" />
      </div>
      <div class="form-group">
        <input v-model="newGift.image_url" placeholder="Ссылка на фото (необязательно)" />
      </div>
      <button @click="addGift" class="btn" :disabled="loading || !newGift.name.trim() || !newGift.points">
        {{ loading ? 'Создание...' : 'Добавить' }}
      </button>
      </div>
    </div>
    <div class="card">
      <h3>Текущие подарки</h3>
      <div v-if="gifts.length > 0">
        <div v-for="gift in gifts" :key="gift.id" class="gift-item">
          <div class="gift-content">
            <div class="gift-control">
              <img v-if="gift.image_url" :src="gift.image_url" class="gift-image" />
              <button @click="deleteGift(gift.id)" class="btn-delete">Удалить</button>
            </div>
            <div class="gift-desc">
              <span>{{ gift.name }}</span>
              <span>{{ gift.points_cost }} баллов</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else>Нет подарков</div>
    </div>
  </div>

  <!-- История -->
  <div v-if="activeTab === 'history'" class="tab active">
  <div class="card">
    <h3>История операций</h3>
    <div v-for="t in transactions" :key="t.id" class="transaction-card">
      <div class="tx-main">
        <div :class="['tx-amount', t.points_change > 0 ? 'pos' : 'neg']">
          {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
        </div>
        <div class="tx-details">
          <div class="tx-user">{{ t.client_name }}</div>
          <div class="tx-desc">{{ t.description }}</div>
        </div>
        
        <button
          v-if="t.description && !t.description.includes('[ОТМЕНЕНА]')"
          @click="canselTx(t.id)" 
          class="btn-cancel-small"
        >
          Отменить
        </button>
      </div>
      <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
    </div>
  </div>
  </div>

  <!-- Аудит -->
  <div v-if="activeTab === 'audit'" class="tab active">
  
  <div class="audit-filters">
    <button :class="{ active: auditFilter === 'all' }" @click="auditFilter = 'all'">Все</button>
    <button :class="{ active: auditFilter === 'creation' }" @click="auditFilter = 'creation'">Создание</button>
    <button :class="{ active: auditFilter === 'deletion' }" @click="auditFilter = 'deletion'">Удаление</button>
    <button :class="{ active: auditFilter === 'broadcast' }" @click="auditFilter = 'broadcast'">Рассылки</button>
  </div>

  <div v-for="log in filteredAuditLogs" :key="log.id" class="audit-item-new" 
       :style="{ borderLeftColor: getAuditStyle(log).color }">
    
    <div class="audit-badge" 
         :style="{ backgroundColor: getAuditStyle(log).color + '22', color: getAuditStyle(log).color }">
      {{ getAuditStyle(log).icon }}
    </div>

    <div class="audit-info">
      <div class="audit-header">
        <span class="audit-type" :style="{ color: getAuditStyle(log).color }">
          {{ getAuditStyle(log).label }}
        </span>
        <span class="audit-date">{{ formatDate(log.created_at) }}</span>
      </div>
      
      <div class="audit-desc">
        {{ log.description.replace(/\[.*?\]\s?/, '') }}
      </div>
      
      <div class="audit-footer">
        <span class="staff-tag">👤 {{ log.staff_name || 'Система' }}</span>
      </div>
    </div>
  </div>
  
  <div v-if="filteredAuditLogs.length === 0" class="empty">Записей не найдено</div>
</div>

  <!-- Пуш-рассылка -->
  <div v-if="activeTab === 'broadcast'" class="tab active">
  <div class="card">
    <h3>Рассылка:</h3>
    <div class="form-group">
      <input v-model="broadcast.title" placeholder="Заголовок рассылки" />
    </div>
    <div class="form-group">
      <textarea v-model="broadcast.message" placeholder="Текст сообщения" rows="4"></textarea>
    </div>
    <div class="form-group">
      <input v-model="broadcast.image_url" placeholder="Ссылка на изображение (необязательно)" />
    </div>
    <div class="form-group">
      <input v-model="broadcast.link" placeholder="Ссылка (необязательно)" />
    </div>
    <button @click="sendBroadcast" :disabled="loading || !broadcast.title.trim() || !broadcast.message.trim()" class="btn">
      {{ loading ? 'Отправка...' : 'Отправить' }}
    </button>
    <div v-if="broadcastResult" class="broadcast-result">
      <p>✅ Отправлено: {{ broadcastResult.sent_to }} из {{ broadcastResult.total }}</p>
      <p v-if="broadcastResult.failed">❌ Не доставлено: {{ broadcastResult.failed }}</p>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, computed } from 'vue'

const isScanning = ref(false)
const qrScanner = ref(null) 
const isFormExpanded = ref(false)

const getAuditStyle = (log) => {
  if (log.type === 'notification_created' || log.type === 'gift_created') {
    return { icon: '✨', color: '#52c41a', label: 'Создание' };
  }
  if (log.type === 'notification_deleted' || log.type === 'gift_deleted') {
    return { icon: '🗑', color: '#ff4d4f', label: 'Удаление' };
  }
  if (log.type === 'broadcast_sent') {
    return { icon: '📢', color: '#1890ff', label: 'Рассылка' };
  }

  const desc = log.description ? log.description.toLowerCase() : '';
  if (desc.includes('удален') || desc.includes('удалено')) {
    return { icon: '🗑', color: '#ff4d4f', label: 'Удаление' };
  }
  if (desc.includes('создан') || desc.includes('добавлен')) {
    return { icon: '✨', color: '#52c41a', label: 'Создание' };
  }
  
  return { icon: '📝', color: '#8c8c8c', label: 'Действие' };
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const filteredAuditLogs = computed(() => {
  if (auditFilter.value === 'all') return auditLogs.value;
  return auditLogs.value.filter(log => {
    const style = getAuditStyle(log);
    if (auditFilter.value === 'creation') return style.label === 'Создание';
    if (auditFilter.value === 'deletion') return style.label === 'Удаление';
    if (auditFilter.value === 'broadcast') return log.type === 'broadcast_sent';
    return true;
  });
});

const props = defineProps({
  staffId: { type: Number, required: true }
})

const activeTab = ref('staff-mode')
const loading = ref(false)
const errorMessage = ref('')

const newNotification = ref({ type: 'promotion', title: '', description: '', image_url: '', days: 7 })
const newGift = ref({ name: '', points: 0, image_url: '' })
const searchQuery = ref('')
const purchaseAmount = ref(0)
const selectedGift = ref('')
const staffList = ref([])
const clientList = ref([])
const newStaff = ref({ telegram_id: null, name: '', role: 'staff' })
const transactions = ref([])
const gifts = ref([])
const auditLogs = ref([])
const client = ref(null)
const giftsForRedeem = ref([])
const auditFilter = ref('all');

const currentNotifications = ref({ announcement: null, novelty: [], promotion: [] })

const broadcast = ref({ 
  title: '', 
  message: '', 
  link: '',
  image_url: ''
})
const broadcastResult = ref(null)

const getInitData = () => {
  return window.Telegram?.WebApp?.initData || ''
}

const formatDateTime = (isoStr) => {
  return new Date(isoStr).toLocaleString('ru-RU')
}

const clearError = () => {
  errorMessage.value = ''
}

const switchTab = (tab) => {
  activeTab.value = tab
  clearError()
  if (tab === 'audit') loadAuditLogs()
  if (tab === 'staff') loadStaffAndClients()
  if (tab === 'broadcast') {
    broadcast.value = { title: '', message: '', link: '' }
    broadcastResult.value = null
  }
  if (tab === 'notifications') {
    loadCurrentNotifications()
  }
}

onMounted(async () => {
  clearError()
  try {
    const [resTx, resGifts] = await Promise.all([
      fetch(`${window.API_BASE}/api/admin/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      }),
      fetch(`${window.API_BASE}/api/admin/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
    ])
    transactions.value = await resTx.json()
    gifts.value = await resGifts.json()
    await loadGiftsForRedeem()
  } catch (e) {
    errorMessage.value = "Ошибка загрузки данных"
  }
})

const loadCurrentNotifications = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/all-notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    currentNotifications.value = {
      announcement: data.find(n => n.type === 'announcement') || null,
      novelty: data.filter(n => n.type === 'novelty'),
      promotion: data.filter(n => n.type === 'promotion')
    }
  } catch (e) {
    errorMessage.value = "Ошибка загрузки уведомлений: " + (e.message || e)
    console.error("Ошибка загрузки уведомлений:", e)
  }
}

const canselTx = async (txId) => {
  window.Telegram.WebApp.showConfirm('Вы уверены, что хотите отменить эту операцию? Баллы клиента будут изменены.', async (confirmed) => {
    if (!confirmed) return;
    try {
      const response = await fetch(`${window.API_BASE}/api/admin/cancel-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, initData: getInitData() })
      });
      
      if (response.ok) {
        window.Telegram.WebApp.showAlert('✅ Операция успешно отменена');
        const resTx = await fetch(`${window.API_BASE}/api/admin/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData() })
        });
        if (resTx.ok) transactions.value = await resTx.json();
      } else {
        const err = await response.json();
        window.Telegram.WebApp.showAlert('❌ Ошибка: ' + (err.detail || 'Не удалось отменить'));
      }
    } catch (e) {
      window.Telegram.WebApp.showAlert('❌ Ошибка соединения с сервером');
    }
  });
};

const deleteNotification = async (id) => {
  window.Telegram.WebApp.showConfirm("Удалить Новость? Это действие нельзя отменить.", async (confirmed) => {
    if (!confirmed) return;
    try {
      const res = await fetch(`${window.API_BASE}/api/admin/delete-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), notification_id: id })
      });
      if (res.ok) {
        await loadCurrentNotifications();
        loadAuditLogs();
        window.Telegram.WebApp.showAlert("✅ Новость удалена");
      }
    } catch (e) {
      window.Telegram.WebApp.showAlert("❌ Ошибка подключения");
    }
  });
};
const loadGiftsForRedeem = async () => {
  const res = await fetch(`${window.API_BASE}/api/client/gifts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: getInitData() })
  })
  giftsForRedeem.value = await res.json()
}

const loadStaffAndClients = async () => {
  try {
    const [staffRes, clientRes] = await Promise.all([
      fetch(`${window.API_BASE}/api/admin/staff-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      }),
      fetch(`${window.API_BASE}/api/admin/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
    ])
    staffList.value = await staffRes.json()
    clientList.value = await clientRes.json()
  } catch (e) {
    errorMessage.value = "Ошибка загрузки персонала"
  }
}

const searchClient = async () => {
  clearError();
  const q = searchQuery.value.trim();
  if (!q) return;
  try {
    const isPhone = q.match(/^\d+$/);
    const payload = { initData: getInitData(), [isPhone ? 'phone' : 'card_number']: q };
    const url = isPhone 
      ? `${window.API_BASE}/api/staff/client-by-phone`
      : `${window.API_BASE}/api/staff/client-by-card`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    client.value = res.ok ? await res.json() : null;
    if (!client.value) {
      errorMessage.value = "Клиент не найден";
    }
  } catch (e) {
    errorMessage.value = "Ошибка поиска клиента";
  }
};

const scanQR = async () => {
  clearError();
  if (window.Telegram?.WebApp?.showScanQrPopup) {
    window.Telegram.WebApp.showScanQrPopup({
      text: "Отсканируйте QR-код клиента"
    }, (data) => {
      if (data) {
        searchQuery.value = data.trim();
        window.Telegram.WebApp.closeScanQrPopup();
        searchClient();
        return true; 
      }
    });
    return;
  }

  if (isScanning.value) {
    stopHtml5QrScanner();
    return;
  }

  isScanning.value = true;
  try {
    const { Html5QrcodeScanner } = await import('html5-qrcode');
    const container = document.getElementById('qr-reader');
    if (container) container.style.display = 'block';

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true
    };

    qrScanner.value = new Html5QrcodeScanner('qr-reader', config, false);
    qrScanner.value.render((decodedText) => {
      stopHtml5QrScanner();
      searchQuery.value = decodedText.trim();
      searchClient();
    }, (error) => {
      if (!error?.includes('NotFoundException')) console.warn(error);
    });

  } catch (err) {
    errorMessage.value = 'Ошибка запуска запасного сканера';
    isScanning.value = false;
  }
};

const stopHtml5QrScanner = () => {
  if (qrScanner.value) {
    qrScanner.value.clear()
    qrScanner.value = null
  }
  const container = document.getElementById('qr-reader')
  if (container) {
    container.style.display = 'none'
  }
  isScanning.value = false
}

onBeforeUnmount(() => {
  stopHtml5QrScanner()
})

const addPoints = async () => {
  if (!client.value || !purchaseAmount.value || purchaseAmount.value <= 0) {
    errorMessage.value = "Укажите сумму покупки";
    return;
  }
  if (purchaseAmount.value > 2500) {
    errorMessage.value = "Максимум 2500 руб. за одну операцию";
    return;
  }

  loading.value = true;
  try {
    const res = await fetch(`${window.API_BASE}/api/staff/add-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        client_id: client.value.id,
        purchase_amount: purchaseAmount.value
      })
    });

    if (res.ok) {
      await searchClient();
      purchaseAmount.value = 0;
      window.Telegram.WebApp.showAlert("✅ Баллы успешно начислены!");
    } else {
      const err = await res.json();
      window.Telegram.WebApp.showAlert("❌ " + (err.detail || "Ошибка начисления"));
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
      }
    }
  } catch (e) {
    window.Telegram.WebApp.showAlert("❌ Ошибка подключения");
  } finally {
    loading.value = false;
  }
};

const redeemGift = async () => {
  clearError();
  if (!client.value || !selectedGift.value) {
    errorMessage.value = "Выберите подарок";
    return;
  }
  const gift = giftsForRedeem.value.find(g => g.id == selectedGift.value);
  
  window.Telegram.WebApp.showConfirm(`Выдать "${gift?.name}" клиенту ${client.value.name}?`, async (confirmed) => {
    if (!confirmed) return;
    loading.value = true;
    try {
      const res = await fetch(`${window.API_BASE}/api/staff/redeem-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: getInitData(),
          client_id: client.value.id,
          gift_id: selectedGift.value
        })
      });
      if (res.ok) {
        window.Telegram.WebApp.showAlert(`✅ Подарок "${gift?.name}" выдан!`);
        await searchClient();
        selectedGift.value = '';
      } else {
        const err = await res.json();
        window.Telegram.WebApp.showAlert("❌ " + (err.detail || "Не удалось выдать подарок"));
      }
    } catch (e) {
      window.Telegram.WebApp.showAlert("❌ Ошибка соединения");
    } finally {
      loading.value = false;
    }
  });
};

const selectClient = (client) => {
  newStaff.value.telegram_id = client.telegram_id
  newStaff.value.name = `${client.first_name} ${client.last_name}`
  isFormExpanded.value = !isFormExpanded.value 
}

const addStaff = async () => {
  clearError()
  if (!newStaff.value.telegram_id || !newStaff.value.name.trim()) {
    errorMessage.value = "Заполните все поля"
    return
  }
  loading.value = true
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/add-staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        telegram_id: newStaff.value.telegram_id,
        name: newStaff.value.name,
        role: newStaff.value.role
      })
    })
    if (res.ok) {
      newStaff.value = { telegram_id: null, name: '', role: 'staff' }
      await loadStaffAndClients()
      isFormExpanded.value = false
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось добавить сотрудника"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

const removeStaff = async (id) => {
  window.Telegram.WebApp.showConfirm("Удалить сотрудника? Это действие нельзя отменить.", async (confirmed) => {
    if (!confirmed) return;
    loading.value = true;
    try {
      const res = await fetch(`${window.API_BASE}/api/admin/delete-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), staff_id: id })
      });
      if (res.ok) {
        await loadStaffAndClients();
        window.Telegram.WebApp.showAlert("✅ Сотрудник удален");
      }
    } catch (e) {
      window.Telegram.WebApp.showAlert("❌ Ошибка подключения");
    } finally {
      loading.value = false;
    }
  });
};

const addNotification = async () => {
  clearError()
  const { type, title, description, image_url, days } = newNotification.value
  if (!title.trim() || !description.trim()) {
    errorMessage.value = "Заполните заголовок и описание"
    return
  }
  loading.value = true
  try {
    const payload = { initData: getInitData(), type, title, description, days_valid: days }
    if (image_url) payload.image_url = image_url
    const res = await fetch(`${window.API_BASE}/api/admin/create-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      newNotification.value = { type: 'promotion', title: '', description: '', image_url: '', days: 7 }
      loadAuditLogs()
      isFormExpanded.value = false
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось создать новость"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

const addGift = async () => {
  clearError()
  const { name, points, image_url } = newGift.value
  if (!name.trim() || !points || points <= 0) {
    errorMessage.value = "Укажите название и стоимость"
    return
  }
  loading.value = true
  try {
    const payload = { initData: getInitData(), name, points_cost: points }
    if (image_url) payload.image_url = image_url
    const res = await fetch(`${window.API_BASE}/api/admin/create-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      newGift.value = { name: '', points: 0, image_url: '' }
      const resGifts = await fetch(`${window.API_BASE}/api/admin/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      gifts.value = await resGifts.json()
      loadAuditLogs()
      isFormExpanded.value = false
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось добавить подарок"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

const deleteGift = async (id) => {
  window.Telegram.WebApp.showConfirm("Удалить подарок? Это действие нельзя отменить.", async (confirmed) => {
    if (!confirmed) return;
    loading.value = true;
    try {
      const res = await fetch(`${window.API_BASE}/api/admin/delete-gift`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData(), gift_id: id })
      });
      if (res.ok) {
        const resGifts = await fetch(`${window.API_BASE}/api/admin/gifts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: getInitData() })
        });
        gifts.value = await resGifts.json();
        loadAuditLogs();
        window.Telegram.WebApp.showAlert("✅ Подарок удален из каталога");
      }
    } catch (e) {
      window.Telegram.WebApp.showAlert("❌ Ошибка соединения");
    } finally {
      loading.value = false;
    }
  });
};
const loadAuditLogs = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (res.ok) {
      auditLogs.value = await res.json()
    }
  } catch (e) {
    console.error("Ошибка загрузки аудита:", e)
  }
}

const sendBroadcast = async () => {
  clearError();
  if (!broadcast.value.title.trim() || !broadcast.value.message.trim()) return;
  
  loading.value = true;
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), ...broadcast.value })
    });

    if (res.ok) {
      const result = await res.json();
      window.Telegram.WebApp.showAlert(`📢 Рассылка запущена!\nПолучателей: ${result.total_targets}\nРезультат появится в аудите после завершения.`);
      broadcast.value = { title: '', message: '', link: '', image_url: '' };
    } else {
      const err = await res.json();
      window.Telegram.WebApp.showAlert("❌ " + (err.detail || "Ошибка рассылки"));
    }
  } catch (e) {
    window.Telegram.WebApp.showAlert("❌ Ошибка соединения");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .form-expandable {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .nav-container {
  padding: 16px;
  background: #111;
  margin-bottom: 8px;
}

.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-left: 4px;
}

.admin-select {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background: #222;
  color: white;
  /* border: 1px solid #333; */
  border-radius: 10px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  cursor: pointer;
}

.admin-select:focus {
  outline: none;
  border-color: #0d6efd;
}
.header h1 {
  color: white;
  text-align: center;
  margin: 16px 0;
}
.nav {
  display: flex;
  gap: 6px;
  margin: 16px 0;
  flex-wrap: wrap;
  justify-content: center;
}
.nav button {
  background: #222;
  color: #ddd;
  border: none !important;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 100px;
}
.nav button.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}
.error-message {
  background: #5a1818;
  color: #ffcccc;
  padding: 10px 16px;
  border-radius: 6px;
  margin: 12px 0;
  font-weight: 500;
  border: none !important;
}

.card {
  width: 100%;
  background: #111;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  color: white;
}

.card h3, .card-head h3 {
  margin-top: 0;
  color: white;
}

.search-box {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-btn, .search-box input, .expandable-btn {
  padding: 10px;
  border-radius: 6px;
  background: #222;
  font-size: 14px;
  color: white;
  border: none !important;
}

.search-box input  {
  flex: 1;
  /* min-width: 160px; */
}
.search-btn {
  width: 100%;
  margin-bottom: 16px;
}

.btn-scan {
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  cursor: pointer;
  display: block;
  width: 100%;
  font-size: 16px;
  background: #222;
  font-weight: 600;
}

.client-result {
  background: #222;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  color: white;
}
.form-group {
  display: flex;
  gap: 10px;
  margin: 12px 0;
  flex-wrap: wrap;
  align-items: center;
}
.form-group input,
.form-group select,
.form-group > textarea {
  padding: 10px;
  border: none !important;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
  background: #222;
  color: white;
}
.form-group > textarea {
  width: 100%;
  min-height: 80px;
  resize: none;
}
.form-group button {
  padding: 10px 20px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.form-group button:disabled {
  background: #444;
  cursor: not-allowed;
}
.staff-item,
.client-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  color: white;
}
.btn-select {
  background: #0d6efd;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.admin-tag {
  color: #ffd700;
  font-size: 12px;
  padding: 4px 8px;
  border: none !important;
  border-radius: 4px;
}
.gift-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
  color: white;
  padding: 5px !important;
}
.gift-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  gap: 8px;
}

.gift-control {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 5px;
}

.gift-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.gift-desc {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.transaction-item,
.audit-item {
  padding: 12px 0;
  border-bottom: 1px solid #333;
  color: white;
}
.transaction-item:last-child,
.audit-item:last-child {
  border-bottom: none;
}
.timestamp {
  font-size: 12px;
  color: #aaa;
  position: absolute;
  right: 10px;
  top: 10px;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 20px 0;
  font-style: italic;
}

.btn-cancel-small {
  background: none;
  border: 1px solid #dc3545;
  color: #dc3545;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  margin-left: 10px;
  transition: 0.2s;
}
.btn-cancel-small:hover {
  background: #dc3545;
  color: white;
}

.audit-description {
  padding-bottom: 10px;
}
.audit-meta {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.notification-section {
  margin-bottom: 16px;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.notification-section h4 {
  margin: 12px 0 8px;
}
.notification-item {
  position: relative;
  padding: 12px;
  margin: 0 !important;
}
.notification-content {
  flex: 1;
  margin-right: 12px;
}
.notification-content h5 {
  margin: 0 0 6px;
  font-size: 16px;
  max-width: 50%;
}
.notification-content p {
  margin: 0 0 8px;
  color: #ccc;
  font-size: 14px;
  max-width: 100%;
  overflow: hidden;
}

.empty {
  text-align: center;
  color: #777;
  padding: 12px 0;
  font-style: italic;
}
.btn-delete-notific {
  position: absolute;
  top: 8px;
  right: 10px;
}

.btn-delete, .btn-delete-notific {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  align-self: center;
}

.audit-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.audit-info { flex: 1; }

.audit-label {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.audit-footer {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.transaction-card {
  position: relative;
  background: #1a1a1a !important;
  padding: 12px;
  border: none;
  border-radius: 8px;
  margin-bottom: 8px;
}

.tx-amount {
  font-size: 18px;
  font-weight: 700;
  width: 60px;
}

.tx-amount.pos { color: #52c41a; }
.tx-amount.neg { color: #ff4d4f; }

.tx-user { font-weight: 600; color: #fff; }
.tx-desc { font-size: 13px; color: #aaa; }

.audit-item-new {
  display: flex;
  gap: 5px;
  padding: 6px;
  background: #1e1e1e; 
  border-radius: 12px;
  margin-bottom: 12px;
  border-left: 4px solid transparent;
  transition: transform 0.2s;
}

.audit-badge {
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.audit-info {
  flex: 1;
}

.audit-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 5px;
}

.audit-type {
  font-weight: bold;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-date {
  flex: 1;
  font-size: 12px;
  color: #2a2a2a;
  text-align: left;
}

.audit-desc {
  color: #ddd;
  font-size: 14px;
  line-height: 1.4;
}

.staff-tag {
  display: inline-block;
  margin-top: 8px;
  font-size: 11px;
  color: #888;
  background: #2a2a2a;
  padding: 2px 8px;
  border-radius: 4px;
}
.audit-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
  
  -webkit-overflow-scrolling: touch;
}

.audit-filters::-webkit-scrollbar {
  display: none;
}

.audit-filters {
  -ms-overflow-style: none; 
  scrollbar-width: none; 
}

.audit-filters button {
  padding: 6px 12px;
  border-radius: 20px;
  border: none !important;
  background: #1a1a1a;
  color: #888;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.audit-filters button.active {
  background: #4dabf7;
  color: #fff;
  border-color: #4dabf7;
}
</style>