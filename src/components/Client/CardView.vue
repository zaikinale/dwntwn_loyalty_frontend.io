<template>
  <div class="card">
    <h3>Моя карта DwnTwn Loyalty</h3>
    <!-- QR-код -->
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
    <!-- Информация о карте -->
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
    <p class="hint">1 балл = 1 рубль</p>
  </div>

  <!-- Подарки -->
  <div class="card">
    <h3>Доступные подарки</h3>
    <div v-if="availableGifts.length === 0" class="empty">
      Нет доступных подарков
    </div>
    <div v-for="gift in availableGifts" :key="gift.id" class="gift-item">
      <div class="gift-content">
        <img v-if="gift.image_url" :src="gift.image_url" class="gift-image" />
        <span>{{ gift.name }}</span>
      </div>
      <span>{{ gift.points_cost }} баллов</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'

const props = defineProps({
  profile: { type: Object, required: true },
  gifts: { type: Array, required: true }
})

const availableGifts = computed(() => {
  return props.gifts.filter(gift => gift.points_cost <= props.profile.points)
})
</script>

<style scoped>
.card {
  background: #111;
  border-radius: 12px;
  padding: 20px;
  margin: 16px;
  color: white;
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
.hint {
  text-align: center;
  font-size: 14px;
  color: #777;
  margin-top: 16px;
}
.gift-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #333;
}
.gift-item:last-child {
  border-bottom: none;
}
.gift-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
.gift-image {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}
.empty {
  text-align: center;
  color: #777;
  padding: 20px 0;
}
</style>