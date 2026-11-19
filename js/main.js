document.addEventListener('DOMContentLoaded', () => {
  initCountdownTimer();
  initStickyCta();
  initReviewsSlider();
  initFaqAccordion();
  initMultiStepForm();
  initSuccessModal();
});

/* Таймер + смена текста CTA */
function initCountdownTimer() {
  const DURATION_SECONDS = 15 * 60;
  const STORAGE_KEY = 'primeinvest_timer_deadline_v1';

  const timerDisplays = document.querySelectorAll('[data-timer-display]');
  const ctaButtons = document.querySelectorAll('[data-cta-button]');
  const timerStatus = document.querySelector('[data-timer-status]');
  const timerCardValue = document.querySelector('.timer-card__value');

  if (!timerDisplays.length) return;

  let deadline = Number(sessionStorage.getItem(STORAGE_KEY));
  if (!deadline || Number.isNaN(deadline)) {
    deadline = Date.now() + DURATION_SECONDS * 1000;
    sessionStorage.setItem(STORAGE_KEY, String(deadline));
  }

  function formatTime(totalSeconds) {
    const clamped = Math.max(0, totalSeconds);
    const minutes = String(Math.floor(clamped / 60)).padStart(2, '0');
    const seconds = String(clamped % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function applyExpiredState() {
    ctaButtons.forEach((btn) => {
      btn.textContent = 'Последний шанс';
      btn.classList.remove('button--primary');
      btn.classList.add('button--urgent');
    });

    if (timerCardValue) {
      timerCardValue.classList.add('timer-card__value--expired');
    }

    if (timerStatus) {
      timerStatus.textContent =
        'Время основного обратного отсчёта вышло — форма открыта для заявки в статусе «Последний шанс».';
    }
  }

  function tick() {
    const remainingSeconds = Math.ceil((deadline - Date.now()) / 1000);
    const formatted = formatTime(remainingSeconds);

    timerDisplays.forEach((el) => {
      el.textContent = formatted;
    });

    if (remainingSeconds <= 0) {
      applyExpiredState();
      clearInterval(intervalId);
    }
  }

  tick();
  const intervalId = setInterval(tick, 1000);
}

/* Sticky CTA */
function initStickyCta() {
  const stickyCta = document.getElementById('stickyCta');
  const hero = document.getElementById('hero');

  if (!stickyCta || !hero) return;

  const DESKTOP_BREAKPOINT = 1024;
  let scrollThreshold = 0;

  function recalcThreshold() {
    scrollThreshold = hero.offsetTop + hero.offsetHeight * 0.65;
  }

  function updateStickyVisibility() {
    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      stickyCta.classList.remove('sticky-cta--visible');
      return;
    }

    const shouldShow = window.scrollY > scrollThreshold;
    stickyCta.classList.toggle('sticky-cta--visible', shouldShow);
  }

  recalcThreshold();
  updateStickyVisibility();

  window.addEventListener('scroll', updateStickyVisibility, { passive: true });
  window.addEventListener('resize', () => {
    recalcThreshold();
    updateStickyVisibility();
  });
}

/* Слайдер */
function initReviewsSlider() {
  const slider = document.querySelector('[data-reviews-slider]');
  if (!slider) return;

  const viewport = slider.querySelector('[data-slider-viewport]');
  const track = slider.querySelector('[data-slider-track]');
  const slides = Array.from(track ? track.children : []);
  const prevBtn = document.querySelector('[data-slider-prev]');
  const nextBtn = document.querySelector('[data-slider-next]');
  const dotsContainer = slider.querySelector('[data-slider-dots]');

  if (!viewport || !track || slides.length === 0) return;

  const DESKTOP_BREAKPOINT = 1024;
  let currentIndex = 0;

  function getSlidesPerView() {
    if (window.innerWidth >= DESKTOP_BREAKPOINT) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function getMaxIndex() {
    return Math.max(0, slides.length - getSlidesPerView());
  }

  function isDesktopControlsMode() {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  function renderDots() {
    if (!dotsContainer) return;
    const maxIndex = getMaxIndex();
    const totalPositions = maxIndex + 1;

    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalPositions; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider__dot';
      dot.setAttribute('aria-label', `Перейти к отзыву ${i + 1}`);
      if (i === currentIndex) {
        dot.classList.add('slider__dot--active');
        dot.setAttribute('aria-current', 'true');
      }
      dot.addEventListener('click', () => {
        goToSlide(i);
      });
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    if (!dotsContainer) return;
    const dots = Array.from(dotsContainer.children);
    dots.forEach((dot, idx) => {
      const isActive = idx === currentIndex;
      dot.classList.toggle('slider__dot--active', isActive);
      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
  }

  function goToSlide(index) {
    const maxIndex = getMaxIndex();
    currentIndex = Math.max(0, Math.min(index, maxIndex));

    if (isDesktopControlsMode()) {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const offset = currentIndex * (slideWidth + gap);
      track.style.transform = `translate3d(-${offset}px, 0, 0)`;
    } else {
      track.style.transform = '';
      const targetSlide = slides[currentIndex];
      if (targetSlide) {
        viewport.scrollTo({
          left: targetSlide.offsetLeft,
          behavior: 'smooth',
        });
      }
    }

    updateDots();
  }

  let scrollTimeout = null;
  viewport.addEventListener(
    'scroll',
    () => {
      if (isDesktopControlsMode()) return;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const slideWidth = slides[0].getBoundingClientRect().width;
        const gap = parseFloat(getComputedStyle(track).gap) || 0;
        const step = slideWidth + gap || 1;
        const nearest = Math.round(viewport.scrollLeft / step);
        currentIndex = Math.max(0, Math.min(nearest, getMaxIndex()));
        updateDots();
      }, 80);
    },
    { passive: true }
  );

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
    });
  }

  window.addEventListener('resize', () => {
    renderDots();
    goToSlide(currentIndex);
  });

  renderDots();
  goToSlide(0);
}

/* FAQ */
function initFaqAccordion() {
  const accordion = document.querySelector('[data-accordion]');
  if (!accordion) return;

  const items = Array.from(accordion.querySelectorAll('.accordion__item'));

  function setItemState(targetItem, shouldOpen) {
    const trigger = targetItem.querySelector('.accordion__trigger');
    const panel = targetItem.querySelector('.accordion__panel');

    targetItem.classList.toggle('accordion__item--open', shouldOpen);
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(shouldOpen));
    }
    if (panel) {
      panel.inert = !shouldOpen;
    }
  }

  items.forEach((item) => {
    const isInitiallyOpen = item.classList.contains('accordion__item--open');
    setItemState(item, isInitiallyOpen);

    const trigger = item.querySelector('.accordion__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isAlreadyOpen = item.classList.contains('accordion__item--open');

      items.forEach((otherItem) => {
        if (otherItem !== item) {
          setItemState(otherItem, false);
        }
      });

      setItemState(item, !isAlreadyOpen);
    });
  });
}

/* Форма лидогенерации */
const COUNTRY_MASKS = {
  UA: {
    prefix: '+380',
    localDigits: 9,
    formatLocal: (digits) => {
      // XX XXX-XX-XX
      const p1 = digits.slice(0, 2);
      const p2 = digits.slice(2, 5);
      const p3 = digits.slice(5, 7);
      const p4 = digits.slice(7, 9);
      let out = '';
      if (p1) out += ` (${p1}`;
      if (p1.length === 2) out += ')';
      if (p2) out += ` ${p2}`;
      if (p3) out += `-${p3}`;
      if (p4) out += `-${p4}`;
      return out;
    },
  },
  PL: {
    prefix: '+48',
    localDigits: 9,
    formatLocal: (digits) => {
      // XXX XXX XXX
      const parts = [
        digits.slice(0, 3),
        digits.slice(3, 6),
        digits.slice(6, 9),
      ].filter(Boolean);
      return parts.length ? ` ${parts.join(' ')}` : '';
    },
  },
  DE: {
    prefix: '+49',
    localDigits: 10,
    formatLocal: (digits) => {
      // XXX XXXXXXX
      const p1 = digits.slice(0, 3);
      const p2 = digits.slice(3, 10);
      let out = '';
      if (p1) out += ` ${p1}`;
      if (p2) out += ` ${p2}`;
      return out;
    },
  },
  US: {
    prefix: '+1',
    localDigits: 10,
    formatLocal: (digits) => {
      // (XXX) XXX-XXXX
      const p1 = digits.slice(0, 3);
      const p2 = digits.slice(3, 6);
      const p3 = digits.slice(6, 10);
      let out = '';
      if (p1) out += ` (${p1}`;
      if (p1.length === 3) out += ')';
      if (p2) out += ` ${p2}`;
      if (p3) out += `-${p3}`;
      return out;
    },
  },
};

function initMultiStepForm() {
  const form = document.getElementById('multiStepForm');
  if (!form) return;

  const step1Fieldset = form.querySelector('[data-step="1"]');
  const step2Fieldset = form.querySelector('[data-step="2"]');
  const step1Indicator = document.querySelector('[data-step-indicator="1"]');
  const step2Indicator = document.querySelector('[data-step-indicator="2"]');

  const nextBtn = form.querySelector('[data-next-step]');
  const prevBtn = form.querySelector('[data-prev-step]');

  const nameInput = form.querySelector('#leadName');
  const emailInput = form.querySelector('#leadEmail');
  const countrySelect = form.querySelector('[data-country-select]');
  const phoneInput = form.querySelector('[data-phone-input]');
  const consentInput = form.querySelector('#leadConsent');

  function setFieldError(fieldName, message, inputEl) {
    const errorEl = form.querySelector(`[data-error-for="${fieldName}"]`);
    if (errorEl) {
      errorEl.textContent = message || '';
    }
    if (inputEl) {
      inputEl.classList.toggle('form-field__input--invalid', Boolean(message));
    }
  }

  function getLocalPhoneDigits() {
    const country = countrySelect ? countrySelect.value : 'UA';
    const config = COUNTRY_MASKS[country] || COUNTRY_MASKS.UA;
    const prefixDigits = config.prefix.replace(/\D/g, '');
    let allDigits = (phoneInput ? phoneInput.value : '').replace(/\D/g, '');

    if (allDigits.startsWith(prefixDigits)) {
      allDigits = allDigits.slice(prefixDigits.length);
    }

    return {
      config,
      digits: allDigits.slice(0, config.localDigits),
    };
  }

  function applyPhoneMask(forcePrefixOnly = false) {
    if (!phoneInput) return;
    const { config, digits } = getLocalPhoneDigits();

    if (!digits.length && forcePrefixOnly) {
      phoneInput.value = `${config.prefix} `;
      return;
    }

    if (!digits.length) {
      phoneInput.value = '';
      return;
    }

    phoneInput.value = `${config.prefix}${config.formatLocal(digits)}`;
  }

  function validateStep1() {
    let isValid = true;

    const nameVal = nameInput ? nameInput.value.trim() : '';
    if (!nameVal) {
      setFieldError('name', 'Введите ваше имя', nameInput);
      isValid = false;
    } else if (nameVal.length < 2) {
      setFieldError(
        'name',
        'Имя должно содержать минимум 2 символа',
        nameInput
      );
      isValid = false;
    } else {
      setFieldError('name', '', nameInput);
    }

    const emailVal = emailInput ? emailInput.value.trim() : '';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailVal) {
      setFieldError('email', 'Введите электронную почту', emailInput);
      isValid = false;
    } else if (!emailPattern.test(emailVal)) {
      setFieldError(
        'email',
        'Введите корректный email, например name@domain.com',
        emailInput
      );
      isValid = false;
    } else {
      setFieldError('email', '', emailInput);
    }

    return isValid;
  }

  function validateStep2() {
    let isValid = true;

    const { config, digits } = getLocalPhoneDigits();
    if (digits.length < config.localDigits) {
      setFieldError(
        'phone',
        `Введите номер полностью (${config.localDigits} цифр после ${config.prefix})`,
        phoneInput
      );
      isValid = false;
    } else {
      setFieldError('phone', '', phoneInput);
    }

    const consentErrorEl = form.querySelector('[data-error-for="consent"]');
    if (consentInput && !consentInput.checked) {
      if (consentErrorEl) {
        consentErrorEl.textContent =
          'Необходимо подтвердить согласие на обработку данных';
      }
      isValid = false;
    } else if (consentErrorEl) {
      consentErrorEl.textContent = '';
    }

    return isValid;
  }

  function switchToStep(stepNumber) {
    const isStep1 = stepNumber === 1;
    if (step1Fieldset) step1Fieldset.classList.toggle('is-hidden', !isStep1);
    if (step2Fieldset) step2Fieldset.classList.toggle('is-hidden', isStep1);

    if (step1Indicator) {
      step1Indicator.classList.toggle('stepper__item--active', isStep1);
    }
    if (step2Indicator) {
      step2Indicator.classList.toggle('stepper__item--active', !isStep1);
    }

    if (!isStep1 && phoneInput && !phoneInput.value.trim()) {
      applyPhoneMask(true);
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateStep1()) {
        switchToStep(2);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      switchToStep(1);
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', () => {
      if (nameInput.classList.contains('form-field__input--invalid')) {
        validateStep1();
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('form-field__input--invalid')) {
        validateStep1();
      }
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener('change', () => {
      const { config } = getLocalPhoneDigits();
      const currentDigits = getLocalPhoneDigits().digits;
      phoneInput.placeholder = `${config.prefix}${config.formatLocal('X'.repeat(config.localDigits))}`;
      phoneInput.value = currentDigits
        ? `${config.prefix}${config.formatLocal(currentDigits)}`
        : `${config.prefix} `;
      setFieldError('phone', '', phoneInput);
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        applyPhoneMask(true);
      }
    });

    phoneInput.addEventListener('input', () => {
      applyPhoneMask(false);
      if (phoneInput.classList.contains('form-field__input--invalid')) {
        validateStep2();
      }
    });
  }

  if (consentInput) {
    consentInput.addEventListener('change', () => {
      const consentErrorEl = form.querySelector('[data-error-for="consent"]');
      if (consentInput.checked && consentErrorEl) {
        consentErrorEl.textContent = '';
      }
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const step1Ok = validateStep1();
    if (!step1Ok) {
      switchToStep(1);
      return;
    }

    const step2Ok = validateStep2();
    if (!step2Ok) {
      switchToStep(2);
      return;
    }

    window.dispatchEvent(new CustomEvent('primeinvest:lead-submitted'));
    form.reset();
    setFieldError('name', '', nameInput);
    setFieldError('email', '', emailInput);
    setFieldError('phone', '', phoneInput);
    const consentErrorEl = form.querySelector('[data-error-for="consent"]');
    if (consentErrorEl) consentErrorEl.textContent = '';
    switchToStep(1);
  });
}

/* Модальное окно */
function initSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal) return;

  const dialog = modal.querySelector('.modal__dialog');
  const closeTriggers = modal.querySelectorAll('[data-modal-close]');
  let lastFocusedElement = null;

  function openModal() {
    lastFocusedElement = document.activeElement;
    modal.classList.add('modal--open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('page--locked');

    if (dialog) {
      dialog.focus();
    }
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('page--locked');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  window.addEventListener('primeinvest:lead-submitted', openModal);

  closeTriggers.forEach((btn) => {
    btn.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });
}
