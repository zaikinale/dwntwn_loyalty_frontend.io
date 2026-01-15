<template>
  <div class="news-page">
    <div v-if="!announcement && novelties.length === 0 && promotions.length === 0" class="empty-news">
      Новостей пока что нет, но они обязательно скоро появятся!
    </div>

    <!-- 1. ОБЪЯВЛЕНИЕ -->
    <div v-else>
      <div v-if="announcement" class="announcement">
        <img v-if="announcement.image_url" :src="announcement.image_url" alt="Объявление" />
        <div class="announcement-content">
          <h2>{{ announcement.title }}</h2>
          <p>{{ announcement.description }}</p>
        </div>
      </div>

      <!-- 2. НОВИНКИ -->
      <div v-if="novelties.length > 0" class="novelties-slider">
        <div 
          class="slider-container" 
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          @mousedown="handleMouseDown"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
        >
          <div
            v-for="(item, index) in novelties"
            :key="item.id"
            class="slide"
            :class="{ active: currentIndex === index }"
          >
            <img v-if="item.image_url" :src="item.image_url" alt="Новинка" />
            <div class="slide-content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
          </div>
        </div>
        <div class="slider-dots">
          <span
            v-for="(item, index) in novelties"
            :key="item.id"
            :class="{ active: currentIndex === index }"
            @click="goToSlide(index)"
          ></span>
        </div>
      </div>

      <!-- 3. АКЦИИ -->
      <div v-if="promotions.length > 0" class="promotions">
        <h2>Акции</h2>
        <div class="promotions-grid">
          <div
            v-for="promo in promotions"
            :key="promo.id"
            class="promo-card"
            @click="openPromoDetail(promo)"
          >
            <div class="promo-image-placeholder" v-if="!promo.image_url">🔥</div>
            <img v-else :src="promo.image_url" :alt="promo.title" />
            <h4>{{ promo.title }}</h4>
            <p>{{ promo.description.substring(0, 60) }}...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <div v-if="selectedPromo" class="modal-overlay" @click="closePromoDetail">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closePromoDetail">×</button>
        <div class="modal-body">
          <div class="modal-image" v-if="selectedPromo.image_url">
            <div class="modal-image-wrapper">
              <img :src="selectedPromo.image_url" :alt="selectedPromo.title" />
            </div>
          </div>
          <div class="modal-text">
            <h2>{{ selectedPromo.title }}</h2>
            <p>{{ selectedPromo.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

<style scoped>
.news-page {
  padding: 16px;
  max-width: 520px;
  margin: 0 auto;
  color: white;
}

.announcement {
  background: #222;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}
.announcement img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}
.announcement-content {
  padding: 16px;
}
.announcement-content h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

/* Новинки (слайдер) */
.novelties-slider {
  margin-bottom: 24px;
}
.slider-container {
  position: relative;
  height: 220px;
  overflow: hidden;
  border-radius: 12px;
  background: #222;
}
.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
  display: flex;
  flex-direction: column;
}
.slide.active {
  opacity: 1;
}
.slide img {
  width: 100%;
  height: 140px;
  object-fit: cover;
}
.slide-content {
  padding: 12px;
}
.slider-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}
.slider-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
  cursor: pointer;
}
.slider-dots span.active {
  background: #0d6efd;
}

.promotions h2 {
  margin-bottom: 16px;
  font-size: 20px;
}
.promotions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.promo-card {
  background: #222;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}
.promo-card:hover {
  transform: translateY(-2px);
}
.promo-image-placeholder {
  width: 100%;
  height: 80px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: 6px;
  margin-bottom: 8px;
}
.promo-card img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}
.promo-card h4 {
  font-size: 14px;
  margin-bottom: 6px;
}
.promo-card p {
  font-size: 12px;
  color: #aaa;
}

/* Модальное окно */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
  box-sizing: border-box;
}
.modal-content {
  background: #111;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  z-index: 1001;
}
.modal-body {
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: auto;
}
.modal-image {
  margin-bottom: 16px;
}
.modal-image-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #222;
  border-radius: 10px;
  overflow: hidden;
}
.modal-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@media (min-width: 500px) {
  .modal-body {
    flex-direction: row;
    gap: 20px;
    padding: 20px;
  }
  .modal-image {
    margin-bottom: 0;
    flex: 1;
  }
  .modal-text {
    flex: 1.5;
  }
}
.modal-text h2 {
  margin-bottom: 12px;
  font-size: 18px;
}

.empty-news {
  text-align: center;
  padding: 40px 20px;
  color: #aaa;
  font-size: 18px;
  font-style: italic;
  background: #1a1a1a;
  border-radius: 12px;
  margin-top: 16px;
}

</style>