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
          <p>{{ announcement.description.substring(0, 100) }}...</p>
        </div>
      </div>

      <div v-if="novelties.length > 0" class="section-container">
        <h3 class="section-title">Новинки</h3>
        <div class="novelties-slider-native">
          <div v-for="item in novelties" :key="item.id" 
               class="novelty-slide-card glass" @click="openDetail(item)">
            <img v-if="item.image_url" :src="item.image_url" />
            <div class="slide-body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="promotions.length > 0" class="section-container">
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
          <div class="modal-type-tag" v-if="selectedItem.type">
            {{ selectedItem.type === 'promotion' ? 'Акция' : selectedItem.type === 'novelty' ? 'Новинка' : 'Инфо' }}
          </div>
          <h2>{{ selectedItem.title }}</h2>
          <div class="modal-description">{{ selectedItem.description }}</div>
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
}

.novelties-wrapper {
  position: relative;
  margin: 0 -12px; /* Вывод слайдера за поля для красоты */
}

.novelties-slider-native {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory; /* Магнитный эффект */
  scroll-behavior: smooth;
  gap: 12px;
  padding: 0 12px 15px; /* Нижний паддинг, чтобы текст не прилипал */
  scrollbar-width: none; /* Скрываем скроллбар FF */
}

.novelties-slider-native::-webkit-scrollbar {
  display: none; /* Скрываем скроллбар Chrome/Safari */
}

.novelty-slide-card {
  flex: 0 0 85vw; /* Слайд занимает 85% ширины экрана */
  scroll-snap-align: center; /* Центрирование при скролле */
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 320px; /* Фиксируем минимальную высоту, чтобы не скакало */
}

.slide-image-box {
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
}

.slide-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-body {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.slide-body h3 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #fff;
}

.slide-body p {
  margin: 0;
  font-size: 0.95rem;
  color: #ccc;
  line-height: 1.4;
  /* Ограничение текста, если его слишком много */
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scroll-hint {
  text-align: right;
  font-size: 10px;
  color: rgba(255,255,255,0.3);
  padding-right: 20px;
  margin-top: -10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

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

.promo-last {
  margin-bottom: 30px;
}
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

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85); /* Затемнение */
  backdrop-filter: blur(10px); /* Размытие фона за окном */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-card {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  position: relative;
  overflow-y: auto; /* Если текст очень длинный */
  display: flex;
  flex-direction: column;
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* Кнопка закрытия */
.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.modal-image-container {
  width: 100%;
  max-height: 250px;
  overflow: hidden;
}

.modal-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-content-area {
  padding: 20px;
}

.modal-type-tag {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  background: #4dabf7;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-weight: bold;
}

.modal-content-area h2 {
  margin: 0 0 12px 0;
  font-size: 1.4rem;
}

.modal-description {
  font-size: 1rem;
  line-height: 1.5;
  color: #ddd;
  white-space: pre-wrap; /* Сохраняет переносы строк из базы */
}

/* Скрываем скролл модалки для чистоты */
.modal-card::-webkit-scrollbar {
  display: none;
}
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

const selectedItem = ref(null);

const openDetail = (item) => {
  selectedItem.value = item;
  document.body.style.overflow = 'hidden';
};

const closeDetail = () => {
  selectedItem.value = null;
  document.body.style.overflow = 'auto';
};

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
