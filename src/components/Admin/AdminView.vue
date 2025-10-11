<template>
  <div class="header"><h1>Админ-панель</h1></div>
  
  <div class="nav" style="position:static; background:none; border:none; padding:0;">
    <button :class="{ active: activeTab === 'staff-mode' }" @click="switchTab('staff-mode')">Рабочее место</button>
    <button :class="{ active: activeTab === 'staff' }" @click="switchTab('staff')">Персонал</button>
    <button :class="{ active: activeTab === 'notifications' }" @click="switchTab('notifications')">Уведомления</button>
    <button :class="{ active: activeTab === 'gifts' }" @click="switchTab('gifts')">Подарки</button>
    <button :class="{ active: activeTab === 'history' }" @click="switchTab('history')">История</button>
    <button :class="{ active: activeTab === 'audit' }" @click="switchTab('audit')">Аудит</button>
  </div>

  <!-- Сообщение об ошибке (универсальное) -->
  <div v-if="errorMessage" class="error-message">
    {{ errorMessage }}
  </div>

  <!-- Рабочее место -->
  <div v-if="activeTab === 'staff-mode'" class="tab active">
    <div class="card">
      <h3>Рабочее место сотрудника</h3>
      
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          placeholder="Номер карты (DTLC-XXXXXX) / телефон (+7...)" 
        />
        <button @click="searchClient" :disabled="loading">Найти</button>
      </div>

      <button @click="scanQR" class="btn-scan">Сканировать QR-код клиента</button>

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
            max="4999"
          />
          <button @click="addPoints" :disabled="loading || !purchaseAmount">
            {{ loading ? 'Обработка...' : 'Начислить' }}
          </button>
        </div>
        
        <!-- Выдача подарка -->
        <div class="form-group">
          <select v-model="selectedGift">
            <option value="">Выберите подарок</option>
            <option v-for="g in giftsForRedeem" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.points_cost }} баллов)
            </option>
          </select>
          <button 
            @click="redeemGift" 
            :disabled="loading || !selectedGift"
          >
            {{ loading ? 'Обработка...' : 'Выдать подарок' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Персонал -->
  <div v-if="activeTab === 'staff'" class="tab active">
    <!-- Сотрудники -->
    <div class="card">
      <h3>Сотрудники</h3>
      <div v-if="staffList.length === 0" class="empty">Нет сотрудников</div>
      <div v-for="s in staffList" :key="s.id" class="staff-item">
        <div>
          <strong>{{ s.name }}</strong> ({{ s.role }})
        </div>
        <button 
          v-if="s.role !== 'admin'" 
          @click="removeStaff(s.id)" 
          class="btn-delete"
        >
          Удалить
        </button>
        <span v-else class="admin-tag">Админ</span>
      </div>
    </div>

    <!-- Добавление сотрудника -->
    <div class="card">
      <h3>Добавить сотрудника</h3>
      <div class="form-group">
        <input 
          v-model.number="newStaff.telegram_id" 
          type="number" 
          placeholder="Telegram ID клиента" 
        />
      </div>
      <div class="form-group">
        <input v-model="newStaff.name" placeholder="ФИО" />
      </div>
      <div class="form-group">
        <select v-model="newStaff.role">
          <option value="staff">Сотрудник</option>
          <option value="admin">Администратор</option>
        </select>
      </div>
      <button 
        @click="addStaff" 
        class="btn"
        :disabled="!newStaff.telegram_id || !newStaff.name.trim()"
      >
        Добавить
      </button>
    </div>

    <!-- Клиенты (для выбора) -->
    <div class="card">
      <h3>Клиенты</h3>
      <div v-if="clientList.length === 0" class="empty">Нет клиентов</div>
      <div v-for="c in clientList" :key="c.telegram_id" class="client-item">
        <div>
          <strong>{{ c.first_name }} {{ c.last_name }}</strong> ({{ c.level }})
          <br />
          <small>Telegram ID: {{ c.telegram_id }}</small>
        </div>
        <button @click="selectClient(c)" class="btn-select">Выбрать</button>
      </div>
    </div>
  </div>

  <!-- Уведомления -->
  <div v-if="activeTab === 'notifications'" class="tab active">
    <div class="card">
      <h3>Новое уведомление</h3>
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
        <textarea 
          v-model="newNotification.description" 
          placeholder="Описание" 
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <input 
          v-model="newNotification.image_url" 
          placeholder="Ссылка на фото (необязательно)" 
        />
      </div>
      <div class="form-group">
        <input 
          v-model.number="newNotification.days" 
          type="number" 
          placeholder="Дней действия" 
          min="1" 
        />
      </div>
      <button 
        @click="addNotification" 
        class="btn"
        :disabled="loading"
      >
        {{ loading ? 'Создание...' : 'Добавить уведомление' }}
      </button>
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
        <input 
          v-model.number="newGift.points" 
          type="number" 
          placeholder="Стоимость в бонусах" 
          min="1" 
        />
      </div>
      <div class="form-group">
        <input 
          v-model="newGift.image_url" 
          placeholder="Ссылка на фото (необязательно)" 
        />
      </div>
      <button 
        @click="addGift" 
        class="btn"
        :disabled="loading || !newGift.name.trim() || !newGift.points"
      >
        {{ loading ? 'Создание...' : 'Добавить подарок' }}
      </button>
    </div>
  </div>

  <!-- История -->
  <div v-if="activeTab === 'history'" class="tab active">
    <div class="card">
      <h3>История операций</h3>
      <div v-for="t in transactions" :key="t.id" class="transaction-item">
        <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
          {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
        </div>
        <div>{{ t.client_name }}</div>
        <div>{{ t.description }}</div>
        <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
      </div>
    </div>
  </div>

  <!-- Аудит -->
  <div v-if="activeTab === 'audit'" class="tab active">
    <div class="card">
      <h3>Журнал действий администратора</h3>
      <div v-if="auditLogs.length === 0" class="empty">Нет записей</div>
      <div v-for="log in auditLogs" :key="log.id" class="audit-item">
        <div class="audit-description">
          <strong>{{ log.description }}</strong>
        </div>
        <div class="audit-meta">
          <span v-if="log.staff_name">Админ: {{ log.staff_name }}</span>
          <span class="date">{{ formatDateTime(log.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  staffId: { type: Number, required: true }
})

// Состояния
const activeTab = ref('staff-mode')
const adminId = ref(props.staffId)
const loading = ref(false)
const errorMessage = ref('')

// Формы
const newNotification = ref({ 
  type: 'promotion', 
  title: '', 
  description: '', 
  image_url: '', 
  days: 7 
})
const newGift = ref({ 
  name: '', 
  points: 0, 
  image_url: '' 
})
const searchQuery = ref('')
const purchaseAmount = ref(0)
const selectedGift = ref('')

// Персонал
const staffList = ref([])
const clientList = ref([])
const newStaff = ref({ 
  telegram_id: null, 
  name: '', 
  role: 'staff' 
})

// Данные
const transactions = ref([])
const gifts = ref([])
const auditLogs = ref([])
const client = ref(null)
const giftsForRedeem = ref([])

// Утилиты
const switchTab = (tab) => {
  activeTab.value = tab
  errorMessage.value = ''
  if (tab === 'audit') loadAuditLogs()
  if (tab === 'staff') loadStaffAndClients()
}

const formatDateTime = (isoStr) => {
  return new Date(isoStr).toLocaleString('ru-RU')
}

const clearError = () => {
  errorMessage.value = ''
}

// Загрузка данных
onMounted(async () => {
  clearError()
  try {
    const [resTx, resGifts] = await Promise.all([
      fetch(`${window.API_BASE}/api/admin/transactions`),
      fetch(`${window.API_BASE}/api/admin/gifts`)
    ])
    transactions.value = await resTx.json()
    gifts.value = await resGifts.json()
    await loadGiftsForRedeem()
  } catch (e) {
    errorMessage.value = "Ошибка загрузки данных"
  }
})

const loadGiftsForRedeem = async () => {
  const res = await fetch(`${window.API_BASE}/api/client/gifts`)
  giftsForRedeem.value = await res.json()
}

const loadStaffAndClients = async () => {
  try {
    const [staffRes, clientRes] = await Promise.all([
      fetch(`${window.API_BASE}/api/admin/staff?admin_id=${adminId.value}`),
      fetch(`${window.API_BASE}/api/admin/clients?admin_id=${adminId.value}`)
    ])
    staffList.value = await staffRes.json()
    clientList.value = await clientRes.json()
  } catch (e) {
    console.error("Ошибка загрузки персонала:", e)
    errorMessage.value = "Ошибка загрузки данных"
  }
}

// === Рабочее место ===
const searchClient = async () => {
  clearError()
  const q = searchQuery.value.trim()
  if (!q) return

  let url
  if (/^[\d+\s\-\(\)]+$/.test(q)) {
    url = `${window.API_BASE}/api/staff/client-by-phone?phone=${encodeURIComponent(q)}`
  } else {
    url = `${window.API_BASE}/api/staff/client-by-card?card_number=${encodeURIComponent(q)}`
  }

  try {
    const res = await fetch(url)
    client.value = res.ok ? await res.json() : null
    if (!client.value) {
      errorMessage.value = "Клиент не найден"
    }
  } catch (e) {
    errorMessage.value = "Ошибка поиска клиента"
  }
}

const scanQR = () => {
  clearError()
  if (!window.Telegram?.WebApp?.scanQrPopup) {
    errorMessage.value = "Сканирование доступно только в Telegram"
    return
  }

  window.Telegram.WebApp.scanQrPopup(
    { text: "Отсканируйте QR-код бонусной карты клиента" },
    (data) => {
      if (data) {
        searchQuery.value = data.trim()
        searchClient()
      }
    }
  )
}

const addPoints = async () => {
  clearError()
  if (!client.value || !purchaseAmount.value || purchaseAmount.value <= 0) {
    errorMessage.value = "Укажите корректную сумму покупки"
    return
  }
  if (purchaseAmount.value > 4999) {
    errorMessage.value = "Максимальная сумма покупки — 4999 руб."
    return
  }

  loading.value = true
  try {
    const url = `${window.API_BASE}/api/staff/add-points?client_id=${client.value.id}&staff_id=${adminId.value}&purchase_amount=${purchaseAmount.value}`
    const res = await fetch(url, { method: 'POST' })
    if (res.ok) {
      await searchClient() // обновить баланс
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

  // Подтверждение
  const gift = giftsForRedeem.value.find(g => g.id == selectedGift.value)
  if (!confirm(`Выдать подарок "${gift?.name}" клиенту ${client.value.name}?`)) {
    return
  }

  loading.value = true
  try {
    const url = `${window.API_BASE}/api/staff/redeem-gift?client_id=${client.value.id}&staff_id=${adminId.value}&gift_id=${selectedGift.value}`
    const res = await fetch(url, { method: 'POST' })
    if (res.ok) {
      await searchClient() // обновить баланс
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

// === Персонал ===
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
    const params = new URLSearchParams({
      admin_id: adminId.value.toString(),
      telegram_id: newStaff.value.telegram_id.toString(),
      name: newStaff.value.name,
      role: newStaff.value.role
    })
    const url = `${window.API_BASE}/api/admin/staff?${params}`
    const res = await fetch(url, { method: 'POST' })
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
    const url = `${window.API_BASE}/api/admin/staff/${id}?admin_id=${adminId.value}`
    const res = await fetch(url, { method: 'DELETE' })
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

// === Уведомления ===
const addNotification = async () => {
  clearError()
  const { type, title, description, image_url, days } = newNotification.value
  if (!title.trim() || !description.trim()) {
    errorMessage.value = "Заполните все поля"
    return
  }

  loading.value = true
  try {
    const params = new URLSearchParams({
      admin_id: adminId.value.toString(),
      type,
      title,
      description,
      days_valid: days.toString()
    })
    if (image_url) params.append('image_url', image_url)
    
    const url = `${window.API_BASE}/api/admin/notification?${params}`
    const res = await fetch(url, { method: 'POST' })
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

// === Подарки ===
const addGift = async () => {
  clearError()
  const { name, points, image_url } = newGift.value
  if (!name.trim() || !points || points <= 0) {
    errorMessage.value = "Укажите название и стоимость"
    return
  }

  loading.value = true
  try {
    const params = new URLSearchParams({
      name,
      points_cost: points.toString()
    })
    if (image_url) params.append('image_url', image_url)
    
    const url = `${window.API_BASE}/api/admin/gift?${params}`
    const res = await fetch(url, { method: 'POST' })
    if (res.ok) {
      newGift.value = { name: '', points: 0, image_url: '' }
      const resGifts = await fetch(`${window.API_BASE}/api/admin/gifts`)
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
    const url = `${window.API_BASE}/api/admin/gift/${id}?admin_id=${adminId.value}`
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) {
      const resGifts = await fetch(`${window.API_BASE}/api/admin/gifts`)
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

// === Аудит ===
const loadAuditLogs = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/audit?admin_id=${adminId.value}`)
    if (res.ok) {
      auditLogs.value = await res.json()
    }
  } catch (e) {
    console.error("Ошибка загрузки аудита:", e)
  }
}
</script>

<style scoped>
/* Общие настройки */
body {
  background: #000;
  color: white;
}

/* Навигация */
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

/* Сообщение об ошибке */
.error-message {
  background: #5a1818;
  color: #ffcccc;
  padding: 10px 16px;
  border-radius: 6px;
  margin: 12px 0;
  font-weight: 500;
  border: 1px solid #8b2626;
}

/* Карточки */
.card {
  background: #111;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  color: white;
}
.card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: white;
}

/* Рабочее место */
.search-box {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-box input {
  flex: 1;
  min-width: 180px;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 14px;
  background: #222;
  color: white;
}
.btn-scan {
  background: #198754;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0 24px;
  cursor: pointer;
  display: block;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
}
.btn-scan:hover {
  background: #157347;
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
.form-group textarea {
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 14px;
  min-width: 160px;
  background: #222;
  color: white;
}
.form-group textarea {
  min-height: 80px;
  resize: vertical;
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

/* Персонал */
.staff-item,
.client-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #333;
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

/* Подарки */
.gift-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
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
.btn-delete {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

/* История и аудит */
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
.timestamp,
.date {
  font-size: 12px;
  color: #aaa;
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
</style>