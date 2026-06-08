/**
 * EcoLens — Calculator / Onboarding Quiz Module
 * 
 * Renders the multi-step onboarding quiz, collects answers,
 * calculates baseline footprint, and shows results with comparisons.
 */

'use strict';

const Calculator = (() => {
  let currentStep = 0;
  const totalSteps = 6; // welcome + 4 categories + results
  const answers = {};

  function init() {
    renderQuizSteps();
    renderStepIndicator();
    bindEvents();
  }

  function renderStepIndicator() {
    const container = Utils.$('#quiz-steps');
    Utils.clearChildren(container);

    const stepLabels = ['Welcome', 'Transport', 'Food', 'Energy', 'Lifestyle', 'Results'];
    for (let i = 0; i < totalSteps; i++) {
      if (i > 0) {
        const line = Utils.createElement('div', { className: 'step-line' + (i <= currentStep ? ' completed' : '') });
        container.appendChild(line);
      }
      const dot = Utils.createElement('div', {
        className: 'step-dot' + (i === currentStep ? ' active' : '') + (i < currentStep ? ' completed' : ''),
        title: stepLabels[i],
      });
      container.appendChild(dot);
    }
    container.setAttribute('aria-valuenow', currentStep + 1);
  }

  function renderQuizSteps() {
    const categories = ['transport', 'food', 'energy', 'lifestyle'];
    categories.forEach((cat, idx) => {
      const container = Utils.$(`#quiz-${cat}`);
      const questions = EmissionData.QUIZ_QUESTIONS[cat];
      const catInfo = EmissionData.CATEGORIES[cat];

      let html = `<div class="card">`;
      html += `<div class="quiz-category-title"><span class="quiz-category-icon">${catInfo.icon}</span> ${catInfo.label}</div>`;

      questions.forEach(q => {
        html += `<div class="quiz-question" id="qq-${q.id}">`;
        html += `<div class="quiz-question-text">${escapeHtml(q.question)}</div>`;

        if (q.type === 'select') {
          html += `<select class="form-select" id="q-${q.id}" data-qid="${q.id}" aria-label="${escapeHtml(q.question)}">`;
          q.options.forEach(opt => {
            const selected = opt.value === q.default ? ' selected' : '';
            html += `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
          });
          html += `</select>`;
          answers[q.id] = q.default;
        } else if (q.type === 'slider') {
          html += `<div class="slider-container">`;
          html += `<div class="flex-between">`;
          html += `<input type="range" class="form-slider" id="q-${q.id}" data-qid="${q.id}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.default}" aria-label="${escapeHtml(q.question)}" aria-valuemin="${q.min}" aria-valuemax="${q.max}" aria-valuenow="${q.default}">`;
          html += `<span class="slider-value" id="sv-${q.id}">${q.default} ${q.unit}</span>`;
          html += `</div></div>`;
          answers[q.id] = q.default;
        }

        html += `</div>`;
      });

      html += `<div class="quiz-actions">`;
      html += `<button class="btn btn-secondary" type="button" data-action="prev">← Back</button>`;
      html += `<button class="btn btn-primary" type="button" data-action="next">${idx === 3 ? 'See Results →' : 'Next →'}</button>`;
      html += `</div>`;
      html += `</div>`;

      container.innerHTML = html;
    });
  }

  function bindEvents() {
    // Start button
    Utils.$('#btn-start-quiz').addEventListener('click', () => {
      const name = Utils.$('#input-name').value.trim();
      if (name) answers.name = name;
      goToStep(1);
    });

    // Quiz navigation
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'next') goToStep(currentStep + 1);
      if (action === 'prev') goToStep(currentStep - 1);
    });

    // Slider value updates
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('form-slider')) {
        const qid = e.target.dataset.qid;
        const q = findQuestion(qid);
        const val = Number(e.target.value);
        answers[qid] = val;
        const sv = Utils.$(`#sv-${qid}`);
        if (sv && q) sv.textContent = `${val} ${q.unit}`;
        e.target.setAttribute('aria-valuenow', val);
      }
    });

    // Select changes
    document.addEventListener('change', (e) => {
      if (e.target.dataset.qid) {
        answers[e.target.dataset.qid] = e.target.value;
      }
    });

    // Finish quiz
    Utils.$('#btn-finish-quiz').addEventListener('click', finishQuiz);
  }

  function goToStep(step) {
    if (step < 0 || step >= totalSteps) return;

    // Collect current answers from inputs before leaving
    const currentStepEl = Utils.$(`.quiz-step[data-step="${currentStep}"]`);
    if (currentStepEl) {
      currentStepEl.querySelectorAll('.form-select[data-qid], .form-slider[data-qid]').forEach(input => {
        answers[input.dataset.qid] = input.type === 'range' ? Number(input.value) : input.value;
      });
    }

    // Hide current, show next
    Utils.$$('.quiz-step').forEach(el => el.classList.remove('active'));
    const nextStep = Utils.$(`.quiz-step[data-step="${step}"]`);
    if (nextStep) {
      nextStep.classList.add('active');
    }

    currentStep = step;
    renderStepIndicator();

    // If results step, calculate and show
    if (step === 5) {
      showResults();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Utils.announce(`Step ${step + 1} of ${totalSteps}`);
  }

  function showResults() {
    const baseline = EmissionData.calculateBaselineFootprint(answers);

    // Animate total
    const totalEl = Utils.$('#results-total-value');
    const totalKg = baseline.total;
    if (totalKg >= 1000) {
      Utils.animateCounter(totalEl, totalKg / 1000, 1500, ' t');
    } else {
      Utils.animateCounter(totalEl, totalKg, 1200, ' kg');
    }

    // Category breakdown
    const breakdown = Utils.$('#results-breakdown');
    Utils.clearChildren(breakdown);
    const categories = ['transport', 'food', 'energy', 'lifestyle'];
    categories.forEach(cat => {
      const info = EmissionData.CATEGORIES[cat];
      const value = baseline[cat];
      const pct = baseline.total > 0 ? Math.round((value / baseline.total) * 100) : 0;

      const card = Utils.createElement('div', { className: 'card card-compact stat-card' });
      card.innerHTML = `
        <div style="font-size: 1.5rem; margin-bottom: var(--space-xs);">${info.icon}</div>
        <div class="stat-value" style="font-size: 1.5rem; color: ${info.color};">${Utils.formatCO2(value)}</div>
        <div class="stat-label">${info.label} (${pct}%)</div>
      `;
      breakdown.appendChild(card);
    });

    // Comparison bars
    const compContainer = Utils.$('#results-comparison');
    Utils.clearChildren(compContainer);
    const comparisons = [
      { label: 'You', value: baseline.total, className: 'user' },
      { label: '🌍 Global Avg', value: EmissionData.AVERAGES.global, className: 'average' },
      { label: '🇺🇸 US Avg', value: EmissionData.AVERAGES.usa, className: 'average' },
      { label: '🇪🇺 EU Avg', value: EmissionData.AVERAGES.eu, className: 'average' },
      { label: '🇮🇳 India Avg', value: EmissionData.AVERAGES.india, className: 'average' },
      { label: '🎯 2030 Target', value: EmissionData.AVERAGES.target_2030, className: 'average' },
    ];

    const maxVal = Math.max(...comparisons.map(c => c.value));

    comparisons.forEach(comp => {
      const pct = Math.max(5, (comp.value / maxVal) * 100);
      const bar = Utils.createElement('div', { className: 'comparison-bar' });
      bar.innerHTML = `
        <span class="comparison-label">${comp.label}</span>
        <div class="comparison-track">
          <div class="comparison-fill ${comp.className}" style="width: 0%;">${Utils.formatCO2(comp.value)}</div>
        </div>
      `;
      compContainer.appendChild(bar);
      // Animate after append
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.querySelector('.comparison-fill').style.width = pct + '%';
        });
      });
    });
  }

  function finishQuiz() {
    const baseline = EmissionData.calculateBaselineFootprint(answers);

    Storage.saveProfile({
      name: answers.name || 'Eco Warrior',
      quizAnswers: answers,
      completedOnboarding: true,
    });

    Storage.saveBaseline(baseline);

    // Initialize challenge data
    if (!Storage.getChallenges().points) {
      Storage.saveChallenges({ completed: [], active: null, points: 0, level: 1 });
    }

    // Trigger app to show dashboard
    if (typeof App !== 'undefined') {
      App.onOnboardingComplete();
    }
  }

  function findQuestion(qid) {
    for (const cat of Object.values(EmissionData.QUIZ_QUESTIONS)) {
      const q = cat.find(question => question.id === qid);
      if (q) return q;
    }
    return null;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function reset() {
    currentStep = 0;
    Object.keys(answers).forEach(k => delete answers[k]);
    Utils.$$('.quiz-step').forEach(el => el.classList.remove('active'));
    Utils.$('#quiz-welcome').classList.add('active');
    renderStepIndicator();
    Utils.$('#input-name').value = '';
  }

  return Object.freeze({ init, reset });
})();
