class Notification {
  constructor() {
    // Создание контейнеров для каждой позиции
    this.positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center'];
    this.containers = {};

    this.positions.forEach((position) => {
      const container = document.createElement("div");
      container.classList.add("notification-container", position);
      document.body.appendChild(container);
      this.containers[position] = container;
    });
  }

  createNotification(options) {
    const {
      title = '',
      message = '',
      animationTime = 250,
      activeTime = 3000,
      showIndicator = true,
      additionalClass = '',
      position = 'bottom-right' // Позиция по умолчанию
    } = options;

    const container = this.containers[position];
    const notification = document.createElement("div");
    notification.classList.add("notification");
    if (additionalClass) {
      notification.classList.add(additionalClass);
    }

    const header = document.createElement("div");
    header.classList.add("notification-header");
    header.textContent = title;
    notification.appendChild(header);

    const content = document.createElement("div");
    content.classList.add("notification-content");
    content.textContent = message;
    notification.appendChild(content);

    if (showIndicator) {
      const indicator = document.createElement("div");
      indicator.classList.add("notification-indicator");
      notification.appendChild(indicator);

      let startTime = null;
      const duration = activeTime;

      const animateIndicator = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsedTime = timestamp - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        indicator.style.width = `${100 - progress * 100}%`;

        if (elapsedTime < duration) {
          requestAnimationFrame(animateIndicator);
        } else {
          this.closeNotification(notification);
        }
      };

      requestAnimationFrame(animateIndicator);
    }

    container.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, animationTime);

    const closeButton = document.createElement("button");
    closeButton.classList.add("notification-close");
    closeButton.innerHTML = "&#10005;";
    closeButton.onclick = () => this.closeNotification(notification);
    notification.appendChild(closeButton);

    setTimeout(() => {
      this.closeNotification(notification);
    }, activeTime + animationTime);
  }

  closeNotification(notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.addEventListener('transitionend', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, { once: true });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  window.notificationSystem = new Notification();

// Пример вызова

window.notificationSystem.createNotification({
  title: "Привет 👋",
  message: "Уведомление",
});
})
