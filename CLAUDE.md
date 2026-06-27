# CLAUDE.md — FORGEFIT

This file provides guidance for Claude Code and AI assistants working on the FORGEFIT codebase.

---

## Project Overview

**FORGEFIT** is an AI-powered personal fitness coaching app built as a single-file React artifact. It generates personalised workout plans, provides rep/set/weight guidance, links to YouTube form tutorials, lets users log workouts, and analyses Garmin watch data to adjust training — all driven by a conversational onboarding flow and an embedded Claude AI coach.

---

## Architecture

### Single-file React component (`fitness-coach.jsx`)

The entire app lives in one self-contained React component with no external dependencies beyond what's available in the Claude artifact runtime. There is no build step, no routing library, and no backend — all state is managed in memory and persisted to `localStorage`.

**Key sections of the file (in order):**

| Section | Purpose |
|---|---|
| `C` constant | Design token palette (hex colors) |
| `QUESTIONS` array | Ordered onboarding questions with types and metadata |
| `buildPlan(profile)` | Core plan-generation logic — derives split, exercises, schemes |
| `calcStats(profile)` | BMI, TDEE (Mifflin-St Jeor), and calorie target calculations |
| `parseGarminCSV(text)` | Parses raw Garmin CSV export text into a structured summary object |
| `FitnessCoach` component | Main app with phase + tab-based rendering |

### Phases

The app uses a `phase` state string to switch between full-screen modes:

- `"onboard"` — Step-by-step questionnaire (12 questions)
- `"plan"` — Main app shell (renders the active tab)
- `"log"` — Active workout logging session (full-screen, no tabs)

### Tabs (within `"plan"` phase)

A `tab` state string controls which panel renders inside the main shell:

- `"plan"` — Day selector, exercise list, quick fallback, AI coach, stats
- `"garmin"` — CSV upload, biometric summary, AI analysis & plan adjustments
- `"history"` — Past workout log viewer

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

> **Note:** Raw CSV text (`garminRaw`) is NOT persisted — only the parsed summary is saved to avoid hitting the ~5 MB localStorage limit.

---

## Anthropic API Usage

Two separate Claude API calls are made from the browser:

### 1. General AI Coach (`askAI`)
- **Trigger:** User taps a preset question button on the Plan tab
- **System prompt:** Built from `profile` + `calcStats()` + any existing `garminInsights`
- **Response format:** Plain text, 3-5 sentences
- **State:** `aiResponse`, `loadingAI`

### 2. Garmin Analysis (`analyseGarmin`)
- **Trigger:** Called automatically after a CSV is parsed
- **System prompt:** User profile + full `garminData` summary metrics
- **Response format:** Strict JSON (see `garminAdjusted` shape above)
- **Parsing:** Strips markdown fences before `JSON.parse()`; falls back to storing raw text if parse fails
- **State:** `garminInsights`, `garminAdjusted`, `garminLoading`

Both calls use:
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6`
- **Max tokens:** 1000
- **Auth:** Handled by the Claude artifact runtime (no API key in code)

---

## Garmin CSV Parsing (`parseGarminCSV`)

The parser uses fuzzy column matching — it searches header names case-insensitively for known keywords rather than requiring exact column names. This handles the variety of column naming across Garmin's different export types (Activities, Health Snapshot, Sleep, Stress).

**Detected columns (by keyword match):**

| Metric | Keywords searched |
|---|---|
| Date | `Date`, `Start Time`, `Activity Date` |
| Activity Type | `Activity Type`, `Type` |
| Avg HR | `Avg HR`, `Average HR`, `Heart Rate Avg` |
| Max HR | `Max HR`, `Maximum HR`, `Heart Rate Max` |
| Calories | `Calories`, `Energy (kcal)` |
| HRV | `HRV`, `Heart Rate Variability` |
| VO2 Max | `VO2`, `VO2 Max` |
| Stress | `Stress` |
| Sleep Score | `Sleep`, `Sleep Score` |
| Body Battery | `Body Battery`, `BB` |
| Respiration | `Respiration`, `Avg Respiration` |

If a column isn't found, its summary value is `null` and it's excluded from the AI prompt and the UI.

**Supported Garmin export types:**
- Activities list (most common)
- Health Snapshot
- Sleep data export
- Stress & Body Battery export

---

## Plan Generation Logic

### Split selection (`buildPlan → structures`)

| Days/week | Split type |
|---|---|
| 2 | Full Body A / Full Body B |
| 3 | Push / Pull / Legs |
| 4 | Upper-Lower (A/B) |
| 5 | Chest+Tris / Back+Bis / Legs / Shoulders+Arms / Full Body |
| 6 | Classic bro split (one muscle group per day) |

### Rep scheme by goal

| Goal | Sets | Reps | Rest |
|---|---|---|---|
| Muscle Building | 4 | 6-10 | 90-120s |
| Fat Loss | 3 | 12-15 | 45-60s |
| Body Recomposition | 3-4 | 8-12 | 60-90s |

### Weight progression by level

- **Beginner:** 50-60% of form-failure weight, +2.5 kg/week if easy
- **Intermediate:** 65-75% 1RM, increase at top of rep range
- **Advanced:** 70-85% 1RM, RPE 8-9, deload every 4th week

---

## Styling System

All styles are inline objects defined in the `s` constant inside the render function. The palette is defined in the top-level `C` constant. **Do not add external CSS files or CSS modules.**

Color roles:
- `C.accent` (`#FF4D00`) — primary CTA, active states, highlights
- `C.gold` (`#F5C842`) — quick/express workout, secondary highlights
- `C.green` (`#22C55E`) — log/save actions, positive stats
- `C.blue` (`#3B82F6`) — AI coach, Pull day tag
- `C.purple` (`#A855F7`) — Garmin tab, biometric data, watch features
- `C.muted` (`#7A7A9A`) — secondary text, disabled states

The Garmin tab uses `C.purple` (`#A855F7`) as its signature color throughout — tab button, borders, section titles, insight cards, and CTA buttons.

---

## Extending the App

### Adding a new exercise
Add an entry to the relevant muscle group array inside `exercises` in `buildPlan()`. Shape: `{ name, muscle, reps, sets, weight, youtube, tip }`.

### Adding a new training split
Add a key to the `structures` object in `buildPlan()`. Key = number of days (integer), value = array of `{ name, focus: string[], tag, color }`.

### Adding new onboarding questions
Append to the `QUESTIONS` array. The `id` becomes the key on `profile`. Supported types: `"text"`, `"number"`, `"select"` (requires `options` array).

### Adding new AI coach presets
Add a string to the preset buttons array in the AI Coach section of the plan tab render. `askAI()` handles the API call.

### Adding new Garmin metrics
In `parseGarminCSV`, add a new `find(...)` call with relevant keywords, then include the metric in `summary` and pass it through to the `analyseGarmin` prompt string.

### Adding nutrition tracking
`calcStats()` already computes TDEE and target calories. A nutrition tab could add macro splits:
- Fat Loss: ~40% protein / 30% carb / 30% fat
- Muscle Building: ~30% protein / 50% carb / 20% fat

---

## Known Constraints

- **No backend** — all data is local to the browser. Clearing browser storage clears all history and Garmin data.
- **localStorage only** — the Claude artifact runtime does not support `sessionStorage` or IndexedDB reliably.
- **Raw CSV not persisted** — `garminRaw` is kept in React state only (not localStorage) to avoid the ~5 MB storage limit. Re-upload is required after a hard refresh if the user wants to re-analyse.
- **Single file** — keep all logic and styles in `fitness-coach.jsx`. Do not split into multiple components unless migrating to a full React project.
- **YouTube links are search URLs** — not pinned to specific video IDs, so results may vary. Pin to specific IDs for production stability.
- **Garmin JSON parse fallback** — if the AI returns malformed JSON, `garminInsights` is set to the raw text string and `garminAdjusted` stays `null`. The UI degrades gracefully (no insights cards shown).

---

## Commands

This is a Claude artifact — there is no local dev server or build pipeline. To work on it:

1. Paste the JSX into the Claude artifact editor, or
2. Migrate to a standard React project:

```bash
npm create vite@latest forgefit -- --template react
cp fitness-coach.jsx src/App.jsx
npm install
npm run dev
```

If migrating, replace inline `localStorage` calls with a proper state management solution (Zustand, Redux, or React Context) and move all Anthropic API calls to a backend route to protect your API key.
