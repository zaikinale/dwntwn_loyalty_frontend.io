<template>
  <div class="header"><h1>Админ-панель</h1></div>
  <div class="nav" style="position:static; background:none; border:none; padding:0;">
    <button :class="{ active: activeTab === 'staff-mode' }" @click="switchTab('staff-mode')">Рабочее место</button>
    <button :class="{ active: activeTab === 'staff' }" @click="switchTab('staff')">Персонал</button>
    <button :class="{ active: activeTab === 'notifications' }" @click="switchTab('notifications')">Уведомления</button>
    <button :class="{ active: activeTab === 'gifts' }" @click="switchTab('gifts')">Подарки</button>
    <button :class="{ active: activeTab === 'history' }" @click="switchTab('history')">История</button>
    <button :class="{ active: activeTab === 'audit' }" @click="switchTab('audit')">Аудит</button>
    <button :class="{ active: activeTab === 'broadcast' }" @click="switchTab('broadcast')">Пуш-рассылка</button>
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
        <textarea v-model="newNotification.description" placeholder="Описание" rows="3"></textarea>
      </div>
      <div class="form-group">
        <input v-model="newNotification.image_url" placeholder="Ссылка на фото (необязательно)" />
      </div>
      <div class="form-group">
        <input v-model.number="newNotification.days" type="number" placeholder="Дней действия" min="1" />
      </div>
      <button @click="addNotification" class="btn" :disabled="loading">
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
        <div class="audit-description"><strong>{{ log.description }}</strong></div>
        <div class="audit-meta">
          <span v-if="log.staff_name">Админ: {{ log.staff_name }}</span>
          <span class="date">{{ formatDateTime(log.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Пуш-рассылка -->
<div v-if="activeTab === 'broadcast'" class="tab active">
  <div class="card">
    <h3>Пуш-рассылка всем клиентам</h3>
    <div class="form-group">
      <input v-model="broadcast.title" placeholder="Заголовок рассылки" />
    </div>
    <div class="form-group">
      <textarea v-model="broadcast.message" placeholder="Текст сообщения" rows="4"></textarea>
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
import { ref, onMounted } from 'vue'

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

const broadcast = ref({ title: '', message: '', link: '' })
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

const scanQR = () => {
  if (typeof Telegram !== 'undefined' && Telegram.WebApp?.scanQrCode) {
    Telegram.WebApp.scanQrCode().then(data => {
      if (data) {
        alert("Отсканировано: " + data);
      }
    }).catch(err => {
      alert("Ошибка сканирования");
    });
  } else {
    alert("scanQrCode недоступен\n" +
          "WebApp: " + !!Telegram?.WebApp + "\n" +
          "Метод: " + typeof Telegram?.WebApp?.scanQrCode);
  }
};

const addPoints = async () => {
  clearError()
  if (!client.value || !purchaseAmount.value || purchaseAmount.value <= 0) {
    errorMessage.value = "Укажите сумму покупки"
    return
  }
  if (purchaseAmount.value > 4999) {
    errorMessage.value = "Максимум 4999 руб."
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
    const res = await fetch(`${window.API_BASE}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: getInitData(),
        title: broadcast.value.title,
        message: broadcast.value.message,
        link: broadcast.value.link
      })
    })
    if (res.ok) {
      broadcastResult.value = await res.json()
      // Опционально: сбросить форму
      // broadcast.value = { title: '', message: '', link: '' }
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
/* Общие стили — такие же, как в StaffView.vue */
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