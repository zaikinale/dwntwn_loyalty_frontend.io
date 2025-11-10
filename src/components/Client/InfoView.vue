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
    <h3>Правила программы</h3>
    <p class="rules-text">
      • За каждую покупку начисляются бонусы<br />
      • 1 бонус = 1 рубль<br />
      • Бонусы можно обменять на напитки и десерты
    </p>
  </div>

  <div class="card">
    <h3>Управление аккаунтом</h3>
    <button class="leave-button" @click="handleLeaveLoyalty">Покинуть программу лояльности</button>
  </div>
</template>


<script>
export default {
  methods: {
    async handleLeaveLoyalty() {
      const confirmed = confirm(
        'Вы уверены, что хотите покинуть программу лояльности?\n' +
        'Все ваши бонусы будут удалены, но вы сможете зарегистрироваться снова в будущем.'
      );
      if (!confirmed) return;

      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        alert('Ошибка: не удалось получить данные авторизации. Попробуйте обновить страницу.');
        return;
      }

      try {
        const response = await fetch('/api/client/delete-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData })
        });

        const data = await response.json();

        if (response.ok) {
          alert('Спасибо, что пользовались нашей программой лояльности!\nЕсли захотите вернуться — мы всегда будем рады вас снова!');
          
        } else {
          alert('Ошибка: ' + (data.detail || 'Не удалось покинуть программу.'));
        }
      } catch (error) {
        console.error('Ошибка при удалении аккаунта:', error);
        alert('Произошла ошибка при подключении к серверу. Попробуйте позже.');
      }
    }
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
.card h3 {
  margin-bottom: 10px;
  color: white;
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
</style>