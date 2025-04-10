# Just Push Notification

Универсальная система всплывающих уведомлений для браузера — с поддержкой различных типов, позиций, анимаций, индикатора времени и доступности (a11y). Без зависимостей.

Github pages - https://baujaasd.github.io/just-push-notification/

## Возможности

- Простое подключение без библиотек
- Поддержка 6 позиций: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `top-center`, `bottom-center`
- Темы: `success`, `error`, `info`
- Индикатор прогресса (опционально)
- ARIA-атрибуты для доступности
- Автоудаление уведомлений + пауза по наведению
- Очищается из DOM автоматически

## Подключение

### HTML

```html
<link rel="stylesheet" href="push.css">
<script src="push.js"></script>
```

или

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/baujaasd/just-push-notification/push.css">
<script src="https://cdn.jsdelivr.net/gh/baujaasd/just-push-notification/push.js"></script>
```

### JS
```js
window.notificationSystem = new NotificationSystem();
```

## Использование

```js
window.notificationSystem.createNotification({
  title: "Успешно",
  message: "Уведомление сохранено",
  type: "success", // "info", "error"
  position: "top-right", // позиция
  showIndicator: true,   // показать индикатор времени (по умолчанию)
  activeTime: 3000,      // сколько времени отображать
});
```
---

## Примеры

```js
// Простое уведомление
notificationSystem.createNotification({
  title: "Привет 👋",
  message: "Это обычное уведомление",
  type: "info",
});

// Ошибка
notificationSystem.createNotification({
  title: "Ошибка",
  message: "Что-то пошло не так",
  type: "error",
  position: "bottom-left"
});

// Без заголовка и индикатора
notificationSystem.createNotification({
  message: "Файл загружен!",
  showIndicator: false,
  type: "success",
});
```

---

## Стандарты

- БЭМ-структура классов (notification__container, notification__header и т.д.)
- A11y: используется aria-live="polite" и role="alert"
- Стили с кастомными переменными --var для удобной настройки