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

    <!-- Согласие -->
    <div class="form-group consent-section">
      <label class="consent-label">
        <input
          class="consent-btn"
          type="checkbox"
          v-model="consentGiven"
          required
        />
        Я принимаю 
        <a href="#" @click.prevent="openModal('rules')">Правила программы</a>,
        <a href="#" @click.prevent="openModal('privacy')">Политику конфиденциальности</a>
        и даю согласие на обработку персональных данных.
      </label>
      <p class="disclaimer">
        Разработчик не несёт ответственности за технические сбои, утрату бонусов, недоступность сервиса, а также за любые прямые или косвенные убытки, связанные с использованием программы лояльности.
      </p>
    </div>

    <button
      @click="submit"
      class="btn"
      :disabled="!isValid || !consentGiven || loading"
    >
      {{ loading ? 'ОТПРАВКА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
    </button>
  </div>

  <!-- Модальное окно -->
  <div v-if="modalOpen" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ modalTitle }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-body" v-html="modalContent"></div>
      <div class="modal-footer">
        <button class="btn-small" @click="closeModal">Закрыть</button>
      </div>
    </div>
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
const consentGiven = ref(false)
const loading = ref(false)
const modalOpen = ref(false)
const currentModal = ref('')

const isValid = computed(() => {
  return form.value.lastName.trim() && form.value.firstName.trim()
})

// Тексты модалок
const MODALS = {
  rules: {
    title: 'Правила программы лояльности',
    content: `
      <p><strong>1. Участие</strong><br>Программа доступна всем гостям кофеен dwntwn. Требуется регистрация через Telegram Mini App.</p>

      <p><strong>2. Начисление бонусов</strong><br>Бонусы начисляются за покупки в зависимости от уровня карты:</p>
      <ul>
        <li>PLATINA — 10%</li>
        <li>GOLD — 7%</li>
        <li>SILVER — 5%</li>
        <li>BRONZE — 3%</li>
        <li>IRON — 1%</li>
      </ul>
      <p>Бонусы округляются в меньшую сторону. Бонусы ≠ рубли.</p>

      <p><strong>3. Обмен бонусов</strong><br>Только на подарки из каталога «Подарки». После обмена бонусы списываются безвозвратно.</p>

      <p><strong>4. Акции</strong><br>Акции не суммируются. При использовании акции бонусы не начисляются.</p>

      <p><strong>5. Срок действия</strong><br>Бонусы действительны 12 месяцев с даты начисления.</p>

      <p><strong>6. Выход из программы</strong><br>Вы можете покинуть программу в любой момент. Все данные (бонусы, история, профиль) будут удалены без возможности восстановления. Повторная регистрация разрешена.</p>

      <p><strong>7. Изменение правил</strong><br>Мы можем обновлять правила. Изменения вступают в силу через 10 дней после уведомления в Telegram-боте @dwntwn_coffee_bot.</p>
    `
  },
  privacy: {
    title: 'Политика конфиденциальности',
    content: `
      <p><strong>1. Сбор данных</strong><br>Мы собираем: ФИО, телефон, email, дату рождения, пол и Telegram ID — только для работы программы лояльности.</p>

      <p><strong>2. Цели обработки</strong><br>— Идентификация участника;<br>— Начисление бонусов;<br>— Управление аккаунтом.</p>

      <p><strong>3. Хранение</strong><br>Данные хранятся на серверах на территории РФ.</p>

      <p><strong>4. Передача третьим лицам</strong><br>Не осуществляется.</p>

      <p><strong>5. Удаление данных</strong><br>При выходе из программы все персональные данные удаляются в течение 24 часов в соответствии с ФЗ-152 «О персональных данных».</p>

      <p><strong>6. Отзыв согласия</strong><br>Вы можете отозвать согласие в любой момент через функцию «Покинуть программу».</p>

      <p><strong>7. Безопасность</strong><br>Мы применяем технические и организационные меры для защиты ваших данных.</p>
    `
  }
}

const modalTitle = computed(() => MODALS[currentModal.value]?.title || '')
const modalContent = computed(() => MODALS[currentModal.value]?.content || '')

const openModal = (key) => {
  currentModal.value = key
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  currentModal.value = ''
}

// === Остальной код регистрации (без изменений) ===
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

onMounted(() => {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.expand()
    tg.ready()
    setTimeout(() => {
      const firstInput = document.querySelector('input')
      if (firstInput) firstInput.focus()
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
  background: #111;
  border-radius: 12px;
  color: white;
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

.consent-section {
  margin-top: 16px;
  font-size: 13px;
}
.consent-label {
  display: flex;
  gap: 4px;
  line-height: 1.4;
  color: #ccc;
}
.consent-label input {
  transform: scale(1.1);
}
.disclaimer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
  color: #888;
  line-height: 1.4;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: #1a1a1a;
  color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 16px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.close-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  color: white;
}
.modal-body {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
}
.modal-body ul {
  padding-left: 20px;
  margin: 8px 0;
}
.modal-body li {
  margin-bottom: 4px;
}
.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
  text-align: right;
}
.btn-small {
  background: #3f88c5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
}
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
.consent-btn {
  width: 20px !important;
}
</style>