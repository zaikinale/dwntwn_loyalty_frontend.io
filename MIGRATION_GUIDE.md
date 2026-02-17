# Руководство по миграции на новый API сервис

## Что было сделано

1. ✅ Создан централизованный API сервис (`src/api/authApi.ts`)
2. ✅ Реализована автоматическая авторизация (Telegram initData → JWT)
3. ✅ Добавлен метод `login()` для авторизации по логину/паролю
4. ✅ Реализована обработка ошибок 401/403 с автоматическим редиректом
5. ✅ Добавлена типизация TypeScript
6. ✅ Созданы хелперы для admin/staff запросов

## Быстрый старт

### 1. Установите зависимости для TypeScript

```bash
npm install --save-dev typescript @types/node
```

### 2. Используйте новый API сервис в компонентах

**Было:**
```javascript
const res = await fetch(`${window.API_BASE}/api/client/profile`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData: getInitData() })
})
const profile = await res.json()
```

**Стало:**
```typescript
import { authApi } from '@/api/authApi'

const profile = await authApi.clientPost('profile', {})
```

### 3. Скрытие кнопки "Выйти" в Telegram

```vue
<template>
  <button v-if="!isTelegramWebApp()" @click="logout">
    Выйти
  </button>
</template>

<script setup>
import { isTelegramWebApp, logout } from '@/api/authApi'
</script>
```

## Основные методы

### Авторизация

```typescript
import { login, logout } from '@/api/authApi'

// Вход через логин/пароль
const user = await login({
  phone_or_card: '+79991234567',
  password: 'password123'
})

// Выход
logout()
```

### API запросы

```typescript
import { authApi } from '@/api/authApi'

// Client запросы
const profile = await authApi.clientPost('profile', {})
const gifts = await authApi.clientPost('gifts', {})

// Staff запросы
const client = await authApi.staffPost('client-by-phone', { phone: '+79991234567' })
await authApi.staffPost('add-points', { client_id: 1, purchase_amount: 1000 })

// Admin запросы
const staffList = await authApi.adminPost('staff-list', {})
await authApi.adminPost('add-staff', { telegram_id: 123, name: 'Иван', role: 'staff' })
```

### Проверки

```typescript
import { isTelegramWebApp, getStoredRole, getStoredUser } from '@/api/authApi'

if (isTelegramWebApp()) {
  // Приложение открыто в Telegram
}

const role = getStoredRole() // 'admin' | 'staff' | 'client' | null
const user = getStoredUser() // User | null
```

## Особенности

1. **Автоматическая авторизация**: 
   - Если доступен `window.Telegram.WebApp.initData` → используется он
   - Иначе используется JWT токен из `localStorage`

2. **Обработка ошибок**:
   - При 401/403 автоматически очищается `localStorage`
   - Выполняется редирект на `/login` (только для не-Telegram версии)

3. **initData в теле запроса**:
   - Сервис автоматически добавляет `initData` в тело запроса (как в текущем проекте)
   - Если нужно использовать заголовок `Authorization`, раскомментируйте соответствующий код в `authApi.ts`

## Примеры миграции

См. файл `src/examples/MigrationExample.vue` для подробных примеров.

## Документация

Полная документация доступна в `src/api/README.md`
