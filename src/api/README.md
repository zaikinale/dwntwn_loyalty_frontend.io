# API Service - Документация

## Описание

Централизованный сервис для работы с API бэкенда. Поддерживает два типа авторизации:
1. **Telegram WebApp** - автоматически использует `window.Telegram.WebApp.initData`
2. **JWT** - стандартный Bearer токен для логина/пароля

## Установка зависимостей

Для работы с TypeScript нужно установить типы:

```bash
npm install --save-dev typescript @types/node
```

## Использование

### Базовый пример

```typescript
import { authApi } from '@/api/authApi'

// Автоматически добавит initData или JWT токен
const profile = await authApi.clientPost('profile', {})
```

### Авторизация через логин/пароль

```typescript
import { login } from '@/api/authApi'

try {
  const user = await login({
    phone_or_card: '+79991234567',
    password: 'password123'
  })
  console.log('Авторизован:', user)
} catch (error) {
  console.error('Ошибка авторизации:', error)
}
```

### Проверка типа авторизации

```typescript
import { isTelegramWebApp } from '@/api/authApi'

if (isTelegramWebApp()) {
  // Приложение открыто в Telegram
  // Скрыть кнопку "Выйти"
} else {
  // Обычная веб-версия
  // Показать кнопку "Выйти"
}
```

### Admin запросы

```typescript
import { authApi } from '@/api/authApi'

// POST /api/admin/staff-list
const staffList = await authApi.adminPost('staff-list', {})

// POST /api/admin/add-staff
await authApi.adminPost('add-staff', {
  telegram_id: 123456,
  name: 'Иван Иванов',
  role: 'staff'
})
```

### Staff запросы

```typescript
import { authApi } from '@/api/authApi'

// POST /api/staff/client-by-phone
const client = await authApi.staffPost('client-by-phone', {
  phone: '+79991234567'
})

// POST /api/staff/add-points
await authApi.staffPost('add-points', {
  client_id: 1,
  purchase_amount: 1000
})
```

### Client запросы

```typescript
import { authApi } from '@/api/authApi'

// POST /api/client/profile
const profile = await authApi.clientPost('profile', {})

// POST /api/client/gifts
const gifts = await authApi.clientPost('gifts', {})
```

### Обработка ошибок

```typescript
import { authApi } from '@/api/authApi'

try {
  const data = await authApi.clientPost('profile', {})
} catch (error) {
  if (error.message.includes('Authorization failed')) {
    // Токен истек или невалиден
    // Автоматически очищен localStorage и выполнен редирект
  } else {
    console.error('Другая ошибка:', error)
  }
}
```

### Выход из системы

```typescript
import { logout } from '@/api/authApi'

// Очищает localStorage и редиректит на /login (если не Telegram)
logout()
```

## Миграция существующего кода

### Было:

```javascript
const res = await fetch(`${window.API_BASE}/api/client/profile`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ initData: getInitData() })
})
const profile = await res.json()
```

### Стало:

```typescript
import { authApi } from '@/api/authApi'

const profile = await authApi.clientPost('profile', {})
```

## Особенности

1. **Автоматическая авторизация**: Если доступен Telegram initData, он используется автоматически. Иначе используется JWT токен из localStorage.

2. **Обработка 401/403**: При ошибках авторизации автоматически очищается localStorage и выполняется редирект на `/login` (только для не-Telegram версии).

3. **Скрытие кнопки "Выйти"**: Используйте `isTelegramWebApp()` для проверки и скрытия кнопки выхода в Telegram версии.

4. **Типизация**: Все методы полностью типизированы для TypeScript.
