<template>
  <div class="news-page">
    <div class="scroll-container">
      
      <div v-if="announcement" class="news-card announcement glass" :class="{ 'expanded': expandedId === 'ann' }">
        <div class="card-tag urgent">Важно</div>
        <img v-if="announcement.image_url" :src="announcement.image_url" class="card-img-top" />
        <div class="card-content">
          <h2>{{ announcement.title }}</h2>
          <p class="description" :class="{ 'full-text': expandedId === 'ann' }">
            {{ announcement.description }}
          </p>
          <button class="detail-btn" @click="toggleExpand('ann')">
            {{ expandedId === 'ann' ? 'Свернуть' : 'Подробнее' }}
          </button>
        </div>
      </div>

      <div class="section-header" v-if="novelties.length">Новинки</div>
      <div v-for="item in novelties" :key="item.id" 
           class="news-card novelty glass" 
           :class="{ 'expanded': expandedId === 'nov-' + item.id }">
        <img v-if="item.image_url" :src="item.image_url" class="card-img-top" />
        <div class="card-content">
          <h3>{{ item.title }}</h3>
          <p class="description" :class="{ 'full-text': expandedId === 'nov-' + item.id }">
            {{ item.description }}
          </p>
          <button class="detail-btn" @click="toggleExpand('nov-' + item.id)">
            {{ expandedId === 'nov-' + item.id ? 'Свернуть' : 'Подробнее' }}
          </button>
        </div>
      </div>

      <div class="section-header" v-if="promotions.length">Акции</div>
      <div class="promotions-row">
        <div v-for="promo in promotions" :key="promo.id" class="promo-mini glass" @click="toggleExpand('pro-' + promo.id)">
          <div class="promo-icon">🔥</div>
          <div class="promo-info">
            <h4>{{ promo.title }}</h4>
            <div v-if="expandedId === 'pro-' + promo.id" class="promo-fade-in">
              {{ promo.description }}
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-spacer"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const announcement = ref(null)
const novelties = ref([])
const promotions = ref([])
const expandedId = ref(null)

const loadNotifications = async () => {
  try {
    const res = await fetch(`${window.API_BASE}/api/client/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: window.Telegram?.WebApp?.initData || '' })
    })
    const data = await res.json()
    announcement.value = data.find(n => n.type === 'announcement') || null
    novelties.value = data.filter(n => n.type === 'novelty')
    promotions.value = data.filter(n => n.type === 'promotion')
  } catch (e) { console.error(e) }
}

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

onMounted(loadNotifications)
</script>

<style scoped>
.news-page {
  height: 100vh;
  overflow-y: auto;
  color: white;
  padding: 12px;
  background: transparent;
}

.scroll-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
}

.section-header {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 10px 0 4px 6px;
}

/* КАРТОЧКА ОБЩАЯ */
.news-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.card-img-top {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: rgba(0,0,0,0.2);
}

.card-content {
  padding: 16px;
}

.card-content h2, .card-content h3 {
  margin: 0 0 8px 0;
  font-size: 1.3rem;
}

/* УПРАВЛЕНИЕ ТЕКСТОМ */
.description {
  font-size: 0.95rem;
  color: #ddd;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2; /* Скрываем лишнее */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description.full-text {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

.detail-btn {
  background: transparent;
  border: none;
  color: #4dabf7;
  padding: 10px 0 0 0;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
}

/* ТЭГИ */
.card-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
  z-index: 5;
}
.urgent { background: #ff4d4f; }

/* АКЦИИ */
.promotions-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.promo-mini {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.promo-icon { font-size: 1.5rem; }

.promo-fade-in {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #bbb;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.bottom-spacer {
  height: 100px; /* Чтобы контент не уходил под нижнюю навигацию */
}
</style>