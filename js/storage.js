/**
 * EcoLens — Storage Module
 * 
 * Manages all localStorage CRUD operations with data validation,
 * migration support, and XSS-safe serialization.
 */

'use strict';

const Storage = (() => {

  const STORAGE_PREFIX = 'ecolens_';
  const DATA_VERSION = 1;

  // ── Keys ──
  const KEYS = {
    profile:     STORAGE_PREFIX + 'profile',
    baseline:    STORAGE_PREFIX + 'baseline',
    activities:  STORAGE_PREFIX + 'activities',
    challenges:  STORAGE_PREFIX + 'challenges',
    settings:    STORAGE_PREFIX + 'settings',
    version:     STORAGE_PREFIX + 'version',
  };

  // ── Helpers ──
  function safeStringify(data) {
    try {
      return JSON.stringify(data);
    } catch (e) {
      console.error('[Storage] Stringify error:', e);
      return null;
    }
  }

  function safeParse(raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Storage] Parse error:', e);
      return null;
    }
  }

  function isLocalStorageAvailable() {
    try {
      const test = '__ecolens_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // ── Core CRUD ──
  function set(key, value) {
    if (!isLocalStorageAvailable()) return false;
    const json = safeStringify(value);
    if (json === null) return false;
    try {
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      console.error('[Storage] Write failed:', e);
      return false;
    }
  }

  function get(key, fallback = null) {
    if (!isLocalStorageAvailable()) return fallback;
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = safeParse(raw);
    return parsed !== null ? parsed : fallback;
  }

  function remove(key) {
    if (!isLocalStorageAvailable()) return;
    localStorage.removeItem(key);
  }

  // ── Profile ──
  function saveProfile(profile) {
    // Sanitize profile name by stripping HTML tags and escaping brackets to prevent XSS
    const sanitizedName = String(profile.name || '')
      .replace(/<[^>]*>/g, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .substring(0, 100);
    return set(KEYS.profile, {
      name: sanitizedName,
      quizAnswers: profile.quizAnswers || {},
      completedOnboarding: !!profile.completedOnboarding,
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  function getProfile() {
    return get(KEYS.profile, null);
  }

  // ── Baseline Footprint ──
  function saveBaseline(baseline) {
    return set(KEYS.baseline, {
      transport: Number(baseline.transport) || 0,
      food: Number(baseline.food) || 0,
      energy: Number(baseline.energy) || 0,
      lifestyle: Number(baseline.lifestyle) || 0,
      total: Number(baseline.total) || 0,
      calculatedAt: new Date().toISOString(),
    });
  }

  function getBaseline() {
    return get(KEYS.baseline, null);
  }

  // ── Activity Logging ──
  function getActivities() {
    return get(KEYS.activities, []);
  }

  function addActivity(activity) {
    const activities = getActivities();
    // Enforce reasonable CO2 bounds to prevent overflow/manipulation
    const rawCo2 = Math.round((Number(activity.co2) || 0) * 100) / 100;
    const boundedCo2 = Math.min(100000, Math.max(-100000, rawCo2));
    
    // Ensure date is in valid YYYY-MM-DD format, else fallback to today
    const validDate = (/^\d{4}-\d{2}-\d{2}$/.test(activity.date) ? activity.date : todayString());

    const entry = {
      id: generateId(),
      activityKey: String(activity.activityKey),
      quantity: Math.max(0, Number(activity.quantity) || 0),
      co2: boundedCo2,
      category: String(activity.category),
      date: validDate,
      timestamp: new Date().toISOString(),
      note: String(activity.note || '').substring(0, 200),
    };
    activities.push(entry);
    set(KEYS.activities, activities);
    return entry;
  }

  function deleteActivity(id) {
    const activities = getActivities().filter(a => a.id !== id);
    return set(KEYS.activities, activities);
  }

  function getActivitiesByDate(dateStr) {
    return getActivities().filter(a => a.date === dateStr);
  }

  function getActivitiesInRange(startDate, endDate) {
    return getActivities().filter(a => a.date >= startDate && a.date <= endDate);
  }

  // ── Challenges ──
  function getChallenges() {
    return get(KEYS.challenges, { completed: [], active: null, points: 0, level: 1 });
  }

  function saveChallenges(data) {
    return set(KEYS.challenges, data);
  }

  // ── Settings ──
  function getSettings() {
    return get(KEYS.settings, {
      theme: 'dark',
      reductionGoal: 25,
      country: 'global',
      notifications: true,
    });
  }

  function saveSettings(settings) {
    return set(KEYS.settings, settings);
  }

  // ── Data Export / Import / Clear ──
  function exportAll() {
    return {
      version: DATA_VERSION,
      exportedAt: new Date().toISOString(),
      profile: getProfile(),
      baseline: getBaseline(),
      activities: getActivities(),
      challenges: getChallenges(),
      settings: getSettings(),
    };
  }

  function clearAll() {
    Object.values(KEYS).forEach(key => remove(key));
  }

  function hasData() {
    return getProfile() !== null;
  }

  // ── Utility ──
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  function todayString() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ── Init version ──
  if (isLocalStorageAvailable() && !localStorage.getItem(KEYS.version)) {
    localStorage.setItem(KEYS.version, String(DATA_VERSION));
  }

  // ── Public API ──
  return Object.freeze({
    saveProfile,
    getProfile,
    saveBaseline,
    getBaseline,
    getActivities,
    addActivity,
    deleteActivity,
    getActivitiesByDate,
    getActivitiesInRange,
    getChallenges,
    saveChallenges,
    getSettings,
    saveSettings,
    exportAll,
    clearAll,
    hasData,
    todayString,
    generateId,
  });
})();
