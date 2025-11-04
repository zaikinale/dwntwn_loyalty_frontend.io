<!-- src/components/Client/CardView.vue -->
<template>
  <div v-if="isAnniversary" class="anniversary-banner">
    🎉 Сегодня ваша годовщина в программе лояльности!
  </div>

  <!-- Карта -->
  <div class="card">
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
        <span class="label">Уровень карты:</span>
        <span class="value" :class="`level-${profile.level.toLowerCase()}`">{{ profile.level }}</span>
      </div>
      <div class="info-row">
        <span class="label">Текущий баланс:</span>
        <span class="value">{{ profile.points }} баллов</span>
      </div>
      <div class="info-row">
        <span class="label">Всего заработано:</span>
        <span class="value">{{ profile.total_earned_points }} баллов</span>
      </div>
    </div>
  </div>

  <!-- Подарки -->
  <div class="card">
    <h3>Доступные подарки</h3>
    <div v-if="availableGifts.length === 0" class="empty">
      Нет доступных подарков
    </div>
    <div v-else class="gifts-grid">
      <div v-for="gift in availableGifts" :key="gift.id" class="gift-card">
        <div class="gift-image-wrapper">
          <img
            v-if="gift.image_url"
            :src="gift.image_url"
            :alt="gift.name"
            class="gift-image"
            @error="onImageError"
          />
          <div v-else class="gift-placeholder">
            🎁
          </div>
        </div>
        <div class="gift-details">
          <h4 class="gift-name">{{ gift.name }}</h4>
          <div class="gift-cost">{{ gift.points_cost }} баллов</div>
        </div>
      </div>
    </div>
  </div>

  <!-- История операций -->
  <div class="card">
    <h3>История операций</h3>
    <div v-if="transactions.length === 0" class="empty">Нет операций</div>
    <div v-else>
      <div v-for="t in transactions" :key="t.id" class="transaction-item">
        <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
          {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
        </div>
        <div>{{ t.description }}</div>
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

const availableGifts = computed(() => {
  return props.gifts.filter(gift => gift.points_cost <= props.profile.points)
})

const isAnniversary = computed(() => {
  // Пример: если нужно логику годовщины — замените на реальную
  return false
})

const formatDateTime = (isoStr) => {
  return new Date(isoStr).toLocaleString('ru-RU')
}

const onImageError = (event) => {
  console.warn('Не удалось загрузить изображение подарка:', event.target.src)
}
</script>

<style scoped>
.card {
  background: #111;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  color: white;
}
.card h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: white;
}
.anniversary-banner {
  background: linear-gradient(90deg, #ffd700, #ff8c00);
  color: #000;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  margin: 16px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
.qr-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}
.qr-wrapper {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.qr-code {
  display: block;
  width: 180px;
  height: 180px;
}
.card-info {
  margin: 20px 0;
  padding: 16px;
  background: #222;
  border-radius: 12px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  font-size: 16px;
}
.label {
  color: #aaa;
}
.value {
  font-weight: 600;
  color: white;
}
.level-bronze { color: #cd7f32; }
.level-silver { color: #c0c0c0; }
.level-gold { color: #ffd700; }
.level-platina { color: #e5e4e2; }

/* Сетка подарков */
.gifts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

/* Карточка подарка */
.gift-card {
  background: #222;
  border-radius: 12px;
  overflow: hidden;
  padding: 12px;
  text-align: center;
  transition: transform 0.2s;
}
.gift-card:hover {
  transform: translateY(-2px);
  background: #2a2a2a;
}

/* Обёртка изображения */
.gift-image-wrapper {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.gift-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gift-placeholder {
  font-size: 24px;
  color: #666;
}

/* Детали подарка */
.gift-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gift-name {
  font-size: 14px;
  font-weight: 600;
  color: white;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.gift-cost {
  font-size: 13px;
  color: #0d6efd;
  font-weight: 600;
}

/* История операций */
.transaction-item {
  padding: 12px 0;
  border-bottom: 1px solid #333;
}
.transaction-item:last-child {
  border-bottom: none;
}
.points-positive { color: #4CAF50; }
.points-negative { color: #f44336; }
.timestamp {
  font-size: 12px;
  color: #aaa;
}
.empty {
  text-align: center;
  color: #777;
  padding: 20px 0;
  font-style: italic;
}
</style>