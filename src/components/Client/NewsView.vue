<template>
  <div class="news-page">
    <div v-if="!announcement && novelties.length === 0 && promotions.length === 0" class="empty-news glass">
      Новостей пока что нет, но они скоро появятся!
    </div>

    <div v-else>
      <div v-if="announcement" class="announcement-card glass">
        <div class="announcement-badge">Важно</div>
        <img v-if="announcement.image_url" :src="announcement.image_url" alt="Объявление" class="ann-img" />
        <div class="announcement-content">
          <h2>{{ announcement.title }}</h2>
          <p>{{ announcement.description }}</p>
        </div>
      </div>

      <div v-if="novelties.length > 0" class="section-container">
        <h3 class="section-title">Новинки</h3>
        <div class="novelties-slider glass">
          <div class="slider-container" 
               @touchstart="handleTouchStart" @touchend="handleTouchEnd">
            <div v-for="(item, index) in novelties" :key="item.id" 
                 class="slide" :class="{ active: currentIndex === index }">
              <img v-if="item.image_url" :src="item.image_url" alt="Новинка" />
              <div class="slide-content">
                <h3>{{ item.title }}</h3>
                <p>{{ item.description }}</p>
              </div>
            </div>
          </div>
          <div class="slider-dots">
            <span v-for="(item, index) in novelties" :key="item.id"
                  :class="{ active: currentIndex === index }" @click="goToSlide(index)"></span>
          </div>
        </div>
      </div>

      <div v-if="promotions.length > 0" class="section-container">
        <h3 class="section-title">Акции</h3>
        <div class="promotions-slider">
          <div v-for="promo in promotions" :key="promo.id" 
               class="promo-item glass" @click="openPromoDetail(promo)">
            <div class="promo-img-wrapper">
              <img v-if="promo.image_url" :src="promo.image_url" :alt="promo.title" />
              <div v-else class="promo-placeholder">🔥</div>
            </div>
            <div class="promo-info">
              <h4>{{ promo.title }}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedPromo" class="modal-overlay" @click="closePromoDetail">
      <div class="modal-content glass" @click.stop>
        <button class="modal-close" @click="closePromoDetail">×</button>
        <div class="modal-body">
          <img v-if="selectedPromo.image_url" :src="selectedPromo.image_url" class="modal-img-full" />
          <div class="modal-text">
            <h2>{{ selectedPromo.title }}</h2>
            <p>{{ selectedPromo.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Эффект стекла */
.glass {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.news-page { padding: 12px; color: white; }
.section-container { margin-top: 20px; }
.section-title { font-size: 1.1rem; margin: 0 0 12px 4px; color: #fff; }

/* ОБЪЯВЛЕНИЕ */
.announcement-card {
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}
.announcement-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d4f;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
}
.ann-img { width: 100%; height: 160px; object-fit: cover; }
.announcement-content { padding: 15px; }
.announcement-content h2 { font-size: 1.2rem; margin: 0 0 5px; }
.announcement-content p { font-size: 0.9rem; color: #ccc; margin: 0; }

/* НОВИНКИ (СЛАЙДЕР) */
.novelties-slider { position: relative; height: 260px; }
.slider-container { height: 220px; position: relative; }
.slide {
  position: absolute; width: 100%; height: 100%;
  opacity: 0; transition: opacity 0.5s;
}
.slide.active { opacity: 1; }
.slide img { width: 100%; height: 140px; object-fit: cover; border-radius: 16px 16px 0 0; }
.slide-content { padding: 12px; }
.slide-content h3 { font-size: 1rem; margin: 0 0 4px; }
.slide-content p { font-size: 0.85rem; color: #bbb; }
.slider-dots { display: flex; justify-content: center; gap: 6px; padding-bottom: 10px; }
.slider-dots span { width: 6px; height: 6px; border-radius: 50%; background: #555; }
.slider-dots span.active { background: #4dabf7; width: 15px; border-radius: 10px; }

/* АКЦИИ (ГОРИЗОНТАЛЬНЫЙ СЛАЙДЕР) */
.promotions-slider {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 10px;
  scrollbar-width: none;
}
.promotions-slider::-webkit-scrollbar { display: none; }
.promo-item {
  flex: 0 0 140px;
  padding: 8px;
  text-align: center;
}
.promo-img-wrapper {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  margin-bottom: 8px;
}
.promo-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.promo-info h4 { font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* МОДАЛКА */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-content { width: 100%; max-width: 400px; position: relative; overflow: hidden;}
.modal-close { position: absolute; top: 10px; right: 10px; font-size: 30px; color: white; background: none; border: none; z-index: 10; }
.modal-img-full { width: 100%; max-height: 250px; object-fit: cover; }
.modal-text { padding: 20px; }
</style>
<style scoped>
/* Эффект стекла */
.glass {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.news-page { padding: 12px; color: white; }
.section-container { margin-top: 20px; }
.section-title { font-size: 1.1rem; margin: 0 0 12px 4px; color: #fff; }

/* ОБЪЯВЛЕНИЕ */
.announcement-card {
  position: relative;
  overflow: hidden;
  margin-bottom: 20px;
}
.announcement-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4d4f;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: bold;
  z-index: 2;
}
.ann-img { width: 100%; height: 160px; object-fit: cover; }
.announcement-content { padding: 15px; }
.announcement-content h2 { font-size: 1.2rem; margin: 0 0 5px; }
.announcement-content p { font-size: 0.9rem; color: #ccc; margin: 0; }
/* НОВИНКИ (СЛАЙДЕР) */
.novelties-slider { position: relative; height: 260px; }
.slider-container { height: 220px; position: relative; }
.slide {
  position: absolute; width: 100%; height: 100%;
  opacity: 0; transition: opacity 0.5s;
}
.slide.active { opacity: 1; }
.slide img { width: 100%; height: 140px; object-fit: cover; border-radius: 16px 16px 0 0; }
.slide-content { padding: 12px; }
.slide-content h3 { font-size: 1rem; margin: 0 0 4px; }
.slide-content p { font-size: 0.85rem; color: #bbb; }
.slider-dots { display: flex; justify-content: center; gap: 6px; padding-bottom: 10px; }
.slider-dots span { width: 6px; height: 6px; border-radius: 50%; background: #555; }
.slider-dots span.active { background: #4dabf7; width: 15px; border-radius: 10px; }

/* АКЦИИ (ГОРИЗОНТАЛЬНЫЙ СЛАЙДЕР) */
.promotions-slider {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 10px;
  scrollbar-width: none;
}
.promotions-slider::-webkit-scrollbar { display: none; }
.promo-item {
  flex: 0 0 140px;
  padding: 8px;
  text-align: center;
}
.promo-img-wrapper {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  margin-bottom: 8px;
}
.promo-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
.promo-info h4 { font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* МОДАЛКА */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8); z-index: 2000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-content { width: 100%; max-width: 400px; position: relative; overflow: hidden;}
.modal-close { position: absolute; top: 10px; right: 10px; font-size: 30px; color: white; background: none; border: none; z-index: 10; }
.modal-img-full { width: 100%; max-height: 250px; object-fit: cover; }
.modal-text { padding: 20px; }
</style>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const announcement = ref(null)
const novelties = ref([])
const promotions = ref([])
const currentIndex = ref(0)
const selectedPromo = ref(null)
let sliderInterval = null

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

let touchStartX = 0
let mouseStartX = 0
let isDragging = false

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX
  clearInterval(sliderInterval)
}

const handleTouchEnd = (e) => {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      goToSlide(currentIndex.value + 1)
    } else {
      goToSlide(currentIndex.value - 1)
    }
  } else {
    startAutoSlide()
  }
}

const handleMouseDown = (e) => {
  mouseStartX = e.clientX
  isDragging = true
  clearInterval(sliderInterval)
}

const handleMouseUp = () => {
  if (isDragging) {
    isDragging = false
    startAutoSlide()
  }
}

const handleMouseLeave = () => {
  if (isDragging) {
    isDragging = false
    startAutoSlide()
  }
}

const startAutoSlide = () => {
  sliderInterval = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % novelties.value.length
  }, 5000)
}

const goToSlide = (index) => {
  const total = novelties.value.length
  if (total === 0) return

  if (index < 0) index = total - 1
  if (index >= total) index = 0

  currentIndex.value = index
  clearInterval(sliderInterval)
  startAutoSlide()
}

const openPromoDetail = (promo) => {
  selectedPromo.value = promo
}

const closePromoDetail = () => {
  selectedPromo.value = null
}

onMounted(() => {
  loadNotifications()
  if (novelties.value.length > 1) {
    startAutoSlide()
  }
})

onUnmounted(() => {
  if (sliderInterval) clearInterval(sliderInterval)
})

</script>
