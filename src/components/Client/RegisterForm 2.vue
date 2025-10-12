<template>
  <div class="card">
    <div style="background:#222; padding:16px; border-radius:8px; margin:20px 0; font-size:14px;">
      Для использования полного функционала бота необходимо зарегистрироваться
    </div>

    <div class="form-group">
      <label>Фамилия</label>
      <input v-model="form.lastName" placeholder="Иванович" />
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

    <button @click="submit" class="btn" :disabled="!isValid">
      РЕГИСТРАЦИЯ
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['registered'])

const form = ref({
  lastName: '',
  firstName: '',
  phone: '',
  birthDate: '',
  gender: '',
  email: ''
})

const isValid = computed(() => {
  return form.value.lastName && form.value.firstName
})

const submit = async () => {
  try {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || { id: 123456789 }
    const res = await fetch(`${window.API_BASE}/api/client/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: tgUser.id,
        first_name: form.value.firstName,
        last_name: form.value.lastName,
        phone: form.value.phone || null,
        email: form.value.email || null, 
        birth_date: form.value.birthDate || null,
        gender: form.value.gender || null
      })
    })
    if (res.ok) {
      emit('registered')
    } else {
      alert("Ошибка регистрации")
    }
  } catch (e) {
    alert("Ошибка подключения")
  }
}
</script>