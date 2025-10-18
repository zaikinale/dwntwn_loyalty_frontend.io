import { createApp } from 'vue'
import App from './App.vue'

// === ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP (КРИТИЧЕСКИ ВАЖНО) ===
const tg = window.Telegram?.WebApp

if (tg) {
  tg.ready()           // Разблокирует клики, фокус, клавиатуру
  tg.expand()          // Включает прокрутку
  tg.disableVerticalSwipes() // Отключает свайп закрытия (опционально)
  tg.setBackgroundColor('#111') // Подстройка под тёмную тему
}

// === ГЛОБАЛЬНЫЕ НАСТРОЙКИ ===
window.API_BASE = "https://dwntwn-loyalty-backend.onrender.com".trim()

// === ЗАПУСК ПРИЛОЖЕНИЯ ===
createApp(App).mount('#app')