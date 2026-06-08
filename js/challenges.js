/**
 * EcoLens — Challenges Module
 * 
 * Weekly eco-challenges with XP system, level progression,
 * and completion tracking for gamified engagement.
 */

'use strict';

const Challenges = (() => {
  // ── Challenge Database ──
  const CHALLENGE_DB = [
    {
      id: 'meatless_monday',
      title: 'Meatless Monday',
      desc: 'Go one full day without eating any meat. Try plant-based alternatives for all meals.',
      difficulty: 'easy',
      xp: 30,
      icon: '🥗',
      category: 'food',
      co2Saving: 5.8,
    },
    {
      id: 'bike_commute',
      title: 'Bike to Work',
      desc: 'Replace your car commute with cycling for one day. Great for health and the planet!',
      difficulty: 'medium',
      xp: 50,
      icon: '🚲',
      category: 'transport',
      co2Saving: 5.5,
    },
    {
      id: 'cold_showers',
      title: 'Cold Shower Challenge',
      desc: 'Take cold or cool showers for 3 days straight. Saves energy and is great for circulation!',
      difficulty: 'hard',
      xp: 80,
      icon: '🧊',
      category: 'energy',
      co2Saving: 3.4,
    },
    {
      id: 'no_car_week',
      title: 'Car-Free Day',
      desc: 'Don\'t use a car for an entire day. Walk, bike, or take public transit instead.',
      difficulty: 'medium',
      xp: 60,
      icon: '🚶',
      category: 'transport',
      co2Saving: 8.2,
    },
    {
      id: 'zero_waste_lunch',
      title: 'Zero Waste Lunch',
      desc: 'Pack a lunch with zero single-use packaging. Use reusable containers and cutlery.',
      difficulty: 'easy',
      xp: 25,
      icon: '🍱',
      category: 'lifestyle',
      co2Saving: 1.5,
    },
    {
      id: 'unplug_devices',
      title: 'Phantom Power Hunt',
      desc: 'Unplug all non-essential devices for 24 hours. Find and eliminate phantom energy drains.',
      difficulty: 'easy',
      xp: 35,
      icon: '🔌',
      category: 'energy',
      co2Saving: 2.1,
    },
    {
      id: 'local_food_day',
      title: 'Eat Local Day',
      desc: 'Source all your meals from local farmers or producers for one full day.',
      difficulty: 'medium',
      xp: 45,
      icon: '🌾',
      category: 'food',
      co2Saving: 3.2,
    },
    {
      id: 'plant_tree',
      title: 'Plant a Tree',
      desc: 'Plant a tree or support a reforestation project. Trees absorb ~21 kg CO₂ per year!',
      difficulty: 'medium',
      xp: 100,
      icon: '🌳',
      category: 'lifestyle',
      co2Saving: 21,
    },
    {
      id: 'public_transit_week',
      title: 'Public Transit Week',
      desc: 'Use only public transportation for your daily commute for 5 consecutive days.',
      difficulty: 'hard',
      xp: 120,
      icon: '🚆',
      category: 'transport',
      co2Saving: 25,
    },
    {
      id: 'vegan_day',
      title: 'Fully Vegan Day',
      desc: 'Eat entirely plant-based for one full day. No dairy, eggs, or meat products.',
      difficulty: 'medium',
      xp: 50,
      icon: '🌱',
      category: 'food',
      co2Saving: 7.2,
    },
    {
      id: 'energy_audit',
      title: 'Home Energy Audit',
      desc: 'Walk through your home and identify 5 ways to reduce energy usage. Make at least 2 changes.',
      difficulty: 'easy',
      xp: 40,
      icon: '💡',
      category: 'energy',
      co2Saving: 5,
    },
    {
      id: 'secondhand_shop',
      title: 'Secondhand Shopping',
      desc: 'Buy something you need from a thrift store or secondhand marketplace instead of new.',
      difficulty: 'easy',
      xp: 30,
      icon: '♻️',
      category: 'lifestyle',
      co2Saving: 14,
    },
  ];

  // ── Level System ──
  const LEVELS = [
    { level: 1, name: 'Eco Beginner',    xpRequired: 0 },
    { level: 2, name: 'Green Sprout',    xpRequired: 100 },
    { level: 3, name: 'Nature Ally',     xpRequired: 250 },
    { level: 4, name: 'Earth Guardian',  xpRequired: 500 },
    { level: 5, name: 'Climate Champion',xpRequired: 800 },
    { level: 6, name: 'Eco Warrior',     xpRequired: 1200 },
    { level: 7, name: 'Planet Protector',xpRequired: 1800 },
    { level: 8, name: 'Sustainability Master', xpRequired: 2500 },
  ];

  function init() {
    bindEvents();
    refresh();
  }

  function refresh() {
    const data = Storage.getChallenges();
    renderLevel(data);
    renderActiveChallenge(data);
    renderAvailableChallenges(data);
    renderCompletedChallenges(data);
  }

  function bindEvents() {
    // Event delegation for challenge actions
    document.addEventListener('click', (e) => {
      const startBtn = e.target.closest('[data-challenge-start]');
      if (startBtn) {
        startChallenge(startBtn.dataset.challengeStart);
        return;
      }

      const completeBtn = e.target.closest('[data-challenge-complete]');
      if (completeBtn) {
        completeChallenge(completeBtn.dataset.challengeComplete);
        return;
      }

      const abandonBtn = e.target.closest('[data-challenge-abandon]');
      if (abandonBtn) {
        abandonChallenge();
      }
    });
  }

  function getLevelInfo(points) {
    let current = LEVELS[0];
    let next = LEVELS[1] || null;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (points >= LEVELS[i].xpRequired) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || null;
        break;
      }
    }
    return { current, next };
  }

  function renderLevel(data) {
    const { current, next } = getLevelInfo(data.points);

    Utils.$('#level-badge').textContent = current.level;
    Utils.$('#level-label').textContent = `Level ${current.level} — ${current.name}`;

    if (next) {
      const progress = ((data.points - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100;
      Utils.$('#xp-fill').style.width = Math.min(100, Math.max(0, progress)) + '%';
      Utils.$('#xp-text').textContent = `${data.points} / ${next.xpRequired} XP`;
    } else {
      Utils.$('#xp-fill').style.width = '100%';
      Utils.$('#xp-text').textContent = `${data.points} XP — Max Level!`;
    }
  }

  function renderActiveChallenge(data) {
    const container = Utils.$('#active-challenge');
    Utils.clearChildren(container);

    if (!data.active) {
      const empty = Utils.createElement('div', { className: 'card card-sm' });
      empty.innerHTML = `
        <div class="empty-state" style="padding: var(--space-xl);">
          <div class="empty-state-icon">🏆</div>
          <div class="empty-state-title">No active challenge</div>
          <p class="empty-state-text">Pick a challenge below to get started!</p>
        </div>
      `;
      container.appendChild(empty);
      return;
    }

    const challenge = CHALLENGE_DB.find(c => c.id === data.active.id);
    if (!challenge) return;

    const startDate = new Date(data.active.startedAt);
    const daysSince = Utils.daysBetween(startDate, new Date());

    const card = Utils.createElement('div', { className: 'card challenge-card' });
    card.style.borderColor = 'hsla(152, 68%, 45%, 0.3)';
    card.innerHTML = `
      <div class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty.toUpperCase()}</div>
      <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-md);">
        <span style="font-size: 2.5rem;">${challenge.icon}</span>
        <div>
          <div class="challenge-title">${escapeHtml(challenge.title)}</div>
          <div class="challenge-desc" style="margin-bottom: 0;">${escapeHtml(challenge.desc)}</div>
        </div>
      </div>
      <div class="flex-between" style="margin-top: var(--space-md);">
        <div class="text-sm text-muted">Started ${daysSince === 0 ? 'today' : daysSince + ' day(s) ago'}</div>
        <div class="flex gap-sm">
          <button class="btn btn-ghost btn-sm" data-challenge-abandon type="button">✕ Abandon</button>
          <button class="btn btn-primary btn-sm" data-challenge-complete="${challenge.id}" type="button">✓ Mark Complete (+${challenge.xp} XP)</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  function renderAvailableChallenges(data) {
    const container = Utils.$('#challenges-list');
    Utils.clearChildren(container);

    const completedIds = new Set((data.completed || []).map(c => c.id));
    const activeId = data.active ? data.active.id : null;

    const available = CHALLENGE_DB.filter(c => !completedIds.has(c.id) && c.id !== activeId);

    if (available.length === 0) {
      const empty = Utils.createElement('div', { className: 'card card-sm text-center' });
      empty.innerHTML = `<p class="text-muted">🎉 You've completed all challenges! More coming soon.</p>`;
      container.appendChild(empty);
      return;
    }

    available.forEach(challenge => {
      const card = Utils.createElement('div', { className: 'challenge-card' });
      card.innerHTML = `
        <div class="challenge-difficulty ${challenge.difficulty}">${challenge.difficulty.toUpperCase()}</div>
        <div style="font-size: 2rem; margin-bottom: var(--space-sm);">${challenge.icon}</div>
        <div class="challenge-title">${escapeHtml(challenge.title)}</div>
        <div class="challenge-desc">${escapeHtml(challenge.desc)}</div>
        <div class="challenge-reward">🌟 ${challenge.xp} XP · Saves ~${Utils.formatCO2(challenge.co2Saving)}</div>
        <button class="btn btn-secondary btn-sm btn-full" data-challenge-start="${challenge.id}" type="button" style="margin-top: var(--space-md);"${activeId ? ' disabled title="Complete your active challenge first"' : ''}>
          ${activeId ? '🔒 Finish active first' : '🎯 Start Challenge'}
        </button>
      `;
      container.appendChild(card);
    });
  }

  function renderCompletedChallenges(data) {
    const container = Utils.$('#completed-challenges');
    Utils.clearChildren(container);

    const completed = data.completed || [];

    if (completed.length === 0) {
      const empty = Utils.createElement('div', { className: 'text-muted text-sm' });
      empty.textContent = 'Complete challenges to see them here.';
      container.appendChild(empty);
      return;
    }

    completed.forEach(entry => {
      const challenge = CHALLENGE_DB.find(c => c.id === entry.id);
      if (!challenge) return;

      const card = Utils.createElement('div', { className: 'challenge-card completed' });
      card.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: var(--space-xs);">${challenge.icon}</div>
        <div class="challenge-title" style="font-size: 0.95rem;">${escapeHtml(challenge.title)}</div>
        <div class="text-xs text-muted">${Utils.formatDateDisplay(entry.completedAt.split('T')[0])} · +${challenge.xp} XP</div>
      `;
      container.appendChild(card);
    });
  }

  function startChallenge(challengeId) {
    const data = Storage.getChallenges();
    if (data.active) {
      showToast('Complete or abandon your active challenge first', 'warning');
      return;
    }

    data.active = {
      id: challengeId,
      startedAt: new Date().toISOString(),
    };

    Storage.saveChallenges(data);
    refresh();
    showToast('Challenge started! 🎯', 'success');
    Utils.announce('Challenge started');
  }

  function completeChallenge(challengeId) {
    const data = Storage.getChallenges();
    const challenge = CHALLENGE_DB.find(c => c.id === challengeId);
    if (!challenge) return;

    // Add XP
    data.points = (data.points || 0) + challenge.xp;

    // Update level
    const { current } = getLevelInfo(data.points);
    const oldLevel = data.level || 1;
    data.level = current.level;

    // Move to completed
    data.completed = data.completed || [];
    data.completed.push({
      id: challengeId,
      completedAt: new Date().toISOString(),
      xpEarned: challenge.xp,
    });

    // Clear active
    data.active = null;

    Storage.saveChallenges(data);
    refresh();

    if (data.level > oldLevel) {
      showToast(`🎉 Level Up! You're now Level ${data.level} — ${current.name}!`, 'success');
    } else {
      showToast(`✅ Challenge completed! +${challenge.xp} XP earned!`, 'success');
    }

    Utils.announce(`Challenge completed. Earned ${challenge.xp} experience points.`);
  }

  function abandonChallenge() {
    const data = Storage.getChallenges();
    data.active = null;
    Storage.saveChallenges(data);
    refresh();
    showToast('Challenge abandoned', 'warning');
  }

  function showToast(message, type) {
    if (typeof App !== 'undefined') App.showToast(message, type);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return Object.freeze({ init, refresh });
})();
