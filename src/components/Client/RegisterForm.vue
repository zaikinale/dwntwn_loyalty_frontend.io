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
  import { vMaska } from "maska/vue"
  
  const tg = window.Telegram?.WebApp
  
  const form = ref({
    lastName: '', firstName: '', phone: '',
    birthDate: '', gender: '', email: ''
  })
  const consentGiven = ref(false)
  const loading = ref(false)
  const modalOpen = ref(false)
  const currentModal = ref('')
  
  const MODALS_DATA = {
  rules: {
    title: 'Правила программы',
    lines: [
      { type: 'h4', text: '1. Участие' },
      { type: 'p', text: 'Программа доступна всем гостям кофеен DWNTWN. Требуется регистрация через Telegram Mini App.' },
      
      { type: 'h4', text: '2. Начисление бонусов' },
      { type: 'p', text: 'Бонусы начисляются в зависимости от уровня карты: PLATINA (10%), GOLD (7%), SILVER (5%), BRONZE (3%), IRON (1%).' },
      { type: 'p', text: 'Бонусы округляются в меньшую сторону до целого числа. Бонусы не являются денежными средствами. Бонусы не могут использоваться как скидка при оплате и не передаются третьим лицам.' },
      
      { type: 'h4', text: '3. Обмен бонусов' },
      { type: 'p', text: 'Обмен возможен только на подарки из каталога. После обмена бонусы списываются безвозвратно.' },
      
      { type: 'h4', text: '4. Акции' },
      { type: 'p', text: 'Акции не суммируются. При использовании специальных предложений бонусы не начисляются.' },
      
      { type: 'h4', text: '5. Срок действия' },
      { type: 'p', text: 'Бонусы действительны в течение 12 месяцев с даты их начисления.' },
      
      { type: 'h4', text: '6. Выход из программы' },
      { type: 'p', text: 'При выходе данные (бонусы, история, профиль) удаляются без возможности восстановления.' },
      
      { type: 'h4', text: '7. Изменение правил' },
      { type: 'p', text: 'Мы можем обновлять правила. Изменения вступают в силу через 10 дней после уведомления в боте.' }
    ]
  },
  privacy: {
    title: 'Конфиденциальность',
    lines: [
      { type: 'h4', text: '1. Сбор данных' },
      { type: 'p', text: 'Мы собираем: ФИО, телефон, email, дату рождения, пол и Telegram ID только для работы программы.' },
      
      { type: 'h4', text: '2. Цели обработки' },
      { type: 'p', text: 'Идентификация участника, начисление бонусов и техническое управление аккаунтом.' },
      
      { type: 'h4', text: '3. Хранение и передача' },
      { type: 'p', text: 'Данные хранятся на серверах в РФ и не передаются третьим лицам.' },
      
      { type: 'h4', text: '4. Удаление данных' },
      { type: 'p', text: 'При выходе из программы данные удаляются в течение 24 часов в соответствии с ФЗ-152.' },
      
      { type: 'h4', text: '5. Безопасность' },
      { type: 'p', text: 'Мы применяем технические и организационные меры для полной защиты ваших данных.' }
    ]
  }
};
  
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
          window.location.reload()
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