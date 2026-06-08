/**
 * EcoLens — Insights Engine
 * 
 * Analyzes user activity data to generate personalized,
 * actionable recommendations for reducing carbon footprint.
 * Uses pattern detection and comparison against baseline.
 */

'use strict';

const Insights = (() => {
  function init() {
    refresh();
  }

  function refresh() {
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();
    const insights = generateInsights(activities, baseline);

    renderSummary(activities, baseline);
    renderInsights(insights);
  }

  function generateInsights(activities, baseline) {
    const insights = [];

    if (activities.length === 0) return insights;

    // Calculate category totals from last 30 days
    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);
    const categoryTotals = { transport: 0, food: 0, energy: 0, lifestyle: 0 };
    const activityCounts = {};

    recent.forEach(a => {
      categoryTotals[a.category] = (categoryTotals[a.category] || 0) + a.co2;
      activityCounts[a.activityKey] = (activityCounts[a.activityKey] || 0) + 1;
    });

    const totalRecent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);
    const monthlyBaseline = baseline ? baseline.total / 12 : 0;

    // ── Overall Trend ──
    if (baseline && totalRecent > 0) {
      const diff = totalRecent - monthlyBaseline;
      if (diff < 0) {
        insights.push({
          type: 'success',
          icon: '🎉',
          title: 'Great Progress!',
          body: `Your emissions this month are ${Utils.formatCO2(Math.abs(diff))} below your baseline. Keep up the good work!`,
          impact: `Saving ${Utils.formatCO2(Math.abs(diff) * 12)} annually at this rate`,
          impactClass: 'save',
          priority: 1,
        });
      } else if (diff > monthlyBaseline * 0.1) {
        insights.push({
          type: 'warning',
          icon: '⚠️',
          title: 'Emissions Trending Up',
          body: `Your tracked emissions are ${Utils.formatCO2(diff)} above your monthly baseline. Let's look at where you can cut back.`,
          impact: null,
          priority: 2,
        });
      }
    }

    // ── Highest Impact Category ──
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && sortedCats[0][1] > 0) {
      const [topCat, topVal] = sortedCats[0];
      const pct = totalRecent > 0 ? Math.round((topVal / totalRecent) * 100) : 0;
      const catInfo = EmissionData.CATEGORIES[topCat];

      insights.push({
        type: 'action',
        icon: '🎯',
        title: `${catInfo.label} is Your Biggest Impact Area`,
        body: `${catInfo.icon} ${catInfo.label} accounts for ${pct}% of your recent emissions (${Utils.formatCO2(topVal)}). Focusing here will give you the biggest returns.`,
        impact: null,
        priority: 3,
      });
    }

    // ── Transport-Specific ──
    if (categoryTotals.transport > 0) {
      const carTrips = Object.entries(activityCounts)
        .filter(([key]) => key.startsWith('car_') || key === 'taxi')
        .reduce((s, [, c]) => s + c, 0);
      
      if (carTrips >= 5) {
        const bikeTrips = activityCounts.bicycle || 0;
        const transitTrips = (activityCounts.bus || 0) + (activityCounts.train || 0) + (activityCounts.metro || 0);
        
        if (bikeTrips === 0 && transitTrips < carTrips * 0.3) {
          const potentialSaving = categoryTotals.transport * 0.3;
          insights.push({
            type: 'action',
            icon: '🚲',
            title: 'Try Alternative Transport',
            body: `You've logged ${carTrips} car trips recently. Switching just 2 trips per week to cycling or public transit could significantly reduce your transport emissions.`,
            impact: `Potential saving: ${Utils.formatCO2(potentialSaving)} per month`,
            impactClass: 'save',
            priority: 4,
          });
        }
      }

      if (activityCounts.carpool && activityCounts.carpool > 0) {
        insights.push({
          type: 'success',
          icon: '🤝',
          title: 'Carpooling Champion',
          body: `You've carpooled ${activityCounts.carpool} times. Each carpool trip cuts emissions roughly in half compared to driving alone. Excellent!`,
          impact: null,
          priority: 8,
        });
      }
    }

    // ── Food-Specific ──
    if (categoryTotals.food > 0) {
      const meatMeals = (activityCounts.meal_beef || 0) + (activityCounts.meal_lamb || 0) + (activityCounts.meal_pork || 0);
      const plantMeals = (activityCounts.meal_vegetarian || 0) + (activityCounts.meal_vegan || 0);
      const totalMeals = meatMeals + plantMeals + (activityCounts.meal_chicken || 0) + (activityCounts.meal_fish || 0);

      if (meatMeals > 0 && totalMeals > 0) {
        const meatPct = Math.round((meatMeals / totalMeals) * 100);
        if (meatPct > 50) {
          const beefCount = activityCounts.meal_beef || 0;
          const saving = beefCount * (EmissionData.FOOD.meal_beef.factor - EmissionData.FOOD.meal_chicken.factor);
          insights.push({
            type: 'action',
            icon: '🥗',
            title: 'Reduce Red Meat Consumption',
            body: `${meatPct}% of your logged meals contain red meat. Swapping beef for chicken or plant-based alternatives even twice a week makes a big difference.`,
            impact: saving > 0 ? `Potential saving: ${Utils.formatCO2(saving * 4)} per month` : null,
            impactClass: 'save',
            priority: 5,
          });
        }
      }

      if (plantMeals > 3) {
        insights.push({
          type: 'success',
          icon: '🌱',
          title: 'Plant-Powered Choices',
          body: `You've logged ${plantMeals} vegetarian/vegan meals. Plant-based meals produce up to 90% less CO₂ than beef meals. Amazing!`,
          impact: null,
          priority: 9,
        });
      }
    }

    // ── Energy-Specific ──
    if (categoryTotals.energy > 0) {
      const hotLaundry = activityCounts.laundry_hot || 0;
      const coldLaundry = activityCounts.laundry_cold || 0;

      if (hotLaundry > coldLaundry && hotLaundry > 2) {
        const saving = hotLaundry * (EmissionData.ENERGY.laundry_hot.factor - EmissionData.ENERGY.laundry_cold.factor);
        insights.push({
          type: 'action',
          icon: '🧊',
          title: 'Switch to Cold Water Laundry',
          body: `You're washing with hot water most of the time. Cold water cycles use 75% less energy and are just as effective for most clothes.`,
          impact: `Potential saving: ${Utils.formatCO2(saving)} per month`,
          impactClass: 'save',
          priority: 6,
        });
      }

      const longShowers = activityCounts.shower_long || 0;
      if (longShowers > 5) {
        const saving = longShowers * (EmissionData.ENERGY.shower_long.factor - EmissionData.ENERGY.shower_short.factor);
        insights.push({
          type: 'action',
          icon: '🚿',
          title: 'Shorter Showers, Big Impact',
          body: `You've logged ${longShowers} long showers (10 min). Cutting to 3-minute showers saves water, energy, and ~70% of shower-related emissions.`,
          impact: `Potential saving: ${Utils.formatCO2(saving)} per month`,
          impactClass: 'save',
          priority: 6,
        });
      }
    }

    // ── Lifestyle-Specific ──
    if (categoryTotals.lifestyle > 0) {
      const recycling = activityCounts.recycling || 0;
      const composting = activityCounts.composting || 0;

      if (recycling === 0 && composting === 0 && recent.length > 5) {
        insights.push({
          type: 'action',
          icon: '♻️',
          title: 'Start Recycling & Composting',
          body: `No recycling or composting logged yet. These simple habits can offset a meaningful portion of your lifestyle emissions.`,
          impact: `Potential offset: ${Utils.formatCO2(15)} per month`,
          impactClass: 'save',
          priority: 7,
        });
      } else if (recycling > 3 || composting > 3) {
        insights.push({
          type: 'success',
          icon: '♻️',
          title: 'Eco-Conscious Habits',
          body: `You're regularly recycling and composting. These habits are contributing to a negative carbon offset. Keep it up!`,
          impact: null,
          priority: 10,
        });
      }
    }

    // ── General Tip (always show one) ──
    const tips = [
      {
        type: 'info', icon: '💡', priority: 20,
        title: 'Did You Know?',
        body: 'Air-drying clothes instead of using a dryer can save approximately 2.4 kg of CO₂ per load. Over a year, that adds up to significant savings.',
      },
      {
        type: 'info', icon: '🌡️', priority: 20,
        title: 'Smart Thermostat Tip',
        body: 'Lowering your thermostat by just 1°C can reduce your heating bill and emissions by up to 10%. Every degree counts!',
      },
      {
        type: 'info', icon: '🔌', priority: 20,
        title: 'Phantom Energy',
        body: 'Devices left on standby can account for 5-10% of household electricity use. Unplugging devices or using smart power strips helps.',
      },
      {
        type: 'info', icon: '🛒', priority: 20,
        title: 'Buy Local, Save CO₂',
        body: 'Locally sourced food travels fewer miles to your plate. Choosing local produce can reduce food transport emissions by up to 15%.',
      },
      {
        type: 'info', icon: '🌳', priority: 20,
        title: 'The Power of Trees',
        body: 'A single mature tree absorbs about 21 kg of CO₂ per year. Planting trees or supporting reforestation projects can help offset your footprint.',
      },
    ];

    // Pick a random tip based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    insights.push(tips[dayOfYear % tips.length]);

    // Sort by priority
    insights.sort((a, b) => a.priority - b.priority);

    return insights;
  }

  function renderSummary(activities, baseline) {
    const container = Utils.$('#insights-summary');
    Utils.clearChildren(container);

    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);
    const totalRecent = recent.reduce((s, a) => s + a.co2, 0);
    const monthlyBaseline = baseline ? baseline.total / 12 : 0;
    const uniqueDays = new Set(recent.map(a => a.date)).size;

    const cards = [
      {
        icon: '📊',
        value: Utils.formatCO2(totalRecent),
        label: 'Last 30 Days',
        badge: monthlyBaseline > 0 ? (totalRecent <= monthlyBaseline ? 'On Track' : 'Above Baseline') : null,
        badgeClass: totalRecent <= monthlyBaseline ? 'badge-success' : 'badge-warning',
      },
      {
        icon: '📅',
        value: uniqueDays,
        label: 'Days Tracked',
        badge: uniqueDays >= 7 ? 'Active' : 'Getting Started',
        badgeClass: uniqueDays >= 7 ? 'badge-success' : 'badge-info',
      },
      {
        icon: '📈',
        value: recent.length,
        label: 'Activities Logged',
        badge: null,
        badgeClass: '',
      },
    ];

    cards.forEach(c => {
      const card = Utils.createElement('div', { className: 'card card-sm stat-card' });
      card.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: var(--space-sm);">${c.icon}</div>
        <div class="stat-value" style="font-size: 1.8rem;">${typeof c.value === 'number' ? c.value : c.value}</div>
        <div class="stat-label">${c.label}</div>
        ${c.badge ? `<span class="badge ${c.badgeClass}" style="margin-top: var(--space-sm);">${c.badge}</span>` : ''}
      `;
      container.appendChild(card);
    });
  }

  function renderInsights(insights) {
    const listEl = Utils.$('#insights-list');
    const emptyEl = Utils.$('#insights-empty');
    Utils.clearChildren(listEl);

    if (insights.length === 0) {
      listEl.style.display = 'none';
      emptyEl.style.display = 'block';
      return;
    }

    listEl.style.display = 'flex';
    emptyEl.style.display = 'none';

    insights.forEach(insight => {
      const card = Utils.createElement('div', { className: `insight-card ${insight.type}` });
      card.innerHTML = `
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${escapeHtml(insight.title)}</div>
          <div class="insight-body">${escapeHtml(insight.body)}</div>
          ${insight.impact ? `<div class="insight-impact ${insight.impactClass || ''}">${escapeHtml(insight.impact)}</div>` : ''}
        </div>
      `;
      listEl.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return Object.freeze({ init, refresh });
})();
