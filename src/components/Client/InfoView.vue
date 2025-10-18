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
</template>

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
</style>