<template>
  <div v-if="isAnniversary" class="anniversary-banner">
    🎉 Сегодня ваша годовщина в программе лояльности!
  </div>
  <!-- <div class="card glass">
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
      {{ showCardInfo ? '← Скрыть' : 'Информация →' }}
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
  </div> -->

  <div class="card-visual-container">
  <div 
    :class="['bank-card', `level-${profile.level.toLowerCase()}`]" 
    @click="showFullQR = !showFullQR"
  >
    <div class="card-chip"></div>
    <div class="card-top">
      <span class="brand">LOYALTY PASS</span>
      <div class="level-badge">{{ profile.level }}</div>
    </div>
    
    <div class="card-number">{{ profile.card_number || '•••• •••• •••• ••••' }}</div>

    <div class="card-footer">
      <div class="holder">
        <span class="card-label">Владелец</span>
        <span class="name">{{ profile.first_name || 'КЛИЕНТ' }}</span>
      </div>
      <div class="balance">
        <span class="card-label">Доступно</span>
        <span class="points">{{ profile.points }} ✨</span>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showFullQR" class="qr-overlay">
        <div class="qr-white-box">
          <qrcode-vue 
            v-if="profile.card_number" 
            :value="profile.card_number" 
            :size="150" 
            render-as="svg"
          />
          <p class="qr-tap-hint">Нажмите, чтобы скрыть</p>
        </div>
      </div>
    </transition>
  </div>
</div>

  <div v-if="nextLevelInfo" class="level-progress-container">
    <div class="level-text-wrapper">
      <span class="next-level-label">До уровня {{ nextLevelInfo.next }}</span>
      <span class="points-left">еще {{ nextLevelInfo.remaining }} баллов</span>
    </div>
  
    <div class="progress-track">
      <div 
        class="progress-fill" 
        :style="{ width: nextLevelInfo.progress + '%' }"
      >
        <div class="progress-glow"></div>
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
    <div class="card-head">
      <h3>История операций</h3> 

      <button v-if="transactions.length !== 0" class="history-toggle-btn" @click="showHistoryInfo = !showHistoryInfo">
        {{ showHistoryInfo ? '←' : '→' }}
      </button>
    </div>
    <div v-if="transactions.length === 0" class="empty">Нет операций</div>
    <div v-show="showHistoryInfo" v-else class="transaction-list">
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
const showHistoryInfo = ref(false)

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

const nextLevelInfo = computed(() => {
  const points = props.profile.total_earned_points;
  
  const levels = [
    { name: "IRON", min: 0 },
    { name: "BRONZE", min: 100 },
    { name: "SILVER", min: 300 },
    { name: "GOLD", min: 500 },
    { name: "PLATINA", min: 1000 }
  ];

  for (let i = 0; i < levels.length - 1; i++) {
    if (points < levels[i + 1].min) {
      const currentRangeMin = levels[i].min;
      const nextRangeMin = levels[i + 1].min;
      
      const progress = ((points - currentRangeMin) / (nextRangeMin - currentRangeMin)) * 100;
      
      return {
        next: levels[i + 1].name,
        remaining: nextRangeMin - points,
        progress: Math.min(Math.max(progress, 0), 100) 
      };
    }
  }
  return null;
});

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

.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: space-between;
}

.card-head > h3 {
  margin: 0 !important;
}

.card h3 { margin: 0 0 16px 0; font-size: 1.1rem; }

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
  color: rgba(0, 0, 0, 0.4) !important;
}

.qr-wrapper { background: white; padding: 12px; border-radius: 12px; display: inline-block; }
.qr-container { text-align: center; }
.info-toggle-btn, .history-toggle-btn {
  background: none;
  border: none;
  color: #4da6ff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px;
  text-align: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.info-toggle-btn {
  width: 100%;
}

.info-toggle-btn:hover, .history-toggle-btn:hover {
  color: #1a8cff;
}

.level-progress-container {
  margin-top: 16px;
  padding: 15px;
}

.level-text-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.next-level-label {
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.points-left {
  color: #4dabf7;
  font-weight: bold;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4dabf7, #74c0fc);
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
/* Контейнер и Базовая Карта */
.card-visual-container { padding: 16px 12px; }
.bank-card {
  height: 200px;
  border-radius: 20px;
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  box-shadow: 0 15px 35px rgba(0,0,0,0.4);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.bank-card:active { transform: scale(0.97); }

/* Цвета Металлов */
.level-iron { background: linear-gradient(135deg, #3e4145 0%, #1c1e22 100%); }
.level-bronze { background: linear-gradient(135deg, #a87932 0%, #5e3a11 100%); }
.level-silver { background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%); }
.level-gold { background: linear-gradient(135deg, #f1c40f 0%, #967206 100%); }
.level-platina { background: linear-gradient(135deg, #e5e4e2 0%, #7f8c8d 100%); }

/* Элементы Карты */
.card-chip {
  width: 42px; height: 32px;
  background: linear-gradient(135deg, #f0d78c, #8c7012);
  border-radius: 6px;
}
.brand { font-weight: 900; letter-spacing: 1px; font-size: 12px; opacity: 0.8; }
.level-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; }
.card-number { font-family: 'Courier New', monospace; font-size: 1.2rem; letter-spacing: 2px; }
.card-label { display: block; font-size: 9px; text-transform: uppercase; opacity: 0.6; margin-bottom: 2px; }
.name { font-weight: 600; font-size: 15px; }
.points { font-weight: bold; font-size: 1.2rem; }

/* QR Оверлей */
.qr-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.qr-white-box { background: white; padding: 15px; border-radius: 15px; text-align: center; }
.qr-tap-hint { color: #000; font-size: 10px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }

/* Блок прогресса */
.progress-block { margin-top: -5px !important; }
.progress-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.progress-title h3 { margin: 0 !important; font-size: 14px !important; }
.total-earned { font-size: 11px; opacity: 0.5; margin: 2px 0 0 0; }
.points-needed { color: #4dabf7; font-weight: bold; font-size: 13px; }
.progress-track { height: 8px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4dabf7, #74c0fc); position: relative; transition: width 0.8s ease; }

/* Анимации */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.shimmer {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer-anim 2s infinite;
}
@keyframes shimmer-anim {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>