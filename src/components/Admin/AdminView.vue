<template>
  <div class="nav" style="position:static; background:none; border:none; margin:0 !important;">
    <button :class="{ active: activeTab === 'staff-mode' }" @click="switchTab('staff-mode')">Рабочее место</button>
    <button :class="{ active: activeTab === 'staff' }" @click="switchTab('staff')">Персонал</button>
    <button :class="{ active: activeTab === 'notifications' }" @click="switchTab('notifications')">Новости</button>
    <button :class="{ active: activeTab === 'gifts' }" @click="switchTab('gifts')">Подарки</button>
    <button :class="{ active: activeTab === 'history' }" @click="switchTab('history')">История</button>
    <button :class="{ active: activeTab === 'audit' }" @click="switchTab('audit')">Аудит</button>
    <button :class="{ active: activeTab === 'broadcast' }" @click="switchTab('broadcast')">Рассылка</button>
  </div>

  <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <!-- Рабочее место -->
  <div v-if="activeTab === 'staff-mode'" class="tab active">  
    <div class="card">
      <h3>Рабочее место сотрудника</h3>
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="Номер карты (DTLC-XXXXXX) / телефон (+7...)" 
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
      <h3>Сотрудники</h3>
      <div v-if="staffList.length === 0" class="empty">Нет сотрудников</div>
      <div v-for="s in staffList" :key="s.id" class="staff-item">
        <div><strong>{{ s.name }}</strong> ({{ s.role }})</div>
        <button v-if="s.role !== 'admin'" @click="removeStaff(s.id)" class="btn-delete">Удалить</button>
        <span v-else class="admin-tag">Админ</span>
      </div>
    </div>
    <div class="card">
      <h3>Добавить сотрудника</h3>
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
    <h3>Добавить новость</h3>
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
      {{ loading ? 'Создание...' : 'Добавить в новости' }}
    </button>
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
          <small>Истекает: {{ formatDateTime(currentNotifications.announcement.expires_at) }}</small>
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
          <small>Истекает: {{ formatDateTime(n.expires_at) }}</small>
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
          <small>Истекает: {{ formatDateTime(n.expires_at) }}</small>
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
      <h3>Текущие подарки</h3>
      <div v-if="gifts.length > 0">
        <div v-for="gift in gifts" :key="gift.id" class="gift-item">
          <div class="gift-content">
            <img v-if="gift.image_url" :src="gift.image_url" class="gift-image" />
            <span>{{ gift.name }} — {{ gift.points_cost }} баллов</span>
          </div>
          <button @click="deleteGift(gift.id)" class="btn-delete">Удалить</button>
        </div>
      </div>
      <div v-else>Нет подарков</div>
    </div>
    <div class="card">
      <h3>Добавить подарок</h3>
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
        {{ loading ? 'Создание...' : 'Добавить подарок' }}
      </button>
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
        </div>
        <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
      </div>
    </div>
  </div>

  <!-- Аудит --><div v-if="activeTab === 'audit'" class="tab active">
  
  <div class="audit-filters">
    <button :class="{ active: auditFilter === 'all' }" @click="auditFilter = 'all'">Все</button>
    <button :class="{ active: auditFilter === 'creation' }" @click="auditFilter = 'creation'">✨ Создание</button>
    <button :class="{ active: auditFilter === 'deletion' }" @click="auditFilter = 'deletion'">🗑 Удаление</button>
    <button :class="{ active: auditFilter === 'broadcast' }" @click="auditFilter = 'broadcast'">📢 Рассылки</button>
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
    <h3>Рассылка пользователям:</h3>
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
      {{ loading ? 'Отправка...' : 'Отправить рассылку' }}
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

const deleteNotification = async (id) => {
  if (!confirm("Удалить уведомление? Это действие нельзя отменить.")) return
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/delete-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData(), notification_id: id })
    })
    if (res.ok) {
      await loadCurrentNotifications()
      loadAuditLogs()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось удалить"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  }
}

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
  clearError()
  const q = searchQuery.value.trim()
  if (!q) return
  try {
    const payload = { initData: getInitData(), [q.match(/^\d+$/) ? 'phone' : 'card_number']: q }
    const url = q.match(/^\d+$/) 
      ? `${window.API_BASE}/api/staff/client-by-phone`
      : `${window.API_BASE}/api/staff/client-by-card`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    client.value = res.ok ? await res.json() : null
    if (!client.value) {
      errorMessage.value = "Клиент не найден"
    }
  } catch (e) {
    errorMessage.value = "Ошибка поиска клиента"
  }
}

const scanQR = async () => {
  clearError()

  if (typeof Telegram !== 'undefined' && Telegram.WebApp?.scanQrCode) {
    try {
      const data = await Telegram.WebApp.scanQrCode()
      if (data) {
        searchQuery.value = String(data).trim()
        await searchClient()
      }
    } catch (err) {
      errorMessage.value = "Не удалось отсканировать QR"
    }
    return
  }

  if (isScanning.value) {
    stopHtml5QrScanner()
    return
  }

  isScanning.value = true
  errorMessage.value = ''

  try {
    const { Html5QrcodeScanner } = await import('html5-qrcode')

    const container = document.getElementById('qr-reader')
    if (!container) {
      throw new Error('Контейнер #qr-reader не найден в DOM')
    }
    container.style.display = 'block'

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      useBarCodeDetectorIfSupported: false,
      formatsToSupport: ['QR_CODE']
    }

    const onScanSuccess = (decodedText) => {
      stopHtml5QrScanner()
      searchQuery.value = decodedText.trim()
      searchClient()
    }

    const onScanFailure = (error) => {
      if (!error?.includes('NotFoundException')) {
        console.warn('QR scan error:', error)
      }
    }

    qrScanner.value = new Html5QrcodeScanner('qr-reader', config, false)
    qrScanner.value.render(onScanSuccess, onScanFailure)

  } catch (err) {
    console.error('Ошибка запуска сканера:', err)
    const msg = err?.message || (typeof err === 'string' ? err : 'неизвестная ошибка')
    errorMessage.value = 'Не удалось запустить сканер: ' + msg
    isScanning.value = false
    const container = document.getElementById('qr-reader')
    if (container) container.style.display = 'none'
  }
}

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
  clearError()
  if (!client.value || !purchaseAmount.value || purchaseAmount.value <= 0) {
    errorMessage.value = "Укажите сумму покупки"
    return
  }
  if (purchaseAmount.value > 2500) {
    errorMessage.value = "Максимум 2500 руб."
    return
  }
  loading.value = true
  try {
    const res = await fetch(`${window.API_BASE}/api/staff/add-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        client_id: client.value.id,
        purchase_amount: purchaseAmount.value
      })
    })
    if (res.ok) {
      await searchClient()
      purchaseAmount.value = 0
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось начислить баллы"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

const redeemGift = async () => {
  clearError()
  if (!client.value || !selectedGift.value) {
    errorMessage.value = "Выберите подарок"
    return
  }
  const gift = giftsForRedeem.value.find(g => g.id == selectedGift.value)
  if (!confirm(`Выдать "${gift?.name}" клиенту ${client.value.name}?`)) return
  loading.value = true
  try {
    const res = await fetch(`${window.API_BASE}/api/staff/redeem-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        client_id: client.value.id,
        gift_id: selectedGift.value
      })
    })
    if (res.ok) {
      await searchClient()
      selectedGift.value = ''
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось выдать подарок"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

const selectClient = (client) => {
  newStaff.value.telegram_id = client.telegram_id
  newStaff.value.name = `${client.first_name} ${client.last_name}`
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
  if (!confirm("Удалить сотрудника? Это действие нельзя отменить.")) return
  loading.value = true
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/delete-staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        staff_id: id
      })
    })
    if (res.ok) {
      await loadStaffAndClients()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось удалить сотрудника"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

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
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось создать уведомление"
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
  if (!confirm("Удалить подарок? Это действие нельзя отменить.")) return
  loading.value = true
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/delete-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        gift_id: id
      })
    })
    if (res.ok) {
      const resGifts = await fetch(`${window.API_BASE}/api/admin/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      gifts.value = await resGifts.json()
      loadAuditLogs()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Не удалось удалить подарок"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

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
  clearError()
  loading.value = true
  try {
    const payload = {
      initData: getInitData(),
      title: broadcast.value.title,
      message: broadcast.value.message,
      link: broadcast.value.link,
      image_url: broadcast.value.image_url
    }

    const res = await fetch(`${window.API_BASE}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      broadcastResult.value = await res.json()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Ошибка отправки рассылки"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
  border: 1px solid #444;
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
  border: 1px solid #8b2626;
}
.card {
  background: #111;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  color: white;
}
.card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: white;
}

.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-btn, .search-box input {
  padding: 10px;
  border-radius: 6px;
  background: #222;
  font-size: 14px;
  color: white;
  border: none !important;
}

.search-box input  {
  flex: 1;
  min-width: 180px;
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
  border: 1px solid #444;
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
  border: 1px solid #ffd700;
  border-radius: 4px;
}
.gift-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #333;
  color: white;
}
.gift-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gift-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
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
  right: 15px;
  top: 15px;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 20px 0;
  font-style: italic;
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
  max-width: 60%;
}
.notification-content p {
  margin: 0 0 8px;
  color: #ccc;
  font-size: 14px;
}
.empty {
  text-align: center;
  color: #777;
  padding: 12px 0;
  font-style: italic;
}
.btn-delete-notific {
  position: absolute;
  top: 15px;
  right: 15px;
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

.audit-item-new {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #1a1a1a !important;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid transparent;
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

.audit-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

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
  gap: 15px;
  padding: 16px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.audit-type {
  font-weight: bold;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-date {
  font-size: 12px;
  color: #666;
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
}

.audit-filters button {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #333;
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