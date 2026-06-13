/**
 * EcoLens — App Controller
 * 
 * Main application controller that manages routing, navigation,
 * initialization, theme toggling, particles, and global utilities.
 */

/* global Storage, Calculator, Dashboard, Tracker, Insights, Challenges, EcoBot, Utils */

'use strict';

const App = (() => {
  let currentPage = 'dashboard';

  function init() {
    // Check if user has completed onboarding
    if (!Storage.hasData()) {
      showOnboarding();
    } else {
      showApp();
    }

    bindNavigation();
    bindSettings();
    initTheme();
    initParticles();
  }

  // ── Routing ──
  function showOnboarding() {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    Utils.$('#section-onboarding').classList.add('active');
    Utils.$$('.navbar .nav-links')[0].style.display = 'none';
    Calculator.init();
  }

  function showApp() {
    Utils.$('#section-onboarding').classList.remove('active');
    Utils.$$('.navbar .nav-links')[0].style.display = '';

    // Read hash
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);

    // Initialize all modules
    Dashboard.init();
    Tracker.init();
    Insights.init();
    Challenges.init();
    EcoBot.init();
  }

  function navigateTo(page) {
    const validPages = ['dashboard', 'tracker', 'insights', 'challenges', 'settings'];
    if (!validPages.includes(page)) page = 'dashboard';

    currentPage = page;

    // Toggle sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = Utils.$(`#section-${page}`);
    if (target) {
      target.classList.add('active');
      // Trigger animation
      target.style.animation = 'none';
      target.offsetHeight; // reflow
      target.style.animation = '';
    }

    // Toggle nav active state
    Utils.$$('.nav-links a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });

    // Update hash
    history.replaceState(null, '', `#${page}`);

    // Refresh page data
    if (page === 'dashboard') {
      Dashboard.refresh();
      EcoBot.refreshAchievements();
      EcoBot.renderWhatIfSection();
    }
    if (page === 'insights') Insights.refresh();
    if (page === 'challenges') Challenges.refresh();
    if (page === 'tracker') Tracker.render();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Utils.announce(`Navigated to ${page}`);
  }

  function onOnboardingComplete() {
    showApp();
  }

  // ── Navigation ──
  function bindNavigation() {
    // Nav link clicks
    Utils.$$('.nav-links a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        navigateTo(page);

        // Close mobile menu
        Utils.$('#nav-links').classList.remove('open');
        Utils.$('#nav-toggle').setAttribute('aria-expanded', 'false');
      });
    });

    // Mobile toggle
    Utils.$('#nav-toggle').addEventListener('click', () => {
      const navLinks = Utils.$('#nav-links');
      const isOpen = navLinks.classList.toggle('open');
      Utils.$('#nav-toggle').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Hash change
    window.addEventListener('hashchange', () => {
      if (Storage.hasData()) {
        const page = window.location.hash.replace('#', '') || 'dashboard';
        navigateTo(page);
      }
    });
  }

  // ── Settings ──
  function bindSettings() {
    // Theme toggle
    Utils.$('#toggle-theme').addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      const settings = Storage.getSettings();
      settings.theme = theme;
      Storage.saveSettings(settings);

      // Refresh charts for new colors
      if (currentPage === 'dashboard') Dashboard.refresh();
    });

    // Goal change
    Utils.$('#select-goal').addEventListener('change', (e) => {
      const goal = Number(e.target.value);
      const settings = Storage.getSettings();
      settings.reductionGoal = goal;
      Storage.saveSettings(settings);
      Utils.$('#goal-desc').textContent = `Reduce your footprint by ${goal}%`;
      if (currentPage === 'dashboard') Dashboard.refresh();
    });

    // Country change
    Utils.$('#select-country').addEventListener('change', (e) => {
      const settings = Storage.getSettings();
      settings.country = e.target.value;
      Storage.saveSettings(settings);
    });

    // Export
    Utils.$('#btn-export').addEventListener('click', () => {
      const data = Storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecolens-data-${Storage.todayString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully! 📥', 'success');
    });

    // Retake quiz
    Utils.$('#btn-retake-quiz').addEventListener('click', () => {
      if (window.confirm('This will recalculate your baseline footprint. Continue?')) {
        Calculator.reset();
        showOnboarding();
      }
    });

    // Clear data
    Utils.$('#btn-clear-data').addEventListener('click', () => {
      if (window.confirm('⚠️ This will permanently delete ALL your data. This cannot be undone. Continue?')) {
        Storage.clearAll();
        Calculator.reset();
        showOnboarding();
        showToast('All data cleared', 'warning');
      }
    });
  }

  // ── Theme ──
  function initTheme() {
    const settings = Storage.getSettings();

    // Check system preference
    if (!Storage.hasData()) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      settings.theme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', settings.theme);
    Utils.$('#toggle-theme').checked = settings.theme === 'dark';

    // Load saved settings into UI
    Utils.$('#select-goal').value = settings.reductionGoal || 25;
    Utils.$('#select-country').value = settings.country || 'global';
    Utils.$('#goal-desc').textContent = `Reduce your footprint by ${settings.reductionGoal || 25}%`;
  }

  // ── Particles (subtle leaf effect) ──
  function initParticles() {
    const canvas = Utils.$('#particles-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrame;

    // Check for reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', Utils.debounce(resize, 200));

    // Create particles
    const PARTICLE_COUNT = Math.min(30, Math.floor(window.innerWidth / 50));
    const SHAPES = ['🍃', '🌿', '✨'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 8 + Math.random() * 10,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: 0.2 + Math.random() * 0.4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1,
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        opacity: 0.15 + Math.random() * 0.25,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        // Wrap around
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.x < -20) p.x = canvas.width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.shape, 0, 0);
        ctx.restore();
      });

      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrame);
      } else {
        animate();
      }
    });
  }

  // ── Toast Notifications ──
  function showToast(message, type = 'success') {
    const container = Utils.$('#toast-container');
    const toast = Utils.createElement('div', { className: `toast ${type}`, role: 'status' });

    const icons = { success: '✅', warning: '⚠️', error: '❌' };
    toast.textContent = `${icons[type] || ''} ${message}`;

    container.appendChild(toast);

    // Auto-remove
    window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      window.setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ── Initialize on DOM ready ──
  if (typeof window !== 'undefined' && !window.__ECOLENS_TEST_ENV__) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  const App = Object.freeze({
    navigateTo,
    onOnboardingComplete,
    showToast,
  });

  window.App = App;
  return App;
})();
