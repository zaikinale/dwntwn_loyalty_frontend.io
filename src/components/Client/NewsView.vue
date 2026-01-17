<template>
  <div class="news-page">
    <div class="content-wrapper">
      
      <div v-if="announcement" class="news-item announcement glass">
        <div class="status-badge">Объявление</div>
        <img v-if="announcement.image_url" :src="announcement.image_url" class="item-img" />
        <div class="item-body">
          <h2>{{ announcement.title }}</h2>
          <p v-if="expandedId === 'ann'" class="expanded-desc">{{ announcement.description }}</p>
          <button v-if="announcement.description" class="btn-more" @click="toggleExpand('ann')">
            {{ expandedId === 'ann' ? '← Свернуть' : 'Подробнее →' }}
          </button>
        </div>
      </div>

      <div class="section-title" v-if="novelties.length">Новинки</div>
      <div v-for="item in novelties" :key="item.id" class="news-item novelty glass">
        <img v-if="item.image_url" :src="item.image_url" class="item-img" />
        <div class="item-body">
          <h3>{{ item.title }}</h3>
          <p v-if="expandedId === 'nov-' + item.id" class="expanded-desc">{{ item.description }}</p>
          <button v-if="item.description" class="btn-more" @click="toggleExpand('nov-' + item.id)">
            {{ expandedId === 'nov-' + item.id ? '← Свернуть' : 'Подробнее →' }}
          </button>
        </div>
      </div>

      <div class="section-title" v-if="promotions.length">Акции</div>
      <div class="promo-grid">
        <div v-for="promo in promotions" :key="promo.id" class="promo-card glass">
          <div class="promo-container">
            <div class="promo-image-wrapper">
              <img v-if="promo.image_url" :src="promo.image_url" class="promo-img" />
              <div v-else class="promo-placeholder">🔥</div>
            </div>
            <div class="promo-info">
              <h4>{{ promo.title }}</h4>
              <p v-if="promo.description" class="promo-desc">{{ promo.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-padding"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const announcement = ref(null)
const novelties = ref([])
const promotions = ref([])
const expandedId = ref(null)

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
    console.error("Ошибка загрузки:", e)
  }
}

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

onMounted(loadNotifications)
</script>
<style scoped>
  .news-page {
    min-height: 100vh;
    /* padding: 16px; */
    color: white;
    background: transparent;
  }
  
  .content-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    overflow: hidden;
  }
  
  .section-title {
    font-size: 1.1rem;
    font-weight: 800;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: -8px;
    padding-left: 4px;
  }
  
  .news-item { width: 100%; position: relative; }
  .status-badge {
    position: absolute; top: 12px; right: 12px;
    background: #ff4d4f; padding: 3px 10px; border-radius: 8px;
    font-size: 14px; font-weight: bold; z-index: 2;
  }
  .item-img { width: 100%; height: 210px; object-fit: cover; }
  .item-body { padding: 16px; }
  .item-body h2, .item-body h3 { margin: 0 0 8px 0; font-size: 1.3rem; }
  .item-body p { font-size: 0.95rem; color: #ddd; line-height: 1.5; margin: 0; }
  
  .item-body p.collapsed {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .btn-more {
    background: none; border: none; color: #4dabf7;
    padding: 12px 0 0 0; font-weight: bold; font-size: 0.9rem; cursor: pointer;
  }

  .promo-grid { display: flex; flex-direction: column; gap: 10px; }
  .promo-card {width: 100%;}
  .promo-container { display: flex; align-items: center; gap: 10px; width: 100%;}
  
  .promo-image-wrapper {
    width: 100px; height: 100px; flex-shrink: 0;
    border-radius: 14px; overflow: hidden;
    background: rgba(0, 0, 0, 0.2);
    display: flex; align-items: center; justify-content: center;
  }
  .promo-img { width: 100%; height: 100%; object-fit: cover; }
  .promo-placeholder { font-size: 1.6rem; }
  
  .promo-info { 
    box-sizing: border-box;
    width: 190px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .promo-info h4 { margin: 0 0 4px 0; font-size: 1.05rem; }
  .promo-desc { 
    width: 100%;
    word-wrap: normal;
    margin: 0; 
    font-size: 0.85rem; 
    color: #bbb; 
    line-height: 1.3;  
    max-width: 100%; 
    -webkit-line-clamp: 3; 
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .bottom-padding { height: 110px; }
  .expanded-desc {
    font-size: 0.95rem;
    color: #ddd;
    line-height: 1.5;
    margin: 8px 0 0 0;
  }
</style>