<template>
  <div class="news-wrapper">
    <div v-if="announcement" class="main-announcement glass" :class="{ 'is-expanded': expandedId === 'ann' }">
      <div class="badge">ВАЖНО</div>
      <img :src="announcement.image_url" class="ann-img" v-if="announcement.image_url" />
      <div class="ann-body">
        <h2>{{ announcement.title }}</h2>
        <div class="text-content" :class="{ 'show-all': expandedId === 'ann' }">
          {{ announcement.description }}
        </div>
        <button class="expand-btn" @click="toggleExpand('ann')">
          {{ expandedId === 'ann' ? 'Свернуть' : 'Подробнее' }}
        </button>
      </div>
    </div>

    <div class="section" v-if="novelties.length">
      <h3 class="title">Новинки</h3>
      <div class="horizontal-scroll" :class="{ 'has-expanded': expandedId && expandedId.startsWith('nov-') }">
        <div 
          v-for="item in novelties" 
          :key="item.id" 
          class="card-novelty glass" 
          :class="{ 'is-expanded': expandedId === 'nov-' + item.id }"
        >
          <div class="card-img">
            <img :src="item.image_url" v-if="item.image_url" />
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <div class="text-content" :class="{ 'show-all': expandedId === 'nov-' + item.id }">
              {{ item.description }}
            </div>
            <button class="expand-btn" @click="toggleExpand('nov-' + item.id)">
              {{ expandedId === 'nov-' + item.id ? 'Свернуть' : 'Подробнее' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="section last-section" v-if="promotions.length">
      <h3 class="title">Акции</h3>
      <div class="horizontal-scroll">
        <div v-for="promo in promotions" :key="promo.id" class="card-promo glass" @click="toggleExpand('pro-' + promo.id)">
          <div class="promo-img">
            <img :src="promo.image_url" v-if="promo.image_url" />
            <span v-else>🔥</span>
          </div>
          <h4>{{ promo.title }}</h4>
          <div v-if="expandedId === 'pro-' + promo.id" class="promo-mini-desc">
            {{ promo.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const announcement = ref(null)
const novelties = ref([])
const promotions = ref([])
const expandedId = ref(null) // Хранит ID раскрытого элемента

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
  if (expandedId.value === id) {
    expandedId.value = null
  } else {
    expandedId.value = id
  }
}

onMounted(loadNotifications)
</script>
<style scoped>
  .news-wrapper {
    padding: 15px;
    color: white;
    overflow-x: hidden;
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .section { margin-top: 25px; }
  .title { font-size: 1.2rem; margin: 0 0 12px 5px; font-weight: bold; }
  
  /* ТЕКСТОВАЯ ЛОГИКА */
  .text-content {
    font-size: 0.9rem;
    color: #ccc;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2; /* В свернутом виде только 2 строки */
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  .text-content.show-all {
    display: block;
    -webkit-line-clamp: unset;
    overflow: visible;
    color: #fff;
  }
  
  .expand-btn {
    background: none;
    border: none;
    color: #4dabf7;
    padding: 8px 0 0;
    font-size: 0.85rem;
    font-weight: bold;
    cursor: pointer;
  }
  
  /* ОБЪЯВЛЕНИЕ */
  .main-announcement { position: relative; margin-bottom: 20px; }
  .main-announcement.is-expanded { transform: scale(1.02); }
  .badge {
    position: absolute; top: 12px; right: 12px;
    background: #ff4d4f; padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 900;
  }
  .ann-img { width: 100%; height: 180px; object-fit: cover; }
  .ann-body { padding: 15px; }
  
  /* ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ */
  .horizontal-scroll {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 15px;
    padding: 10px 5px 20px;
    scrollbar-width: none;
  }
  .horizontal-scroll::-webkit-scrollbar { display: none; }
  
  /* КАРТОЧКА НОВИНКИ */
  .card-novelty {
    flex: 0 0 80vw;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    height: max-content; /* Чтобы не срезалось */
  }
  
  .card-novelty.is-expanded {
    flex: 0 0 90vw; /* Немного увеличиваем при раскрытии */
    z-index: 10;
  }
  
  .card-img { width: 100%; height: 150px; }
  .card-img img { width: 100%; height: 100%; object-fit: cover; }
  .card-body { padding: 15px; }
  
  /* АКЦИИ */
  .card-promo { flex: 0 0 130px; padding: 10px; height: fit-content; }
  .promo-img { width: 100%; aspect-ratio: 1; border-radius: 12px; background: rgba(0,0,0,0.2); margin-bottom: 8px; display: flex; align-items: center; justify-content: center; }
  .promo-img img { width: 100%; height: 100%; object-fit: cover; }
  .promo-mini-desc { font-size: 0.75rem; color: #aaa; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 5px; }
  
  .last-section { margin-bottom: 60px; }
  </style>