<template>
  <div class="news-page">
    <div v-if="!announcement && novelties.length === 0 && promotions.length === 0" class="empty-news glass">
      Новостей пока что нет...
    </div>

    <div v-else>
      <div v-if="announcement" class="announcement-card glass" @click="openDetail(announcement)">
        <div class="announcement-badge">Важно</div>
        <img v-if="announcement.image_url" :src="announcement.image_url" class="ann-img" />
        <div class="announcement-content">
          <h2>{{ announcement.title }}</h2>
          <p>{{ announcement.description.substring(0, 80) }}...</p>
        </div>
      </div>

      <div v-if="novelties.length > 0" class="section-container">
        <h3 class="section-title">Новинки</h3>
        <div class="novelties-slider-native">
          <div v-for="item in novelties" :key="item.id" 
               class="novelty-slide-card glass" @click="openDetail(item)">
            <div class="slide-image-box">
              <img v-if="item.image_url" :src="item.image_url" />
              <div v-else class="img-placeholder">☕</div>
            </div>
            <div class="slide-body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="promotions.length > 0" class="section-container promo-last">
        <h3 class="section-title">Акции</h3>
        <div class="promotions-slider">
          <div v-for="promo in promotions" :key="promo.id" 
               class="promo-item glass" @click="openDetail(promo)">
            <div class="promo-img-wrapper">
              <img v-if="promo.image_url" :src="promo.image_url" />
              <div v-else class="promo-placeholder">🔥</div>
            </div>
            <h4>{{ promo.title }}</h4>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedItem" class="modal-overlay" @click="closeDetail">
      <div class="modal-card glass" @click.stop>
        <button class="modal-close-btn" @click="closeDetail">✕</button>
        <div class="modal-image-container" v-if="selectedItem.image_url">
          <img :src="selectedItem.image_url" />
        </div>
        <div class="modal-content-area">
          <div class="modal-type-tag">
            {{ selectedItem.type === 'promotion' ? 'Акция' : selectedItem.type === 'novelty' ? 'Новинка' : 'Инфо' }}
          </div>
          <h2>{{ selectedItem.title }}</h2>
          <div class="modal-description">{{ selectedItem.description }}</div>
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
  } catch (e) {
    console.error("Ошибка загрузки новостей:", e)
  }
}

const openDetail = (item) => {
  selectedItem.value = item
  document.body.style.overflow = 'hidden'
}

const closeDetail = () => {
  selectedItem.value = null
  document.body.style.overflow = 'auto'
}

onMounted(() => {
  loadNotifications()
})
</script>
<style scoped>
  /* Глобальные настройки страницы */
  .news-page {
    padding: 16px;
    color: white;
    overflow-x: hidden; /* Защита от вылетания карточек */
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
  }
  
  .section-container { margin-top: 24px; }
  .section-title { font-size: 1.2rem; margin: 0 0 12px 4px; font-weight: bold; }
  
  /* ОБЪЯВЛЕНИЕ */
  .announcement-card {
    position: relative;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .announcement-badge {
    position: absolute; top: 12px; right: 12px;
    background: #ff4d4f; padding: 3px 10px;
    border-radius: 6px; font-size: 11px; font-weight: bold; z-index: 2;
  }
  .ann-img { width: 100%; height: 180px; object-fit: cover; }
  .announcement-content { padding: 16px; }
  .announcement-content h2 { margin: 0 0 8px; font-size: 1.3rem; }
  .announcement-content p { color: #ccc; font-size: 0.95rem; margin: 0; }
  
  /* НОВИНКИ (СЛАЙДЕР) */
  .novelties-slider-native {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 16px;
    padding-bottom: 10px;
    scrollbar-width: none;
  }
  .novelties-slider-native::-webkit-scrollbar { display: none; }
  
  .novelty-slide-card {
    flex: 0 0 82vw; /* Немного уменьшил, чтобы следующий слайд был виден краем */
    scroll-snap-align: center;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .slide-image-box { width: 100%; height: 160px; }
  .slide-image-box img { width: 100%; height: 100%; object-fit: cover; }
  .slide-body { padding: 16px; }
  .slide-body h3 { margin: 0 0 8px; font-size: 1.1rem; }
  .slide-body p { 
    font-size: 0.9rem; color: #bbb; 
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }
  
  /* АКЦИИ */
  .promotions-slider {
    display: flex;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 10px;
    scrollbar-width: none;
  }
  .promotions-slider::-webkit-scrollbar { display: none; }
  .promo-item { flex: 0 0 130px; padding: 10px; text-align: center; }
  .promo-img-wrapper { 
    width: 100%; aspect-ratio: 1; border-radius: 12px; 
    overflow: hidden; background: rgba(0,0,0,0.2); margin-bottom: 8px;
  }
  .promo-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
  .promo-info h4 { font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  
  /* МОДАЛКА */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
  }
  .modal-card {
    width: 100%; max-width: 400px; max-height: 85vh;
    position: relative; overflow-y: auto;
  }
  .modal-close-btn {
    position: absolute; top: 12px; right: 12px;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.2);
    color: white; font-size: 20px; z-index: 10;
  }
  .modal-image-container img { width: 100%; max-height: 250px; object-fit: cover; }
  .modal-content-area { padding: 20px; }
  .modal-type-tag {
    display: inline-block; background: #4dabf7; padding: 4px 10px;
    border-radius: 6px; font-size: 11px; font-weight: bold; margin-bottom: 12px;
  }
  .modal-description { white-space: pre-wrap; color: #ddd; line-height: 1.5; }
  
  .promo-last { margin-bottom: 40px; }
  </style>