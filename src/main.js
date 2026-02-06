import { createApp } from 'vue'
import App from './App.vue'

const tg = window.Telegram?.WebApp

if (tg) {
  tg.ready()          
  tg.expand()         
  tg.disableVerticalSwipes() 
  tg.setBackgroundColor('#111')
}

window.API_BASE = "https://dwntwncoffee.ru"

createApp(App).mount('#app')