<template>
  <div v-if="isAnniversary" class="anniversary-banner">
    🎉 Сегодня ваша годовщина в программе лояльности!
  </div>

  <div class="card glass">
    <h3>Ваша карта</h3>
    <div class="qr-container">
      <div class="qr-wrapper">
        <qrcode-vue
          v-if="profile.card_number"
          :value="profile.card_number"
          :size="180"
          class="qr-code"
        />
        <div v-else class="qr-placeholder">Загрузка...</div>
      </div>
    </div>
    <div class="card-info">
      <div class="info-row">
        <span class="label">Уровень:</span>
        <span class="value" :class="`level-${profile.level.toLowerCase()}`">{{ profile.level }}</span>
      </div>
      <div class="info-row">
        <span class="label">Баланс:</span>
        <span class="value">{{ profile.points }} баллов</span>
      </div>
    </div>
  </div>

  <div class="card glass">
    <h3>Подарки за баллы</h3>
    <div v-if="gifts.length === 0" class="empty">Подарков пока нет 🙁</div>
    
    <div v-else class="gifts-slider">
      <div 
        v-for="gift in gifts" 
        :key="gift.id" 
        class="gift-card-new"
        :class="{ 'locked': gift.points_cost > profile.points }"
      >
        <div class="gift-image-wrapper">
          <img
            v-if="gift.image_url"
            :src="gift.image_url"
            :alt="gift.name"
            class="gift-image"
            @error="onImageError"
          />
          <div v-else class="gift-placeholder">🎁</div>
          
          <div v-if="gift.points_cost > profile.points" class="lock-icon">🔒</div>
        </div>
        
        <div class="gift-details">
          <h4 class="gift-name">{{ gift.name }}</h4>
          <div class="gift-cost">{{ gift.points_cost }} б.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card glass">
    <h3>История операций</h3>
    <div v-if="transactions.length === 0" class="empty">Нет операций</div>
    <div v-else class="transaction-list">
      <div v-for="t in transactions" :key="t.id" class="transaction-item">
        <div class="tx-main">
           <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
            {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
          </div>
          <div class="tx-desc">{{ t.description }}</div>
        </div>
        <div class="timestamp">{{ formatDateTime(t.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  profile: { type: Object, required: true },
  gifts: { type: Array, required: true },
  transactions: { type: Array, required: true }
})

const isAnniversary = computed(() => false)

const formatDateTime = (isoStr) => {
  const date = new Date(isoStr)
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const onImageError = (event) => {
  event.target.style.display = 'none'
}
</script>

<style scoped>
/* Эффект стекла для всех карточек */
.glass {
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card {
  border-radius: 16px;
  padding: 16px;
  margin: 12px;
  color: white;
}

.card h3 { margin: 0 0 16px 0; font-size: 1.1rem; }

/* СТИЛИ СЛАЙДЕРА */
.gifts-slider {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory; /* Прилипание */
  scrollbar-width: none; /* Скрыть скроллбар Firefox */
}

.gifts-slider::-webkit-scrollbar {
  display: none; /* Скрыть скроллбар Chrome/Safari */
}

.gift-card-new {
  flex: 0 0 130px; /* Фиксированная ширина карточки в слайдере */
  scroll-snap-align: start;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}


/* Состояние: Недостаточно баллов */
.gift-card-new.locked {
  opacity: 0.5;
  filter: grayscale(0.8);
}

.gift-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: rgba(0,0,0,0.2);
  border-radius: 10px;
  margin-bottom: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gift-image { width: 100%; height: 100%; object-fit: cover; }

.lock-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  background: rgba(0,0,0,0.3);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gift-name {
  font-size: 13px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gift-cost {
  color: #4dabf7;
  font-weight: bold;
  font-size: 12px;
}

/* ИСТОРИЯ */
.transaction-list { display: flex; flex-direction: column; gap: 10px; }
.transaction-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  border-radius: 10px;
}
.tx-main { display: flex; justify-content: space-between; margin-bottom: 4px; }
.tx-desc { font-size: 13px; color: #ccc; text-align: right; flex: 1; margin-left: 10px;}
.points-positive { color: #52c41a; font-weight: bold; }
.points-negative { color: #ff4d4f; font-weight: bold; }
.timestamp { font-size: 11px; color: #777; }

/* QR Код */
.qr-wrapper { background: white; padding: 12px; border-radius: 12px; display: inline-block; }
.qr-container { text-align: center; }
.card-info { background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px; margin-top: 15px; }
.info-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
.label { color: #999; }
</style>