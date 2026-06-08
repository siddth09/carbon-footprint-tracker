/**
 * EcoLens — Unit Tests
 * 
 * Tests for emission calculations, storage operations,
 * utility functions, and insights logic.
 * Open tests/test.html in a browser to run.
 */

'use strict';

(() => {
  const results = { pass: 0, fail: 0, tests: [] };

  function assert(condition, testName) {
    if (condition) {
      results.pass++;
      results.tests.push({ name: testName, passed: true });
    } else {
      results.fail++;
      results.tests.push({ name: testName, passed: false });
      console.error(`FAIL: ${testName}`);
    }
  }

  function assertEqual(actual, expected, testName) {
    assert(actual === expected, `${testName} (expected: ${expected}, got: ${actual})`);
  }

  function assertApprox(actual, expected, tolerance, testName) {
    assert(Math.abs(actual - expected) <= tolerance, `${testName} (expected: ~${expected}, got: ${actual})`);
  }

  function group(name) {
    results.tests.push({ group: name });
  }

  // ═══════════════════════════════════════
  // Emission Data Tests
  // ═══════════════════════════════════════
  group('Emission Data');

  assert(typeof EmissionData !== 'undefined', 'EmissionData module exists');
  assert(typeof EmissionData.TRANSPORT === 'object', 'TRANSPORT data exists');
  assert(typeof EmissionData.FOOD === 'object', 'FOOD data exists');
  assert(typeof EmissionData.ENERGY === 'object', 'ENERGY data exists');
  assert(typeof EmissionData.LIFESTYLE === 'object', 'LIFESTYLE data exists');
  assert(typeof EmissionData.ALL_ACTIVITIES === 'object', 'ALL_ACTIVITIES aggregation exists');

  // Verify specific emission factors
  assertApprox(EmissionData.TRANSPORT.car_petrol.factor, 0.192, 0.001, 'Car petrol emission factor');
  assertApprox(EmissionData.TRANSPORT.bicycle.factor, 0, 0.001, 'Bicycle emission factor is zero');
  assertApprox(EmissionData.FOOD.meal_beef.factor, 6.61, 0.01, 'Beef meal emission factor');
  assertApprox(EmissionData.FOOD.meal_vegan.factor, 0.45, 0.01, 'Vegan meal emission factor');
  assert(EmissionData.ENERGY.solar_panel.factor < 0, 'Solar panel has negative (offset) factor');
  assert(EmissionData.LIFESTYLE.recycling.factor < 0, 'Recycling has negative (offset) factor');

  // Verify all activities have required fields
  let allValid = true;
  Object.entries(EmissionData.ALL_ACTIVITIES).forEach(([key, act]) => {
    if (!act.factor && act.factor !== 0) allValid = false;
    if (!act.unit) allValid = false;
    if (!act.label) allValid = false;
    if (!act.category) allValid = false;
  });
  assert(allValid, 'All activities have required fields (factor, unit, label, category)');

  // Categories
  assert(Object.keys(EmissionData.CATEGORIES).length === 4, 'Four categories exist');
  assert(EmissionData.CATEGORIES.transport.label === 'Transport', 'Transport category label');

  // Averages
  assert(EmissionData.AVERAGES.global === 4700, 'Global average CO₂ is 4700 kg');
  assert(EmissionData.AVERAGES.usa === 16000, 'US average CO₂ is 16000 kg');
  assert(EmissionData.AVERAGES.target_2030 === 2500, '2030 target is 2500 kg');

  // Quiz questions
  assert(EmissionData.QUIZ_QUESTIONS.transport.length >= 3, 'Transport has >= 3 quiz questions');
  assert(EmissionData.QUIZ_QUESTIONS.food.length >= 2, 'Food has >= 2 quiz questions');

  // ═══════════════════════════════════════
  // Baseline Calculation Tests
  // ═══════════════════════════════════════
  group('Baseline Calculation');

  const defaultBaseline = EmissionData.calculateBaselineFootprint({});
  assert(typeof defaultBaseline === 'object', 'calculateBaselineFootprint returns object');
  assert(defaultBaseline.total > 0, 'Default baseline total is positive');
  assert(defaultBaseline.transport >= 0, 'Transport component is non-negative');
  assert(defaultBaseline.food >= 0, 'Food component is non-negative');
  assert(defaultBaseline.energy >= 0, 'Energy component is non-negative');
  assertEqual(
    defaultBaseline.total,
    defaultBaseline.transport + defaultBaseline.food + defaultBaseline.energy + defaultBaseline.lifestyle,
    'Total equals sum of categories'
  );

  // Vegan cyclist should have lower footprint
  const ecoBaseline = EmissionData.calculateBaselineFootprint({
    commute_mode: 'bicycle',
    commute_distance: 10,
    commute_days: 5,
    flights_per_year: 0,
    diet_type: 'vegan',
    food_waste: 'none',
    local_food_pct: 80,
    electricity_bill: 150,
    heating_source: 'heat_pump',
    renewable_energy: 'full',
    shopping_frequency: 'rarely',
    streaming_hours: 1,
    recycling_habit: 'always',
  });

  assert(ecoBaseline.total < defaultBaseline.total, 'Eco-conscious baseline is lower than default');
  assert(ecoBaseline.transport < defaultBaseline.transport, 'Cyclist transport is lower');
  assert(ecoBaseline.food < defaultBaseline.food, 'Vegan food emissions are lower');

  // Heavy emitter should have higher footprint
  const heavyBaseline = EmissionData.calculateBaselineFootprint({
    commute_mode: 'car_petrol',
    commute_distance: 100,
    commute_days: 6,
    flights_per_year: 20,
    diet_type: 'heavy_meat',
    food_waste: 'a_lot',
    local_food_pct: 0,
    electricity_bill: 800,
    heating_source: 'heating_oil',
    renewable_energy: 'none',
    shopping_frequency: 'weekly',
    streaming_hours: 10,
    recycling_habit: 'rarely',
  });

  assert(heavyBaseline.total > defaultBaseline.total, 'Heavy emitter baseline is higher than default');

  // ═══════════════════════════════════════
  // Storage Tests
  // ═══════════════════════════════════════
  group('Storage');

  // Clear before testing
  Storage.clearAll();

  assert(!Storage.hasData(), 'hasData returns false after clear');

  // Profile
  Storage.saveProfile({ name: 'Test User', quizAnswers: {}, completedOnboarding: true });
  const profile = Storage.getProfile();
  assert(profile !== null, 'Profile saved and retrieved');
  assertEqual(profile.name, 'Test User', 'Profile name matches');
  assert(profile.completedOnboarding === true, 'Onboarding flag saved');
  assert(Storage.hasData(), 'hasData returns true after profile save');

  // Baseline
  Storage.saveBaseline({ transport: 1000, food: 800, energy: 600, lifestyle: 400, total: 2800 });
  const baseline = Storage.getBaseline();
  assert(baseline !== null, 'Baseline saved and retrieved');
  assertEqual(baseline.total, 2800, 'Baseline total matches');

  // Activities
  const act1 = Storage.addActivity({
    activityKey: 'car_petrol',
    quantity: 30,
    co2: 5.76,
    category: 'transport',
    date: '2025-01-15',
    note: 'Test drive',
  });
  assert(act1.id, 'Activity has generated ID');
  assertEqual(act1.activityKey, 'car_petrol', 'Activity key matches');

  const act2 = Storage.addActivity({
    activityKey: 'meal_vegan',
    quantity: 1,
    co2: 0.45,
    category: 'food',
    date: '2025-01-15',
  });

  const activities = Storage.getActivities();
  assertEqual(activities.length, 2, 'Two activities stored');

  const byDate = Storage.getActivitiesByDate('2025-01-15');
  assertEqual(byDate.length, 2, 'Two activities on 2025-01-15');

  const byRange = Storage.getActivitiesInRange('2025-01-14', '2025-01-16');
  assertEqual(byRange.length, 2, 'Range query returns correct activities');

  Storage.deleteActivity(act1.id);
  assertEqual(Storage.getActivities().length, 1, 'Activity deleted successfully');

  // Settings
  Storage.saveSettings({ theme: 'light', reductionGoal: 50, country: 'usa', notifications: false });
  const settings = Storage.getSettings();
  assertEqual(settings.theme, 'light', 'Settings theme saved');
  assertEqual(settings.reductionGoal, 50, 'Settings goal saved');

  // Export
  const exported = Storage.exportAll();
  assert(typeof exported === 'object', 'Export returns object');
  assert(exported.version === 1, 'Export has version');
  assert(exported.profile !== null, 'Export includes profile');

  // XSS safety - name truncation
  Storage.saveProfile({ name: 'A'.repeat(200), quizAnswers: {} });
  const longProfile = Storage.getProfile();
  assert(longProfile.name.length <= 100, 'Long name truncated to 100 chars');

  // Challenges
  Storage.saveChallenges({ completed: [{ id: 'test' }], active: null, points: 150, level: 2 });
  const challenges = Storage.getChallenges();
  assertEqual(challenges.points, 150, 'Challenges points saved');
  assertEqual(challenges.level, 2, 'Challenges level saved');

  // Cleanup
  Storage.clearAll();

  // ═══════════════════════════════════════
  // Utils Tests
  // ═══════════════════════════════════════
  group('Utilities');

  // formatCO2
  assertEqual(Utils.formatCO2(0), '0 kg', 'formatCO2 zero');
  assertEqual(Utils.formatCO2(500), '500 kg', 'formatCO2 small value');
  assertEqual(Utils.formatCO2(1500), '1.5 t', 'formatCO2 tonnes');
  assertEqual(Utils.formatCO2(-300), '300 kg', 'formatCO2 negative rounds to positive display');
  assertEqual(Utils.formatCO2(NaN), '0 kg', 'formatCO2 NaN');

  // formatNumber
  assertEqual(Utils.formatNumber(0), '0', 'formatNumber zero');
  assert(Utils.formatNumber(NaN) === '0', 'formatNumber NaN');

  // formatPercent
  assertEqual(Utils.formatPercent(75.6), '76%', 'formatPercent rounds');

  // todayString
  const today = Utils.todayString();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(today), 'todayString returns YYYY-MM-DD format');

  // formatDateDisplay
  assertEqual(Utils.formatDateDisplay(today), 'Today', 'formatDateDisplay today');

  // getDaysArray
  const days = Utils.getDaysArray(7);
  assertEqual(days.length, 7, 'getDaysArray returns 7 days');
  assertEqual(days[days.length - 1], today, 'getDaysArray last day is today');

  // daysBetween
  assertEqual(Utils.daysBetween('2025-01-01', '2025-01-11'), 10, 'daysBetween 10 days');

  // clamp
  assertEqual(Utils.clamp(5, 0, 10), 5, 'clamp within range');
  assertEqual(Utils.clamp(-5, 0, 10), 0, 'clamp below min');
  assertEqual(Utils.clamp(15, 0, 10), 10, 'clamp above max');

  // getGreeting
  const greeting = Utils.getGreeting();
  assert(
    greeting === 'Good morning' || greeting === 'Good afternoon' || greeting === 'Good evening',
    'getGreeting returns valid greeting'
  );

  // createElement
  const el = Utils.createElement('div', { className: 'test', id: 'test-el' }, 'Hello');
  assertEqual(el.tagName, 'DIV', 'createElement creates correct tag');
  assertEqual(el.className, 'test', 'createElement sets className');
  assertEqual(el.textContent, 'Hello', 'createElement sets textContent');

  // debounce
  assert(typeof Utils.debounce(() => {}, 100) === 'function', 'debounce returns function');

  // ═══════════════════════════════════════
  // Integration Tests
  // ═══════════════════════════════════════
  group('Integration');

  // End-to-end: quiz -> baseline -> activity -> total
  Storage.clearAll();
  const quizAnswers = {
    commute_mode: 'car_petrol',
    commute_distance: 30,
    commute_days: 5,
    flights_per_year: 2,
    diet_type: 'medium_meat',
    food_waste: 'some',
    local_food_pct: 20,
    electricity_bill: 300,
    heating_source: 'natural_gas',
    renewable_energy: 'none',
    shopping_frequency: 'monthly',
    streaming_hours: 3,
    recycling_habit: 'sometimes',
  };
  const calcBaseline = EmissionData.calculateBaselineFootprint(quizAnswers);
  Storage.saveBaseline(calcBaseline);
  Storage.saveProfile({ name: 'Integration Test', quizAnswers, completedOnboarding: true });

  assert(Storage.hasData(), 'Integration: data persisted after quiz');
  const storedBaseline = Storage.getBaseline();
  assertEqual(storedBaseline.total, calcBaseline.total, 'Integration: baseline matches calculation');

  // Add activities for today
  const todayStr = Storage.todayString();
  Storage.addActivity({ activityKey: 'car_petrol', quantity: 30, co2: 5.76, category: 'transport', date: todayStr });
  Storage.addActivity({ activityKey: 'meal_vegetarian', quantity: 1, co2: 0.74, category: 'food', date: todayStr });
  Storage.addActivity({ activityKey: 'recycling', quantity: 2, co2: -1.0, category: 'lifestyle', date: todayStr });

  const todayActs = Storage.getActivitiesByDate(todayStr);
  assertEqual(todayActs.length, 3, 'Integration: 3 activities logged today');

  const dailyTotal = todayActs.reduce((s, a) => s + a.co2, 0);
  assertApprox(dailyTotal, 5.5, 0.1, 'Integration: daily total correct (5.76 + 0.74 - 1.0)');

  // Verify negative offset works
  const positiveOnly = todayActs.filter(a => a.co2 > 0).reduce((s, a) => s + a.co2, 0);
  assert(dailyTotal < positiveOnly, 'Integration: recycling offset reduces total');

  Storage.clearAll();

  // ═══════════════════════════════════════
  // Render Results
  // ═══════════════════════════════════════
  function renderResults() {
    const summary = document.getElementById('summary');
    const total = results.pass + results.fail;
    const allPassed = results.fail === 0;

    summary.innerHTML = `
      <span class="${allPassed ? 'pass' : 'fail'}" style="font-size: 1.2rem; font-weight: 700;">
        ${allPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
      </span>
      <br>
      <span class="pass">${results.pass} passed</span>
      ${results.fail > 0 ? ` · <span class="fail">${results.fail} failed</span>` : ''}
      · ${total} total
    `;

    const container = document.getElementById('results');
    let currentGroup = '';

    results.tests.forEach(t => {
      if (t.group) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'group';
        groupDiv.innerHTML = `<div class="group-title">${t.group}</div>`;
        container.appendChild(groupDiv);
        currentGroup = t.group;
        return;
      }

      const testDiv = document.createElement('div');
      testDiv.className = 'test';
      testDiv.innerHTML = `
        <span class="icon">${t.passed ? '✅' : '❌'}</span>
        <span class="name">${t.name}</span>
        <span class="status ${t.passed ? 'pass' : 'fail'}">${t.passed ? 'PASS' : 'FAIL'}</span>
      `;
      container.appendChild(testDiv);
    });

    // Also log to console
    console.log(`\n=== EcoLens Test Results ===`);
    console.log(`${results.pass} passed, ${results.fail} failed, ${total} total`);
    if (results.fail > 0) {
      console.log('Failed tests:');
      results.tests.filter(t => t.passed === false).forEach(t => console.log(`  ❌ ${t.name}`));
    }
  }

  renderResults();
})();
