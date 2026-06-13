/**
 * EcoLens — Utility Functions
 * 
 * Shared helpers for formatting, animation, date handling,
 * DOM manipulation, and accessibility.
 * 
 * @module Utils
 */

'use strict';

const Utils = (() => {

  // ── Number Formatting ──

  /**
   * Formats a CO₂ amount in kg or tonnes.
   * Always displays absolute positive value.
   * @param {number} kg - The CO2 amount in kg
   * @returns {string} Formatted string (e.g. "1.2 t" or "350 kg")
   */
  function formatCO2(kg) {
    if (typeof kg !== 'number' || isNaN(kg)) return '0 kg';
    const absKg = Math.abs(kg);
    if (absKg >= 1000) {
      return (absKg / 1000).toFixed(1) + ' t';
    }
    return Math.round(absKg) + ' kg';
  }

  /**
   * Formats a number with thousands separators.
   * @param {number} num - The number to format
   * @returns {string} Formatted number string
   */
  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }

  /**
   * Formats a percentage value.
   * @param {number} value - The percentage value
   * @returns {string} Formatted percentage (e.g. "45%")
   */
  function formatPercent(value) {
    return Math.round(value) + '%';
  }

  // ── Date Helpers ──

  /**
   * Returns today's date in YYYY-MM-DD format.
   * @returns {string} Current date string
   */
  function todayString() {
    return formatDateToString(new Date());
  }

  /**
   * Converts a date object into a YYYY-MM-DD string.
   * @param {Date|string|number} date - The date to format
   * @returns {string} Formatted date string
   */
  function formatDateToString(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /**
   * Formats a YYYY-MM-DD string for display.
   * Returns 'Today', 'Yesterday', or a readable date.
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {string} Readable display date
   */
  function formatDateDisplay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (formatDateToString(today) === dateStr) return 'Today';
    if (formatDateToString(yesterday) === dateStr) return 'Yesterday';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /**
   * Generates an array of YYYY-MM-DD dates leading up to today.
   * @param {number} numDays - Number of days to include
   * @returns {Array<string>} Array of date strings
   */
  function getDaysArray(numDays) {
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(formatDateToString(d));
    }
    return dates;
  }

  /**
   * Calculates the number of calendar days between two dates.
   * @param {string} date1 - First date (YYYY-MM-DD)
   * @param {string} date2 - Second date (YYYY-MM-DD)
   * @returns {number} Number of days difference
   */
  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // ── DOM Helpers (XSS-safe) ──

  /**
   * Selects a single element matching a CSS selector.
   * @param {string} selector - CSS selector
   * @returns {Element|null} The matched element
   */
  function $(selector) {
    return document.querySelector(selector);
  }

  /**
   * Selects all elements matching a CSS selector.
   * @param {string} selector - CSS selector
   * @returns {NodeList} NodeList of matched elements
   */
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Safely creates a DOM element with attributes and text content.
   * Handles className, datasets, and ARIA attributes safely.
   * @param {string} tag - Tag name (e.g. 'div')
   * @param {Object} [attrs={}] - Attributes key-value map
   * @param {string} [textContent=''] - Inner text (safely escapes user input)
   * @returns {HTMLElement} The created element
   */
  function createElement(tag, attrs = {}, textContent = '') {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        for (const [dk, dv] of Object.entries(value)) {
          el.dataset[dk] = dv;
        }
      } else if (key.startsWith('aria')) {
        el.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
    if (textContent) {
      el.textContent = textContent;
    }
    return el;
  }

  /**
   * Clears all child nodes from a DOM element.
   * @param {Element} el - The parent element
   */
  function clearChildren(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  // ── Animation Helpers ──

  /**
   * Animates a numerical text counter using ease-out easing.
   * Respects prefers-reduced-motion.
   * @param {HTMLElement} el - Target element
   * @param {number} target - Numerical target value
   * @param {number} [duration=1200] - Duration of animation in ms
   * @param {string} [suffix=''] - Optional text suffix (e.g. '%')
   */
  function animateCounter(el, target, duration = 1200, suffix = '') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.textContent = formatNumber(target) + suffix;
      return;
    }

    const start = performance.now();
    const from = 0;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = from + (target - from) * eased;
      el.textContent = formatNumber(Math.round(current)) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  /**
   * Animates width transitions on progress bars.
   * Respects prefers-reduced-motion.
   * @param {HTMLElement} el - Progress bar fill element
   * @param {number} targetPercent - Percentage width target (0-100)
   * @param {number} [duration=800] - Animation transition duration in ms
   */
  function animateProgressBar(el, targetPercent, duration = 800) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.style.width = targetPercent + '%';
      return;
    }
    el.style.transition = `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    requestAnimationFrame(() => {
      el.style.width = targetPercent + '%';
    });
  }

  // ── Accessibility ──

  /**
   * Dynamically announces messages for screen reader assistive technologies.
   * @param {string} message - Text announcement
   * @param {string} [priority='polite'] - ARIA-live priority (polite or assertive)
   */
  function announce(message, priority = 'polite') {
    const region = document.getElementById('aria-live-region');
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      setTimeout(() => { region.textContent = ''; }, 3000);
    }
  }

  /**
   * Traps tab focus inside a container element (e.g. modal).
   * @param {HTMLElement} container - The container element to trap focus in
   * @returns {function|null} Cleanup function to remove focus trap listener
   */
  function trapFocus(container) {
    const focusable = container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return null;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handler);
    first.focus();
    return () => container.removeEventListener('keydown', handler);
  }

  // ── Misc ──

  /**
   * Creates a debounced version of a function.
   * @param {function} fn - The function to debounce
   * @param {number} [delay=300] - Debounce delay in ms
   * @returns {function} Debounced function wrapper
   */
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Clamps a numerical value within bounds.
   * @param {number} value - The input value
   * @param {number} min - Lower bound
   * @param {number} max - Upper bound
   * @returns {number} Clamped value
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Generates a greeting based on current local hour.
   * @returns {string} Greeting prefix
   */
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ── Public API ──
  return Object.freeze({
    formatCO2,
    formatNumber,
    formatPercent,
    todayString,
    formatDateToString,
    formatDateDisplay,
    getDaysArray,
    daysBetween,
    $,
    $$,
    createElement,
    clearChildren,
    animateCounter,
    animateProgressBar,
    announce,
    trapFocus,
    debounce,
    clamp,
    getGreeting,
  });
})();
