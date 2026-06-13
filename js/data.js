/**
 * EcoLens — Emission Factors Database
 * 
 * All emission factors are in kg CO₂e (CO₂ equivalent).
 * Sources: EPA, DEFRA, IPCC AR6, Our World in Data.
 * Factors represent average values for a typical individual.
 */

'use strict';

const EmissionData = (() => {

  // ── Transport emission factors (kg CO₂e per km) ──
  const TRANSPORT = {
    car_petrol:    { factor: 0.192,  unit: 'km', label: 'Car (Petrol)',       icon: '🚗', category: 'transport' },
    car_diesel:    { factor: 0.171,  unit: 'km', label: 'Car (Diesel)',       icon: '🚙', category: 'transport' },
    car_electric:  { factor: 0.053,  unit: 'km', label: 'Car (Electric)',     icon: '⚡', category: 'transport' },
    car_hybrid:    { factor: 0.112,  unit: 'km', label: 'Car (Hybrid)',       icon: '🔋', category: 'transport' },
    motorcycle:    { factor: 0.114,  unit: 'km', label: 'Motorcycle',         icon: '🏍️', category: 'transport' },
    bus:           { factor: 0.089,  unit: 'km', label: 'Bus',                icon: '🚌', category: 'transport' },
    train:         { factor: 0.041,  unit: 'km', label: 'Train',              icon: '🚆', category: 'transport' },
    metro:         { factor: 0.033,  unit: 'km', label: 'Metro/Subway',       icon: '🚇', category: 'transport' },
    bicycle:       { factor: 0.000,  unit: 'km', label: 'Bicycle',            icon: '🚲', category: 'transport' },
    walking:       { factor: 0.000,  unit: 'km', label: 'Walking',            icon: '🚶', category: 'transport' },
    flight_short:  { factor: 0.255,  unit: 'km', label: 'Flight (< 1500km)',  icon: '✈️', category: 'transport' },
    flight_long:   { factor: 0.195,  unit: 'km', label: 'Flight (> 1500km)',  icon: '🛫', category: 'transport' },
    taxi:          { factor: 0.210,  unit: 'km', label: 'Taxi/Rideshare',     icon: '🚕', category: 'transport' },
    carpool:       { factor: 0.096,  unit: 'km', label: 'Carpool (2 people)', icon: '🤝', category: 'transport' },
  };

  // ── Food emission factors (kg CO₂e per meal / per serving) ──
  const FOOD = {
    meal_beef:       { factor: 6.61,  unit: 'meal', label: 'Beef Meal',          icon: '🥩', category: 'food' },
    meal_lamb:       { factor: 5.84,  unit: 'meal', label: 'Lamb Meal',          icon: '🍖', category: 'food' },
    meal_pork:       { factor: 2.63,  unit: 'meal', label: 'Pork Meal',          icon: '🥓', category: 'food' },
    meal_chicken:    { factor: 1.82,  unit: 'meal', label: 'Chicken Meal',       icon: '🍗', category: 'food' },
    meal_fish:       { factor: 1.34,  unit: 'meal', label: 'Fish Meal',          icon: '🐟', category: 'food' },
    meal_vegetarian: { factor: 0.74,  unit: 'meal', label: 'Vegetarian Meal',    icon: '🥗', category: 'food' },
    meal_vegan:      { factor: 0.45,  unit: 'meal', label: 'Vegan Meal',         icon: '🌱', category: 'food' },
    coffee:          { factor: 0.21,  unit: 'cup',  label: 'Coffee',             icon: '☕', category: 'food' },
    dairy_milk:      { factor: 0.63,  unit: 'litre', label: 'Dairy Milk',        icon: '🥛', category: 'food' },
    plant_milk:      { factor: 0.18,  unit: 'litre', label: 'Plant-based Milk',  icon: '🌾', category: 'food' },
    food_waste:      { factor: 2.50,  unit: 'kg',    label: 'Food Waste',        icon: '🗑️', category: 'food' },
  };

  // ── Energy emission factors ──
  const ENERGY = {
    electricity:     { factor: 0.42,   unit: 'kWh',   label: 'Electricity',           icon: '💡', category: 'energy' },
    natural_gas:     { factor: 2.04,   unit: 'm³',    label: 'Natural Gas',            icon: '🔥', category: 'energy' },
    heating_oil:     { factor: 2.96,   unit: 'litre', label: 'Heating Oil',            icon: '🛢️', category: 'energy' },
    solar_panel:     { factor: -0.42,  unit: 'kWh',   label: 'Solar Generated',        icon: '☀️', category: 'energy' },
    air_conditioning:{ factor: 1.50,   unit: 'hour',  label: 'Air Conditioning',       icon: '❄️', category: 'energy' },
    heating:         { factor: 1.80,   unit: 'hour',  label: 'Space Heating',          icon: '🌡️', category: 'energy' },
    laundry_hot:     { factor: 2.40,   unit: 'load',  label: 'Laundry (Hot Water)',     icon: '👔', category: 'energy' },
    laundry_cold:    { factor: 0.60,   unit: 'load',  label: 'Laundry (Cold Water)',    icon: '🧊', category: 'energy' },
    shower_long:     { factor: 1.60,   unit: '10min', label: 'Shower (10 min)',         icon: '🚿', category: 'energy' },
    shower_short:    { factor: 0.48,   unit: '3min',  label: 'Shower (3 min)',          icon: '💧', category: 'energy' },
  };

  // ── Lifestyle emission factors ──
  const LIFESTYLE = {
    new_clothing:     { factor: 15.0,  unit: 'item',   label: 'New Clothing Item',     icon: '👕', category: 'lifestyle' },
    secondhand:       { factor: 1.0,   unit: 'item',   label: 'Secondhand Clothing',   icon: '♻️', category: 'lifestyle' },
    electronics:      { factor: 75.0,  unit: 'item',   label: 'New Electronics',       icon: '📱', category: 'lifestyle' },
    streaming:        { factor: 0.036, unit: 'hour',   label: 'Video Streaming',       icon: '📺', category: 'lifestyle' },
    online_meeting:   { factor: 0.065, unit: 'hour',   label: 'Video Call',            icon: '💻', category: 'lifestyle' },
    paper_waste:      { factor: 1.10,  unit: 'kg',     label: 'Paper Waste',           icon: '📄', category: 'lifestyle' },
    recycling:        { factor: -0.50, unit: 'kg',     label: 'Recycling',             icon: '♻️', category: 'lifestyle' },
    composting:       { factor: -0.30, unit: 'kg',     label: 'Composting',            icon: '🌿', category: 'lifestyle' },
    tree_planted:     { factor: -21.0, unit: 'tree',   label: 'Tree Planted',          icon: '🌳', category: 'lifestyle' },
  };

  // ── All activities combined ──
  const ALL_ACTIVITIES = { ...TRANSPORT, ...FOOD, ...ENERGY, ...LIFESTYLE };

  // ── Category metadata ──
  const CATEGORIES = {
    transport: { label: 'Transport',  icon: '🚗', color: 'hsl(210, 70%, 55%)',  colorRgb: '66, 135, 214' },
    food:      { label: 'Food',       icon: '🍽️', color: 'hsl(38, 92%, 55%)',   colorRgb: '245, 178, 45' },
    energy:    { label: 'Energy',     icon: '⚡', color: 'hsl(0, 72%, 55%)',    colorRgb: '214, 66, 66' },
    lifestyle: { label: 'Lifestyle',  icon: '🌱', color: 'hsl(152, 68%, 45%)', colorRgb: '37, 193, 116' },
  };

  // ── Average benchmarks (kg CO₂e per year) ──
  const AVERAGES = {
    global:       4700,
    usa:          16000,
    eu:           7500,
    uk:           5500,
    india:        1900,
    china:        7400,
    target_2030:  2500,   // Paris Agreement aligned target
  };

  // ── Onboarding quiz questions ──
  const QUIZ_QUESTIONS = {
    transport: [
      {
        id: 'commute_mode',
        question: 'How do you usually commute?',
        type: 'select',
        options: [
          { value: 'car_petrol',   label: '🚗 Car (Petrol/Gas)' },
          { value: 'car_diesel',   label: '🚙 Car (Diesel)' },
          { value: 'car_electric', label: '⚡ Electric Car' },
          { value: 'car_hybrid',   label: '🔋 Hybrid Car' },
          { value: 'carpool',      label: '🤝 Carpool' },
          { value: 'bus',          label: '🚌 Bus' },
          { value: 'train',        label: '🚆 Train' },
          { value: 'metro',        label: '🚇 Metro/Subway' },
          { value: 'motorcycle',   label: '🏍️ Motorcycle' },
          { value: 'bicycle',      label: '🚲 Bicycle' },
          { value: 'walking',      label: '🚶 Walking' },
        ],
        default: 'car_petrol',
      },
      {
        id: 'commute_distance',
        question: 'Daily commute distance (round trip in km)?',
        type: 'slider',
        min: 0, max: 150, step: 5, default: 30,
        unit: 'km',
      },
      {
        id: 'commute_days',
        question: 'How many days per week do you commute?',
        type: 'slider',
        min: 0, max: 7, step: 1, default: 5,
        unit: 'days',
      },
      {
        id: 'flights_per_year',
        question: 'How many flights do you take per year?',
        type: 'slider',
        min: 0, max: 30, step: 1, default: 2,
        unit: 'flights',
      },
    ],
    food: [
      {
        id: 'diet_type',
        question: 'What best describes your diet?',
        type: 'select',
        options: [
          { value: 'heavy_meat', label: '🥩 Heavy Meat Eater (daily)' },
          { value: 'medium_meat', label: '🍗 Moderate Meat (3-4x/week)' },
          { value: 'light_meat', label: '🐟 Light Meat (1-2x/week)' },
          { value: 'pescatarian', label: '🐟 Pescatarian' },
          { value: 'vegetarian', label: '🥗 Vegetarian' },
          { value: 'vegan', label: '🌱 Vegan' },
        ],
        default: 'medium_meat',
      },
      {
        id: 'local_food_pct',
        question: 'What % of your food is locally sourced?',
        type: 'slider',
        min: 0, max: 100, step: 10, default: 20,
        unit: '%',
      },
      {
        id: 'food_waste',
        question: 'How much food do you waste per week?',
        type: 'select',
        options: [
          { value: 'none',   label: '♻️ Almost none' },
          { value: 'little', label: '🤏 A little' },
          { value: 'some',   label: '🍽️ Some' },
          { value: 'a_lot',  label: '🗑️ A lot' },
        ],
        default: 'some',
      },
    ],
    energy: [
      {
        id: 'electricity_bill',
        question: 'Monthly electricity usage (kWh)?',
        type: 'slider',
        min: 50, max: 1000, step: 25, default: 300,
        unit: 'kWh',
      },
      {
        id: 'heating_source',
        question: 'Primary heating source?',
        type: 'select',
        options: [
          { value: 'natural_gas', label: '🔥 Natural Gas' },
          { value: 'heating_oil', label: '🛢️ Heating Oil' },
          { value: 'electric',    label: '⚡ Electric' },
          { value: 'heat_pump',   label: '♨️ Heat Pump' },
          { value: 'none',        label: '🌴 No heating needed' },
        ],
        default: 'natural_gas',
      },
      {
        id: 'renewable_energy',
        question: 'Do you use renewable energy?',
        type: 'select',
        options: [
          { value: 'none',    label: '❌ No' },
          { value: 'partial', label: '🌤️ Partially (mixed grid)' },
          { value: 'full',    label: '☀️ 100% Renewable' },
        ],
        default: 'none',
      },
    ],
    lifestyle: [
      {
        id: 'shopping_frequency',
        question: 'How often do you buy new clothes?',
        type: 'select',
        options: [
          { value: 'weekly',    label: '🛍️ Weekly' },
          { value: 'monthly',   label: '👕 Monthly' },
          { value: 'quarterly', label: '📦 Every few months' },
          { value: 'rarely',    label: '♻️ Rarely / Secondhand' },
        ],
        default: 'monthly',
      },
      {
        id: 'streaming_hours',
        question: 'Daily screen time for streaming (hours)?',
        type: 'slider',
        min: 0, max: 12, step: 0.5, default: 3,
        unit: 'hours',
      },
      {
        id: 'recycling_habit',
        question: 'Do you recycle and compost regularly?',
        type: 'select',
        options: [
          { value: 'always',    label: '♻️ Always' },
          { value: 'sometimes', label: '🤷 Sometimes' },
          { value: 'rarely',    label: '🚫 Rarely' },
        ],
        default: 'sometimes',
      },
    ],
  };

  // ── Calculate annual footprint from quiz answers ──
  function calculateBaselineFootprint(answers) {
    const result = { transport: 0, food: 0, energy: 0, lifestyle: 0, total: 0 };

    // Transport
    const commuteMode = answers.commute_mode || 'car_petrol';
    const commuteKm = answers.commute_distance || 30;
    const commuteDays = answers.commute_days || 5;
    const flights = answers.flights_per_year || 2;
    const transportFactor = TRANSPORT[commuteMode] ? TRANSPORT[commuteMode].factor : 0.192;
    result.transport = (transportFactor * commuteKm * commuteDays * 52) + (flights * 1200 * 0.195);

    // Food
    const dietFactors = {
      heavy_meat: 2800, medium_meat: 2000, light_meat: 1500,
      pescatarian: 1200, vegetarian: 1100, vegan: 800,
    };
    const wasteFactors = { none: 0, little: 50, some: 150, a_lot: 350 };
    const localDiscount = 1 - ((answers.local_food_pct || 20) / 100) * 0.15;
    result.food = ((dietFactors[answers.diet_type] || 2000) * localDiscount) +
                  (wasteFactors[answers.food_waste] || 150);

    // Energy
    const elecKwh = answers.electricity_bill || 300;
    const renewableFactor = { none: 1, partial: 0.5, full: 0.1 };
    const heatingFactors = { natural_gas: 1200, heating_oil: 1800, electric: 600, heat_pump: 300, none: 0 };
    result.energy = (elecKwh * 12 * 0.42 * (renewableFactor[answers.renewable_energy] || 1)) +
                    (heatingFactors[answers.heating_source] || 1200);

    // Lifestyle
    const shoppingFactors = { weekly: 780, monthly: 180, quarterly: 60, rarely: 15 };
    const streamingHours = answers.streaming_hours || 3;
    const recyclingOffset = { always: -200, sometimes: -50, rarely: 0 };
    result.lifestyle = (shoppingFactors[answers.shopping_frequency] || 180) +
                       (streamingHours * 365 * 0.036) +
                       (recyclingOffset[answers.recycling_habit] || -50);

    result.total = Math.round(result.transport + result.food + result.energy + result.lifestyle);
    result.transport = Math.round(result.transport);
    result.food = Math.round(result.food);
    result.energy = Math.round(result.energy);
    result.lifestyle = Math.round(result.lifestyle);

    return result;
  }

  // ── Public API ──
  const EmissionData = Object.freeze({
    TRANSPORT,
    FOOD,
    ENERGY,
    LIFESTYLE,
    ALL_ACTIVITIES,
    CATEGORIES,
    AVERAGES,
    QUIZ_QUESTIONS,
    calculateBaselineFootprint,
  });

  window.EmissionData = EmissionData;
  return EmissionData;
})();
