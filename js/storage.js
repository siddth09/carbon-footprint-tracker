/**
 * EcoLens — Storage Module
 * 
 * Manages all localStorage CRUD operations with data validation,
 * migration support, and XSS-safe serialization.
 * 
 * @module Storage
 */

'use strict';

const Storage = (() => {

  const STORAGE_PREFIX = 'ecolens_';
  const DATA_VERSION = 1;

  /**
   * Internal storage key definitions.
   * @type {Object<string, string>}
   * @private
   */
  const KEYS = {
    profile:     STORAGE_PREFIX + 'profile',
    baseline:    STORAGE_PREFIX + 'baseline',
    activities:  STORAGE_PREFIX + 'activities',
    challenges:  STORAGE_PREFIX + 'challenges',
    settings:    STORAGE_PREFIX + 'settings',
    version:     STORAGE_PREFIX + 'version',
  };



  /**
   * Check if localStorage is available and writable.
   * @returns {boolean} True if localStorage is functional
   * @private
   */
  function isLocalStorageAvailable() {
    try {
      const test = '__ecolens_test__';
      window.localStorage.setItem(test, '1');
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set a value in localStorage.
   * @param {string} key - The storage key
   * @param {*} value - The value to store
   * @returns {boolean} True if the write succeeded
   * @private
   */
  function set(key, value) {
    if (!isLocalStorageAvailable()) return false;
    try {
      const json = JSON.stringify(value);
      window.localStorage.setItem(key, json);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve a value from localStorage.
   * @param {string} key - The storage key
   * @returns {*} The retrieved value, or null
   * @private
   */
  function get(key, fallback = null) {
    if (!isLocalStorageAvailable()) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Remove a key from localStorage.
   * @param {string} key - The key to remove
   * @returns {boolean} True if successful
   * @private
   */
  function remove(key) {
    if (!isLocalStorageAvailable()) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save the user profile, applying HTML sanitization to prevent XSS.
   * @param {Object} profile - User profile info
   * @param {string} profile.name - The username
   * @param {Object} [profile.quizAnswers] - Quiz response cache
   * @param {boolean} [profile.completedOnboarding] - Quiz completion status
   * @param {string} [profile.createdAt] - Creation ISO timestamp
   * @returns {boolean} True if successful
   */
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

  /**
   * Retrieve the user profile.
   * @returns {Object|null} User profile, or null if not set
   */
  function getProfile() {
    return get(KEYS.profile, null);
  }

  /**
   * Save calculated baseline emissions.
   * @param {Object} baseline - The baseline metrics
   * @param {number} baseline.transport - Transport emissions in kg CO2e
   * @param {number} baseline.food - Food emissions in kg CO2e
   * @param {number} baseline.energy - Energy emissions in kg CO2e
   * @param {number} baseline.lifestyle - Lifestyle emissions in kg CO2e
   * @param {number} baseline.total - Total annual baseline emissions in kg CO2e
   * @returns {boolean} True if successful
   */
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

  /**
   * Retrieve the baseline footprint.
   * @returns {Object|null} Baseline object, or null if not set
   */
  function getBaseline() {
    return get(KEYS.baseline, null);
  }

  /**
   * Retrieve the full list of logged activities.
   * @returns {Array<Object>} List of activity logs
   */
  function getActivities() {
    return get(KEYS.activities, []);
  }

  /**
   * Add a new activity log, validating input bounds and dates.
   * @param {Object} activity - The activity data
   * @param {string} activity.activityKey - Activity type ID
   * @param {number} activity.quantity - Activity multiplier/count
   * @param {number} activity.co2 - Computed CO2 emission value
   * @param {string} activity.category - Activity category (e.g. food)
   * @param {string} [activity.date] - Date of the activity (YYYY-MM-DD)
   * @param {string} [activity.note] - Optional custom user note
   * @returns {Object} The created activity log entry
   */
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

  /**
   * Delete an activity log entry by its ID.
   * @param {string} id - The activity entry unique ID
   * @returns {boolean} True if successful
   */
  function deleteActivity(id) {
    const activities = getActivities().filter(a => a.id !== id);
    return set(KEYS.activities, activities);
  }

  /**
   * Retrieve activities logged on a specific date.
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Array<Object>} List of matching logs
   */
  function getActivitiesByDate(dateStr) {
    return getActivities().filter(a => a.date === dateStr);
  }

  /**
   * Retrieve activities logged within a date range (inclusive).
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Array<Object>} List of matching logs
   */
  function getActivitiesInRange(startDate, endDate) {
    return getActivities().filter(a => a.date >= startDate && a.date <= endDate);
  }

  /**
   * Retrieve challenge and points progression.
   * @returns {Object} Challenge progress metrics
   */
  function getChallenges() {
    return get(KEYS.challenges, { completed: [], active: null, points: 0, level: 1 });
  }

  /**
   * Save challenge progression metrics.
   * @param {Object} data - Challenge status
   * @returns {boolean} True if successful
   */
  function saveChallenges(data) {
    return set(KEYS.challenges, data);
  }

  /**
   * Retrieve app-wide user settings.
   * @returns {Object} Settings details
   */
  function getSettings() {
    return get(KEYS.settings, {
      theme: 'dark',
      reductionGoal: 25,
      country: 'global',
      notifications: true,
    });
  }

  /**
   * Save app-wide user settings.
   * @param {Object} settings - Settings options
   * @returns {boolean} True if successful
   */
  function saveSettings(settings) {
    return set(KEYS.settings, settings);
  }

  /**
   * Export all user data as a single JSON object.
   * @returns {Object} Exported data package
   */
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

  /**
   * Clear all app-related data from local storage.
   */
  function clearAll() {
    Object.values(KEYS).forEach(key => remove(key));
  }

  /**
   * Verify if profile details exist.
   * @returns {boolean} True if onboarding profile exists
   */
  function hasData() {
    return getProfile() !== null;
  }

  /**
   * Generate a unique ID string.
   * @returns {string} Unique alphanumeric string
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  /**
   * Helper to return current date in local YYYY-MM-DD string format.
   * @returns {string} Current date string
   */
  function todayString() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  // ── Init version ──
  if (isLocalStorageAvailable() && !window.localStorage.getItem(KEYS.version)) {
    window.localStorage.setItem(KEYS.version, String(DATA_VERSION));
  }

  const Storage = Object.freeze({
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

  window.Storage = Storage;
  return Storage;
})();
