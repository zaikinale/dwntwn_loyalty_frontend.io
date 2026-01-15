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
        <CardView :profile="profile" :gifts="gifts" :transactions="transactions"  />
      </div>
      <div v-show="activeTab === 'news'" class="tab active">
        <NewsView />
      </div>
      <!-- <div v-show="activeTab === 'history'" class="tab active">
        <HistoryView :transactions="transactions" />
      </div> -->
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
      <!-- <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">История</button> -->
      <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Инфо</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RegisterForm from './components/Client/RegisterForm.vue'
import CardView from './components/Client/CardView.vue'
import NewsView from './components/Client/NewsView.vue'
// import HistoryView from './components/Client/HistoryView.vue'
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

// const loadProfile = async () => {
//   try {
//     const res = await fetch(`${window.API_BASE}/api/client/profile`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ initData: getInitData() })
//     })
//     if (res.ok) {
//       profile.value = await res.json()
//       isRegistered.value = true

//       const giftsRes = await fetch(`${window.API_BASE}/api/client/gifts`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ initData: getInitData() })
//       })
//       gifts.value = await giftsRes.json()

//       const txRes = await fetch(`${window.API_BASE}/api/client/transactions`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ initData: getInitData() })
//       })
//       transactions.value = await txRes.json()

//       const notifRes = await fetch(`${window.API_BASE}/api/client/user-notifications`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ initData: getInitData() })
//       })
//       if (notifRes.ok) {
//         const notifications = await notifRes.json()
//         const unread = notifications.filter(n => !n.is_read)
//         if (unread.length > 0) {
//           const first = unread[0]
//           alert(`🔔 ${first.title}\n\n${first.message}`)
//         }
//       }
//     } else {
//       isRegistered.value = false
//     }
//   } catch (e) {
//     console.error(e)
//     isRegistered.value = false
//   }
// }

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

      // Загрузка подарков
      const giftsRes = await fetch(`${window.API_BASE}/api/client/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      gifts.value = await giftsRes.json()

      // Загрузка истории операций ← НОВОЕ
      const txRes = await fetch(`${window.API_BASE}/api/client/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: getInitData() })
      })
      transactions.value = await txRes.json()

      // Загрузка уведомлений
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
<style>
  /* 1. Глобальные стили (без scoped, чтобы влиять на всё приложение) */
  body {
    margin: 0;
    padding: 0;
    /* Укажите правильное название вашего файла */
    background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
                url('/assets/изображение.png') no-repeat center center fixed;
    background-size: cover;
    min-height: 100vh;
  }
  
  /* 2. Контейнер приложения */
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: transparent !important; /* Убираем черный фон */
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  /* 3. Заголовок (делаем прозрачным) */
  .header {
    padding: clamp(16px, 5vw, 24px);
    background: rgba(0, 0, 0, 0.4) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .header h1 {
    text-align: center;
    margin: 0;
    font-size: clamp(1.5rem, 4vw, 2.2rem);
    font-weight: 700;
    color: white;
  }
  
  /* 4. Универсальная карточка с эффектом стекла */
  /* Эти стили применятся ко всем карточкам во всех View (Admin, Staff, Client) */
  .card, .tab, .audit-item-new, .transaction-card, .notification-item, .gift-item {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 16px;
    margin: clamp(10px, 3vw, 20px);
    padding: clamp(15px, 5vw, 25px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  /* 5. Навигация */
  .nav {
    display: flex;
    gap: 8px;
    justify-content: center;
    padding: 15px;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(10px);
    margin-top: auto;
  }
  
  .nav button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 8px 16px;
    border-radius: 10px;
    cursor: pointer;
  }
  
  .nav button.active {
    background: #4dabf7 !important;
    border-color: #4dabf7;
  }
  
  .loading-text {
    text-align: center;
    color: #eee;
    margin: 20px 0;
  }
  </style>