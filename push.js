class NotificationSystem {
  constructor() {
    this.containers = {};
    this.positions = [
      'top-left', 'top-right',
      'bottom-left', 'bottom-right',
      'top-center', 'bottom-center'
    ];
  }

  getContainer(position) {
    if (!this.containers[position]) {
      const container = document.createElement("div");
      container.className = `notification__container notification__container--${position}`;
      container.setAttribute("role", "region");
      container.setAttribute("aria-live", "polite");
      container.setAttribute("aria-atomic", "false");

      document.body.appendChild(container);
      this.containers[position] = container;
    }

    return this.containers[position];
  }

  createNotification({
    title = "",
    message = "",
    animationTime = 250,
    activeTime = 3000,
    showIndicator = true,
    type = "", // success, error, info
    position = "bottom-right"
  }) {
    const container = this.getContainer(position);

    const notification = document.createElement("div");
    notification.className = `notification notification--${type}`;
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-atomic", "true");

    if (title) {
      const header = document.createElement("h3");
      header.className = "notification__header";
      header.textContent = title;
      notification.appendChild(header);
    }

    const content = document.createElement("p");
    content.className = "notification__content";
    content.textContent = message;
    notification.appendChild(content);

    let indicator;
    let indicatorAnimationFrame;
    let hoverPaused = false;
    let startTime = null;
    let pauseTime = 0;

    if (showIndicator) {
      indicator = document.createElement("div");
      indicator.className = "notification__indicator";
      notification.appendChild(indicator);
    }

    // Закрытие уведомления
    const close = () => {
      this.closeNotification(notification);
    };

    // Таймер для закрытия
    let autoCloseTimeout = setTimeout(close, activeTime + animationTime);

    // Анимация индикатора
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      if (hoverPaused) return;

      const progress = (timestamp - startTime - pauseTime) / activeTime;
      if (indicator) {
        indicator.style.width = `${Math.max(0, 100 - progress * 100)}%`;
      }

      if (progress < 1) {
        indicatorAnimationFrame = requestAnimationFrame(animate);
      }
    };

    if (showIndicator) {
      indicatorAnimationFrame = requestAnimationFrame(animate);
    }

    // При наведении — отменяем таймер и паузим анимацию
    notification.addEventListener("mouseenter", () => {
      hoverPaused = true;
      clearTimeout(autoCloseTimeout);
      pauseTime = performance.now() - startTime;
    });

    // При уходе мыши — перезапускаем таймер
    notification.addEventListener("mouseleave", () => {
      hoverPaused = false;
      autoCloseTimeout = setTimeout(close, activeTime - pauseTime);
      if (showIndicator) {
        indicatorAnimationFrame = requestAnimationFrame(animate);
      }
    });

    // Кнопка закрытия
    const closeBtn = document.createElement("button");
    closeBtn.className = "notification__close";
    closeBtn.setAttribute("aria-label", "Закрыть уведомление");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoCloseTimeout);
      cancelAnimationFrame(indicatorAnimationFrame);
      close();
    });
    notification.appendChild(closeBtn);

    container.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add("notification--show");
    });
  }

  closeNotification(notification) {
    notification.classList.remove("notification--show");
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";
    notification.addEventListener("transitionend", () => {
      notification.remove();
    }, { once: true });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.notificationSystem = new NotificationSystem();

  // Примеры:
  window.notificationSystem.createNotification({
    title: "Успешно",
    message: "Данные сохранены.",
    type: "success",
    // activeTime: "10000000"
  });

  // window.notificationSystem.createNotification({
  //   title: "Ошибка",
  //   message: "Что-то пошло не так",
  //   type: "error"
  // });

  // window.notificationSystem.createNotification({
  //   title: "Информация",
  //   message: "Это просто уведомление",
  //   type: "info",
  //   showIndicator: false
  // });
});
