<template>
  <div class="card">
    <div style="background:#222; padding:16px; border-radius:8px; margin:20px 0; font-size:14px; color: white;">
      Для использования полного функционала необходимо зарегистрироваться
    </div>
    <div class="form-group">
      <label>Фамилия</label>
      <input v-model="form.lastName" placeholder="Иванов" />
    </div>
    <div class="form-group">
      <label>Имя</label>
      <input v-model="form.firstName" placeholder="Иван" />
    </div>
    <div class="form-group">
      <label>Телефон</label>
      <input v-model="form.phone" type="tel" placeholder="+7 (999) 123-45-67" />
    </div>
    <div class="form-group">
      <label>Дата рождения</label>
      <input v-model="form.birthDate" type="date" />
    </div>
    <div class="form-group">
      <label>Пол</label>
      <select v-model="form.gender">
        <option value="">Выберите</option>
        <option value="male">Мужской</option>
        <option value="female">Женский</option>
      </select>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input v-model="form.email" type="email" placeholder="example@mail.ru" />
    </div>
    <button @click="submit" class="btn" :disabled="!isValid || loading">
      {{ loading ? 'ОТПРАВКА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const emit = defineEmits(['registered'])

const form = ref({
  lastName: '',
  firstName: '',
  phone: '',
  birthDate: '',
  gender: '',
  email: ''
})

const loading = ref(false)

const isValid = computed(() => {
  return form.value.lastName.trim() && form.value.firstName.trim()
})

// Надёжное получение initData
function waitForTelegramInit(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      const tg = window.Telegram?.WebApp
      if (tg && tg.initData !== undefined) {
        resolve(tg.initData)
      } else if (Date.now() - start > timeoutMs) {
        resolve("")
      } else {
        setTimeout(check, 50)
      }
    }
    check()
  })
}

// Автофокус и инициализация
onMounted(() => {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.expand()
    tg.ready()
    // Попытка фокуса (работает на Android)
    setTimeout(() => {
      const firstInput = document.querySelector('input')
      if (firstInput) {
        firstInput.focus()
      }
    }, 400)
  }
})

const submit = async () => {
  loading.value = true
  const initData = await waitForTelegramInit()

  if (!initData) {
    alert("❌ Нет данных от Telegram. Откройте приложение через бота!")
    loading.value = false
    return
  }

  try {
    const payload = {
      initData,
      first_name: form.value.firstName,
      last_name: form.value.lastName,
      phone: form.value.phone || null,
      email: form.value.email || null,
      birth_date: form.value.birthDate || null,
      gender: form.value.gender || null
    }

    const res = await fetch(`${window.API_BASE}/api/client/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (res.ok) {
      emit('registered')
    } else {
      const err = await res.json().catch(() => ({}))
      alert("Ошибка регистрации: " + (err.detail || "Неизвестная ошибка"))
    }
  } catch (e) {
    console.error("Registration error:", e)
    alert("Ошибка подключения")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: white;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 16px;
  background: #222;
  color: white;
}
.btn {
  width: 100%;
  padding: 12px;
  background: #3f88c5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
.btn:disabled {
  background: #555;
  cursor: not-allowed;
}
</style>