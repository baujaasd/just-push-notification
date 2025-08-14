class NotificationSystem {
  /**
   * @param {Object} options
   * @param {number} [options.maxVisiblePerPosition=4] Максимум карточек в одном контейнере
   */
  constructor({ maxVisiblePerPosition = 4 } = {}) {
    this.containers = {};
    this.positions = [
      'top-left', 'top-right',
      'bottom-left', 'bottom-right',
      'top-center', 'bottom-center'
    ];
    this.types = ['success', 'error', 'info'];
    this.maxVisiblePerPosition = Number(maxVisiblePerPosition) > 0 ? Number(maxVisiblePerPosition) : 4;

    // Делегированное закрытие по Esc (последнее добавленное в каждом контейнере)
    this.__onKeydown = (e) => {
      if (e.key !== 'Escape') return;
      Object.values(this.containers).forEach(container => {
        const last = container.lastElementChild;
        if (last) this.closeNotification(last);
      });
    };
    document.addEventListener('keydown', this.__onKeydown);
  }

  /** Создать/получить контейнер позиции */
  getContainer(position) {
    if (!this.positions.includes(position)) position = 'bottom-right';
    if (!this.containers[position]) {
      const container = document.createElement('div');
      container.className = `notification__container notification__container--${position}`;
      container.dataset.position = position;
      document.body.appendChild(container);
      this.containers[position] = container;
    }
    return this.containers[position];
  }

  /**
   * Создать уведомление
   * @param {Object} opts
   * @param {string} [opts.title]
   * @param {string} [opts.message]
   * @param {number} [opts.animationTime=250]
   * @param {number} [opts.activeTime=3000] 0 или <0 — без автозакрытия/индикатора
   * @param {boolean} [opts.showIndicator=true]
   * @param {'success'|'error'|'info'} [opts.type='info']
   * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'|'top-center'|'bottom-center'} [opts.position='bottom-right']
   * @param {boolean} [opts.closeOnClick=false]
   * @param {Function} [opts.onOpen]
   * @param {Function} [opts.onClose]
   * @returns {{close:Function, el:HTMLElement, onClose:Function}}
   */
  createNotification(opts = {}) {
    // Нормализация входных
    let {
      title = '',
      message = '',
      animationTime = 250,
      activeTime = 3000,
      showIndicator = true,
      type = 'info',
      position = 'bottom-right',
      closeOnClick = false,
      onOpen,
      onClose
    } = opts;

    position = this.positions.includes(position) ? position : 'bottom-right';
    type = this.types.includes(type) ? type : 'info';

    const duration = Math.max(0, Number(activeTime) || 0);
    const container = this.getContainer(position);

    // === Ограничение "стопки" без бесконечного цикла ===
    const current = Array.from(container.children);
    const max = this.maxVisiblePerPosition;
    // Нужен зазор на будущую карточку: допустимый размер "до вставки" = max - 1
    const needToClose = Math.max(0, current.length - (max - 1));
    if (needToClose > 0) {
      const toClose = current.slice(0, needToClose); // самые старые
      toClose.forEach(el => this.closeNotification(el));
    }

    // Карточка
    const n = document.createElement('div');
    n.className = `notification notification--${type}`;
    n.dataset.position = position;

    // ARIA id-шники для связи
    const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    n.id = id;
    let headerId, contentId;

    // Правильные роли/живость
    const isError = type === 'error';
    n.setAttribute('role', isError ? 'alert' : 'status');
    n.setAttribute('aria-atomic', 'true');

    if (title) {
      const h = document.createElement('h3');
      h.className = 'notification__header';
      h.textContent = String(title);
      h.id = `${id}-title`;
      headerId = h.id;
      n.appendChild(h);
    }
    const p = document.createElement('p');
    p.className = 'notification__content';
    p.textContent = String(message ?? '');
    p.id = `${id}-content`;
    contentId = p.id;
    n.appendChild(p);

    if (headerId) n.setAttribute('aria-labelledby', headerId);
    if (contentId) n.setAttribute('aria-describedby', contentId);

    // Кнопка закрытия
    const btn = document.createElement('button');
    btn.className = 'notification__close';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Закрыть уведомление');
    btn.appendChild(document.createTextNode('×'));
    btn.addEventListener('click', () => this.closeNotification(n));
    n.appendChild(btn);

    // Индикатор (выключаем при reduced motion или при duration=0)
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useIndicator = !!showIndicator && !prefersReduced && duration > 0;
    let indicatorEl = null;
    if (useIndicator) {
      indicatorEl = document.createElement('div');
      indicatorEl.className = 'notification__indicator';
      n.appendChild(indicatorEl);
    }

    // Внутреннее состояние для чистки и пауз
    n.__timers = { rAF: null, timeout: null };
    n.__time = { start: 0, pausedTotal: 0, pausedAt: 0, duration };
    n.__onClose = typeof onClose === 'function' ? onClose : null;
    n.__closing = false;

    // Анимация индикатора + автозакрытие
    const animate = (ts) => {
      if (!n.isConnected || n.__closing) return;
      if (!n.__time.start) n.__time.start = ts;
      if (n.__time.pausedAt) return; // на паузе

      const elapsed = ts - n.__time.start - n.__time.pausedTotal;
      const progress = n.__time.duration ? Math.min(1, elapsed / n.__time.duration) : 1;

      if (indicatorEl) {
        indicatorEl.style.width = `${Math.max(0, 100 - progress * 100)}%`;
      }

      if (progress < 1) {
        n.__timers.rAF = requestAnimationFrame(animate);
      } else {
        this.closeNotification(n);
      }
    };

    const startTimers = () => {
      if (n.__time.duration > 0) {
        if (!n.__time.start) n.__time.start = performance.now();
        n.__timers.timeout = setTimeout(() => this.closeNotification(n), n.__time.duration);
        if (useIndicator) n.__timers.rAF = requestAnimationFrame(animate);
      }
    };

    const stopTimers = () => {
      if (n.__timers.timeout) clearTimeout(n.__timers.timeout);
      if (n.__timers.rAF) cancelAnimationFrame(n.__timers.rAF);
      n.__timers.timeout = n.__timers.rAF = null;
    };

    // Пауза по наведению
    n.addEventListener('mouseenter', () => {
      if (!n.__time.pausedAt) {
        n.__time.pausedAt = performance.now();
        stopTimers();
      }
    });
    n.addEventListener('mouseleave', () => {
      if (n.__time.pausedAt) {
        n.__time.pausedTotal += performance.now() - n.__time.pausedAt;
        n.__time.pausedAt = 0;
        if (n.__time.duration > 0) {
          const now = performance.now();
          const elapsed = now - n.__time.start - n.__time.pausedTotal;
          const rest = Math.max(0, n.__time.duration - elapsed);
          n.__timers.timeout = setTimeout(() => this.closeNotification(n), rest);
          if (useIndicator) n.__timers.rAF = requestAnimationFrame(animate);
        }
      }
    });

    // Опционально закрывать по клику на карточку (кроме интерактивных элементов)
    if (closeOnClick) {
      n.addEventListener('click', (e) => {
        if (e.target === btn) return;
        const interactive = e.target.closest('button,a,[role="button"],input,textarea,select');
        if (!interactive) this.closeNotification(n);
      });
    }

    container.appendChild(n);

    // Показывающая анимация
    requestAnimationFrame(() => {
      n.classList.add('notification--show');
      if (typeof onOpen === 'function') onOpen();
      startTimers();
      if (isError) {
        btn.focus({ preventScroll: true });
      }
    });

    // Хэндл наружу
    return {
      close: () => this.closeNotification(n),
      el: n,
      onClose: (cb) => { n.__onClose = typeof cb === 'function' ? cb : null; },
    };
  }

  /** Закрыть и почистить (идемпотентно) */
  closeNotification(n) {
    if (!n || !n.isConnected || n.__closing) return;
    n.__closing = true;

    // Чистим таймеры/RAF
    if (n.__timers) {
      if (n.__timers.timeout) clearTimeout(n.__timers.timeout);
      if (n.__timers.rAF) cancelAnimationFrame(n.__timers.rAF);
      n.__timers.timeout = n.__timers.rAF = null;
    }

    // Плавное закрытие: направление зависит от позиции
    n.classList.remove('notification--show');
    const pos = n.dataset.position || '';
    const isTop = pos.startsWith('top');
    n.style.opacity = '0';
    n.style.transform = `translateY(${isTop ? '-20px' : '20px'})`;

    const container = n.parentElement;
    const onEnd = () => {
      n.removeEventListener('transitionend', onEnd);
      const cb = n.__onClose;
      n.remove();

      // Удаляем пустой контейнер
      if (container && container.children.length === 0) {
        container.remove();
        Object.keys(this.containers).forEach(k => {
          if (this.containers[k] === container) delete this.containers[k];
        });
      }

      if (typeof cb === 'function') cb();
    };

    // Динамический fallback по CSS-длительности
    let ended = false;
    const cs = getComputedStyle(n);
    const dur = (cs.transitionDuration || '0s').split(',').map(s => parseFloat(s) || 0);
    const del = (cs.transitionDelay || '0s').split(',').map(s => parseFloat(s) || 0);
    const maxSec = Math.max(0, ...dur.map((d, i) => d + (del[i] || 0)));
    const fallback = setTimeout(() => { if (!ended) onEnd(); }, (maxSec || 0.45) * 1000);

    n.addEventListener('transitionend', () => {
      ended = true;
      clearTimeout(fallback);
      onEnd();
    }, { once: true });
  }

  /** Явное разрушение системы (если нужно в SPA/HMR) */
  destroy() {
    document.removeEventListener('keydown', this.__onKeydown);
    Object.values(this.containers).forEach(c => c.remove());
    this.containers = {};
  }
}

// Инициализация глобально (с защитой от повторной инициализации)
document.addEventListener('DOMContentLoaded', () => {
  if (!window.notificationSystem || !(window.notificationSystem instanceof NotificationSystem)) {
    window.notificationSystem = new NotificationSystem();
  }
});
