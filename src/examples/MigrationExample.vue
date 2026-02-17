<!--
  ПРИМЕР МИГРАЦИИ: Как перейти со старого кода на новый API сервис
  
  Этот файл показывает примеры миграции кода из существующих компонентов
  на использование нового централизованного API сервиса.
-->

<template>
  <div>
    <h2>Примеры миграции кода</h2>
    <!-- Примеры использования показаны в комментариях ниже -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi, isTelegramWebApp, logout } from '@/api/authApi'
import type { User } from '@/api/authApi'

// ==================== ПРИМЕР 1: Загрузка профиля клиента ====================

// ❌ БЫЛО (старый код):
/*
const loadProfile = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/client/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: getInitData() })
    })
    if (res.ok) {
      profile.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  }
}
*/

// ✅ СТАЛО (новый код):
const profile = ref<any>(null)

const loadProfile = async () => {
  try {
    profile.value = await authApi.clientPost('profile', {})
    // Автоматически добавляется initData или JWT токен
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
  }
}

// ==================== ПРИМЕР 2: Загрузка подарков ====================

// ❌ БЫЛО:
/*
const giftsRes = await fetch(`${window.API_BASE}/api/client/gifts`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData: getInitData() })
})
gifts.value = await giftsRes.json()
*/

// ✅ СТАЛО:
const gifts = ref<any[]>([])

const loadGifts = async () => {
  try {
    gifts.value = await authApi.clientPost('gifts', {})
  } catch (error) {
    console.error('Ошибка загрузки подарков:', error)
  }
}

// ==================== ПРИМЕР 3: Admin запросы ====================

// ❌ БЫЛО:
/*
const res = await fetch(`${window.API_BASE}/api/admin/staff-list`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData: getInitData() })
})
staffList.value = await res.json()
*/

// ✅ СТАЛО:
const staffList = ref<any[]>([])

const loadStaffList = async () => {
  try {
    staffList.value = await authApi.adminPost('staff-list', {})
  } catch (error) {
    console.error('Ошибка загрузки персонала:', error)
  }
}

// ==================== ПРИМЕР 4: Staff запросы с параметрами ====================

// ❌ БЫЛО:
/*
const res = await fetch(`${window.API_BASE}/api/staff/add-points`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    initData: getInitData(),
    client_id: client.value.id,
    purchase_amount: purchaseAmount.value
  })
})
*/

// ✅ СТАЛО:
const addPoints = async (clientId: number, amount: number) => {
  try {
    await authApi.staffPost('add-points', {
      client_id: clientId,
      purchase_amount: amount
    })
    // initData добавляется автоматически
  } catch (error) {
    console.error('Ошибка начисления баллов:', error)
  }
}

// ==================== ПРИМЕР 5: Проверка Telegram и скрытие кнопки выхода ====================

// ❌ БЫЛО:
/*
const getInitData = () => {
  return window.Telegram?.WebApp?.initData || ""
}
// Нужно было вручную проверять наличие Telegram
*/

// ✅ СТАЛО:
const showLogoutButton = !isTelegramWebApp() // Автоматическая проверка

const handleLogout = () => {
  logout() // Автоматически очищает localStorage и редиректит
}

// ==================== ПРИМЕР 6: Обработка ошибок авторизации ====================

// ❌ БЫЛО:
/*
const res = await fetch(...)
if (res.status === 401) {
  // Нужно было вручную обрабатывать
  localStorage.clear()
  window.location.href = '/login'
}
*/

// ✅ СТАЛО:
// Обработка 401/403 происходит автоматически в API сервисе!
// Просто используйте try/catch:

const makeRequest = async () => {
  try {
    const data = await authApi.clientPost('profile', {})
    // Если токен истек, автоматически:
    // 1. Очистится localStorage
    // 2. Выполнится редирект на /login (если не Telegram)
  } catch (error) {
    // Ошибка уже обработана, можно показать сообщение пользователю
    console.error('Ошибка:', error)
  }
}

// ==================== ПРИМЕР 7: Авторизация через логин/пароль ====================

// ✅ НОВОЕ (раньше не было):
import { login } from '@/api/authApi'

const handleLogin = async (phoneOrCard: string, password: string) => {
  try {
    const user: User = await login({
      phone_or_card: phoneOrCard,
      password: password
    })
    // Токен автоматически сохраняется в localStorage
    console.log('Пользователь авторизован:', user)
  } catch (error) {
    console.error('Ошибка входа:', error)
  }
}

onMounted(() => {
  // Пример загрузки данных при монтировании
  loadProfile()
  loadGifts()
})
</script>

<style scoped>
/* Стили для примера */
</style>
