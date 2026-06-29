# CLAUDE.md — FORGEFIT

This file provides guidance for Claude Code and AI assistants working on the FORGEFIT codebase.

---

## Project Overview

**FORGEFIT** is an AI-powered personal fitness coaching app built as a single-file React artifact. It generates personalised workout plans, provides rep/set/weight guidance, links to YouTube form tutorials, lets users log workouts, and analyses Garmin watch data to adjust training — all driven by a conversational onboarding flow and an embedded Claude AI coach.

---

## Repository Structure

```
FORGEFIT/
├── CLAUDE.md              # This file — AI assistant guidance
├── fitness-coach-2.jsx    # Original JSX source (914 lines, ~59.8 KB)
└── index.html             # Production build — CDN React + Babel, no build step
```

`index.html` is the live file served by GitHub Pages and loaded by the Android app. It is the source of truth for all UI and behaviour changes. `fitness-coach-2.jsx` is the original authoring source but is not directly deployed.

> **Note:** There is no `fitness-coach.jsx` in the repo. The active source file is `fitness-coach-2.jsx`, and the deployed file is `index.html`.

---

## Deployment

### GitHub Pages
The app is hosted at `https://dananth.github.io/FORGEFIT/` via GitHub Pages, serving `index.html` from the `main` branch root.

### Android App
A Capacitor wrapper APK loads the GitHub Pages URL at runtime via WebView. **No APK rebuild is needed for UI or logic changes** — just push to GitHub and the change is live in the existing app. Rebuild the APK only when changing:
- App name, icon, or splash screen
- `AndroidManifest.xml` permissions
- Capacitor version

---

## Architecture

### `index.html` — how it works

The entire app is a single HTML file using:
- **React 18** and **ReactDOM** loaded from cdnjs CDN
- **Babel standalone** to transpile JSX in the browser at runtime
- A `<script type="text/babel">` block containing all app code

There is no build step, no `npm run build`, no Webpack or Vite. Editing `index.html` and pushing to GitHub is all that's needed to deploy.

**Key sections of the file (in order):**

| Section                   | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `<head>` / CSS            | Viewport meta, splash screen styles, CDN script tags              |
| `STORAGE_KEY` constant    | localStorage key `"fitness_coach_data"`                            |
| `C` constant              | Design token palette (hex colors)                                  |
| `QUESTIONS` array         | 12 ordered onboarding questions with types and metadata            |
| `buildPlan(profile)`      | Core plan-generation logic — derives split, exercises, schemes     |
| `calcStats(profile)`      | BMI, TDEE (Mifflin-St Jeor), and calorie target calculations       |
| `parseGarminCSV(text)`    | Parses raw Garmin CSV export text into a structured summary object |
| `FitnessCoach` component  | Main app with phase + tab-based rendering                          |
| Mount + splash hide       | `ReactDOM.createRoot` call and splash screen removal               |

### Viewport meta tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0,
  maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

`user-scalable=no` and `viewport-fit=cover` are required for correct rendering in the Capacitor Android WebView. Do not remove these.

### Phases

The app uses a `phase` state string to switch between full-screen modes:

- `"onboard"` — Step-by-step questionnaire (12 questions)
- `"plan"` — Main app shell (renders the active tab + bottom nav)
- `"log"` — Active workout logging session (full-screen, no tabs)

### Tabs (within `"plan"` phase)

A `tab` state string controls which panel renders inside the main shell:

- `"plan"` — Day selector, exercise list, quick fallback, AI coach, stats
- `"garmin"` — CSV upload, biometric summary, AI analysis & plan adjustments
- `"history"` — Past workout log viewer

---

## Navigation — Bottom Tab Bar

The `"plan"` phase uses a **fixed bottom tab bar** (not a top nav). This is an intentional Android-native pattern matching the UX conventions of Gmail, YouTube, etc.

**Structure:**
- Fixed to `bottom: 0`, full width, height 62px
- Three equal-width tab buttons: 🏋️ Plan · ⌚ Garmin · 📋 History
- Active tab shown with the tab's accent colour + a small coloured dot indicator
- `env(safe-area-inset-bottom)` padding handles Android gesture navigation bar

**Reset button** lives in the slim top bar (logo + reset only), separate from the tabs.

**Style keys in `s`:**

| Key          | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| `bottomNav`  | Fixed bottom bar container                           |
| `tabBtn`     | Function `(active, color)` → individual tab button   |
| `tabIcon`    | Emoji icon style (fontSize 20)                       |
| `tabLabel`   | Function `(active, color)` → label below icon        |
| `tabDot`     | Small active indicator dot below label               |

**Do not move tabs back to the top bar.** The top bar is intentionally slim (logo + reset only) to maximise vertical content space on mobile.

---

## Data Model

### `profile` object

Populated incrementally during onboarding. Keys mirror `QUESTIONS[].id`:

```js
{
  name, age, gender, height, weight, target,
  goal,        // "Fat Loss" | "Muscle Building" | "Body Recomposition"
  level,       // "Beginner (< 1 yr)" | "Intermediate (1-3 yrs)" | "Advanced (3+ yrs)"
  equipment,   // "Full Gym" | "Dumbbells Only" | "Resistance Bands" | "Bodyweight Only"
  days,        // "2" | "3" | "4" | "5" | "6"  (string)
  sessionLen,  // "30 min" | "45 min" | "60 min" | "75+ min"
  injuries,    // free text
}
```

### `plan` object

Returned by `buildPlan(profile)`:

```js
{
  workoutDays: [{ name, focus: string[], tag, color }],  // array length = profile.days
  exercises: {
    chest: [...], back: [...], legs: [...],
    shoulders: [...], arms: [...], core: [...],
  },
  scheme: { sets, reps, rest, note },   // goal-derived rep scheme
  weightGuide: string,                   // level-derived progression advice
  quickFallback: [...],                  // 5-exercise 20-min express workout
}
```

Each exercise object:

```js
{
  name: string,
  muscle: string,
  reps: string,
  sets: string,
  weight: string,    // descriptive range, e.g. "20-70 kg"
  youtube: string,   // YouTube search URL for form tutorial
  tip: string,       // coaching cue
}
```

### `workoutLogs` array

```js
[{
  id: number,           // Date.now()
  date: string,         // toLocaleString()
  dayName: string,
  tag: string,
  sets: {
    [exerciseName]: [{ reps: string, weight: string }]
  }
}]
```

### `garminData` object

Returned by `parseGarminCSV(text)`. Only fields present in the uploaded CSV are populated (others are `null`):

```js
{
  totalActivities: number,
  dateRange: string,
  avgHR: number | null,
  maxHR: number | null,
  avgHRV: number | null,
  vo2Max: string | null,
  avgStress: number | null,
  avgSleep: string | null,
  avgBodyBat: number | null,
  avgCal: number | null,
  totalCal: number | null,
  activityTypes: string[],
  rows: object[],      // raw parsed rows
  headers: string[],   // original CSV headers
  keys: { ... },       // detected column name mappings
}
```

### `garminAdjusted` object

Returned by the AI analysis call as structured JSON:

```js
{
  summary: string,
  keyInsights: [{ icon, title, detail }],         // 4 items
  planAdjustments: [{ type, recommendation }],    // types: intensity | recovery | cardio | nutrition
  warningFlags: string[],
  weeklyStructure: string,
}
```

---

## State Variables (`FitnessCoach` component)

| Variable          | Type      | Purpose                                           |
| ----------------- | --------- | ------------------------------------------------- |
| `phase`           | string    | `"onboard"` \| `"plan"` \| `"log"`               |
| `tab`             | string    | `"plan"` \| `"garmin"` \| `"history"`            |
| `qIndex`          | number    | Current onboarding question index                 |
| `profile`         | object    | User answers from onboarding                      |
| `inputVal`        | string    | Current onboarding text/select value              |
| `plan`            | object    | Output of `buildPlan()`                           |
| `selectedDay`     | number    | Index into `plan.workoutDays`                     |
| `showQuick`       | boolean   | Toggle for 20-min express workout panel           |
| `workoutLogs`     | array     | Array of saved workout sessions                   |
| `logSession`      | object    | Day object being logged                           |
| `logSets`         | object    | `{ [exerciseName]: [{ reps, weight }] }`          |
| `toast`           | string    | Transient status message (auto-clears in 2.8s)    |
| `aiResponse`      | string    | Latest AI coach text response                     |
| `loadingAI`       | boolean   | AI coach request in-flight                        |
| `garminData`      | object    | Parsed Garmin CSV summary                         |
| `garminRaw`       | string    | Raw CSV text (in-memory only, not persisted)      |
| `garminInsights`  | string    | AI summary text from Garmin analysis              |
| `garminLoading`   | boolean   | Garmin analysis request in-flight                 |
| `garminAdjusted`  | object    | Full AI JSON response with plan adjustments       |
| `garminFileName`  | string    | Original uploaded filename (display only)         |

> **Note:** There is no `fileRef`. The Garmin file upload uses a `<label htmlFor>` pattern instead — see the Android File Upload section below.

---

## Persistence

One `localStorage` key: `fitness_coach_data`

```js
{
  profile: {...},
  plan: {...},
  logs: [...],
  garminData: {...},       // parsed Garmin summary (no raw CSV — too large)
  garminInsights: string,  // AI summary text
  garminAdjusted: {...},   // full AI JSON response
  garminFileName: string,  // original filename for display
}
```

On load, if a saved profile + plan is found, the app skips onboarding. The **Reset** button clears this key entirely and restarts from onboarding.

> **Note:** Raw CSV text (`garminRaw`) is NOT persisted — only the parsed summary is saved to avoid the ~5 MB localStorage limit.

---

## Anthropic API Usage

Two separate Claude API calls are made from the browser:

### 1. General AI Coach (`askAI`)

- **Trigger:** User taps a preset question button on the Plan tab
- **System prompt:** Built from `profile` + `calcStats()` + any existing `garminInsights`
- **Response format:** Plain text, 3-5 sentences
- **State:** `aiResponse`, `loadingAI`

### 2. Garmin Analysis (`analyseGarmin`)

- **Trigger:** Called automatically after a CSV is successfully parsed
- **System prompt:** User profile + full `garminData` summary metrics
- **Response format:** Strict JSON (see `garminAdjusted` shape above)
- **Parsing:** Strips markdown fences before `JSON.parse()`; falls back to storing raw text if parse fails
- **State:** `garminInsights`, `garminAdjusted`, `garminLoading`

Both calls use:

- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 1000
- **Auth:** Handled by the Claude artifact runtime / GitHub Pages host (no API key in source)

---

## Android File Upload (Garmin CSV)

### Problem
Android WebView blocks two common web patterns for file inputs:
1. `display: none` input + programmatic `ref.click()` — blocked by WebView security
2. `<label htmlFor>` with `position: absolute; zIndex: -1` on the input — the negative z-index pushes the input behind other elements, making it untappable even via the label

Both of these were tried and failed on Android.

### Solution — full-cover transparent overlay

The correct pattern for Android WebView is to stretch a transparent `<input type="file">` over the entire visible button using absolute positioning, with the visual UI underneath having `pointerEvents: "none"`:

```jsx
<div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
  {/* Visual layer — decorative only, receives no pointer events */}
  <div style={{ ...s.dropZone(false), pointerEvents: "none" }}>
    <div>⌚</div>
    <div>{garminFileName ? `✓ ${garminFileName}` : "Tap to upload Garmin CSV"}</div>
    <div>Choose CSV File</div>
  </div>

  {/* Invisible input stretched over full area — Android taps this directly */}
  <input
    type="file"
    accept=".csv,text/csv,text/plain,application/vnd.ms-excel"
    onChange={handleFile}
    style={{
      position: "absolute",
      top: 0, left: 0, width: "100%", height: "100%",
      opacity: 0,
      cursor: "pointer",
      fontSize: 0,
    }}
  />
</div>
```

When the user taps anywhere on the zone, they are directly tapping the real `<input>` — no JavaScript indirection, no label delegation. Android WebView treats it as a genuine user-initiated file picker tap and opens the system file chooser.

**Three rules that must never be broken:**
- The `<input>` must have `opacity: 0` (not `display: none` or `visibility: hidden`)
- The `<input>` must have **no negative `zIndex`** — it must sit above the visual layer
- The parent container must have `position: relative` + `overflow: hidden`

### MIME type handling in `handleFile`

Android's file picker reports CSV files with varying MIME types depending on device and Android version. The validator accepts all of:

```js
const isCSV = file.name.endsWith(".csv")
           || file.type === "text/csv"
           || file.type === "text/plain"
           || file.type === "application/vnd.ms-excel";
```

Do not narrow this back to `.csv` extension only — it will silently reject valid files on many Android devices. The `accept` attribute on the input also includes all four types to maximise compatibility with the Android file picker's filter.

---

## Garmin CSV Parsing (`parseGarminCSV`)

The parser uses fuzzy column matching — it searches header names case-insensitively for known keywords rather than requiring exact column names. This handles the variety of column naming across Garmin's different export types.

**Detected columns (by keyword match):**

| Metric        | Keywords searched                             |
| ------------- | --------------------------------------------- |
| Date          | `Date`, `Start Time`, `Activity Date`         |
| Activity Type | `Activity Type`, `Type`, `type`               |
| Avg HR        | `Avg HR`, `avg hr`, `Average HR`              |
| Max HR        | `Max HR`, `max hr`, `Maximum HR`              |
| Calories      | `Calories`, `calories`, `Energy (kcal)`       |
| Distance      | `Distance`, `distance`                        |
| Time          | `Time`, `Elapsed Time`, `Duration`            |
| Steps         | `Steps`, `steps`, `Total Steps`               |
| HRV           | `HRV`, `hrv`, `Heart Rate Variability`        |
| VO2 Max       | `VO2`, `vo2`, `VO2 Max`                       |
| Stress        | `Stress`, `stress`                            |
| Sleep         | `Sleep`, `sleep`, `Sleep Score`               |
| Body Battery  | `Body Battery`, `body battery`, `BB`          |
| Respiration   | `Respiration`, `Avg Respiration`              |

If a column isn't found, its summary value is `null` and it's excluded from the AI prompt and UI.

**Supported Garmin export types:**

- Activities list (most common)
- Health Snapshot
- Sleep data export
- Stress & Body Battery export

---

## Plan Generation Logic

### Split selection (`buildPlan → structures`)

| Days/week | Split type                                                |
| --------- | --------------------------------------------------------- |
| 2         | Full Body A / Full Body B                                 |
| 3         | Push / Pull / Legs                                        |
| 4         | Upper-Lower (A/B)                                         |
| 5         | Chest+Tris / Back+Bis / Legs / Shoulders+Arms / Full Body |
| 6         | Classic bro split (one muscle group per day)              |

Defaults to the 3-day split if `profile.days` doesn't match a key.

### Rep scheme by goal

| Goal               | Sets | Reps  | Rest    |
| ------------------ | ---- | ----- | ------- |
| Muscle Building    | 4    | 6-10  | 90-120s |
| Fat Loss           | 3    | 12-15 | 45-60s  |
| Body Recomposition | 3-4  | 8-12  | 60-90s  |

### Weight progression by level

- **Beginner:** 50-60% of form-failure weight, +2.5 kg/week if easy
- **Intermediate:** 65-75% 1RM, increase at top of rep range
- **Advanced:** 70-85% 1RM, RPE 8-9, deload every 4th week

### TDEE calculation (`calcStats`)

Uses the Mifflin-St Jeor formula. Activity multiplier is derived from `profile.days`:

| Days/week | Multiplier |
| --------- | ---------- |
| ≤ 2       | 1.375      |
| 3–4       | 1.55       |
| 5+        | 1.725      |

Calorie target offsets: Fat Loss −400 kcal, Muscle Building +250 kcal, Recomp −100 kcal.

---

## Styling System

All styles are inline objects defined in the `s` constant inside the render function. The palette is defined in the top-level `C` constant. **Do not add external CSS files or CSS modules.**

### Color palette (`C`)

| Token         | Hex         | Role                                               |
| ------------- | ----------- | -------------------------------------------------- |
| `C.bg`        | `#0A0A0F`   | App background                                     |
| `C.surface`   | `#13131A`   | Inputs, secondary surfaces, top/bottom bars        |
| `C.card`      | `#1C1C27`   | Card backgrounds                                   |
| `C.border`    | `#2A2A3D`   | Borders and dividers                               |
| `C.accent`    | `#FF4D00`   | Primary CTA, Plan tab active state                 |
| `C.accentDim` | `#FF4D0022` | Subtle accent fill                                 |
| `C.accentMid` | `#FF4D0055` | Mid-strength accent fill                           |
| `C.gold`      | `#F5C842`   | Quick/express workout, secondary highlights        |
| `C.text`      | `#F0EEF8`   | Primary text                                       |
| `C.muted`     | `#7A7A9A`   | Secondary text, inactive tab labels                |
| `C.green`     | `#22C55E`   | Log/save actions, History tab active state         |
| `C.blue`      | `#3B82F6`   | AI coach, Pull day tag                             |
| `C.purple`    | `#A855F7`   | Garmin tab active state, all Garmin UI elements    |

---

## Extending the App

### Adding a new exercise

Add an entry to the relevant muscle group array inside `exercises` in `buildPlan()`. Shape: `{ name, muscle, reps, sets, weight, youtube, tip }`.

### Adding a new training split

Add a key to the `structures` object in `buildPlan()`. Key = number of days (integer), value = array of `{ name, focus: string[], tag, color }`.

### Adding new onboarding questions

Append to the `QUESTIONS` array. The `id` becomes the key on `profile`. Supported types: `"text"`, `"number"`, `"select"` (requires `options` array). The `unit` field is optional (shown as a suffix inside the input).

### Adding a new tab

1. Add a new value to the `tab` state options
2. Add a new button to the `bottomNav` section with appropriate icon, label, and colour
3. Add a new `{tab === "newtab" && (...)}` render block after the existing tab blocks
4. Use `paddingBottom: 72` on the page container so content clears the bottom nav

### Adding new AI coach presets

Add a string to the preset buttons array in the AI Coach section of the plan tab render. `askAI()` handles the API call.

### Adding new Garmin metrics

In `parseGarminCSV`, add a new `find(...)` call with relevant keywords, assign it to a new key constant, then compute a summary value from `rows` and add it to the `summary` object. Pass the new metric through in `analyseGarmin`'s prompt string.

---

## Known Constraints

- **No backend** — all data is local to the browser. Clearing browser storage clears all history and Garmin data.
- **localStorage only** — the Claude artifact runtime does not support `sessionStorage` or IndexedDB reliably.
- **Raw CSV not persisted** — `garminRaw` is kept in React state only (not localStorage) to avoid the ~5 MB storage limit. Re-upload is required after a hard refresh if the user wants to re-analyse.
- **Single file** — keep all logic and styles in `index.html`. Do not split into multiple files unless migrating to a full React project.
- **YouTube links are search URLs** — not pinned to specific video IDs, so results may vary. Pin to specific IDs for production stability.
- **Garmin JSON parse fallback** — if the AI returns malformed JSON, `garminInsights` is set to the raw text string and `garminAdjusted` stays `null`. The UI degrades gracefully (no insight cards shown).
- **No `<form>` tags** — all interactions use `onClick`/`onChange` handlers. Never use HTML `<form>` elements.
- **No hidden file inputs** — Android WebView blocks both `display:none` + `ref.click()` AND `<label htmlFor>` with `zIndex:-1`. Always use the full-cover transparent overlay pattern (see Android File Upload section). The input must be `opacity:0`, no negative z-index, parent must be `position:relative`.
- **No APK rebuild for content changes** — the Capacitor wrapper loads GitHub Pages at runtime. Push to GitHub; the app updates automatically.

---

## Commands

There is no local dev server or build pipeline. To work on the app:

**Option 1 — Edit directly**
Open `index.html` in any text editor, make changes, push to GitHub. Live within ~30 seconds.

**Option 2 — Local preview**
```bash
# Serve locally to test before pushing
npx serve .
# or
python3 -m http.server 8080
```
Open `http://localhost:8080` in Chrome DevTools with mobile emulation enabled.

**Option 3 — Migrate to a proper React project**
```bash
npm create vite@latest forgefit -- --template react
# copy app logic from index.html into src/App.jsx
npm install
npm run dev
```
If migrating, replace inline `localStorage` calls with Zustand or React Context, and move Anthropic API calls to a backend route to protect the API key.
