<template>
  <div class="login-container">
    <div class="card">
      <h2>Вход в систему</h2>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      
      <div class="form-group">
        <label>Номер телефона или карты</label>
        <input
          v-model="credentials.phone_or_card"
          type="text"
          placeholder="+79991234567 или DTLC-XXXXXX"
          :disabled="loading"
        />
      </div>
      
      <div class="form-group">
        <label>Пароль</label>
        <input
          v-model="credentials.password"
          type="password"
          placeholder="Введите пароль"
          :disabled="loading"
        />
      </div>
      
      <button
        @click="handleLogin"
        class="btn"
        :disabled="loading || !isValid"
      >
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>
      
      <div v-if="isTelegramWebApp" class="telegram-notice">
        <small>Вы используете Telegram версию. Вход через логин/пароль недоступен.</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { login, isTelegramWebApp as checkTelegram } from '@/api/authApi'
import type { LoginCredentials } from '@/api/authApi'

const emit = defineEmits<{
  (e: 'success', user: any): void
}>()

const credentials = ref<LoginCredentials>({
  phone_or_card: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')
const isTelegramWebApp = checkTelegram()

const isValid = computed(() => {
  return credentials.value.phone_or_card.trim() && credentials.value.password.trim()
})

const handleLogin = async () => {
  if (isTelegramWebApp) {
    errorMessage.value = 'В Telegram версии используется автоматическая авторизация'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const user = await login(credentials.value)
    emit('success', user)
  } catch (error: any) {
    errorMessage.value = error.message || 'Ошибка входа. Проверьте данные.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: #111;
  border-radius: 12px;
  padding: 24px;
  color: white;
}

.card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #ddd;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #222;
  color: white;
  font-size: 16px;
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  width: 100%;
  padding: 12px;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

.btn:disabled {
  background: #444;
  cursor: not-allowed;
}

.error-message {
  background: #5a1818;
  color: #ffcccc;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #8b2626;
}

.telegram-notice {
  margin-top: 16px;
  padding: 12px;
  background: #1a3a1a;
  border-radius: 6px;
  border: 1px solid #2d5a2d;
}

.telegram-notice small {
  color: #90ee90;
}
</style>
