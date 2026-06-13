/**
 * EcoLens — EcoBot, What-If Simulator, Social Share & Achievements
 * 
 * Smart contextual assistant that provides personalized eco-advice,
 * interactive "what-if" scenario comparisons, shareable score cards,
 * and achievement badges with confetti celebrations.
 * 
 * @module EcoBot
 * @requires EmissionData, Storage, Utils
 */

'use strict';

const EcoBot = (() => {

  // ═══════════════════════════════════════════
  // 1. ECOBOT AI ASSISTANT
  // ═══════════════════════════════════════════

  /** @type {Array<{role: string, text: string}>} Chat history for the session */
  let chatHistory = [];
  /** @type {boolean} Whether the bot panel is currently open */
  let isPanelOpen = false;

  /**
   * Knowledge base of contextual responses.
   * The bot selects responses based on user data patterns.
   * @readonly
   */
  const KNOWLEDGE_BASE = [
    // Transport advice
    { trigger: 'transport_high', category: 'transport',
      responses: [
        'Your transport emissions are your biggest area. Even switching one car trip per week to public transit saves ~400 kg CO₂/year!',
        'Have you considered carpooling? Sharing rides cuts per-person emissions by 50% immediately.',
        'Electric bikes are amazing for commutes under 15 km — zero emissions and no parking hassles!',
      ] },
    { trigger: 'transport_low', category: 'transport',
      responses: [
        'Your transport footprint is impressively low! You\'re clearly making smart commute choices. 🚲',
        'Great transport habits! Your low-emission commute is saving tonnes of CO₂ every year.',
      ] },
    // Food advice
    { trigger: 'food_high', category: 'food',
      responses: [
        'Food is a big part of your footprint. Try "Meatless Mondays" — just one day/week saves ~340 kg CO₂/year!',
        'Switching from beef to chicken for half your meals could cut your food emissions by 40%.',
        'Seasonal, local produce has up to 10x lower emissions than imported out-of-season food.',
      ] },
    { trigger: 'food_low', category: 'food',
      responses: [
        'Your food choices are planet-friendly! Plant-forward eating is one of the highest-impact actions. 🌱',
        'Amazing food footprint! Your dietary choices are significantly below average.',
      ] },
    // Energy advice
    { trigger: 'energy_high', category: 'energy',
      responses: [
        'Energy is driving your footprint up. LED bulbs use 75% less electricity — an easy win!',
        'Smart power strips eliminate phantom loads. Devices on standby waste 5-10% of household power.',
        'Lowering your thermostat by just 2°C saves up to 10% on heating emissions.',
      ] },
    { trigger: 'energy_low', category: 'energy',
      responses: [
        'Your energy usage is efficient! Keep up those smart habits. ⚡',
        'Great energy management! You\'re well below average consumption.',
      ] },
    // Lifestyle advice
    { trigger: 'lifestyle_high', category: 'lifestyle',
      responses: [
        'Fast fashion has a huge carbon cost. One new garment ≈ 15 kg CO₂. Try secondhand or clothing swaps!',
        'Digital declutter: reduce streaming quality from 4K to HD and save ~60% of streaming emissions.',
      ] },
    // General encouragement
    { trigger: 'streak', category: 'general',
      responses: [
        'You\'re on a logging streak! Consistency is key to understanding and reducing your footprint.',
        'Keep that streak going! Regular tracking makes you 3x more likely to hit your reduction goals.',
      ] },
    { trigger: 'new_user', category: 'general',
      responses: [
        'Welcome! Start by logging your main daily activities — commute, meals, and energy use. I\'ll give you personalized tips as your data grows!',
        'Great to have you! Try the Quick Log on your Dashboard for the fastest way to track activities.',
      ] },
    { trigger: 'improvement', category: 'general',
      responses: [
        'You\'re trending downward — that\'s exactly what we want to see! Every kg of CO₂ saved matters.',
        'Your recent emissions are below your baseline. You\'re making real progress! 🎉',
      ] },
  ];

  /**
   * Quick suggestion buttons the user can tap in the chat panel.
   * @readonly
   */
  const QUICK_SUGGESTIONS = [
    { text: '💡 Give me a tip', action: 'tip' },
    { text: '📊 My summary', action: 'summary' },
    { text: '🔄 What-if scenario', action: 'whatif' },
    { text: '🏆 My achievements', action: 'achievements' },
    { text: '📤 Share my score', action: 'share' },
  ];

  /**
   * Initialize the EcoBot module: render chat UI, bind events.
   */
  function init() {
    renderChatPanel();
    bindChatEvents();
    initAchievements();
    renderWhatIfSection();
  }

  /**
   * Build the floating chat panel DOM.
   * Uses textContent for any user-sourced strings to prevent XSS.
   */
  function renderChatPanel() {
    // Floating action button
    const fab = Utils.createElement('button', {
      className: 'ecobot-fab',
      id: 'ecobot-fab',
      type: 'button',
      'aria-label': 'Open EcoBot assistant',
      'aria-expanded': 'false',
    });
    fab.innerHTML = '<span class="ecobot-fab-icon">🤖</span><span class="ecobot-fab-badge" id="ecobot-badge">1</span>';
    document.body.appendChild(fab);

    // Chat panel
    const panel = Utils.createElement('div', {
      className: 'ecobot-panel',
      id: 'ecobot-panel',
      role: 'complementary',
      'aria-label': 'EcoBot assistant',
    });

    panel.innerHTML = `
      <div class="ecobot-header">
        <div class="ecobot-header-info">
          <span class="ecobot-avatar">🤖</span>
          <div>
            <div class="ecobot-name">EcoBot</div>
            <div class="ecobot-status">Your eco-assistant</div>
          </div>
        </div>
        <button class="ecobot-close" id="ecobot-close" type="button" aria-label="Close assistant">✕</button>
      </div>
      <div class="ecobot-messages" id="ecobot-messages" role="log" aria-live="polite">
        <!-- Messages rendered here -->
      </div>
      <div class="ecobot-suggestions" id="ecobot-suggestions">
        <!-- Quick suggestion buttons -->
      </div>
      <div class="ecobot-input-row">
        <input type="text" class="ecobot-input" id="ecobot-input" placeholder="Ask me anything about your footprint..." maxlength="300" autocomplete="off" aria-label="Chat with EcoBot">
        <button class="ecobot-send" id="ecobot-send" type="button" aria-label="Send message">→</button>
      </div>
    `;
    document.body.appendChild(panel);

    // Render quick suggestions
    renderSuggestions();

    // Initial greeting
    addBotMessage(getContextualGreeting());
  }

  /**
   * Render quick-tap suggestion buttons in the chat panel.
   */
  function renderSuggestions() {
    const container = Utils.$('#ecobot-suggestions');
    if (!container) return;
    Utils.clearChildren(container);
    QUICK_SUGGESTIONS.forEach(s => {
      const btn = Utils.createElement('button', {
        className: 'ecobot-suggestion',
        type: 'button',
        dataset: { action: s.action },
      }, s.text);
      container.appendChild(btn);
    });
  }

  /**
   * Bind all chat-related event listeners.
   */
  function bindChatEvents() {
    // Toggle panel
    Utils.$('#ecobot-fab').addEventListener('click', togglePanel);
    Utils.$('#ecobot-close').addEventListener('click', togglePanel);

    // Send message
    Utils.$('#ecobot-send').addEventListener('click', handleUserMessage);
    Utils.$('#ecobot-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleUserMessage();
    });

    // Quick suggestions
    Utils.$('#ecobot-suggestions').addEventListener('click', (e) => {
      const btn = e.target.closest('.ecobot-suggestion');
      if (!btn) return;
      handleAction(btn.dataset.action);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isPanelOpen) togglePanel();
    });
  }

  /** Toggle the chat panel open/closed. */
  function togglePanel() {
    isPanelOpen = !isPanelOpen;
    Utils.$('#ecobot-panel').classList.toggle('open', isPanelOpen);
    Utils.$('#ecobot-fab').setAttribute('aria-expanded', isPanelOpen ? 'true' : 'false');
    Utils.$('#ecobot-badge').style.display = 'none';
    if (isPanelOpen) {
      Utils.$('#ecobot-input').focus();
      Utils.announce('EcoBot assistant opened');
    }
  }

  /**
   * Process a user's typed message and generate a contextual response.
   */
  function handleUserMessage() {
    const input = Utils.$('#ecobot-input');
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    input.value = '';

    // Simple keyword-based intent detection
    const lower = text.toLowerCase();
    setTimeout(() => {
      if (lower.includes('tip') || lower.includes('advice') || lower.includes('help') || lower.includes('suggest')) {
        handleAction('tip');
      } else if (lower.includes('summary') || lower.includes('overview') || lower.includes('how am i')) {
        handleAction('summary');
      } else if (lower.includes('what if') || lower.includes('switch') || lower.includes('compare') || lower.includes('scenario')) {
        handleAction('whatif');
      } else if (lower.includes('share') || lower.includes('social') || lower.includes('post')) {
        handleAction('share');
      } else if (lower.includes('achieve') || lower.includes('badge') || lower.includes('level')) {
        handleAction('achievements');
      } else if (lower.includes('challenge') || lower.includes('goal')) {
        addBotMessage('Check out the Challenges tab for eco-challenges! Complete them to earn XP and level up. 🏆');
      } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        addBotMessage(getContextualGreeting());
      } else {
        // Fallback: give a smart contextual tip
        addBotMessage(getSmartTip());
      }
    }, 400 + Math.random() * 300);
  }

  /**
   * Handle a quick-action button press.
   * @param {string} action - The action identifier
   */
  function handleAction(action) {
    switch (action) {
      case 'tip':
        addBotMessage(getSmartTip());
        break;
      case 'summary':
        addBotMessage(getUserSummary());
        break;
      case 'whatif':
        addBotMessage('Open the **What-If Simulator** below the Dashboard to explore different scenarios! I\'ve highlighted it for you. 🔄');
        if (typeof App !== 'undefined') App.navigateTo('dashboard');
        setTimeout(() => {
          const section = Utils.$('#whatif-section');
          if (section) section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
        break;
      case 'achievements':
        addBotMessage(getAchievementSummary());
        break;
      case 'share':
        generateShareCard();
        addBotMessage('Your share card is ready! 📤 Check the popup to copy or download your score card.');
        break;
      default:
        addBotMessage(getSmartTip());
    }
  }

  /**
   * Add a bot message bubble to the chat panel.
   * @param {string} text - Message text (safe — no user-sourced HTML)
   */
  function addBotMessage(text) {
    const container = Utils.$('#ecobot-messages');
    const msg = Utils.createElement('div', { className: 'ecobot-msg bot' });
    const bubble = Utils.createElement('div', { className: 'ecobot-bubble bot' });
    bubble.textContent = text;
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ role: 'bot', text });
  }

  /**
   * Add a user message bubble to the chat panel.
   * @param {string} text - User's message (sanitized via textContent)
   */
  function addUserMessage(text) {
    const container = Utils.$('#ecobot-messages');
    const msg = Utils.createElement('div', { className: 'ecobot-msg user' });
    const bubble = Utils.createElement('div', { className: 'ecobot-bubble user' });
    bubble.textContent = text;
    msg.appendChild(bubble);
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
    chatHistory.push({ role: 'user', text });
  }

  /**
   * Generate a context-aware greeting based on user data.
   * @returns {string}
   */
  function getContextualGreeting() {
    const profile = Storage.getProfile();
    const activities = Storage.getActivities();
    const name = profile ? profile.name : 'there';

    if (activities.length === 0) {
      return `Hi ${name}! 👋 I'm EcoBot, your personal eco-assistant. Start logging activities and I'll give you smart tips to shrink your carbon footprint!`;
    }

    const streak = calculateStreak(activities);
    if (streak >= 3) {
      return `Hey ${name}! 🔥 You're on a ${streak}-day logging streak! Ask me for a tip, check your summary, or explore what-if scenarios.`;
    }

    return `Hi ${name}! 🌿 I've been analyzing your data. Ask me for personalized tips, a summary, or try a what-if scenario!`;
  }

  /**
   * Select a contextually relevant tip based on the user's data patterns.
   * @returns {string}
   */
  function getSmartTip() {
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();

    if (activities.length === 0) {
      const entry = KNOWLEDGE_BASE.find(k => k.trigger === 'new_user');
      return entry.responses[Math.floor(Math.random() * entry.responses.length)];
    }

    // Find highest-emission category
    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);
    const catTotals = { transport: 0, food: 0, energy: 0, lifestyle: 0 };
    recent.forEach(a => { catTotals[a.category] = (catTotals[a.category] || 0) + a.co2; });

    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCat = sorted[0][0];
    const topVal = sorted[0][1];
    const totalRecent = Object.values(catTotals).reduce((s, v) => s + v, 0);

    // Check if improving
    if (baseline && totalRecent > 0 && totalRecent < baseline.total / 12) {
      const entry = KNOWLEDGE_BASE.find(k => k.trigger === 'improvement');
      if (entry) return entry.responses[Math.floor(Math.random() * entry.responses.length)];
    }

    // Category-specific advice
    const pct = totalRecent > 0 ? (topVal / totalRecent) : 0;
    const triggerKey = pct > 0.35 ? `${topCat}_high` : `${topCat}_low`;
    const entry = KNOWLEDGE_BASE.find(k => k.trigger === triggerKey);
    if (entry) {
      return entry.responses[Math.floor(Math.random() * entry.responses.length)];
    }

    return 'Keep tracking your activities! The more data I have, the better tips I can give you. 📊';
  }

  /**
   * Generate a personalized text summary of the user's footprint.
   * @returns {string}
   */
  function getUserSummary() {
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();
    const profile = Storage.getProfile();

    if (activities.length === 0) {
      return 'No data yet! Log some activities and I\'ll generate a summary of your carbon footprint trends.';
    }

    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);
    const totalRecent = recent.reduce((s, a) => s + a.co2, 0);
    const uniqueDays = new Set(recent.map(a => a.date)).size;
    const avgDaily = uniqueDays > 0 ? totalRecent / uniqueDays : 0;

    let summary = `📊 30-Day Summary: ${Utils.formatCO2(totalRecent)} total CO₂ across ${uniqueDays} days tracked (avg ${Utils.formatCO2(avgDaily)}/day).`;

    if (baseline && baseline.total > 0) {
      const monthlyBase = baseline.total / 12;
      const diff = totalRecent - monthlyBase;
      if (diff < 0) {
        summary += ` That's ${Utils.formatCO2(Math.abs(diff))} BELOW your baseline! 🎉`;
      } else {
        summary += ` That's ${Utils.formatCO2(diff)} above your baseline. Let's find ways to reduce!`;
      }
    }

    return summary;
  }

  /**
   * Calculate the user's current logging streak.
   * @param {Array} activities
   * @returns {number}
   */
  function calculateStreak(activities) {
    if (activities.length === 0) return 0;
    const dates = [...new Set(activities.map(a => a.date))].sort().reverse();
    const today = Storage.todayString();
    const yesterday = Utils.formatDateToString(new Date(Date.now() - 86400000));
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 0;
    let checkDate = new Date(dates[0] + 'T00:00:00');
    for (const dateStr of dates) {
      if (dateStr === Utils.formatDateToString(checkDate)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return streak;
  }


  // ═══════════════════════════════════════════
  // 2. WHAT-IF SIMULATOR
  // ═══════════════════════════════════════════

  /**
   * Predefined what-if scenarios with current/alternative activity comparisons.
   * @readonly
   */
  const WHATIF_SCENARIOS = [
    {
      id: 'car_to_bike',
      title: 'Drive → Cycle',
      desc: 'Switch 3 car trips/week to cycling',
      icon: '🚗→🚲',
      currentKey: 'car_petrol',
      altKey: 'bicycle',
      tripsPerWeek: 3,
      distanceKm: 10,
    },
    {
      id: 'beef_to_veg',
      title: 'Beef → Plant-based',
      desc: 'Replace 4 beef meals/week with vegetarian',
      icon: '🥩→🥗',
      currentKey: 'meal_beef',
      altKey: 'meal_vegetarian',
      tripsPerWeek: 4,
      distanceKm: 1,
    },
    {
      id: 'car_to_transit',
      title: 'Drive → Public Transit',
      desc: 'Take the train instead of driving 5 days/week',
      icon: '🚗→🚆',
      currentKey: 'car_petrol',
      altKey: 'train',
      tripsPerWeek: 5,
      distanceKm: 15,
    },
    {
      id: 'hot_to_cold',
      title: 'Hot → Cold Laundry',
      desc: 'Wash clothes in cold water (3 loads/week)',
      icon: '♨️→🧊',
      currentKey: 'laundry_hot',
      altKey: 'laundry_cold',
      tripsPerWeek: 3,
      distanceKm: 1,
    },
    {
      id: 'new_to_secondhand',
      title: 'New → Secondhand Clothes',
      desc: 'Buy secondhand instead of new (2 items/month)',
      icon: '🛍️→♻️',
      currentKey: 'new_clothing',
      altKey: 'secondhand',
      tripsPerWeek: 0.5,
      distanceKm: 1,
    },
    {
      id: 'long_to_short_shower',
      title: 'Long → Short Showers',
      desc: 'Cut showers from 10 min to 3 min daily',
      icon: '🚿→💧',
      currentKey: 'shower_long',
      altKey: 'shower_short',
      tripsPerWeek: 7,
      distanceKm: 1,
    },
  ];

  /**
   * Render the What-If Simulator cards into the dashboard section.
   */
  function renderWhatIfSection() {
    const whatifSection = Utils.$('#whatif-section');
    if (!whatifSection) return;

    const grid = Utils.$('#whatif-grid');
    if (!grid) return;
    Utils.clearChildren(grid);

    WHATIF_SCENARIOS.forEach(scenario => {
      const current = EmissionData.ALL_ACTIVITIES[scenario.currentKey];
      const alt = EmissionData.ALL_ACTIVITIES[scenario.altKey];
      if (!current || !alt) return;

      const weeklyCurrent = current.factor * scenario.distanceKm * scenario.tripsPerWeek;
      const weeklyAlt = alt.factor * scenario.distanceKm * scenario.tripsPerWeek;
      const weeklySaving = weeklyCurrent - weeklyAlt;
      const annualSaving = weeklySaving * 52;

      const card = Utils.createElement('div', {
        className: 'whatif-card',
        tabindex: '0',
        role: 'article',
        'aria-label': `What if you ${scenario.desc}`,
      });

      card.innerHTML = `
        <div class="whatif-icon">${scenario.icon}</div>
        <div class="whatif-title">${scenario.title}</div>
        <div class="whatif-desc">${scenario.desc}</div>
        <div class="whatif-result">
          <div class="whatif-saving">${Utils.formatCO2(annualSaving)}</div>
          <div class="whatif-period">saved per year</div>
        </div>
        <div class="whatif-bar-container">
          <div class="whatif-bar-label">
            <span>Current</span>
            <span>After switch</span>
          </div>
          <div class="whatif-bars">
            <div class="whatif-bar current" style="width: 100%;"></div>
            <div class="whatif-bar alt" style="width: ${weeklyCurrent > 0 ? Math.max(2, (weeklyAlt / weeklyCurrent) * 100) : 2}%;"></div>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });
  }


  // ═══════════════════════════════════════════
  // 3. SOCIAL SHARE CARD
  // ═══════════════════════════════════════════

  /**
   * Generate and display a shareable score card as a modal.
   * Uses Canvas API to render a visual card that can be downloaded or shared.
   */
  function generateShareCard() {
    const baseline = Storage.getBaseline();
    const profile = Storage.getProfile();
    const activities = Storage.getActivities();
    const challenges = Storage.getChallenges();

    if (!baseline) {
      addBotMessage('Complete the onboarding quiz first to generate your share card!');
      return;
    }

    // Calculate stats
    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);
    const totalRecent = recent.reduce((s, a) => s + a.co2, 0);
    const monthlyBase = baseline.total / 12;
    const reduction = monthlyBase > 0 ? Math.round(((monthlyBase - totalRecent) / monthlyBase) * 100) : 0;

    // Build the share modal
    const modal = Utils.$('#modal-share');
    if (!modal) return;
    modal.classList.add('open');

    const content = Utils.$('#share-card-content');
    if (!content) return;

    const name = profile ? profile.name : 'Eco Warrior';
    const level = challenges.level || 1;
    const completedCount = challenges.completed ? challenges.completed.length : 0;
    const globalAvg = EmissionData.AVERAGES.global;
    const pctVsGlobal = Math.round(((globalAvg - baseline.total) / globalAvg) * 100);
    const vsGlobalText = pctVsGlobal > 0 ? `${pctVsGlobal}% below global average` : `${Math.abs(pctVsGlobal)}% above global average`;

    content.innerHTML = `
      <div class="share-card" id="share-card">
        <div class="share-card-header">
          <span class="share-card-logo">🌿 EcoLens</span>
          <span class="share-card-badge">Level ${level}</span>
        </div>
        <div class="share-card-name">${name}'s Carbon Score</div>
        <div class="share-card-footprint">${Utils.formatCO2(baseline.total)}<span class="share-card-unit">/year</span></div>
        <div class="share-card-comparison">${vsGlobalText} 🌍</div>
        <div class="share-card-stats">
          <div class="share-stat">
            <div class="share-stat-value">${reduction > 0 ? '↓' : '↑'}${Math.abs(reduction)}%</div>
            <div class="share-stat-label">vs baseline</div>
          </div>
          <div class="share-stat">
            <div class="share-stat-value">${completedCount}</div>
            <div class="share-stat-label">challenges</div>
          </div>
          <div class="share-stat">
            <div class="share-stat-value">${activities.length}</div>
            <div class="share-stat-label">activities</div>
          </div>
        </div>
        <div class="share-card-cta">Track yours at ecolens.app 🌱</div>
      </div>
    `;

    // Copy text button
    Utils.$('#btn-share-copy').onclick = () => {
      const text = `🌿 My carbon footprint is ${Utils.formatCO2(baseline.total)}/year (${vsGlobalText}). I've completed ${completedCount} eco-challenges! Track yours with EcoLens. #EcoLens #CarbonFootprint #ClimateAction`;
      navigator.clipboard.writeText(text).then(() => {
        if (typeof App !== 'undefined') App.showToast('Copied to clipboard! 📋', 'success');
      }).catch(() => {
        if (typeof App !== 'undefined') App.showToast('Could not copy — try selecting the text manually', 'warning');
      });
    };

    // Close modal
    Utils.$('#share-close').onclick = () => modal.classList.remove('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
  }


  // ═══════════════════════════════════════════
  // 4. ACHIEVEMENT BADGES
  // ═══════════════════════════════════════════

  /**
   * Achievement definitions with unlock criteria.
   * @readonly
   */
  const ACHIEVEMENTS = [
    { id: 'first_log',      icon: '🌱', title: 'First Step',        desc: 'Log your first activity',           check: (a) => a.length >= 1 },
    { id: 'ten_logs',       icon: '📊', title: 'Data Driven',       desc: 'Log 10 activities',                 check: (a) => a.length >= 10 },
    { id: 'fifty_logs',     icon: '📈', title: 'Tracking Pro',      desc: 'Log 50 activities',                 check: (a) => a.length >= 50 },
    { id: 'green_meal',     icon: '🥗', title: 'Green Eater',       desc: 'Log 5 vegetarian/vegan meals',      check: (a) => a.filter(x => x.activityKey === 'meal_vegetarian' || x.activityKey === 'meal_vegan').length >= 5 },
    { id: 'cyclist',        icon: '🚲', title: 'Pedal Power',       desc: 'Log 5 bicycle trips',               check: (a) => a.filter(x => x.activityKey === 'bicycle').length >= 5 },
    { id: 'recycler',       icon: '♻️', title: 'Recycling Hero',    desc: 'Log 10 recycling activities',       check: (a) => a.filter(x => x.activityKey === 'recycling' || x.activityKey === 'composting').length >= 10 },
    { id: 'low_day',        icon: '⭐', title: 'Low-Carbon Day',    desc: 'Have a day under 3 kg CO₂',         check: (a) => { const byDate = {}; a.forEach(x => { byDate[x.date] = (byDate[x.date] || 0) + x.co2; }); return Object.values(byDate).some(v => v > 0 && v < 3); } },
    { id: 'week_streak',    icon: '🔥', title: 'Week Warrior',      desc: 'Maintain a 7-day logging streak',   check: (a) => calculateStreak(a) >= 7 },
    { id: 'challenge_done', icon: '🏆', title: 'Challenge Accepted',desc: 'Complete your first challenge',     check: () => { const c = Storage.getChallenges(); return c.completed && c.completed.length >= 1; } },
    { id: 'tree_planter',   icon: '🌳', title: 'Tree Hugger',       desc: 'Log a tree planting activity',      check: (a) => a.some(x => x.activityKey === 'tree_planted') },
    { id: 'zero_transport', icon: '🚶', title: 'Car-Free Hero',     desc: 'Log a full day with zero-emission transport only', check: (a) => { const byDate = {}; a.filter(x => x.category === 'transport').forEach(x => { if (!byDate[x.date]) byDate[x.date] = []; byDate[x.date].push(x); }); return Object.values(byDate).some(day => day.length > 0 && day.every(x => x.co2 <= 0)); } },
    { id: 'fifty_saved',    icon: '💎', title: 'Impact Maker',      desc: 'Offset 50 kg CO₂ through green actions', check: (a) => a.filter(x => x.co2 < 0).reduce((s, x) => s + Math.abs(x.co2), 0) >= 50 },
  ];

  /** @type {Set<string>} Tracks already-celebrated achievements to avoid re-animating */
  let celebratedAchievements = new Set();

  /**
   * Check and unlock any newly earned achievements.
   * Fires confetti animation on new unlocks.
   */
  function initAchievements() {
    checkAchievements();
  }

  /**
   * Evaluate all achievement criteria and trigger celebrations for new ones.
   */
  function checkAchievements() {
    const activities = Storage.getActivities();
    const unlocked = getUnlockedAchievements(activities);

    // Check for new unlocks
    const stored = Storage.getChallenges();
    const previouslyUnlocked = stored.achievements || [];
    const newUnlocks = unlocked.filter(a => !previouslyUnlocked.includes(a.id));

    if (newUnlocks.length > 0) {
      stored.achievements = unlocked.map(a => a.id);
      Storage.saveChallenges(stored);

      newUnlocks.forEach(achievement => {
        if (!celebratedAchievements.has(achievement.id)) {
          celebratedAchievements.add(achievement.id);
          if (typeof App !== 'undefined') {
            App.showToast(`🏅 Achievement Unlocked: ${achievement.title}!`, 'success');
          }
          fireConfetti();
        }
      });
    }

    renderAchievements(unlocked);
  }

  /**
   * Get list of achievements the user has unlocked.
   * @param {Array} activities
   * @returns {Array}
   */
  function getUnlockedAchievements(activities) {
    return ACHIEVEMENTS.filter(a => {
      try { return a.check(activities); }
      catch { return false; }
    });
  }

  /**
   * Render achievement badges into the achievements container in the dashboard.
   * @param {Array} unlocked - List of unlocked achievement objects
   */
  function renderAchievements(unlocked) {
    const container = Utils.$('#achievements-grid');
    if (!container) return;
    Utils.clearChildren(container);

    const unlockedIds = new Set(unlocked.map(a => a.id));

    ACHIEVEMENTS.forEach(achievement => {
      const isUnlocked = unlockedIds.has(achievement.id);
      const badge = Utils.createElement('div', {
        className: `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`,
        'aria-label': `${achievement.title}: ${achievement.desc}${isUnlocked ? ' (Unlocked)' : ' (Locked)'}`,
        tabindex: '0',
      });

      badge.innerHTML = `
        <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-desc">${achievement.desc}</div>
      `;

      container.appendChild(badge);
    });

    // Update counter
    const counter = Utils.$('#achievements-count');
    if (counter) counter.textContent = `${unlocked.length} / ${ACHIEVEMENTS.length}`;
  }

  /**
   * Get a text summary of the user's achievements for the bot.
   * @returns {string}
   */
  function getAchievementSummary() {
    const activities = Storage.getActivities();
    const unlocked = getUnlockedAchievements(activities);
    if (unlocked.length === 0) {
      return 'No badges unlocked yet! Start logging activities to earn your first achievement. 🌱';
    }
    const names = unlocked.map(a => `${a.icon} ${a.title}`).join(', ');
    return `You've unlocked ${unlocked.length}/${ACHIEVEMENTS.length} badges: ${names}. Keep going! 🏅`;
  }

  /**
   * Fire a confetti animation for achievement celebrations.
   * Respects prefers-reduced-motion.
   */
  function fireConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = Utils.createElement('canvas', {
      id: 'confetti-canvas',
      'aria-hidden': 'true',
    });
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#25c174', '#30a493', '#f5b22d', '#4287d6', '#d64242', '#9b59b6', '#1abc9c'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: Math.random() * -18 - 5,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.4,
        opacity: 1,
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      frame++;
      if (alive && frame < 180) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(animate);
  }

  /**
   * Refresh achievements check (called after new activity is logged).
   */
  function refreshAchievements() {
    checkAchievements();
  }

  // ── Public API ──
  return Object.freeze({
    init,
    refreshAchievements,
    fireConfetti,
    renderWhatIfSection,
    ACHIEVEMENTS,
    WHATIF_SCENARIOS,
    getUnlockedAchievements,
    getSmartTip,
    getUserSummary,
  });
})();
