<template>
  <div class="card">
    <div class="info-banner">
      Для использования полного функционала необходимо зарегистрироваться
    </div>

    <div class="form-group">
      <label>Фамилия</label>
      <input v-model="form.lastName" placeholder="Иванов" @input="v$.lastName.$touch()" />
    </div>
    
    <div class="form-group">
      <label>Имя</label>
      <input v-model="form.firstName" placeholder="Иван" />
    </div>

    <div class="form-group">
      <label>Телефон</label>
      <input 
        v-model="form.phone" 
        type="tel" 
        placeholder="+7 (999) 123-45-67"
        v-maska data-maska="+7 (###) ###-##-##"
      />
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

    <div class="form-group consent-section">
      <label class="consent-label">
        <input class="consent-btn" type="checkbox" v-model="consentGiven" />
        Я принимаю 
        <a href="#" @click.prevent="openModal('rules')">Правила</a> и 
        <a href="#" @click.prevent="openModal('privacy')">Политику конфиденциальности</a>
      </label>
    </div>

    <button
      @click="submit"
      class="btn"
      :disabled="!isValid || !consentGiven || loading"
    >
      {{ loading ? 'ОТПРАВКА...' : 'ЗАРЕГИСТРИРОВАТЬСЯ' }}
    </button>

    <div v-if="modalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
        </div>
        <div class="modal-body">
          <div v-for="(p, i) in modalContentLines" :key="i" class="modal-text-block">
            <p v-if="p.type === 'p'">{{ p.text }}</p>
            <strong v-if="p.type === 'h4'">{{ p.text }}</strong>
          </div>
        </div>
        <button class="btn-small" @click="closeModal">Закрыть</button>
      </div>
    </div>
  </div>
</template>
<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { vMaska } from "maska"
  
  const tg = window.Telegram?.WebApp
  
  const form = ref({
    lastName: '', firstName: '', phone: '',
    birthDate: '', gender: '', email: ''
  })
  const consentGiven = ref(false)
  const loading = ref(false)
  const modalOpen = ref(false)
  const currentModal = ref('')
  
  // Данные модалок вынесены в константы без HTML-тегов внутри строк для безопасности
  const MODALS_DATA = {
    rules: {
      title: 'Правила программы',
      lines: [
        { type: 'h4', text: '1. Участие' },
        { type: 'p', text: 'Программа доступна всем гостям кофеен через Telegram Mini App.' },
        { type: 'h4', text: '2. Бонусы' },
        { type: 'p', text: 'Начисление от 1% до 10% в зависимости от уровня.' }
      ]
    },
    privacy: {
      title: 'Конфиденциальность',
      lines: [
        { type: 'h4', text: '1. Данные' },
        { type: 'p', text: 'Мы собираем ФИО, телефон и Email для работы программы лояльности.' }
      ]
    }
  }
  
  const modalTitle = computed(() => MODALS_DATA[currentModal.value]?.title || '')
  const modalContentLines = computed(() => MODALS_DATA[currentModal.value]?.lines || [])
  
  const openModal = (key) => { currentModal.value = key; modalOpen.value = true }
  const closeModal = () => { modalOpen.value = false }
  
  const isValid = computed(() => {
    const f = form.value
    const phoneClean = f.phone.replace(/\D/g, '')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    return f.lastName.trim() && f.firstName.trim() && 
           phoneClean.length === 11 && emailRegex.test(f.email) &&
           f.birthDate && f.gender
  })
  
  const submit = async () => {
    if (!isValid.value) return
    
    loading.value = true
    const initData = tg?.initData || ""
  
    if (!initData) {
      tg?.showAlert("Ошибка: Запустите приложение через Telegram")
      loading.value = false
      return
    }
  
    try {
      const res = await fetch(`${window.API_BASE}/api/client/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          first_name: form.value.firstName,
          last_name: form.value.lastName,
          phone: form.value.phone.replace(/\D/g, ''),
          birth_date: form.value.birthDate,
          gender: form.value.gender,
          email: form.value.email
        })
      })
  
      if (res.ok) {
        tg?.showAlert("Регистрация успешна!", () => {
          window.location.reload() // Или переход на главную
        })
      } else {
        const err = await res.json()
        tg?.showConfirm(err.detail || "Ошибка регистрации")
      }
    } catch (e) {
      tg?.showAlert("Сетевая ошибка. Проверьте интернет.")
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    tg?.expand()
    tg?.ready()
  })
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