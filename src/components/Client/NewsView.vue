<template>
  <div class="news-wrapper">
    <div v-if="announcement" class="main-announcement glass" @click="openDetail(announcement)">
      <div class="badge">ВАЖНО</div>
      <img :src="announcement.image_url" class="ann-img" v-if="announcement.image_url" />
      <div class="ann-body">
        <h2>{{ announcement.title }}</h2>
        <p>{{ announcement.description.substring(0, 80) }}...</p>
      </div>
    </div>

    <div class="section" v-if="novelties.length">
      <h3 class="title">Новинки</h3>
      <div class="horizontal-scroll">
        <div v-for="item in novelties" :key="item.id" class="card-novelty glass" @click="openDetail(item)">
          <div class="card-img">
            <img :src="item.image_url" v-if="item.image_url" />
          </div>
          <div class="card-body">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="section last-section" v-if="promotions.length">
      <h3 class="title">Акции</h3>
      <div class="horizontal-scroll">
        <div v-for="promo in promotions" :key="promo.id" class="card-promo glass" @click="openDetail(promo)">
          <div class="promo-img">
            <img :src="promo.image_url" v-if="promo.image_url" />
            <span v-else>🔥</span>
          </div>
          <h4>{{ promo.title }}</h4>
        </div>
      </div>
    </div>

    <div v-if="selectedItem" class="modal-root" @click="closeDetail">
      <div class="modal-window glass" @click.stop>
        <button class="close-x" @click="closeDetail">✕</button>
        <img :src="selectedItem.image_url" class="modal-big-img" v-if="selectedItem.image_url" />
        <div class="modal-text">
          <span class="type-label">{{ selectedItem.type }}</span>
          <h2>{{ selectedItem.title }}</h2>
          <div class="desc">{{ selectedItem.description }}</div>
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
const selectedItem = ref(null)

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

const openDetail = (item) => {
  selectedItem.value = item
  document.body.style.overflow = 'hidden'
}

const closeDetail = () => {
  selectedItem.value = null
  document.body.style.overflow = 'auto'
}

onMounted(loadNotifications)
</script>
<style scoped>
  /* ГЛОБАЛЬНЫЕ СТИЛИ КОНТЕЙНЕРА */
  .news-wrapper {
    padding: 15px;
    color: white;
    max-width: 100vw;
    overflow-x: hidden;
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    overflow: hidden;
  }
  
  .section { margin-top: 25px; }
  .title { font-size: 1.2rem; margin: 0 0 12px 5px; font-weight: bold; }
  .last-section { margin-bottom: 50px; }
  
  /* ОБЪЯВЛЕНИЕ */
  .main-announcement { position: relative; margin-bottom: 20px; width: 100%; }
  .badge {
    position: absolute; top: 12px; right: 12px;
    background: #ff4d4f; padding: 4px 10px;
    border-radius: 8px; font-size: 10px; font-weight: 900; z-index: 2;
  }
  .ann-img { width: 100%; height: 180px; object-fit: cover; }
  .ann-body { padding: 15px; }
  .ann-body h2 { margin: 0 0 5px; font-size: 1.3rem; }
  .ann-body p { color: #ccc; font-size: 0.9rem; }
  
  /* ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ (УНИВЕРСАЛЬНЫЙ) */
  .horizontal-scroll {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 15px;
    padding-bottom: 10px;
    scrollbar-width: none;
  }
  .horizontal-scroll::-webkit-scrollbar { display: none; }
  
  /* КАРТОЧКА НОВИНКИ */
  .card-novelty {
    flex: 0 0 80vw; /* Четкий размер: 80% ширины экрана */
    scroll-snap-align: center;
    display: flex;
    flex-direction: column;
  }
  .card-img { width: 100%; height: 150px; background: rgba(0,0,0,0.2); }
  .card-img img { width: 100%; height: 100%; object-fit: cover; }
  .card-body { padding: 15px; }
  .card-body h3 { margin: 0 0 8px; font-size: 1.1rem; }
  .card-body p { 
    font-size: 0.9rem; color: #bbb; 
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  
  /* КАРТОЧКА АКЦИИ */
  .card-promo { flex: 0 0 130px; padding: 10px; text-align: center; }
  .promo-img { 
    width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden;
    background: rgba(0,0,0,0.2); margin-bottom: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 2rem;
  }
  .promo-img img { width: 100%; height: 100%; object-fit: cover; }
  .card-promo h4 { font-size: 0.85rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  /* МОДАЛЬНОЕ ОКНО (ЖЕСТКОЕ ЦЕНТРИРОВАНИЕ) */
  .modal-root {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.9);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;    /* СТРОГО ЦЕНТР */
    justify-content: center; /* СТРОГО ЦЕНТР */
    z-index: 99999;
  }
  
  .modal-window {
    width: 90%;
    max-width: 400px;
    max-height: 80vh;
    position: relative;
    overflow-y: auto;
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  }
  
  .close-x {
    position: absolute; top: 15px; right: 15px;
    width: 35px; height: 35px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.3);
    color: white; font-size: 20px; z-index: 10;
    display: flex; align-items: center; justify-content: center;
  }
  
  .modal-big-img { width: 100%; max-height: 250px; object-fit: cover; }
  .modal-text { padding: 25px; }
  .type-label { 
    display: inline-block; background: #4dabf7; padding: 3px 8px; 
    border-radius: 5px; font-size: 10px; font-weight: bold; margin-bottom: 15px;
    text-transform: uppercase;
  }
  .modal-text h2 { margin: 0 0 15px; font-size: 1.5rem; }
  .desc { line-height: 1.6; color: #ddd; white-space: pre-wrap; font-size: 1rem; }
  </style>