<template>
  <div class="nav">
    <button :class="{ active: activeTab === 'workplace' }" @click="activeTab = 'workplace'">
      Рабочее место
    </button>
    <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
      История операций
    </button>
  </div>

  <div v-if="activeTab === 'workplace'" class="tab active">
    <div class="card">
      <h3>Поиск клиента</h3>
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Номер карты (DTLC-XXXXXX) или телефон (+7...)"
          @keyup.enter="searchClient"
        />
        <button class="search-btn" @click="searchClient" :disabled="loading">Найти</button>
      </div>
      <button @click="scanQR" class="btn-scan">
        {{ isScanning ? 'Остановить сканирование' : 'Сканировать QR-код' }}
      </button>

      <div id="qr-reader" style="display: none;"></div>

      <div v-if="client" class="client-result">
        <h4>{{ client.name }}</h4>
        <p>Баллы: {{ client.points }} (уровень: {{ client.level }})</p>

        <div class="form-group">
          <input
            v-model.number="purchaseAmount"
            type="number"
            placeholder="Сумма покупки"
            min="1"
            max="2500"
          />
          <button @click="addPoints" :disabled="loading || !purchaseAmount">
            {{ loading ? 'Обработка...' : 'Начислить баллы' }}
          </button>
        </div>

        <div class="form-group">
          <select v-model="selectedGift">
            <option value="">Выберите подарок</option>
            <option v-for="g in gifts" :key="g.id" :value="g.id">
              {{ g.name }} ({{ g.points_cost }} баллов)
            </option>
          </select>
          <button @click="redeemGift" :disabled="loading || !selectedGift">
            {{ loading ? 'Обработка...' : 'Выдать подарок' }}
          </button>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    </div>
  </div>

  <div v-if="activeTab === 'history'" class="tab active">
    <div class="card">
      <h3>История операций</h3>
      <div v-if="myTransactions.length === 0" class="empty">Нет операций</div>
      <div v-for="t in myTransactions" :key="t.id" class="transaction-item" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
            {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
          </div>
          <div>{{ t.client_name }}</div>
          <div>{{ t.description }}</div>
          <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
        </div>
        <button 
          v-if="!t.description.includes('Отмена')" 
          @click="cancelTx(t.id)" 
          style="background: #331111; color: #ff4444; border: 1px solid #552222; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;"
        >
          Отменить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  staffId: { type: Number, required: true }
})

const activeTab = ref('workplace')
const searchQuery = ref('')
const purchaseAmount = ref(0)
const selectedGift = ref('')
const client = ref(null)
const gifts = ref([])
const myTransactions = ref([])
const loading = ref(false)
const errorMessage = ref('')
const isScanning = ref(false)
const qrScanner = ref(null)

const getInitData = () => window.Telegram?.WebApp?.initData || ''
const formatDateTime = (isoStr) => new Date(isoStr).toLocaleString('ru-RU')
// Вынес загрузку истории в отдельную функцию для переиспользования
const loadHistory = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/staff/my-transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (res.ok) {
      myTransactions.value = await res.json()
    }
  } catch (e) {
    console.error("Ошибка загрузки истории", e)
  }
}

onMounted(async () => {
  window.Telegram?.WebApp?.ready?.()
  try {
    const [giftsRes] = await Promise.all([
      fetch(`${window.API_BASE}/api/client/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
    ])
    gifts.value = await giftsRes.json()
    await loadHistory()
  } catch (e) {
    errorMessage.value = "Ошибка загрузки данных"
  }
})

const searchClient = async () => {
  errorMessage.value = ''
  const q = searchQuery.value.trim()
  if (!q) return
  loading.value = true
  try {
    const isPhone = q.match(/^\+?\d+$/)
    const payload = { initData: getInitData(), [isPhone ? 'phone' : 'card_number']: q }
    const url = `${window.API_BASE}/api/staff/client-by-${isPhone ? 'phone' : 'card'}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    client.value = res.ok ? await res.json() : null
    if (!client.value) errorMessage.value = "Клиент не найден"
  } catch (e) {
    errorMessage.value = "Ошибка поиска"
  } finally {
    loading.value = false
  }
}

// НОВЫЙ БЕСШОВНЫЙ СКАНЕР
const scanQR = async () => {
  errorMessage.value = ''
  
  if (window.Telegram?.WebApp?.showScanQrPopup) {
    window.Telegram.WebApp.showScanQrPopup({ text: "Сканируйте QR клиента" }, (data) => {
      if (data) {
        searchQuery.value = data.trim()
        window.Telegram.WebApp.closeScanQrPopup()
        searchClient()
        return true
      }
    })
    return
  }

  // Фолбек на библиотеку
  if (isScanning.value) { stopHtml5QrScanner(); return; }
  isScanning.value = true
  try {
    const { Html5QrcodeScanner } = await import('html5-qrcode')
    const container = document.getElementById('qr-reader')
    if (container) container.style.display = 'block'
    qrScanner.value = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
    qrScanner.value.render((text) => {
      stopHtml5QrScanner()
      searchQuery.value = text.trim()
      searchClient()
    })
  } catch (err) {
    isScanning.value = false
  }
}

const stopHtml5QrScanner = () => {
  if (qrScanner.value) { qrScanner.value.clear(); qrScanner.value = null; }
  const container = document.getElementById('qr-reader')
  if (container) container.style.display = 'none'
  isScanning.value = false
}

const addPoints = async () => {
  if (!client.value || purchaseAmount.value <= 0) return
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
      alert("✅ Баллы успешно начислены!");
      purchaseAmount.value = 0
      await searchClient()
      await loadHistory() // Обновляем историю
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Ошибка"
    }
  } catch (e) { errorMessage.value = "Ошибка сети" }
  finally { loading.value = false }
}
const cancelTx = async (txId) => {
  if (!confirm('Вы уверены, что хотите отменить эту операцию?')) return
  try {
    const res = await fetch(`${window.API_BASE}/api/admin/cancel-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction_id: txId, initData: getInitData() })
    })
    if (res.ok) {
      alert('Операция отменена');
      await loadHistory()
      if (client.value) await searchClient()
    } else {
      const err = await res.json()
      alert(err.detail || 'Ошибка отмены')
    }
  } catch (e) { alert('Ошибка сети') }
}

const redeemGift = async () => {
  if (!client.value || !selectedGift.value) return
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
      selectedGift.value = ''
      await searchClient()
      await loadHistory() // Обновляем историю
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Ошибка"
    }
  } catch (e) { errorMessage.value = "Ошибка" }
  finally { loading.value = false }
}

onBeforeUnmount(() => stopHtml5QrScanner())
</script>
<style scoped>
.header h1 {
  color: white;
  text-align: center;
  margin: 16px 0;
}
.nav {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
.nav button {
  background: #222;
  color: #ddd;
  border: 1px solid #444;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.nav button.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}
.card {
  background: #111;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.card > h3 {
  margin-bottom: 10px;
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
.form-group button {
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #222;
  color: white;
  font-size: 14px;
  min-width: 160px;
}
.form-group button {
  background: #0d6efd;
  border: none;
  cursor: pointer;
  font-weight: 500;
}
.form-group button:disabled {
  background: #444;
  cursor: not-allowed;
}
.error-message {
  background: #5a1818;
  color: #ffcccc;
  padding: 10px 16px;
  border-radius: 6px;
  margin-top: 12px;
  border: 1px solid #8b2626;
}
.transaction-item {
  padding: 12px 0;
  border-bottom: 1px solid #333;
}
.transaction-item:last-child {
  border-bottom: none;
}
.points-positive { color: #4CAF50; }
.points-negative { color: #f44336; }
.timestamp {
  font-size: 12px;
  color: #aaa;
}
.empty {
  text-align: center;
  color: #aaa;
  padding: 20px 0;
  font-style: italic;
}
</style>