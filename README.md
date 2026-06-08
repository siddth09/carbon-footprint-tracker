# 🌿 EcoLens — Carbon Footprint Tracker

**EcoLens** is a smart, dynamic web assistant that helps individuals understand, track, and reduce their carbon footprint through personalized insights and actionable eco-challenges.

![EcoLens Screenshot](https://img.shields.io/badge/EcoLens-Carbon_Tracker-25c174?style=for-the-badge&logo=leaflet&logoColor=white)

## 🎯 Chosen Vertical

**Sustainability & Carbon Footprint Reduction**

A personal carbon footprint calculator, daily tracker, and eco-coach that provides data-driven, personalized recommendations to help users make a measurable positive environmental impact.

---

## 🧠 Approach & Logic

### Architecture

EcoLens is a **single-page web application** built with vanilla HTML, CSS, and JavaScript — no frameworks, no build tools, zero runtime dependencies in the repository. This was a deliberate choice to demonstrate:

- **Clean, maintainable code** without framework abstractions
- **Minimal repository size** (< 1 MB total)
- **Zero-config setup** — open `index.html` and it works
- **Pure engineering skill** — every line serves a purpose

### Smart Decision-Making

The application uses a **multi-layered intelligence system**:

1. **Baseline Calculation Engine** (`data.js`, `calculator.js`)
   - Uses real emission factors sourced from EPA, DEFRA, and IPCC AR6
   - Calculates personalized annual CO₂ footprint across 4 categories
   - Factors in commute mode, diet type, energy source, and lifestyle habits

2. **Pattern Detection Engine** (`insights.js`)
   - Analyzes 30-day rolling activity data
   - Detects high-impact behavior patterns (e.g., frequent car trips, high meat consumption)
   - Generates **context-aware, prioritized recommendations** with specific CO₂ savings estimates
   - Adapts dynamically as user behavior changes

3. **Gamification System** (`challenges.js`)
   - 12 curated eco-challenges across 3 difficulty tiers
   - XP-based progression through 8 levels
   - Reinforces positive behavior change through achievement mechanics

4. **Comparative Analytics** (`dashboard.js`)
   - Compares user footprint against national and global averages
   - Tracks goal progress with projected annual calculations
   - Streak tracking for engagement

### Data Flow

```
User Quiz Answers → Baseline Calculation → Stored Baseline
                                              ↓
Daily Activity Logging → CO₂ Calculation → Activity Database
                                              ↓
Pattern Analysis → Personalized Insights → Recommendations
                                              ↓
Challenge Completion → XP/Level System → Behavioral Reinforcement
```

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

### 3. Activity Logger
- Log emissions across 40+ activities with precise CO₂ factors
- Category and date filtering
- Live CO₂ estimation in the modal form
- Daily comparison against personal baseline average
- Edit and delete logged entries

### 4. Smart Insights Engine
- Analyzes activity patterns over rolling 30-day window
- Generates **7 types of personalized insights**:
  - Overall trend analysis (above/below baseline)
  - Highest impact category identification
  - Transport mode optimization suggestions
  - Dietary shift recommendations with savings estimates
  - Energy efficiency tips (hot→cold laundry, shower duration)
  - Recycling/composting encouragement
  - Rotating daily eco-facts
- Priority-sorted for maximum impact

### 5. Eco Challenges
- 12 curated challenges (Easy/Medium/Hard)
- XP rewards and 8-level progression system
- Active challenge tracking with start/complete/abandon lifecycle
- Completion history with dates

### 6. Settings & Data Management
- Dark/Light theme toggle
- Configurable reduction goals (10%/25%/50%/75%)
- Regional comparison selection (Global, US, EU, UK, India, China)
- Full data export as JSON
- Retake quiz option
- Clear all data

---

## 🏗️ How It Works

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Structure | HTML5 | Semantic, accessible markup |
| Styling | Vanilla CSS | Custom properties, glassmorphism, responsive |
| Logic | Vanilla JavaScript | Modular IIFE pattern, no dependencies |
| Charts | Chart.js (CDN) | Professional data visualization |
| Fonts | Google Fonts (Inter) | Modern, readable typography |
| Persistence | LocalStorage | No backend required, privacy-first |

### File Structure

```
carbon-footprint-tracker/
├── index.html              # SPA shell with all sections
├── css/
│   └── styles.css          # Complete design system (26 sections)
├── js/
│   ├── data.js             # Emission factors database (40+ activities)
│   ├── storage.js          # LocalStorage CRUD with validation
│   ├── utils.js            # DOM helpers, animations, accessibility
│   ├── calculator.js       # Onboarding quiz & baseline calculation
│   ├── tracker.js          # Activity logging & management
│   ├── insights.js         # Smart personalized insights engine
│   ├── dashboard.js        # Dashboard stats & Chart.js charts
│   ├── challenges.js       # Eco-challenges & XP system
│   └── app.js              # Main controller, routing, theme, particles
├── tests/
│   ├── test.html           # In-browser test runner
│   └── tests.js            # 50+ unit & integration tests
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
| Input Sanitization | String truncation, type coercion, bounds checking on all stored data |
| CSP | Content Security Policy meta tag restricting script/style sources |
| No eval() | Zero use of `eval()`, `Function()`, or `document.write()` |
| No External APIs | Fully client-side — no data leaves the browser |
| Safe Storage | JSON parse/stringify wrapped in try-catch with fallbacks |

---

## ♿ Accessibility

| Feature | Implementation |
|---------|---------------|
| Semantic HTML | `<main>`, `<nav>`, `<section>`, `<article>`, `role` attributes |
| ARIA Labels | All interactive elements have `aria-label` or `aria-labelledby` |
| Keyboard Navigation | Full tab navigation, Enter/Escape for dialogs |
| Focus Management | `:focus-visible` outlines, logical tab order |
| Screen Readers | `aria-live` region for dynamic announcements |
| Reduced Motion | `prefers-reduced-motion` disables all animations |
| Color Contrast | ≥ 4.5:1 ratio on all text against backgrounds |
| System Theme | `prefers-color-scheme` auto-detection on first visit |

---

## 🧪 Testing

### Run Tests

Open `tests/test.html` in any modern browser. The test suite includes **50+ assertions** across:

- **Emission Data Tests**: Verify emission factors, category structure, quiz questions
- **Baseline Calculation Tests**: Default vs eco-conscious vs heavy emitter profiles
- **Storage Tests**: Profile CRUD, activity management, settings, export, XSS safety
- **Utility Tests**: Number formatting, date helpers, DOM utilities, clamping
- **Integration Tests**: End-to-end quiz → baseline → activity → total flow

### Test Results

All tests run in-browser with visual pass/fail indicators and console output.

---

## 💡 Assumptions

1. **Emission factors** represent average values; real-world emissions vary by region, vehicle type, grid carbon intensity, and individual circumstances
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

3. **Complete the onboarding quiz** to calculate your baseline carbon footprint

4. **Start logging activities** daily to get personalized insights

---

## 📊 Design Highlights

- **Dark Glassmorphism**: Frosted glass cards with `backdrop-filter: blur(20px)`
- **Eco-Green Palette**: HSL-based color system with green/teal accent gradient
- **Floating Particles**: Canvas-rendered floating leaf/sparkle effect (motion-safe)
- **Micro-Animations**: Counter animations, card hover lifts, staggered reveals
- **Responsive**: Fully responsive from mobile (320px) to desktop (1200px+)
- **Typography**: Inter font with clamp-based fluid sizing

---

## 📜 License

MIT License — feel free to use, modify, and distribute.
