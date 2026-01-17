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

    <button class="info-toggle-btn" @click="showCardInfo = !showCardInfo">
      {{ showCardInfo ? 'Скрыть' : 'Информация' }}
    </button>

    <div v-show="showCardInfo" class="card-info">
      <div class="info-row">
        <span class="label">Уровень:</span>
        <span class="value" :class="`level-${profile.level.toLowerCase()}`">{{ profile.level }}</span>
      </div>
      <div class="info-row">
        <span class="label">Баланс:</span>
        <span class="value">{{ profile.points }} баллов</span>
      </div>
      <div class="info-row">
        <span class="label">Заработано всего:</span>
        <span class="value">{{ profile.total_earned_points }} баллов</span>
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
          <div class="gift-cost">{{ gift.points_cost }} баллов</div>
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
import { computed, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'

const showCardInfo = ref(false)

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

.card:last-child {
  margin-bottom: 30px;
}

.gifts-slider {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 8px;
  scroll-snap-type: x mandatory;
  scrollbar-width: none; 
}

.gifts-slider::-webkit-scrollbar {
  display: none; 
}

.gift-card-new {
  flex: 0 0 130px;
  scroll-snap-align: start;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

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
.gift-placeholder { 
  min-width: 100%; 
  min-height: 100%; 
  display: flex;
  justify-content: center;
  align-items: center;
}

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
.card-info {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 12px;
  margin-top: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 14px;
}

.label {
  color: rgba(255, 255, 255, 0.6)
}

.value {
  font-weight: 600;
  color: #fff;
}

.level-bronze { color: #cd7f32; }
.level-silver { color: #c0c0c0; }
.level-gold { color: #ffd700; }
.level-platina { color: #e5e4e2; }

.transaction-list { display: flex; flex-direction: column; gap: 10px; }
.transaction-item {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  padding: 10px;
  border-radius: 10px;
}
.tx-main { 
  display: flex; 
  flex-direction: column;
  gap: 5px;
}
.tx-desc { font-size: 13px; color: #ccc; flex: 1; margin-left: 10px;}
.points-positive { color: #52c41a; font-weight: bold; }
.points-negative { color: #ff4d4f; font-weight: bold; }
.timestamp { 
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 11px; 
  color: rgba(255, 255, 255, 0.03); 
}

.qr-wrapper { background: white; padding: 12px; border-radius: 12px; display: inline-block; }
.qr-container { text-align: center; }
/* .card-info { background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px; margin-top: 15px; } */
/* .info-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; } */
/* .label { color: #999; } */
.info-toggle-btn {
  background: none;
  border: none;
  color: #4da6ff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  margin: 12px 0 0 0;
  text-align: left;
  width: 100%;
  border-radius: 6px;
  transition: background 0.2s;
}
.info-toggle-btn:hover {
  color: #1a8cff;
  background: rgba(77, 166, 255, 0.1);
}
</style>