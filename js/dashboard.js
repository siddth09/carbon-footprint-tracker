/**
 * EcoLens — Dashboard Module
 * 
 * Renders dashboard stats, Chart.js charts (category donut + 30-day trend),
 * quick-log grid, and handles dynamic updates.
 */

/* global Utils, Storage, EmissionData, App, Chart, Tracker */

'use strict';

const Dashboard = (() => {
  let categoryChart = null;
  let trendChart = null;

  function init() {
    refresh();
  }

  function refresh() {
    renderGreeting();
    renderStats();
    renderCharts();
    renderQuickLog();
    renderWeeklySummary();
  }

  function renderGreeting() {
    const profile = Storage.getProfile();
    const name = profile ? profile.name : 'there';
    Utils.$('#dashboard-greeting').textContent = `${Utils.getGreeting()}, ${name}! 🌿`;
    Utils.$('#dashboard-subtitle').textContent = `Here's your carbon footprint overview`;
  }

  function renderStats() {
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();
    const settings = Storage.getSettings();
    const today = Storage.todayString();

    // Monthly total
    const now = new Date();
    const monthStart = Utils.formatDateToString(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthActivities = activities.filter(a => a.date >= monthStart);
    const monthTotal = monthActivities.reduce((s, a) => s + a.co2, 0);

    Utils.animateCounter(Utils.$('#stat-monthly-value'), Math.round(monthTotal), 1000, ' kg');

    // Monthly change vs baseline
    const changeEl = Utils.$('#stat-monthly-change');
    if (baseline && baseline.total > 0) {
      const monthlyBaseline = baseline.total / 12;
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const projectedMonthly = (monthTotal / dayOfMonth) * daysInMonth;
      const diff = projectedMonthly - monthlyBaseline;

      if (diff <= 0) {
        changeEl.className = 'stat-change positive';
        changeEl.textContent = `↓ ${Math.round(Math.abs(diff))} kg projected savings`;
      } else {
        changeEl.className = 'stat-change negative';
        changeEl.textContent = `↑ ${Math.round(diff)} kg above baseline`;
      }
    } else {
      changeEl.textContent = '';
    }

    // Today's total
    const todayActivities = activities.filter(a => a.date === today);
    const todayTotal = todayActivities.reduce((s, a) => s + a.co2, 0);
    Utils.$('#stat-daily-value').textContent = Utils.formatCO2(todayTotal);

    // Streak
    const streak = calculateStreak(activities);
    Utils.animateCounter(Utils.$('#stat-streak-value'), streak, 800);

    // Goal progress
    if (baseline && baseline.total > 0) {
      const goalPct = settings.reductionGoal || 25;
      const targetAnnual = baseline.total * (1 - goalPct / 100);

      // Annualize current month
      const now2 = new Date();
      const daysInYear = 365;
      const dayOfYear = Math.floor((now2 - new Date(now2.getFullYear(), 0, 0)) / 86400000);
      const yearActivities = activities.filter(a => a.date >= `${now2.getFullYear()}-01-01`);
      const yearTotal = yearActivities.reduce((s, a) => s + a.co2, 0);
      const projectedAnnual = dayOfYear > 0 ? (yearTotal / dayOfYear) * daysInYear : baseline.total;

      const reduction = baseline.total - projectedAnnual;
      const targetReduction = baseline.total - targetAnnual;
      const progress = targetReduction > 0 ? Math.min(100, Math.max(0, Math.round((reduction / targetReduction) * 100))) : 0;

      Utils.animateCounter(Utils.$('#stat-goal-value'), progress, 800, '%');
      Utils.$('#stat-goal-label').textContent = `of ${goalPct}% reduction goal`;
    }
  }

  function calculateStreak(activities) {
    if (activities.length === 0) return 0;

    const dates = [...new Set(activities.map(a => a.date))].sort().reverse();
    const today = Storage.todayString();
    
    // Check if today or yesterday has activity
    const yesterday = Utils.formatDateToString(new Date(Date.now() - 86400000));
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 0;
    let checkDate = new Date(dates[0] + 'T00:00:00');

    for (const dateStr of dates) {
      const d = Utils.formatDateToString(checkDate);
      if (dateStr === d) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr < d) {
        break;
      }
    }

    return streak;
  }

  function renderCharts() {
    renderCategoryChart();
    renderTrendChart();
  }

  function renderCategoryChart() {
    const canvas = Utils.$('#chart-category');
    const ctx = canvas.getContext('2d');
    const activities = Storage.getActivities();

    // Last 30 days
    const thirtyDaysAgo = Utils.formatDateToString(new Date(Date.now() - 30 * 86400000));
    const recent = activities.filter(a => a.date >= thirtyDaysAgo);

    const catTotals = { transport: 0, food: 0, energy: 0, lifestyle: 0 };
    recent.forEach(a => {
      catTotals[a.category] = (catTotals[a.category] || 0) + Math.max(0, a.co2);
    });

    const labels = Object.keys(catTotals).map(k => EmissionData.CATEGORIES[k].label);
    const data = Object.values(catTotals);
    const colors = Object.keys(catTotals).map(k => EmissionData.CATEGORIES[k].color);
    const hasData = data.some(v => v > 0);

    if (categoryChart) categoryChart.destroy();

    categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: hasData ? labels : ['No data yet'],
        datasets: [{
          data: hasData ? data : [1],
          backgroundColor: hasData ? colors.map(c => c.replace(')', ', 0.8)').replace('hsl', 'hsla')) : ['hsla(220, 10%, 30%, 0.3)'],
          borderColor: hasData ? colors : ['hsla(220, 10%, 30%, 0.5)'],
          borderWidth: 2,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: window.getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#9ca3af',
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 10,
              font: { family: 'Inter', size: 12 },
            },
          },
          tooltip: {
            backgroundColor: 'hsla(220, 20%, 12%, 0.95)',
            titleColor: '#f2f2f2',
            bodyColor: '#9ca3af',
            borderColor: 'hsla(0, 0%, 100%, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${Utils.formatCO2(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  function renderTrendChart() {
    const canvas = Utils.$('#chart-trend');
    const ctx = canvas.getContext('2d');
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();
    const days = Utils.getDaysArray(30);

    const dailyTotals = days.map(date => {
      return activities
        .filter(a => a.date === date)
        .reduce((sum, a) => sum + a.co2, 0);
    });

    const labels = days.map(d => {
      const date = new Date(d + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const dailyBaseline = baseline ? baseline.total / 365 : 0;

    if (trendChart) trendChart.destroy();

    const accentPrimary = window.getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#25c174';

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily CO₂',
            data: dailyTotals,
            borderColor: accentPrimary,
            backgroundColor: accentPrimary.replace(')', ', 0.1)').replace('hsl', 'hsla'),
            fill: true,
            tension: 0.4,
            pointRadius: 2,
            pointHoverRadius: 6,
            pointBackgroundColor: accentPrimary,
            borderWidth: 2,
          },
          ...(dailyBaseline > 0 ? [{
            label: 'Daily Baseline',
            data: Array(30).fill(Math.round(dailyBaseline * 10) / 10),
            borderColor: 'hsla(0, 72%, 55%, 0.5)',
            borderDash: [6, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
          }] : []),
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { color: 'hsla(0, 0%, 100%, 0.04)' },
            ticks: {
              color: window.getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#555',
              font: { family: 'Inter', size: 10 },
              maxTicksLimit: 8,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'hsla(0, 0%, 100%, 0.04)' },
            ticks: {
              color: window.getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#555',
              font: { family: 'Inter', size: 10 },
              callback: (v) => v + ' kg',
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: window.getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#9ca3af',
              usePointStyle: true,
              pointStyleWidth: 10,
              font: { family: 'Inter', size: 12 },
            },
          },
          tooltip: {
            backgroundColor: 'hsla(220, 20%, 12%, 0.95)',
            titleColor: '#f2f2f2',
            bodyColor: '#9ca3af',
            borderColor: 'hsla(0, 0%, 100%, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Utils.formatCO2(ctx.raw)}`,
            },
          },
        },
      },
    });
  }

  function renderQuickLog() {
    const grid = Utils.$('#quicklog-grid');
    Utils.clearChildren(grid);

    const quickActivities = [
      'car_petrol', 'bus', 'bicycle', 'train',
      'meal_beef', 'meal_vegetarian', 'meal_vegan', 'coffee',
      'electricity', 'laundry_cold', 'shower_short',
      'recycling',
    ];

    quickActivities.forEach(key => {
      const act = EmissionData.ALL_ACTIVITIES[key];
      if (!act) return;

      const btn = Utils.createElement('button', {
        className: 'quicklog-btn',
        type: 'button',
        'aria-label': `Quick log ${act.label}`,
      });

      btn.innerHTML = `
        <span class="icon" aria-hidden="true">${act.icon}</span>
        <span class="label">${act.label}</span>
        <span class="co2">${act.factor >= 0 ? '+' : '-'}${Utils.formatCO2(act.factor)} / ${act.unit}</span>
      `;

      btn.addEventListener('click', () => {
        Tracker.quickLog(key, 1);
      });

      grid.appendChild(btn);
    });

    // Go to tracker button
    Utils.$('#btn-go-to-tracker').addEventListener('click', () => {
      if (typeof App !== 'undefined') App.navigateTo('tracker');
    });
  }

  /**
   * Render the Weekly Summary section on the dashboard.
   * Compares the user's weekly emissions against their baseline and provides a contextual tip.
   */
  function renderWeeklySummary() {
    const activities = Storage.getActivities();
    const baseline = Storage.getBaseline();
    const container = Utils.$('#weekly-summary-content');
    if (!container) return;

    // Filter activities in the last 7 days
    const sevenDaysAgo = Utils.formatDateToString(new Date(Date.now() - 7 * 86400000));
    const weeklyActs = activities.filter(a => a.date >= sevenDaysAgo);
    const weeklyTotal = weeklyActs.reduce((s, a) => s + a.co2, 0);

    const weeklyBaseline = baseline ? (baseline.total / 52) : 0;
    const diff = weeklyBaseline > 0 ? (weeklyTotal - weeklyBaseline) : 0;
    const diffPercent = weeklyBaseline > 0 ? Math.round((Math.abs(diff) / weeklyBaseline) * 100) : 0;

    let comparisonHTML = '';
    if (baseline) {
      if (diff <= 0) {
        comparisonHTML = `<span class="badge badge-success">↓ ${diffPercent}% below baseline</span>`;
      } else {
        comparisonHTML = `<span class="badge badge-danger">↑ ${diffPercent}% above baseline</span>`;
      }
    } else {
      comparisonHTML = `<span class="badge badge-secondary">No baseline calculated</span>`;
    }

    // Category breakdown for the week
    const catTotals = { transport: 0, food: 0, energy: 0, lifestyle: 0 };
    weeklyActs.forEach(a => {
      catTotals[a.category] = (catTotals[a.category] || 0) + a.co2;
    });

    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCats.length > 0 && sortedCats[0][1] > 0 ? sortedCats[0][0] : null;

    let insightsHTML = '';
    if (weeklyActs.length === 0) {
      insightsHTML = `<p class="text-muted text-sm" style="margin: 0; padding: var(--space-md) 0;">No activities logged in the past 7 days. Start logging daily activities under the **Log** tab to see your weekly performance report here!</p>`;
    } else {
      let adviceText = '';
      if (topCategory === 'transport') {
        adviceText = 'Your transportation emissions were your primary driver this week. Consider walking, cycling, or using public transit for short trips.';
      } else if (topCategory === 'food') {
        adviceText = 'Your diet choices contributed significantly to your footprint this week. Incorporating more plant-based meals next week can make a large impact.';
      } else if (topCategory === 'energy') {
        adviceText = 'Electricity and heating drove your emissions this week. Unplugging idle appliances and lowering the thermostat slightly will help reduce usage.';
      } else if (topCategory === 'lifestyle') {
        adviceText = 'Consumer goods and lifestyle choices were your main source of emissions. Try purchasing secondhand or opting for durable alternatives.';
      } else {
        adviceText = 'Fantastic job! Your weekly emissions are extremely low. Keep maintaining these sustainable habits!';
      }

      const greenActions = weeklyActs.filter(a => a.co2 < 0).length;
      const greenText = greenActions > 0 
        ? ` You logged <strong>${greenActions} green offset actions</strong> (e.g. recycling or composting) — outstanding work!`
        : '';

      insightsHTML = `
        <div class="weekly-summary-grid">
          <div class="weekly-summary-stats">
            <div class="weekly-stat">
              <span class="label">Total Emitted</span>
              <span class="value">${Utils.formatCO2(weeklyTotal)}</span>
            </div>
            <div class="weekly-stat">
              <span class="label">Weekly Baseline</span>
              <span class="value">${baseline ? Utils.formatCO2(weeklyBaseline) : 'N/A'}</span>
            </div>
            <div class="weekly-stat">
              <span class="label">Comparison</span>
              <span class="value">${comparisonHTML}</span>
            </div>
          </div>
          <div class="weekly-summary-details">
            <h4 class="details-title">Weekly Performance Analysis</h4>
            <p class="details-text">
              Over the last 7 days, you emitted <strong>${Utils.formatCO2(weeklyTotal)}</strong> of carbon dioxide equivalents. 
              ${baseline ? `This represents a difference of <strong>${Utils.formatCO2(Math.abs(diff))}</strong> compared to your average weekly target.${greenText}` : ''}
            </p>
            <p class="details-tip">
              💡 <strong>Smart Tip:</strong> ${adviceText}
            </p>
          </div>
        </div>
      `;
    }

    container.innerHTML = insightsHTML;
  }

  const Dashboard = Object.freeze({ init, refresh });
  window.Dashboard = Dashboard;
  return Dashboard;
})();
