<template>
  <div class="header">
    <h1>Рабочее место сотрудника</h1>
  </div>
  <div class="nav">
    <button :class="{ active: activeTab === 'workplace' }" @click="activeTab = 'workplace'">
      Рабочее место
    </button>
    <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
      История операций
    </button>
  </div>

  <!-- Рабочее место -->
  <div v-if="activeTab === 'workplace'" class="tab active">
    <div class="card">
      <h3>Поиск клиента</h3>
      <div class="search-box">
        <input
          v-model="searchQuery"
          placeholder="Номер карты (DTLC-XXXXXX) или телефон (+7...)"
        />
        <button @click="searchClient" :disabled="loading">Найти</button>
      </div>
      <button @click="scanQR" class="btn-scan">Сканировать QR-код</button>

      <div v-if="client" class="client-result">
        <h4>{{ client.name }}</h4>
        <p>Баллы: {{ client.points }} (уровень: {{ client.level }})</p>

        <!-- Начисление баллов -->
        <div class="form-group">
          <input
            v-model.number="purchaseAmount"
            type="number"
            placeholder="Сумма покупки"
            min="1"
            max="4999"
          />
          <button @click="addPoints" :disabled="loading || !purchaseAmount">
            {{ loading ? 'Обработка...' : 'Начислить баллы' }}
          </button>
        </div>

        <!-- Выдача подарка -->
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

  <!-- История операций -->
  <div v-if="activeTab === 'history'" class="tab active">
    <div class="card">
      <h3>История операций</h3>
      <div v-if="myTransactions.length === 0" class="empty">Нет операций</div>
      <div v-for="t in myTransactions" :key="t.id" class="transaction-item">
        <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
          {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
        </div>
        <div>{{ t.client_name }}</div>
        <div>{{ t.description }}</div>
        <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

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

const getInitData = () => {
  return window.Telegram?.WebApp?.initData || ''
}

const formatDateTime = (isoStr) => {
  return new Date(isoStr).toLocaleString('ru-RU')
}

// Загрузка данных при монтировании
onMounted(async () => {
  window.Telegram?.WebApp?.ready();
  // const WebApp = window.Telegram?.WebApp;
  // const scanAvailable = typeof WebApp?.scanQrCode === 'function';
  
  // console.log("WebApp version:", WebApp?.version);
  // console.log("Platform:", WebApp?.platform);
  // console.log("scanQrCode available:", scanAvailable);
  try {
    const [giftsRes, historyRes] = await Promise.all([
      fetch(`${window.API_BASE}/api/client/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      }),
      fetch(`${window.API_BASE}/api/staff/my-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
    ])

    gifts.value = await giftsRes.json()

    if (historyRes.ok) {
      myTransactions.value = await historyRes.json()
    } else {
      // Эндпоинт не существует или вернул ошибку → пустой массив
      myTransactions.value = []
      console.warn("Не удалось загрузить историю операций:", await historyRes.text())
    }
  } catch (e) {
    errorMessage.value = "Ошибка загрузки данных"
    myTransactions.value = []
    console.error("Исключение при загрузке данных:", e)
  }
})

// Поиск клиента
const searchClient = async () => {
  errorMessage.value = ''
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
    errorMessage.value = "Ошибка поиска"
  }
}

// Сканирование QR — ИСПРАВЛЕНО
// const scanQR = () => {
//   const WebApp = window.Telegram?.WebApp;
//   if (WebApp && typeof WebApp.scanQrCode === 'function') {
//     WebApp.scanQrCode().then(data => {
//       if (data) {
//         alert("Успех! Отсканировано: " + data);
//       }
//     });
//   } else {
//     alert("Платформа: " + WebApp?.platform + "\nМетод: " + (typeof WebApp?.scanQrCode) + "\nДомен: " + window.location.origin + "\nWebApp version: " + window.Telegram?.WebApp?.version);
//   }
// };

const scanQR = () => {
  const WebApp = window.Telegram?.WebApp;

  if (!WebApp) {
    alert("Telegram WebApp не инициализирован");
    return;
  }

  // Проверяем наличие метода
  if (typeof WebApp.openScanQrPopup === 'function') {
    WebApp.openScanQrPopup({
      text: "Отсканируйте QR-код клиента",
      callback: (data) => {
        if (data) {
          WebApp.closeScanQrPopup();
          alert("✅ Успех! Отсканировано: " + data);
          // Можно сразу искать клиента:
          searchQuery.value = data;
          searchClient();
        } else {
          alert("QR-код не распознан");
        }
      },
    });
  } else {
    alert(
      "QR-сканер недоступен.\n" +
      "Платформа: " + WebApp.platform + "\n" +
      "Версия: " + WebApp.version + "\n\n" +
      "Проверь, что Mini App запущен внутри Telegram (мобильный клиент ≥10.3)"
    );
  }
};


// Начисление баллов
const addPoints = async () => {
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
      // Обновить историю
      const histRes = await fetch(`${window.API_BASE}/api/staff/my-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      myTransactions.value = await histRes.json()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Ошибка начисления"
    }
  } catch (e) {
    errorMessage.value = "Ошибка подключения"
  } finally {
    loading.value = false
  }
}

// Выдача подарка
const redeemGift = async () => {
  if (!client.value || !selectedGift.value) return
  const gift = gifts.value.find(g => g.id == selectedGift.value)
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
      // Обновить историю
      const histRes = await fetch(`${window.API_BASE}/api/staff/my-transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      myTransactions.value = await histRes.json()
    } else {
      const err = await res.json()
      errorMessage.value = err.detail || "Ошибка выдачи"
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
.search-box input {
  flex: 1;
  min-width: 180px;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #222;
  color: white;
  font-size: 14px;
}
.btn-scan {
  background: #198754;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 16px 0;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.btn-scan:hover {
  background: #157347;
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