<!-- src/App.vue -->
<template>
  <div v-if="!userRole" class="card">
    <div class="header"><h1>DwnTwn Loyalty</h1></div>
    <p style="text-align:center; color:#777; margin:20px 0;">Загрузка...</p>
  </div>

  <!-- Регистрация для клиентов -->
  <RegisterForm v-else-if="userRole === 'client' && !isRegistered" @registered="loadProfile" />

  <!-- Основной интерфейс -->
  <div v-else>
    <div class="header">
      <h1>DwnTwn Loyalty</h1>
    </div>

    <!-- Клиент -->
    <template v-if="userRole === 'client'">
      <div v-show="activeTab === 'card'" class="tab active">
        <CardView :profile="profile" :gifts="gifts" />
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
      <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">История</button>
      <button :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Инфо</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RegisterForm from './components/Client/RegisterForm.vue'
import CardView from './components/Client/CardView.vue'
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
    tg.expand() // ✅ Разрешить прокрутку
    tg.ready()  // ✅ Разрешить взаимодействие с клавиатурой
  }
  authorizeStaff()
})
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
}
</style>