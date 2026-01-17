<template>
  <div class="card">
    <h3>Адреса кофеен</h3>
    <div class="locations">
      <a
        href="https://yandex.ru/maps/-/CLRijYmL"
        target="_blank"
        rel="noopener noreferrer"
        class="location-link"
      >
        ул. Казанская, 25
      </a>
      <a
        href="https://yandex.ru/maps/-/CLRifK3C"
        target="_blank"
        rel="noopener noreferrer"
        class="location-link"
      >
        ул. Малая Морская, 18
      </a>
    </div>
  </div>

  <div class="card">
    <h3>Оставить чаевые</h3>
    <a
      href="https://netmonet.co/qr/494339/groups/0?o=2"
      target="_blank"
      rel="noopener noreferrer"
      class="location-link"
    >
      cсылка на нетмонет
    </a>
  </div>

  <div class="card">
    <h3>Поддержка</h3>
    <a
      href="https://t.me/dwntwn_coffee_support_bot"
      target="_blank"
      rel="noopener noreferrer"
      class="support-link"
    >
      Напишите нам в Telegram!<br>
      @dwntwn_coffee_support_bot
    </a>
  </div>

  <div class="card">
    <h3>Мы в Instagram</h3>
    <a
      href="https://instagram.com/dwntwn_coffee"
      target="_blank"
      rel="noopener noreferrer"
      class="social-link"
    >
      @dwntwn_coffee
    </a>
  </div>
  <div class="card">
    <div class="card-head">
      <h3>Правила программы лояльности</h3> 
      <button class="toggle-btn" @click="isRulesVisible = !isRulesVisible">
        {{ isRulesVisible ? '↑' : '↓' }}
      </button>
    </div>
  <div v-show="isRulesVisible" class="rules-content">
    <p><strong>1. Участие</strong><br />Программа доступна всем гостям кофеен dwntwn. Для участия требуется регистрация через Telegram Mini App.</p>

    <p><strong>2. Начисление бонусов</strong><br />Бонусы начисляются за каждую оплаченную покупку в размере процента от суммы чека в зависимости от уровня вашей карты:</p>
    <ul>
      <li>PLATINA — 10%</li>
      <li>GOLD — 7%</li>
      <li>SILVER — 5%</li>
      <li>BRONZE — 3%</li>
      <li>IRON — 1%</li>
    </ul>
    <p>Бонусы округляются в меньшую сторону до целого числа.</p>

    <p><strong>3. Бонусы ≠ деньги</strong><br />Бонусы не являются деньгами, не подлежат обмену на рубли, не могут использоваться как скидка при оплате и не передаются третьим лицам.</p>

    <p><strong>4. Обмен бонусов</strong><br />Бонусы можно обменять только на подарки из официального каталога «Подарки». Каждый подарок имеет фиксированную стоимость в бонусах. После обмена бонусы списываются со счёта без возможности возврата.</p>

    <p><strong>5. Акции и спецпредложения</strong><br />Акции, промокоды и специальные предложения <strong>не суммируются</strong> между собой. При оформлении покупки по акции или со скидкой <strong>бонусы не начисляются</strong>.</p>

    <p><strong>6. Срок действия бонусов</strong><br />Бонусы действительны в течение 12 месяцев с даты начисления. По истечении срока они автоматически аннулируются.</p>

    <p><strong>7. Выход из программы</strong><br />Вы можете покинуть программу в любой момент. При этом:</p>
    <ul>
      <li>Все накопленные бонусы аннулируются;</li>
      <li>История покупок и обменов удаляется;</li>
      <li>Ваши персональные данные, связанные с программой, полностью удаляются в соответствии с Политикой конфиденциальности.</li>
    </ul>
    <p>После выхода вы можете зарегистрироваться снова — мы всегда рады вам!</p>

    <p><strong>8. Изменение правил</strong><br />Мы оставляем за собой право изменять условия программы. Все изменения вступают в силу через 10 дней после публикации в Telegram-боте @dwntwn_coffee_bot.</p>
  </div>
</div>

  <div class="card">
    <h3>Управление аккаунтом</h3>
    <button class="leave-button" @click="leaveLoyaltyProgram">Покинуть программу</button>
  </div>
</template>


<script setup>
import { ref } from 'vue'

const isRulesVisible = ref(false)

const leaveLoyaltyProgram = async () => {
  const confirmed = confirm(
    'Вы уверены, что хотите покинуть программу лояльности?\n' +
    'Все ваши бонусы будут удалены, но вы сможете зарегистрироваться снова.'
  )
  if (!confirmed) return

  const initData = window.Telegram?.WebApp?.initData
  if (!initData) {
    alert('Ошибка: не удалось получить данные сессии.')
    return
  }

  try {
    const response = await fetch(`${window.API_BASE}/api/client/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData })
    })

    const data = await response.json()

    if (response.ok) {
      // 💡 Перезагружаем страницу, чтобы выйти из состояния "зарегистрирован"
      alert('Спасибо, что пользовались нашей программой лояльности!\nМы всегда будем рады вам снова!')
      window.location.reload()
    } else {
      alert('Ошибка: ' + (data.detail || 'Не удалось удалить аккаунт'))
    }
  } catch (err) {
    console.error('Ошибка при удалении аккаунта:', err)
    alert('Ошибка подключения к серверу. Попробуйте позже.')
  }
}
</script>


<style scoped>
.card {
  background: #111;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
}
.card-head h3, .card h3 {
  margin-bottom: 10px;
  color: white;
}
.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
} 

.location-link,
.social-link,
.support-link {
  display: block;
  color: #4da6ff;
  text-decoration: none;
  margin-bottom: 8px;
  line-height: 1.4;
}
.location-link:last-child,
.social-link:last-child,
.support-link:last-child {
  margin-bottom: 0;
}
.location-link:hover,
.social-link:hover,
.support-link:hover {
  color: #1a8cff;
  text-decoration: underline;
}
.rules-text {
  line-height: 1.6;
  font-size: 14px;
  margin: 0;
  color: inherit;
}
.rules-content {
  font-size: 14px;
  line-height: 1.6;
  color: inherit;
}
.rules-content p {
  margin: 0 0 12px 0;
}
.rules-content ul {
  margin: 6px 0 12px 20px;
  padding-left: 0;
  list-style-type: disc;
}
.rules-content li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.leave-button {
  background: #e53935;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
  width: 100%;
  text-align: center;
}
.leave-button:hover {
  background: #c62828;
}
.toggle-btn {
  background: none;
  border: none;
  color: #4da6ff;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 0;
  margin-bottom: 12px;
  text-align: left;
  font-weight: 500;
}
.toggle-btn:hover {
  color: #1a8cff;
}
.rules-content {
  font-size: 14px;
  line-height: 1.6;
  color: inherit;
}
.rules-content p {
  margin: 0 0 12px 0;
}
.rules-content ul {
  margin: 6px 0 12px 20px;
  padding-left: 0;
  list-style-type: disc;
}
.rules-content li {
  margin-bottom: 4px;
  line-height: 1.5;
}
</style>