/**
 * EcoLens — Tracker Module
 * 
 * Handles activity logging, display, filtering, deletion,
 * and the add-activity modal with live CO₂ estimation.
 */

'use strict';

const Tracker = (() => {
  let currentFilter = 'all';
  let currentDate = Storage.todayString();

  function init() {
    setDateInput();
    bindEvents();
    render();
  }

  function setDateInput() {
    const dateInput = Utils.$('#tracker-date');
    dateInput.value = currentDate;

    const activityDateInput = Utils.$('#activity-date');
    activityDateInput.value = currentDate;
  }

  function bindEvents() {
    // Date change
    Utils.$('#tracker-date').addEventListener('change', (e) => {
      currentDate = e.target.value;
      render();
    });

    // Category filter
    Utils.$('#tracker-category-filter').addEventListener('click', (e) => {
      const tag = e.target.closest('.tag');
      if (!tag) return;
      currentFilter = tag.dataset.filter;
      Utils.$$('#tracker-category-filter .tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
      render();
    });

    // Open modal
    const openModal = () => {
      const modal = Utils.$('#modal-add-activity');
      modal.classList.add('open');
      Utils.$('#activity-date').value = currentDate;
      Utils.$('#activity-category').focus();
      Utils.announce('Log activity dialog opened');
    };

    Utils.$('#btn-add-activity').addEventListener('click', openModal);
    Utils.$('#btn-add-first-activity').addEventListener('click', openModal);

    // Close modal
    Utils.$('#modal-close').addEventListener('click', closeModal);
    Utils.$('#modal-add-activity').addEventListener('click', (e) => {
      if (e.target.id === 'modal-add-activity') closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && Utils.$('#modal-add-activity').classList.contains('open')) {
        closeModal();
      }
    });

    // Category change -> populate activities
    Utils.$('#activity-category').addEventListener('change', (e) => {
      populateActivityTypes(e.target.value);
      updateEstimate();
    });

    // Activity type / quantity change -> update estimate
    Utils.$('#activity-type').addEventListener('change', updateEstimate);
    Utils.$('#activity-quantity').addEventListener('input', updateEstimate);

    // Form submit
    Utils.$('#form-add-activity').addEventListener('submit', (e) => {
      e.preventDefault();
      addActivity();
    });

    // Delete activity
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.activity-delete');
      if (!btn) return;
      const id = btn.dataset.id;
      Storage.deleteActivity(id);
      render();
      refreshDependents();
      showToast('Activity removed', 'success');
      Utils.announce('Activity deleted');
    });
  }

  function populateActivityTypes(category) {
    const select = Utils.$('#activity-type');
    Utils.clearChildren(select);

    const defaultOpt = Utils.createElement('option', { value: '' }, 'Select activity...');
    select.appendChild(defaultOpt);

    if (!category) return;

    Object.entries(EmissionData.ALL_ACTIVITIES).forEach(([key, act]) => {
      if (act.category === category) {
        const opt = Utils.createElement('option', { value: key }, `${act.icon} ${act.label}`);
        select.appendChild(opt);
      }
    });

    Utils.$('#quantity-unit').textContent = '';
    Utils.$('#activity-quantity').value = 1;
  }

  function updateEstimate() {
    const actKey = Utils.$('#activity-type').value;
    const qty = Number(Utils.$('#activity-quantity').value) || 0;

    if (!actKey || !EmissionData.ALL_ACTIVITIES[actKey]) {
      Utils.$('#activity-estimate').textContent = '0 kg';
      Utils.$('#quantity-unit').textContent = '';
      return;
    }

    const act = EmissionData.ALL_ACTIVITIES[actKey];
    const co2 = act.factor * qty;
    Utils.$('#activity-estimate').textContent = Utils.formatCO2(Math.abs(co2));
    Utils.$('#quantity-unit').textContent = act.unit;
  }

  function addActivity() {
    const actKey = Utils.$('#activity-type').value;
    const qty = Number(Utils.$('#activity-quantity').value);
    const date = Utils.$('#activity-date').value;
    const note = Utils.$('#activity-note').value;

    if (!actKey || qty <= 0 || !date) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const act = EmissionData.ALL_ACTIVITIES[actKey];
    if (!act) return;

    const co2 = act.factor * qty;

    Storage.addActivity({
      activityKey: actKey,
      quantity: qty,
      co2: co2,
      category: act.category,
      date: date,
      note: note,
    });

    closeModal();
    resetForm();
    currentDate = date;
    Utils.$('#tracker-date').value = date;
    render();
    refreshDependents();
    showToast(`Logged: ${act.label} — ${Utils.formatCO2(Math.abs(co2))} CO₂`, 'success');
    Utils.announce(`Activity logged: ${act.label}, ${Utils.formatCO2(Math.abs(co2))} C O 2`);
  }

  function render() {
    const activities = Storage.getActivitiesByDate(currentDate);
    let filtered = activities;

    if (currentFilter !== 'all') {
      filtered = activities.filter(a => a.category === currentFilter);
    }

    const listEl = Utils.$('#activity-list');
    const emptyEl = Utils.$('#tracker-empty');
    Utils.clearChildren(listEl);

    if (filtered.length === 0) {
      listEl.style.display = 'none';
      emptyEl.style.display = 'block';
    } else {
      listEl.style.display = 'flex';
      emptyEl.style.display = 'none';

      // Sort: newest first
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      filtered.forEach(entry => {
        const act = EmissionData.ALL_ACTIVITIES[entry.activityKey];
        if (!act) return;

        const item = Utils.createElement('div', { className: 'activity-item' });
        const isNegative = entry.co2 < 0;

        item.innerHTML = `
          <div class="activity-icon" aria-hidden="true">${act.icon}</div>
          <div class="activity-details">
            <div class="activity-name">${escapeHtml(act.label)}</div>
            <div class="activity-meta">${entry.quantity} ${act.unit}${entry.note ? ' · ' + escapeHtml(entry.note) : ''}</div>
          </div>
          <div class="activity-co2 ${isNegative ? 'negative' : 'positive'}">${isNegative ? '-' : '+'}${Utils.formatCO2(Math.abs(entry.co2))}</div>
          <button class="activity-delete" data-id="${entry.id}" type="button" aria-label="Delete ${escapeHtml(act.label)} entry">✕</button>
        `;
        listEl.appendChild(item);
      });
    }

    // Daily total
    const dailyTotal = activities.reduce((sum, a) => sum + a.co2, 0);
    Utils.$('#tracker-daily-total').textContent = Utils.formatCO2(dailyTotal) + ' CO₂';

    // Comparison to baseline daily
    const baseline = Storage.getBaseline();
    const compEl = Utils.$('#tracker-daily-comparison');
    if (baseline && baseline.total > 0) {
      const dailyBaseline = baseline.total / 365;
      const diff = dailyTotal - dailyBaseline;
      if (diff <= 0) {
        compEl.textContent = `✅ ${Utils.formatCO2(Math.abs(diff))} below your daily average`;
        compEl.style.color = 'var(--color-success)';
      } else {
        compEl.textContent = `⚠️ ${Utils.formatCO2(diff)} above your daily average`;
        compEl.style.color = 'var(--color-warning)';
      }
    } else {
      compEl.textContent = '';
    }
  }

  function closeModal() {
    Utils.$('#modal-add-activity').classList.remove('open');
    Utils.announce('Dialog closed');
  }

  function resetForm() {
    Utils.$('#form-add-activity').reset();
    Utils.$('#activity-estimate').textContent = '0 kg';
    Utils.$('#quantity-unit').textContent = '';
    const typeSelect = Utils.$('#activity-type');
    Utils.clearChildren(typeSelect);
    typeSelect.appendChild(Utils.createElement('option', { value: '' }, 'Select activity...'));
  }

  function refreshDependents() {
    if (typeof Dashboard !== 'undefined') Dashboard.refresh();
    if (typeof Insights !== 'undefined') Insights.refresh();
  }

  function showToast(message, type = 'success') {
    if (typeof App !== 'undefined') {
      App.showToast(message, type);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Public quick-log (from dashboard)
  function quickLog(activityKey, quantity = 1) {
    const act = EmissionData.ALL_ACTIVITIES[activityKey];
    if (!act) return;

    const co2 = act.factor * quantity;
    Storage.addActivity({
      activityKey,
      quantity,
      co2,
      category: act.category,
      date: Storage.todayString(),
      note: 'Quick log',
    });

    render();
    refreshDependents();
    showToast(`Quick logged: ${act.label}`, 'success');
    Utils.announce(`Quick logged: ${act.label}`);
  }

  return Object.freeze({ init, render, quickLog });
})();
