# 🌿 EcoLens — Carbon Footprint Tracker

**EcoLens** is a smart, dynamic web assistant that helps individuals understand, track, and reduce their carbon footprint through personalized insights, interactive simulations, and gamified eco-challenges.

![EcoLens](https://img.shields.io/badge/EcoLens-Carbon_Tracker-25c174?style=for-the-badge&logo=leaflet&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-80%2B_Passing-25c174?style=for-the-badge)
![Size](https://img.shields.io/badge/Size-Under_300KB-25c174?style=for-the-badge)

## 🎯 Chosen Vertical

**Sustainability & Carbon Footprint Reduction**

A personal carbon footprint calculator, daily tracker, and eco-coach that provides data-driven, personalized recommendations to help users make a measurable positive environmental impact.

---

## 🧠 Approach & Logic

### Smart Assistant Architecture

EcoLens isn't just a tracker — it's a **smart, dynamic assistant** that makes logical decisions based on user context. The application uses a multi-layered intelligence system:

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
│                                                              │
│  Quiz ──→ Baseline Engine ──→ Personalized Baseline          │
│                                       ↓                      │
│  Daily Logging ──→ Activity DB ──→ 30-Day Rolling Analysis   │
│                                       ↓                      │
│  Pattern Detection ──→ Insight Engine ──→ Smart Tips          │
│                                       ↓                      │
│  What-If Simulator ──→ Scenario Comparison ──→ Motivation     │
│                                       ↓                      │
│  EcoBot Chat ──→ Context-Aware NLP ──→ Personalized Advice   │
│                                       ↓                      │
│  Challenges ──→ XP/Level System ──→ Behavioral Reinforcement │
│                                       ↓                      │
│  Achievements ──→ Badge Unlocks ──→ Confetti Celebrations    │
│                                       ↓                      │
│  Share Card ──→ Social Proof ──→ Viral Growth                │
└─────────────────────────────────────────────────────────────┘
```

### Decision-Making Engine

1. **Baseline Calculation Engine** (`data.js`, `calculator.js`)
   - Uses real emission factors sourced from EPA, DEFRA, and IPCC AR6
   - Calculates personalized annual CO₂ footprint across 4 categories
   - Factors in commute mode, diet type, energy source, and lifestyle habits

2. **Pattern Detection Engine** (`insights.js`)
   - Analyzes 30-day rolling activity data
   - Detects high-impact behavior patterns (e.g., frequent car trips, high meat consumption)
   - Generates **context-aware, prioritized recommendations** with specific CO₂ savings
   - Adapts dynamically as user behavior changes

3. **EcoBot AI Assistant** (`ecobot.js`)
   - Floating chat interface with contextual greeting based on user data
   - Keyword-based intent detection (tip, summary, what-if, share, achievements)
   - Knowledge base with category-specific advice triggered by data patterns
   - Quick-action suggestion buttons for common queries

4. **What-If Simulator** (`ecobot.js`)
   - 6 predefined real-world scenarios (car→bike, beef→veggie, hot→cold laundry, etc.)
   - Calculates annual CO₂ savings with visual comparison bars
   - Helps users make informed decisions about behavior changes

5. **Gamification System** (`challenges.js`, `ecobot.js`)
   - 12 curated eco-challenges across 3 difficulty tiers
   - XP-based progression through 8 levels
   - 12 achievement badges with unlock criteria
   - Confetti animation on achievement unlocks

6. **Social Sharing** (`ecobot.js`)
   - Generates shareable carbon score cards with footprint, level, challenges completed
   - Copy-to-clipboard for social media sharing
   - Viral growth through social proof

---

## ✨ Features

### 1. Onboarding Carbon Footprint Quiz
- Multi-step quiz across 4 categories (Transport, Food, Energy, Lifestyle)
- Interactive sliders and dropdowns
- Animated results with comparison bars against global averages
- Establishes personalized baseline for all future insights

### 2. Interactive Dashboard
- **Real-time stat cards**: Monthly total, daily emissions, log streak, goal progress
- **Category donut chart**: Visual breakdown by transport/food/energy/lifestyle
- **30-day trend line**: Daily emissions with baseline comparison line
- **Quick-log buttons**: One-tap logging for common activities

### 3. 🤖 EcoBot AI Assistant (Viral)
- Floating chat interface with pulsing green FAB button
- **Context-aware greetings** based on user data (streak, activity count)
- **Intent detection** — understands "give me a tip", "what if I switched", "share my score"
- **Knowledge base** with category-specific advice triggered by data patterns
- **Quick-action buttons**: Tip, Summary, What-If, Achievements, Share

### 4. 🔄 What-If Simulator (Viral)
- **6 interactive scenario cards**: Car→Bike, Beef→Plant, Drive→Transit, Hot→Cold laundry, New→Secondhand, Long→Short showers
- Shows exact annual CO₂ savings with **animated comparison bars**
- Makes abstract numbers feel tangible and actionable

### 5. Activity Logger
- Log emissions across 40+ activities with precise CO₂ factors
- Category and date filtering
- Live CO₂ estimation in the modal form
- Daily comparison against personal baseline average

### 6. 💡 Smart Insights Engine
- Analyzes 30-day activity patterns
- **7 types of personalized insights** with CO₂ savings estimates
- Priority-sorted for maximum impact

### 7. 🏆 Eco Challenges
- 12 curated challenges (Easy/Medium/Hard)
- XP rewards and 8-level progression

### 8. 🏅 Achievement Badges (Viral)
- **12 achievement badges** with unique unlock criteria
- **Confetti celebration animation** on new unlocks
- Visual locked/unlocked states in achievement grid

### 9. 📤 Social Share Cards (Viral)
- Beautiful score card with footprint, level, comparison vs global average
- **Copy to clipboard** for social media sharing
- Generates viral shareability

### 10. ⚙️ Settings & Data Management
- Dark/Light theme toggle (respects `prefers-color-scheme`)
- Configurable reduction goals and regional comparison
- Full data export as JSON

---

## 🏗️ Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Structure | HTML5 | Semantic, accessible markup |
| Styling | Vanilla CSS | Custom properties, glassmorphism, 31 sections |
| Logic | Vanilla JavaScript | Modular IIFE pattern, zero dependencies |
| Charts | Chart.js (CDN) | Professional data visualization |
| Fonts | Google Fonts (Inter) | Modern, readable typography |
| Persistence | LocalStorage | Privacy-first, no backend |

### File Structure

```
carbon-footprint-tracker/
├── index.html              # SPA shell with all sections
├── css/
│   └── styles.css          # Complete design system (31 sections, 1800+ lines)
├── js/
│   ├── data.js             # Emission factors database (40+ activities)
│   ├── storage.js          # LocalStorage CRUD with validation
│   ├── utils.js            # DOM helpers, animations, accessibility
│   ├── calculator.js       # Onboarding quiz & baseline calculation
│   ├── tracker.js          # Activity logging & management
│   ├── insights.js         # Smart personalized insights engine
│   ├── dashboard.js        # Dashboard stats & Chart.js charts
│   ├── challenges.js       # Eco-challenges & XP system
│   ├── ecobot.js           # 🆕 AI assistant, what-if, share, achievements
│   └── app.js              # Main controller, routing, theme, particles
├── tests/
│   ├── test.html           # In-browser test runner
│   └── tests.js            # 80+ unit, security, efficiency & integration tests
├── README.md
└── .gitignore
```

### Emission Factor Sources

All CO₂ equivalent (CO₂e) emission factors are sourced from:
- **EPA** (US Environmental Protection Agency)
- **DEFRA** (UK Department for Environment, Food & Rural Affairs)
- **IPCC AR6** (Intergovernmental Panel on Climate Change)
- **Our World in Data** (University of Oxford)

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| XSS Prevention | All user input rendered via `textContent`, never `innerHTML` with raw data |
| Input Sanitization | String truncation (100 char cap), type coercion, bounds checking |
| CSP | Content Security Policy meta tag restricting script/style sources |
| No eval() | Zero use of `eval()`, `Function()`, or `document.write()` |
| No External APIs | Fully client-side — no data leaves the browser |
| Module Freezing | All modules use `Object.freeze()` to prevent runtime mutation |
| Safe Storage | JSON parse/stringify wrapped in try-catch with fallbacks |

---

## ♿ Accessibility

| Feature | Implementation |
|---------|---------------|
| Skip Navigation | "Skip to main content" link visible on keyboard focus |
| Semantic HTML | `<main>`, `<nav>`, `<section>`, `<article>`, `role` attributes |
| ARIA Labels | All interactive elements have `aria-label` or `aria-labelledby` |
| Keyboard Navigation | Full tab navigation, Enter/Escape for dialogs |
| Focus Management | `:focus-visible` outlines, logical tab order |
| Screen Readers | `aria-live` region for dynamic announcements via `Utils.announce()` |
| Reduced Motion | `prefers-reduced-motion` disables all animations + confetti + particles |
| Color Contrast | ≥ 4.5:1 ratio on all text against backgrounds |
| System Theme | `prefers-color-scheme` auto-detection on first visit |

---

## 🧪 Testing

### Run Tests

Open `tests/test.html` in any modern browser.

### Test Coverage: 80+ Assertions Across 8 Groups

| Group | Coverage |
|-------|----------|
| **Emission Data** | Module existence, factor accuracy, activity schema, categories, averages, quiz questions |
| **Baseline Calculation** | Default/eco/heavy profiles, category sum verification |
| **Storage** | Profile CRUD, activity management, date filtering, range queries, settings, export, challenges |
| **Utilities** | formatCO2, formatNumber, formatPercent, todayString, getDaysArray, daysBetween, clamp, getGreeting, createElement, debounce |
| **Integration** | End-to-end: quiz → baseline → activities → daily total → offset verification |
| **EcoBot & Viral** | What-if scenario validation, achievement definitions, unlock logic, smart tip generation, summary generation |
| **Security** | XSS injection, name overflow prevention, CO2 bounds, invalid date handling, module freezing |
| **Efficiency** | 100 baseline calculations <500ms, 50 bulk writes <1000ms, 100 reads <200ms |
| **Accessibility** | ARIA announce function, formatCO2 units, date display readability, greeting format |

---

## 💡 Assumptions

1. **Emission factors** represent average values; real-world emissions vary by region, vehicle type, and grid carbon intensity
2. **LocalStorage** provides sufficient persistence for a personal tracking tool; no cloud sync
3. **Single user** model — no multi-user or household support
4. **Chart.js** loaded via CDN — requires internet on first load (cached thereafter)
5. **Annual baseline** is calculated from quiz answers and may differ from actual measured emissions
6. **Negative emissions** (recycling, composting, solar) are represented as offsets subtracted from daily totals

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/carbon-footprint-tracker.git
   ```

2. **Open in browser**
   ```bash
   open carbon-footprint-tracker/index.html
   ```
   No build step, no `npm install`, no server required.

3. **Complete the onboarding quiz** to calculate your baseline
4. **Chat with EcoBot** 🤖 for personalized tips
5. **Explore What-If scenarios** to see impact of changes
6. **Start challenges** to earn XP and unlock achievements

---

## 📊 Design Highlights

- **Dark Glassmorphism**: Frosted glass cards with `backdrop-filter: blur(20px)`
- **Eco-Green Palette**: HSL-based color system with green/teal accent gradient
- **Floating EcoBot**: Pulsing chat button with slide-up panel animation
- **Confetti Celebrations**: Canvas-rendered confetti on achievement unlocks
- **What-If Cards**: Interactive comparison bars with animated width transitions
- **Achievement Grid**: Glowing unlocked badges with grayscale locked states
- **Share Card**: Gradient card with stats for social media sharing
- **Floating Particles**: Canvas-rendered floating leaf/sparkle effect
- **Responsive**: Fully responsive from mobile (320px) to desktop (1200px+)
- **Typography**: Inter font with clamp-based fluid sizing

---

## 📜 License

MIT License — feel free to use, modify, and distribute.
