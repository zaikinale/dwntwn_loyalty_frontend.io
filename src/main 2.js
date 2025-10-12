import { createApp } from 'vue'
import App from './App.vue'

// Глобальные настройки
window.API_BASE = "http://localhost:8000"

createApp(App).mount('#app')