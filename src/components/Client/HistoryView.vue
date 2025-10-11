<template>
  <div class="card">
    <h3>История операций</h3>
    <div v-if="transactions.length === 0" class="empty">Нет операций</div>
    <div v-for="t in transactions" :key="t.id" class="transaction-item">
      <div :class="t.points_change > 0 ? 'points-positive' : 'points-negative'">
        {{ t.points_change > 0 ? '+' : '' }}{{ t.points_change }}
      </div>
      <div>{{ t.description || t.type }}</div>
      <div style="font-size:12px; color:#777;">{{ t.created_at }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps(['transactions'])
</script>