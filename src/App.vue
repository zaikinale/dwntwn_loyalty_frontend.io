<!-- src/App.vue -->
<template>
  <div v-if="!userRole" class="app-container">
    <div class="card">
      <div class="header"><h1>DWNTWN coffee</h1></div>
      <p class="loading-text">Загрузка...</p>
    </div>
  </div>

  <!-- Регистрация для клиентов -->
  <div v-else-if="userRole === 'client' && !isRegistered" class="app-container">
    <RegisterForm @registered="loadProfile" />
  </div>

  <!-- Основной интерфейс -->
  <div v-else class="app-container">
    <div class="header">
      <h1>DWNTWN coffee</h1>
    </div>

    <!-- Клиент -->
    <template v-if="userRole === 'client'">
      <div v-show="activeTab === 'card'" class="tab active">
        <CardView :profile="profile" :gifts="gifts" />
      </div>
      <div v-show="activeTab === 'news'" class="tab active">
        <NewsView />
      </div>
      <div v-show="activeTab === 'history'" class="tab active">
        <HistoryView :transactions="transactions" />
      </div>
      <div v-show="activeTab === 'info'" class="tab active">
        <InfoView />
      </div>
    </template>

    <!-- Сотрудник -->
    <StaffView v-else-if="userRole === 'staff'" :staff-id="staffId" />

    <!-- Админ -->
    <AdminView v-else-if="userRole === 'admin'" :staff-id="staffId" />

    <!-- Навигация (только для клиента) -->
    <div class="nav" v-if="userRole === 'client'">
      <button :class="{ active: activeTab === 'card' }" @click="activeTab = 'card'">Карта</button>
      <button :class="{ active: activeTab === 'news' }" @click="activeTab = 'news'">Новости</button>
      <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">История</button>
      <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Инфо</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RegisterForm from './components/Client/RegisterForm.vue'
import CardView from './components/Client/CardView.vue'
import NewsView from './components/Client/NewsView.vue'
import HistoryView from './components/Client/HistoryView.vue'
import InfoView from './components/Client/InfoView.vue'
import StaffView from './components/Staff/StaffView.vue'
import AdminView from './components/Admin/AdminView.vue'

const userRole = ref(null)
const isRegistered = ref(false)
const profile = ref(null)
const transactions = ref([])
const gifts = ref([])
const staffId = ref(null)
const activeTab = ref('card')

const getInitData = () => {
  return window.Telegram?.WebApp?.initData || ""
}

const loadProfile = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/client/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (res.ok) {
      profile.value = await res.json()
      isRegistered.value = true

      const giftsRes = await fetch(`${window.API_BASE}/api/client/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      gifts.value = await giftsRes.json()

      const notifRes = await fetch(`${window.API_BASE}/api/client/user-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      if (notifRes.ok) {
        const notifications = await notifRes.json()
        const unread = notifications.filter(n => !n.is_read)
        if (unread.length > 0) {
          const first = unread[0]
          alert(`🔔 ${first.title}\n\n${first.message}`)
        }
      }
    } else {
      isRegistered.value = false
    }
  } catch (e) {
    console.error(e)
    isRegistered.value = false
  }
}

const authorizeStaff = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/staff/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (res.ok) {
      const staff = await res.json()
      userRole.value = staff.role
      staffId.value = staff.id
    } else {
      userRole.value = 'client'
      loadProfile()
    }
  } catch (e) {
    userRole.value = 'client'
    loadProfile()
  }
}

onMounted(() => {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.expand()
    tg.ready()
  }
  authorizeStaff()
})
</script>

<style scoped>
/* Общий контейнер приложения */
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #111;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 0;
  margin: 0;
}

/* Заголовок */
.header {
  padding: clamp(16px, 5vw, 24px);
  background: #000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.header h1 {
  text-align: center;
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2.2rem);
  font-weight: 700;
  color: white;
}

/* Контент-карточка */
.card {
  background: #1a1a1a;
  border-radius: 16px;
  margin: clamp(16px, 5vw, 24px);
  padding: clamp(20px, 6vw, 32px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.loading-text {
  text-align: center;
  color: #aaa;
  margin: 20px 0;
  font-size: 1.1rem;
}

/* Навигация */
.nav {
  display: flex;
  gap: clamp(6px, 2vw, 12px);
  justify-content: center;
  flex-wrap: wrap;
  padding: clamp(12px, 4vw, 20px);
  background: #000;
  margin-top: auto;
}

.nav button {
  background: #222;
  color: #ddd;
  border: 1px solid #444;
  padding: clamp(8px, 2.5vw, 14px) clamp(16px, 4vw, 24px);
  border-radius: 10px;
  cursor: pointer;
  font-size: clamp(0.9rem, 2.8vw, 1.1rem);
  font-weight: 600;
  transition: all 0.2s ease;
}

.nav button:hover:not(.active) {
  background: #333;
}

.nav button.active {
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
}

/* Адаптация для десктопа: центрирование и ограничение ширины */
@media (min-width: 768px) {
  .app-container {
    align-items: center;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  }

  .header,
  .card,
  .nav {
    width: min(90%, 600px);
    margin-left: auto;
    margin-right: auto;
  }

  .nav {
    position: sticky;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    border-top: 1px solid #333;
  }
}

/* Убираем скроллбар на мобильных (если нужно) */
* {
  scrollbar-width: none; /* Firefox */
}
*::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
</style>