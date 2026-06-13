/**
 * EcoLens — Utility Functions
 * 
 * Shared helpers for formatting, animation, date handling,
 * DOM manipulation, and accessibility.
 */

'use strict';

const Utils = (() => {

  // ── Number Formatting ──
  function formatCO2(kg) {
    if (typeof kg !== 'number' || isNaN(kg)) return '0 kg';
    const absKg = Math.abs(kg);
    if (absKg >= 1000) {
      return (absKg / 1000).toFixed(1) + ' t';
    }
    return Math.round(absKg) + ' kg';
  }

  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }

  function formatPercent(value) {
    return Math.round(value) + '%';
  }

  // ── Date Helpers ──
  function todayString() {
    return formatDateToString(new Date());
  }

  function formatDateToString(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function formatDateDisplay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (formatDateToString(today) === dateStr) return 'Today';
    if (formatDateToString(yesterday) === dateStr) return 'Yesterday';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getDaysArray(numDays) {
    const dates = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(formatDateToString(d));
    }
    return dates;
  }

  function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
  }

  // ── DOM Helpers (XSS-safe) ──
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

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

  function clearChildren(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  // ── Animation Helpers ──
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
  function announce(message, priority = 'polite') {
    const region = document.getElementById('aria-live-region');
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      setTimeout(() => { region.textContent = ''; }, 3000);
    }
  }

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
  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

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
