import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "fitness_coach_data";

const C = {
  bg: "#0A0A0F",
  surface: "#13131A",
  card: "#1C1C27",
  border: "#2A2A3D",
  accent: "#FF4D00",
  accentDim: "#FF4D0022",
  accentMid: "#FF4D0055",
  gold: "#F5C842",
  text: "#F0EEF8",
  muted: "#7A7A9A",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#A855F7",
};

const QUESTIONS = [
  { id: "name",       label: "What's your name?",                                            type: "text",   placeholder: "e.g. Alex" },
  { id: "age",        label: "How old are you?",                                              type: "number", placeholder: "e.g. 28",  unit: "yrs" },
  { id: "gender",     label: "What's your biological sex?",                                   type: "select", options: ["Male","Female"] },
  { id: "height",     label: "What's your height?",                                          type: "number", placeholder: "e.g. 175", unit: "cm" },
  { id: "weight",     label: "What's your current weight?",                                   type: "number", placeholder: "e.g. 85",  unit: "kg" },
  { id: "target",     label: "What's your target weight?",                                    type: "number", placeholder: "e.g. 75",  unit: "kg" },
  { id: "goal",       label: "What's your primary goal?",                                     type: "select", options: ["Fat Loss","Muscle Building","Body Recomposition"] },
  { id: "level",      label: "What's your training experience?",                              type: "select", options: ["Beginner (< 1 yr)","Intermediate (1-3 yrs)","Advanced (3+ yrs)"] },
  { id: "equipment",  label: "What equipment do you have access to?",                         type: "select", options: ["Full Gym","Dumbbells Only","Resistance Bands","Bodyweight Only"] },
  { id: "days",       label: "How many days per week can you train? (You can adjust later)",  type: "select", options: ["2","3","4","5","6"] },
  { id: "sessionLen", label: "How long is your typical session?",                             type: "select", options: ["30 min","45 min","60 min","75+ min"] },
  { id: "injuries",   label: "Any injuries or limitations? (type 'none' if not)",             type: "text",   placeholder: "e.g. bad knees, shoulder impingement" },
];

function buildPlan(profile) {
  const days = parseInt(profile.days);
  const isBeginner = profile.level.startsWith("Beginner");
  const isAdvanced  = profile.level.startsWith("Advanced");
  const isBuild = profile.goal === "Muscle Building";
  const isLoss  = profile.goal === "Fat Loss";

  const scheme = isBuild
    ? { sets: "4", reps: "6-10",  rest: "90-120s", note: "Heavier loads, progressive overload focus" }
    : isLoss
    ? { sets: "3", reps: "12-15", rest: "45-60s",  note: "Higher reps, shorter rest to elevate HR" }
    : { sets: "3-4", reps: "8-12", rest: "60-90s", note: "Balanced for strength + conditioning" };

  const weightGuide = isBeginner
    ? "Start at 50-60% of form-failure weight. Add 2.5 kg/week if all sets feel easy."
    : isAdvanced
    ? "Work at 70-85% 1RM. RPE 8-9 on final sets. Deload every 4th week."
    : "Work at 65-75% 1RM. Increase when you hit the top of your rep range with good form.";

  const exercises = {
    chest: [
      { name: "Barbell Bench Press",    muscle: "Chest",             reps: scheme.reps, sets: scheme.sets, weight: "60-100 kg",       youtube: "https://www.youtube.com/results?search_query=bench+press+form+technique",      tip: "Retract scapulae, arch naturally, bar to nipple line" },
      { name: "Incline Dumbbell Press", muscle: "Upper Chest",       reps: scheme.reps, sets: scheme.sets, weight: "10-30 kg DB",      youtube: "https://www.youtube.com/results?search_query=incline+dumbbell+press+form",      tip: "30-45° incline, elbows at 75°, full stretch at bottom" },
      { name: "Cable Flyes",            muscle: "Chest isolation",   reps: "12-15",     sets: "3",         weight: "5-15 kg/side",     youtube: "https://www.youtube.com/results?search_query=cable+fly+technique",               tip: "Slight elbow bend, squeeze at peak contraction" },
    ],
    back: [
      { name: "Barbell Deadlift",       muscle: "Full back + hams",  reps: isBuild ? "4-6" : "8-10", sets: scheme.sets, weight: "60-180 kg", youtube: "https://www.youtube.com/results?search_query=deadlift+form+tutorial",        tip: "Hip hinge, bar close to shins, brace core hard" },
      { name: "Pull-Ups / Lat Pulldown",muscle: "Lats, Biceps",      reps: scheme.reps, sets: scheme.sets, weight: "BW / 40-80 kg",   youtube: "https://www.youtube.com/results?search_query=pull+up+lat+pulldown+technique",   tip: "Full ROM, dead hang to chest, retract shoulder blades" },
      { name: "Seated Cable Row",       muscle: "Mid back, Rhomboids",reps: scheme.reps, sets: scheme.sets, weight: "40-80 kg",        youtube: "https://www.youtube.com/results?search_query=seated+cable+row+form",             tip: "Drive elbows back, pause at contraction, no jerking" },
    ],
    legs: [
      { name: "Barbell Back Squat",     muscle: "Quads, Glutes",     reps: scheme.reps, sets: scheme.sets, weight: "40-120 kg",       youtube: "https://www.youtube.com/results?search_query=squat+form+tutorial",               tip: "Knees track toes, hit depth, chest tall throughout" },
      { name: "Romanian Deadlift",      muscle: "Hamstrings, Glutes",reps: "10-12",     sets: "3-4",       weight: "40-100 kg",       youtube: "https://www.youtube.com/results?search_query=romanian+deadlift+form",            tip: "Hinge at hips, soft knee, bar drags down legs" },
      { name: "Leg Press",              muscle: "Quads",             reps: scheme.reps, sets: scheme.sets, weight: "80-200 kg",       youtube: "https://www.youtube.com/results?search_query=leg+press+form+technique",           tip: "Feet shoulder-width, don't lock knees at top" },
      { name: "Calf Raises",            muscle: "Calves",            reps: "15-20",     sets: "3",         weight: "BW + 20-50 kg",   youtube: "https://www.youtube.com/results?search_query=calf+raises+technique",             tip: "Full ROM, 2-second squeeze at top, slow descent" },
    ],
    shoulders: [
      { name: "Overhead Press",         muscle: "Front & Lateral Delt", reps: scheme.reps, sets: scheme.sets, weight: "20-70 kg",    youtube: "https://www.youtube.com/results?search_query=overhead+press+form+technique",     tip: "Lock core, slight layback, bar overhead not forward" },
      { name: "Lateral Raises",         muscle: "Lateral Delt",      reps: "12-20",     sets: "3-4",       weight: "5-20 kg DB",      youtube: "https://www.youtube.com/results?search_query=lateral+raise+form+technique",     tip: "Lead with elbows, slight forward lean, no swinging" },
      { name: "Face Pulls",             muscle: "Rear Delt, Rotator Cuff", reps: "15-20", sets: "3",       weight: "10-30 kg",        youtube: "https://www.youtube.com/results?search_query=face+pull+form+technique",          tip: "Pull to forehead height, external rotation at end" },
    ],
    arms: [
      { name: "Barbell Curl",           muscle: "Biceps",            reps: scheme.reps, sets: "3",         weight: "15-45 kg",        youtube: "https://www.youtube.com/results?search_query=barbell+curl+technique",            tip: "No swinging, supinate at top, full stretch" },
      { name: "Tricep Pushdown",        muscle: "Triceps",           reps: scheme.reps, sets: "3",         weight: "20-50 kg",        youtube: "https://www.youtube.com/results?search_query=tricep+pushdown+technique",        tip: "Elbows glued to sides, fully extend, controlled return" },
      { name: "Hammer Curls",           muscle: "Brachialis, Forearm", reps: "10-12",   sets: "3",         weight: "10-25 kg DB",     youtube: "https://www.youtube.com/results?search_query=hammer+curl+form",                tip: "Neutral grip, slow eccentric" },
    ],
    core: [
      { name: "Plank",                  muscle: "Core",              reps: "45-60s hold", sets: "3",       weight: "BW",              youtube: "https://www.youtube.com/results?search_query=plank+form+core",                   tip: "Neutral spine, glutes squeezed, breathe steadily" },
      { name: "Cable Crunches",         muscle: "Abs",               reps: "15-20",     sets: "3",         weight: "20-50 kg",        youtube: "https://www.youtube.com/results?search_query=cable+crunch+technique",           tip: "Flex spine, don't pull with arms, focus on abs" },
    ],
  };

  const structures = {
    2: [
      { name: "Full Body A", focus: ["chest","back","legs","core"],    tag: "Full Body", color: C.accent },
      { name: "Full Body B", focus: ["shoulders","back","legs","arms"], tag: "Full Body", color: C.gold },
    ],
    3: [
      { name: "Push Day", focus: ["chest","shoulders","arms"], tag: "Push", color: C.accent },
      { name: "Pull Day", focus: ["back","arms"],              tag: "Pull", color: C.blue },
      { name: "Leg Day",  focus: ["legs","core"],              tag: "Legs", color: C.green },
    ],
    4: [
      { name: "Upper A (Push)", focus: ["chest","shoulders"],  tag: "Push", color: C.accent },
      { name: "Lower A",        focus: ["legs","core"],        tag: "Legs", color: C.green },
      { name: "Upper B (Pull)", focus: ["back","arms"],        tag: "Pull", color: C.blue },
      { name: "Lower B",        focus: ["legs","core"],        tag: "Legs", color: C.gold },
    ],
    5: [
      { name: "Chest + Triceps",    focus: ["chest","arms"],          tag: "Push",      color: C.accent },
      { name: "Back + Biceps",      focus: ["back","arms"],           tag: "Pull",      color: C.blue },
      { name: "Leg Day",            focus: ["legs","core"],           tag: "Legs",      color: C.green },
      { name: "Shoulders + Arms",   focus: ["shoulders","arms"],      tag: "Shoulders", color: C.gold },
      { name: "Full Body Burn",     focus: ["chest","back","legs","core"], tag: "Full Body", color: C.purple },
    ],
    6: [
      { name: "Chest",               focus: ["chest","core"],         tag: "Chest",     color: C.accent },
      { name: "Back",                focus: ["back"],                 tag: "Back",      color: C.blue },
      { name: "Legs",                focus: ["legs"],                 tag: "Legs",      color: C.green },
      { name: "Shoulders",           focus: ["shoulders"],            tag: "Shoulders", color: C.gold },
      { name: "Arms",                focus: ["arms","core"],          tag: "Arms",      color: C.purple },
      { name: "Full Body / Weak Points", focus: ["chest","back","legs"], tag: "Full Body", color: "#EC4899" },
    ],
  };

  const workoutDays = structures[days] || structures[3];

  const quickFallback = [
    { name: "Push-Ups",        muscle: "Chest, Triceps", reps: "3×15",          sets: "3", weight: "BW",       youtube: "https://www.youtube.com/results?search_query=push+up+form+technique",        tip: "Full ROM, controlled descent" },
    { name: "Dumbbell Rows",   muscle: "Back",           reps: "3×12 per side", sets: "3", weight: "10-25 kg", youtube: "https://www.youtube.com/results?search_query=dumbbell+row+form",             tip: "Brace core, elbow drives back" },
    { name: "Goblet Squat",    muscle: "Legs, Glutes",   reps: "3×15",          sets: "3", weight: "10-30 kg", youtube: "https://www.youtube.com/results?search_query=goblet+squat+form",            tip: "Chest tall, deep squat, elbows inside knees" },
    { name: "DB Shoulder Press",muscle: "Shoulders",     reps: "3×12",          sets: "3", weight: "8-20 kg",  youtube: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+form", tip: "Slight forward lean, press overhead" },
    { name: "Plank",           muscle: "Core",           reps: "3×45s",         sets: "3", weight: "BW",       youtube: "https://www.youtube.com/results?search_query=plank+form",                   tip: "Neutral spine, steady breathing" },
  ];

  return { workoutDays, exercises, scheme, weightGuide, quickFallback };
}

function calcStats(profile) {
  const h = parseFloat(profile.height) / 100;
  const w = parseFloat(profile.weight);
  const age = parseFloat(profile.age);
  const isMale = profile.gender === "Male";
  if (!h || !w || !age) return null;
  const bmi = (w / (h * h)).toFixed(1);
  const bmr = isMale
    ? 10 * w + 6.25 * parseFloat(profile.height) - 5 * age + 5
    : 10 * w + 6.25 * parseFloat(profile.height) - 5 * age - 161;
  const days = parseInt(profile.days) || 3;
  const actMulti = days <= 2 ? 1.375 : days <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(bmr * actMulti);
  const target = profile.goal === "Fat Loss" ? tdee - 400 : profile.goal === "Muscle Building" ? tdee + 250 : tdee - 100;
  return { bmi, tdee, target };
}

// ── CSV parser for Garmin exports ──────────────────────────────
function parseGarminCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return null;
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
  // Try to identify common Garmin column patterns
  const find = (...keys) => headers.find(h => keys.some(k => h.toLowerCase().includes(k.toLowerCase())));
  const dateKey    = find("Date","date","Start Time","Activity Date");
  const typeKey    = find("Activity Type","Type","type","activity type");
  const hrKey      = find("Avg HR","avg hr","Average HR","Heart Rate Avg");
  const maxHRKey   = find("Max HR","max hr","Maximum HR","Heart Rate Max");
  const calKey     = find("Calories","calories","Energy (kcal)");
  const distKey    = find("Distance","distance");
  const timeKey    = find("Time","Elapsed Time","Duration","Moving Time");
  const stepsKey   = find("Steps","steps","Total Steps");
  const stressKey  = find("Stress","stress");
  const sleepKey   = find("Sleep","sleep","Sleep Score");
  const hrvKey     = find("HRV","hrv","Heart Rate Variability");
  const vo2Key     = find("VO2","vo2","VO2 Max");
  const respKey    = find("Respiration","Avg Respiration","respiration");
  const bodyBatKey = find("Body Battery","body battery","BB");

  const summary = {
    totalActivities: rows.length,
    dateRange: dateKey ? `${rows[rows.length-1][dateKey]} → ${rows[0][dateKey]}` : "N/A",
    avgHR:      hrKey      ? Math.round(rows.filter(r=>r[hrKey]).reduce((a,r)=>a+parseFloat(r[hrKey]||0),0)/rows.filter(r=>r[hrKey]&&parseFloat(r[hrKey])>0).length) : null,
    maxHR:      maxHRKey   ? Math.max(...rows.map(r=>parseFloat(r[maxHRKey]||0)).filter(v=>v>0)) : null,
    avgCal:     calKey     ? Math.round(rows.filter(r=>r[calKey]&&parseFloat(r[calKey])>0).reduce((a,r)=>a+parseFloat(r[calKey]||0),0)/rows.filter(r=>r[calKey]&&parseFloat(r[calKey])>0).length) : null,
    totalCal:   calKey     ? Math.round(rows.reduce((a,r)=>a+parseFloat(r[calKey]||0),0)) : null,
    avgStress:  stressKey  ? Math.round(rows.filter(r=>r[stressKey]&&parseFloat(r[stressKey])>0).reduce((a,r)=>a+parseFloat(r[stressKey]||0),0)/Math.max(1,rows.filter(r=>r[stressKey]&&parseFloat(r[stressKey])>0).length)) : null,
    avgSleep:   sleepKey   ? (rows.filter(r=>r[sleepKey]&&parseFloat(r[sleepKey])>0).reduce((a,r)=>a+parseFloat(r[sleepKey]||0),0)/Math.max(1,rows.filter(r=>r[sleepKey]&&parseFloat(r[sleepKey])>0).length)).toFixed(1) : null,
    avgHRV:     hrvKey     ? Math.round(rows.filter(r=>r[hrvKey]&&parseFloat(r[hrvKey])>0).reduce((a,r)=>a+parseFloat(r[hrvKey]||0),0)/Math.max(1,rows.filter(r=>r[hrvKey]&&parseFloat(r[hrvKey])>0).length)) : null,
    vo2Max:     vo2Key     ? parseFloat(rows.find(r=>r[vo2Key]&&parseFloat(r[vo2Key])>0)?.[vo2Key]||0).toFixed(1) : null,
    avgBodyBat: bodyBatKey ? Math.round(rows.filter(r=>r[bodyBatKey]&&parseFloat(r[bodyBatKey])>0).reduce((a,r)=>a+parseFloat(r[bodyBatKey]||0),0)/Math.max(1,rows.filter(r=>r[bodyBatKey]&&parseFloat(r[bodyBatKey])>0).length)) : null,
    activityTypes: typeKey ? [...new Set(rows.map(r=>r[typeKey]).filter(Boolean))] : [],
    rows, headers,
    keys: { dateKey, typeKey, hrKey, maxHRKey, calKey, distKey, timeKey, stepsKey, stressKey, sleepKey, hrvKey, vo2Key, respKey, bodyBatKey },
  };
  return summary;
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function FitnessCoach() {
  const [phase,       setPhase]      = useState("onboard");
  const [tab,         setTab]        = useState("plan");   // plan | garmin | history
  const [qIndex,      setQIndex]     = useState(0);
  const [profile,     setProfile]    = useState({});
  const [inputVal,    setInputVal]   = useState("");
  const [plan,        setPlan]       = useState(null);
  const [selectedDay, setSelectedDay]= useState(0);
  const [showQuick,   setShowQuick]  = useState(false);
  const [workoutLogs, setWorkoutLogs]= useState([]);
  const [logSession,  setLogSession] = useState(null);
  const [logSets,     setLogSets]    = useState({});
  const [toast,       setToast]      = useState("");
  const [aiResponse,  setAiResponse] = useState("");
  const [loadingAI,   setLoadingAI]  = useState(false);

  // Garmin state
  const [garminData,     setGarminData]     = useState(null);   // parsed summary
  const [garminRaw,      setGarminRaw]      = useState("");     // raw CSV text
  const [garminInsights, setGarminInsights] = useState("");     // AI analysis
  const [garminLoading,  setGarminLoading]  = useState(false);
  const [garminAdjusted, setGarminAdjusted] = useState(null);   // AI-suggested plan tweaks
  const [garminFileName, setGarminFileName] = useState("");
  const fileRef = useRef(null);

  // ── Persist ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.profile && d.plan) {
          setProfile(d.profile);
          setPlan(d.plan);
          setWorkoutLogs(d.logs || []);
          if (d.garminData) setGarminData(d.garminData);
          if (d.garminInsights) setGarminInsights(d.garminInsights);
          if (d.garminAdjusted) setGarminAdjusted(d.garminAdjusted);
          if (d.garminFileName) setGarminFileName(d.garminFileName);
          setPhase("plan");
        }
      }
    } catch (_) {}
  }, []);

  function persist(prof, pl, logs, gData, gInsights, gAdj, gFile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        profile: prof, plan: pl, logs,
        garminData: gData, garminInsights: gInsights,
        garminAdjusted: gAdj, garminFileName: gFile,
      }));
    } catch (_) {}
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(""), 2800); }

  // ── Onboarding ─────────────────────────────────────────────
  const currentQ = QUESTIONS[qIndex];
  function nextQ() {
    const val = inputVal.trim();
    if (!val) return;
    const newProfile = { ...profile, [currentQ.id]: val };
    setProfile(newProfile);
    setInputVal("");
    if (qIndex + 1 >= QUESTIONS.length) {
      const built = buildPlan(newProfile);
      setPlan(built);
      persist(newProfile, built, workoutLogs, garminData, garminInsights, garminAdjusted, garminFileName);
      setPhase("plan");
    } else {
      setQIndex(qIndex + 1);
    }
  }

  // ── AI coach (general) ─────────────────────────────────────
  async function askAI(question) {
    setLoadingAI(true);
    setAiResponse("");
    const stats = calcStats(profile);
    const systemPrompt = `You are an elite personal trainer and nutritionist. User profile:
Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}
Height: ${profile.height}cm, Weight: ${profile.weight}kg, Target: ${profile.target}kg
Goal: ${profile.goal}, Level: ${profile.level}, Equipment: ${profile.equipment}
Training days/week: ${profile.days}, Session: ${profile.sessionLen}, Injuries: ${profile.injuries}
TDEE: ~${stats?.tdee} kcal, Target calories: ~${stats?.target} kcal
${garminInsights ? `\nGarmin data insights already analysed:\n${garminInsights}` : ""}
Give concise, actionable advice in 3-5 sentences with specific numbers.`;
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: question }] }) });
      const data = await res.json();
      setAiResponse(data.content?.map(b => b.text || "").join("") || "Sorry, no response.");
    } catch { setAiResponse("Network error. Please try again."); }
    setLoadingAI(false);
  }

  // ── Garmin AI analysis ─────────────────────────────────────
  async function analyseGarmin(summary) {
    setGarminLoading(true);
    setGarminInsights("");
    setGarminAdjusted(null);
    const stats = calcStats(profile);

    const dataDesc = [
      summary.avgHR      ? `Average HR: ${summary.avgHR} bpm` : null,
      summary.maxHR      ? `Max HR recorded: ${summary.maxHR} bpm` : null,
      summary.avgHRV     ? `Average HRV: ${summary.avgHRV} ms` : null,
      summary.vo2Max     ? `VO2 Max: ${summary.vo2Max}` : null,
      summary.avgStress  ? `Average stress score: ${summary.avgStress}/100` : null,
      summary.avgSleep   ? `Average sleep score: ${summary.avgSleep}` : null,
      summary.avgBodyBat ? `Average Body Battery: ${summary.avgBodyBat}/100` : null,
      summary.avgCal     ? `Avg calories burned/activity: ${summary.avgCal} kcal` : null,
      summary.totalCal   ? `Total calories burned: ${summary.totalCal} kcal` : null,
      summary.activityTypes.length ? `Activity types: ${summary.activityTypes.join(", ")}` : null,
      `Total activities: ${summary.totalActivities}`,
      `Date range: ${summary.dateRange}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are an elite fitness coach and sports scientist. Analyse this Garmin watch data for ${profile.name} and provide workout plan adjustments.

ATHLETE PROFILE:
Goal: ${profile.goal}, Level: ${profile.level}, Training ${profile.days}x/week
Weight: ${profile.weight}kg → Target: ${profile.target}kg, Age: ${profile.age}, TDEE: ${stats?.tdee} kcal
Injuries: ${profile.injuries}

GARMIN DATA SUMMARY:
${dataDesc}

Provide your response in this EXACT JSON format (no markdown, no extra text):
{
  "summary": "2-3 sentence plain-English summary of what the data reveals about their fitness and recovery",
  "keyInsights": [
    {"icon": "❤️", "title": "Heart Rate Zone", "detail": "specific finding and what it means for training"},
    {"icon": "😴", "title": "Recovery Status", "detail": "sleep/HRV/stress finding and implication"},
    {"icon": "⚡", "title": "Fitness Level", "detail": "VO2 max / capacity finding"},
    {"icon": "🔋", "title": "Energy & Load", "detail": "body battery / calorie finding"}
  ],
  "planAdjustments": [
    {"type": "intensity", "recommendation": "specific change to intensity or volume based on the data"},
    {"type": "recovery",  "recommendation": "specific recovery or rest day recommendation"},
    {"type": "cardio",    "recommendation": "specific cardio zone or duration recommendation"},
    {"type": "nutrition", "recommendation": "calorie or macro adjustment based on burn data"}
  ],
  "warningFlags": ["any red flags from the data if present, otherwise empty array"],
  "weeklyStructure": "Recommended weekly structure change if any, e.g. add a deload week, shift cardio timing"
}`;

    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }) });
      const data = await res.json();
      const raw  = data.content?.map(b => b.text || "").join("") || "{}";
      try {
        const clean  = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setGarminInsights(parsed.summary || "");
        setGarminAdjusted(parsed);
        persist(profile, plan, workoutLogs, summary, parsed.summary, parsed, garminFileName);
      } catch {
        setGarminInsights(raw);
        persist(profile, plan, workoutLogs, summary, raw, null, garminFileName);
      }
    } catch { setGarminInsights("Network error. Please try again."); }
    setGarminLoading(false);
  }

  // ── File upload handler ────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { showToast("Please upload a .csv file"); return; }
    setGarminFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setGarminRaw(text);
      const summary = parseGarminCSV(text);
      if (!summary) { showToast("Couldn't parse CSV — check it's a valid Garmin export"); return; }
      setGarminData(summary);
      analyseGarmin(summary);
    };
    reader.readAsText(file);
  }

  // ── Adjust days ─────────────────────────────────────────────
  function adjustDays(d) {
    const newProfile = { ...profile, days: String(d) };
    const built = buildPlan(newProfile);
    setProfile(newProfile); setPlan(built); setSelectedDay(0);
    persist(newProfile, built, workoutLogs, garminData, garminInsights, garminAdjusted, garminFileName);
    showToast(`Plan updated to ${d} days/week`);
  }

  // ── Workout logging ─────────────────────────────────────────
  function startLog(dayObj) { setLogSession({ day: dayObj }); setLogSets({}); setPhase("log"); }
  function updateSet(exName, idx, field, value) {
    setLogSets(prev => {
      const sets = prev[exName] ? [...prev[exName]] : [];
      while (sets.length <= idx) sets.push({ reps: "", weight: "" });
      sets[idx] = { ...sets[idx], [field]: value };
      return { ...prev, [exName]: sets };
    });
  }
  function addSet(exName) { setLogSets(prev => { const sets = [...(prev[exName] || [])]; sets.push({ reps: "", weight: "" }); return { ...prev, [exName]: sets }; }); }
  function finishLog() {
    const entry = { id: Date.now(), date: new Date().toLocaleString(), dayName: logSession.day.name, tag: logSession.day.tag, sets: logSets };
    const newLogs = [entry, ...workoutLogs];
    setWorkoutLogs(newLogs);
    persist(profile, plan, newLogs, garminData, garminInsights, garminAdjusted, garminFileName);
    setPhase("plan"); showToast("Workout logged! 💪");
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("onboard"); setQIndex(0); setProfile({}); setInputVal(""); setPlan(null);
    setWorkoutLogs([]); setAiResponse(""); setGarminData(null); setGarminInsights("");
    setGarminAdjusted(null); setGarminFileName("");
  }

  // ── Styles ──────────────────────────────────────────────────
  const s = {
    app:       { background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.text, paddingBottom: 80 },
    topBar:    { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logo:      { fontSize: 17, fontWeight: 800, letterSpacing: "-0.5px" },
    logoAcc:   { color: C.accent },
    nav:       { display: "flex", gap: 6 },
    navBtn:    (a) => ({ background: a ? C.accentDim : "transparent", border: `1px solid ${a ? C.accent : C.border}`, color: a ? C.accent : C.muted, borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all .2s" }),
    page:      { maxWidth: 720, margin: "0 auto", padding: "20px 14px" },
    card:      { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 14 },
    secTitle:  { fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.accent, textTransform: "uppercase", marginBottom: 12 },
    h1:        { fontSize: 26, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 },
    h2:        { fontSize: 19, fontWeight: 700, marginBottom: 10 },
    h3:        { fontSize: 15, fontWeight: 600, marginBottom: 6 },
    muted:     { color: C.muted, fontSize: 13 },
    btn:       (col = C.accent) => ({ background: col, color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%", marginTop: 10 }),
    btnSm:     (col = C.accent, out = false) => ({ background: out ? "transparent" : col, color: out ? col : "#fff", border: `2px solid ${col}`, borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 12, cursor: "pointer" }),
    input:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 15, width: "100%", outline: "none", boxSizing: "border-box" },
    tag:       (col) => ({ background: col+"22", color: col, border: `1px solid ${col}44`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700, display: "inline-block" }),
    exCard:    { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 8 },
    pill:      (col = C.accent) => ({ background: col+"22", color: col, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, display: "inline-block", marginRight: 5 }),
    statGrid:  { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 },
    statCard:  { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, textAlign: "center" },
    statVal:   { fontSize: 20, fontWeight: 800, color: C.accent },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 },
    dayGrid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8, marginBottom: 14 },
    dayCard:   (a, col) => ({ background: a ? col+"22" : C.surface, border: `2px solid ${a ? col : C.border}`, borderRadius: 12, padding: "12px 8px", textAlign: "center", cursor: "pointer", transition: "all .2s" }),
    logInput:  { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "7px 10px", color: C.text, fontSize: 13, flex: 1 },
    aiBubble:  { background: `linear-gradient(135deg,#3B82F622,#3B82F611)`, border: `1px solid ${C.blue}44`, borderRadius: 12, padding: 14, marginTop: 10 },
    toast:     { position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: C.green, color: "#fff", padding: "10px 22px", borderRadius: 50, fontWeight: 700, fontSize: 13, zIndex: 999, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0008" },
    dropZone:  (over) => ({ border: `2px dashed ${over ? C.purple : C.border}`, borderRadius: 14, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: over ? C.purple+"11" : C.surface, transition: "all .2s" }),
    insightCard: (col) => ({ background: col+"11", border: `1px solid ${col}33`, borderRadius: 12, padding: 14, marginBottom: 8 }),
    adjCard:   (col) => ({ background: col+"11", border: `1px solid ${col}33`, borderRadius: 10, padding: 12, marginBottom: 8 }),
    warnCard:  { background: "#EF444422", border: "1px solid #EF444444", borderRadius: 10, padding: 12, marginBottom: 8 },
  };

  const stats = plan ? calcStats(profile) : null;

  // ══ ONBOARDING ══════════════════════════════════════════════
  if (phase === "onboard") {
    const progress = (qIndex / QUESTIONS.length) * 100;
    return (
      <div style={s.app}>
        <div style={s.topBar}>
          <div style={s.logo}><span style={s.logoAcc}>FORGE</span>FIT</div>
          <div style={{ fontSize: 12, color: C.muted }}>{qIndex + 1} / {QUESTIONS.length}</div>
        </div>
        <div style={s.page}>
          <div style={{ background: C.surface, borderRadius: 4, height: 3, marginBottom: 28, overflow: "hidden" }}>
            <div style={{ background: C.accent, height: "100%", width: `${progress}%`, borderRadius: 4, transition: "width .4s" }} />
          </div>
          <div style={s.card}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>Question {qIndex + 1}</div>
            <div style={{ fontSize: 21, fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>{currentQ.label}</div>
            {currentQ.type === "select" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQ.options.map(opt => (
                  <button key={opt} onClick={() => setInputVal(opt)}
                    style={{ ...s.input, background: inputVal === opt ? C.accentDim : C.surface, border: `2px solid ${inputVal === opt ? C.accent : C.border}`, textAlign: "left", cursor: "pointer", color: C.text, fontWeight: inputVal === opt ? 700 : 400 }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input style={s.input} type={currentQ.type} placeholder={currentQ.placeholder} value={inputVal}
                  onChange={e => setInputVal(e.target.value)} onKeyDown={e => e.key === "Enter" && nextQ()} autoFocus />
                {currentQ.unit && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>{currentQ.unit}</span>}
              </div>
            )}
            <button style={s.btn()} onClick={nextQ} disabled={!inputVal.trim()}>
              {qIndex + 1 >= QUESTIONS.length ? "Build My Plan →" : "Next →"}
            </button>
          </div>
          {qIndex > 0 && (
            <button onClick={() => { setQIndex(qIndex - 1); setInputVal(profile[QUESTIONS[qIndex-1].id] || ""); }}
              style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, padding: "6px 0" }}>← Back</button>
          )}
        </div>
      </div>
    );
  }

  // ══ LOG SESSION ══════════════════════════════════════════════
  if (phase === "log" && logSession) {
    const day    = logSession.day;
    const exList = day.focus.flatMap(f => plan.exercises[f] || []);
    return (
      <div style={s.app}>
        <div style={s.topBar}>
          <div style={s.logo}><span style={s.logoAcc}>FORGE</span>FIT</div>
          <button onClick={() => setPhase("plan")} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>✕ Cancel</button>
        </div>
        <div style={s.page}>
          <div style={s.secTitle}>Logging Workout</div>
          <div style={s.h1}>{day.name}</div>
          <div style={{ ...s.muted, marginBottom: 20 }}>{new Date().toDateString()}</div>
          {exList.map(ex => {
            const sets = logSets[ex.name] || [{ reps: "", weight: "" }];
            return (
              <div key={ex.name} style={s.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={s.h3}>{ex.name}</div>
                  <a href={ex.youtube} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>▶ FORM</a>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>Target: {ex.sets} × {ex.reps} | {ex.weight}</div>
                <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr", gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>SET</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>REPS</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>KG</div>
                </div>
                {sets.map((set, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr", gap: 6, marginBottom: 5 }}>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, paddingTop: 7 }}>{i + 1}</div>
                    <input style={s.logInput} placeholder="e.g. 10" type="number" value={set.reps}   onChange={e => updateSet(ex.name, i, "reps", e.target.value)} />
                    <input style={s.logInput} placeholder="e.g. 60" type="number" value={set.weight} onChange={e => updateSet(ex.name, i, "weight", e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addSet(ex.name)} style={{ ...s.btnSm(C.muted, true), marginTop: 4 }}>+ Set</button>
              </div>
            );
          })}
          <button style={s.btn(C.green)} onClick={finishLog}>✓ Finish & Save Workout</button>
        </div>
      </div>
    );
  }

  if (phase !== "plan" || !plan) return null;

  const dayObj    = plan.workoutDays[selectedDay];
  const exForDay  = dayObj.focus.flatMap(f => plan.exercises[f] || []);

  // ── Tab colour for Garmin ────────────────────────────────────
  const garminColor = C.purple;

  // ══ MAIN PLAN ════════════════════════════════════════════════
  return (
    <div style={s.app}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.topBar}>
        <div style={s.logo}><span style={s.logoAcc}>FORGE</span>FIT</div>
        <div style={s.nav}>
          <button style={s.navBtn(tab === "plan")}    onClick={() => setTab("plan")}>Plan</button>
          <button style={{ ...s.navBtn(tab === "garmin"), borderColor: tab === "garmin" ? garminColor : C.border, color: tab === "garmin" ? garminColor : C.muted, background: tab === "garmin" ? garminColor+"22" : "transparent" }}
            onClick={() => setTab("garmin")}>
            {garminData ? "⌚ Garmin ✓" : "⌚ Garmin"}
          </button>
          <button style={s.navBtn(tab === "history")} onClick={() => setTab("history")}>History ({workoutLogs.length})</button>
          <button style={{ ...s.navBtn(false), borderColor: "#FF4D4444", color: "#FF6666" }} onClick={reset}>Reset</button>
        </div>
      </div>

      {/* ══ PLAN TAB ══════════════════════════════════════════ */}
      {tab === "plan" && (
        <div style={s.page}>
          <div style={{ marginBottom: 18 }}>
            <div style={s.secTitle}>Your Plan</div>
            <div style={s.h1}>Hey, {profile.name} 👋</div>
            <div style={s.muted}>{profile.goal} · {profile.days} days/week · {profile.level}</div>
          </div>

          {/* Stats */}
          {stats && (
            <div style={s.statGrid}>
              <div style={s.statCard}><div style={s.statVal}>{stats.bmi}</div><div style={s.statLabel}>BMI</div></div>
              <div style={s.statCard}><div style={{ ...s.statVal, color: C.gold }}>{stats.tdee}</div><div style={s.statLabel}>TDEE kcal</div></div>
              <div style={s.statCard}><div style={{ ...s.statVal, color: C.green }}>{stats.target}</div><div style={s.statLabel}>Target kcal</div></div>
            </div>
          )}

          {/* Garmin nudge if uploaded */}
          {garminAdjusted && (
            <div style={{ background: garminColor+"11", border: `1px solid ${garminColor}33`, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontSize: 28 }}>⌚</div>
              <div>
                <div style={{ fontWeight: 700, color: garminColor, fontSize: 13, marginBottom: 3 }}>Garmin data is active</div>
                <div style={{ fontSize: 12, color: C.muted }}>{garminAdjusted.summary?.slice(0,100)}…</div>
              </div>
              <button onClick={() => setTab("garmin")} style={{ ...s.btnSm(garminColor, true), whiteSpace: "nowrap", marginLeft: "auto" }}>View →</button>
            </div>
          )}

          {/* Frequency */}
          <div style={s.card}>
            <div style={s.secTitle}>Weekly Frequency</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[2,3,4,5,6].map(d => (
                <button key={d} onClick={() => adjustDays(d)}
                  style={{ background: parseInt(profile.days)===d ? C.accent : C.surface, color: parseInt(profile.days)===d ? "#fff" : C.muted, border: `1px solid ${parseInt(profile.days)===d ? C.accent : C.border}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  {d}×
                </button>
              ))}
            </div>
            <div style={{ ...s.muted, marginTop: 6, fontSize: 11 }}>{plan.scheme.note}</div>
          </div>

          {/* Quick fallback */}
          <div style={{ background: `linear-gradient(135deg,${C.gold}22,${C.gold}11)`, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: 14, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, color: C.gold, marginBottom: 2 }}>⚡ Short on time?</div>
              <div style={{ fontSize: 12, color: C.muted }}>20-min express workout</div>
            </div>
            <button onClick={() => setShowQuick(!showQuick)} style={s.btnSm(C.gold, !showQuick)}>
              {showQuick ? "Hide" : "Show Quick Plan"}
            </button>
          </div>

          {showQuick && (
            <div style={{ ...s.card, border: `1px solid ${C.gold}44`, marginTop: -6 }}>
              <div style={{ ...s.secTitle, color: C.gold }}>⚡ 20-Min Express</div>
              {plan.quickFallback.map(ex => (
                <div key={ex.name} style={{ ...s.exCard, borderLeft: `3px solid ${C.gold}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div><div style={{ fontWeight: 700, marginBottom: 2 }}>{ex.name}</div><div style={{ fontSize: 11, color: C.muted }}>{ex.muscle}</div></div>
                    <a href={ex.youtube} target="_blank" rel="noopener noreferrer" style={{ background: C.gold+"22", color: C.gold, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>▶ FORM</a>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 5 }}>
                    <span style={s.pill(C.gold)}>{ex.reps}</span>
                    <span style={s.pill(C.muted)}>{ex.weight}</span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: C.muted, fontStyle: "italic" }}>💡 {ex.tip}</div>
                </div>
              ))}
            </div>
          )}

          {/* Day selector */}
          <div style={s.card}>
            <div style={s.secTitle}>Select Workout Day</div>
            <div style={s.dayGrid}>
              {plan.workoutDays.map((day, i) => (
                <div key={i} style={s.dayCard(selectedDay === i, day.color)} onClick={() => setSelectedDay(i)}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: day.color, marginBottom: 3 }}>{day.tag}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{day.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div style={s.card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div><div style={s.secTitle}>{dayObj.tag}</div><div style={s.h2}>{dayObj.name}</div></div>
              <button onClick={() => startLog(dayObj)} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Log This →</button>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, marginBottom: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div><span style={{ color: C.muted, fontSize: 11 }}>Sets </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.sets}</span></div>
              <div><span style={{ color: C.muted, fontSize: 11 }}>Reps </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.reps}</span></div>
              <div><span style={{ color: C.muted, fontSize: 11 }}>Rest </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.rest}</span></div>
            </div>
            {exForDay.map((ex, i) => (
              <div key={i} style={{ ...s.exCard, borderLeft: `3px solid ${dayObj.color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{ex.name}</div><div style={{ fontSize: 11, color: C.muted }}>{ex.muscle}</div></div>
                  <a href={ex.youtube} target="_blank" rel="noopener noreferrer" style={{ background: "#FF000022", color: "#FF4444", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none" }}>▶ YouTube</a>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                  <span style={s.pill()}>{ex.sets} sets</span>
                  <span style={s.pill(C.blue)}>{ex.reps} reps</span>
                  <span style={s.pill(C.muted)}>{ex.weight}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>💡 {ex.tip}</div>
              </div>
            ))}
            <div style={{ background: C.accentDim, border: `1px solid ${C.accentMid}`, borderRadius: 10, padding: 10, marginTop: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 4 }}>📊 WEIGHT PROGRESSION</div>
              <div style={{ fontSize: 12, color: C.muted }}>{plan.weightGuide}</div>
            </div>
          </div>

          {/* AI Coach */}
          <div style={s.card}>
            <div style={s.secTitle}>AI Coach</div>
            <div style={s.h3}>Ask Your Coach</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
              {["What should I eat to hit my goal?","How do I break through a plateau?","How do I track progressive overload?","What supplements should I consider?"].map(q => (
                <button key={q} onClick={() => askAI(q)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>{q}</button>
              ))}
            </div>
            {loadingAI && <div style={{ color: C.muted, fontSize: 13, padding: "10px 0" }}>🤔 Coach is thinking…</div>}
            {aiResponse && !loadingAI && (
              <div style={s.aiBubble}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 6 }}>🏋️ YOUR COACH SAYS</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: C.text }}>{aiResponse}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ GARMIN TAB ════════════════════════════════════════ */}
      {tab === "garmin" && (
        <div style={s.page}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ ...s.secTitle, color: garminColor }}>Garmin Integration</div>
            <div style={s.h1}>Watch Data Analysis</div>
            <div style={s.muted}>Upload your Garmin export CSV to get AI-powered workout adjustments</div>
          </div>

          {/* How to export */}
          <div style={{ background: garminColor+"11", border: `1px solid ${garminColor}33`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: garminColor, fontSize: 13, marginBottom: 8 }}>📥 How to export from Garmin Connect</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              1. Open <strong style={{ color: C.text }}>Garmin Connect</strong> → Health Stats or Activities<br/>
              2. Click <strong style={{ color: C.text }}>Export</strong> (top right) → <strong style={{ color: C.text }}>Export to CSV</strong><br/>
              3. Or go to <strong style={{ color: C.text }}>connect.garmin.com/modern/proxy/download-service/export/csv/activity/…</strong><br/>
              4. Works with: Activity exports, Health Snapshot, Sleep data, Stress & Body Battery CSVs
            </div>
          </div>

          {/* Upload zone */}
          <div style={s.card}>
            <div style={s.secTitle}>Upload CSV</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
            <div style={s.dropZone(false)} onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>⌚</div>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>
                {garminFileName ? `✓ ${garminFileName}` : "Tap to upload Garmin CSV"}
              </div>
              <div style={{ fontSize: 12, color: C.muted }}>Activities, Health Stats, Sleep, Stress data</div>
              {garminFileName && <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ ...s.btnSm(garminColor, true), marginTop: 10 }}>Replace file</button>}
            </div>
          </div>

          {/* Loading */}
          {garminLoading && (
            <div style={{ ...s.card, textAlign: "center", padding: 30 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔬</div>
              <div style={{ color: garminColor, fontWeight: 700, marginBottom: 4 }}>Analysing your Garmin data…</div>
              <div style={{ color: C.muted, fontSize: 13 }}>AI coach is reading your biometrics</div>
            </div>
          )}

          {/* Data summary stats */}
          {garminData && !garminLoading && (
            <>
              <div style={s.card}>
                <div style={{ ...s.secTitle, color: garminColor }}>Detected Metrics</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px,1fr))", gap: 8 }}>
                  {[
                    garminData.avgHR      && { label: "Avg HR",        val: `${garminData.avgHR} bpm`,   col: "#EF4444" },
                    garminData.maxHR      && { label: "Max HR",         val: `${garminData.maxHR} bpm`,   col: "#EF4444" },
                    garminData.avgHRV     && { label: "Avg HRV",        val: `${garminData.avgHRV} ms`,   col: C.green },
                    garminData.vo2Max     && { label: "VO2 Max",        val: garminData.vo2Max,           col: C.blue },
                    garminData.avgStress  && { label: "Avg Stress",     val: `${garminData.avgStress}/100`, col: C.gold },
                    garminData.avgSleep   && { label: "Sleep Score",    val: garminData.avgSleep,         col: C.purple },
                    garminData.avgBodyBat && { label: "Body Battery",   val: `${garminData.avgBodyBat}/100`, col: C.green },
                    garminData.avgCal     && { label: "Avg Cal Burn",   val: `${garminData.avgCal} kcal`, col: C.accent },
                    { label: "Activities", val: garminData.totalActivities, col: C.muted },
                  ].filter(Boolean).map((m, i) => (
                    <div key={i} style={s.statCard}>
                      <div style={{ ...s.statVal, fontSize: 16, color: m.col }}>{m.val}</div>
                      <div style={s.statLabel}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {garminData.activityTypes.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>ACTIVITY TYPES FOUND</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {garminData.activityTypes.map(t => <span key={t} style={s.pill(garminColor)}>{t}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Insights */}
              {garminAdjusted && (
                <>
                  {/* Summary */}
                  <div style={{ background: garminColor+"11", border: `1px solid ${garminColor}33`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: garminColor, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>🤖 AI Coach Analysis</div>
                    <div style={{ fontSize: 14, lineHeight: 1.65, color: C.text }}>{garminAdjusted.summary}</div>
                  </div>

                  {/* Warning flags */}
                  {garminAdjusted.warningFlags?.length > 0 && (
                    <div style={s.warnCard}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 6 }}>⚠️ FLAGS TO WATCH</div>
                      {garminAdjusted.warningFlags.map((f,i) => (
                        <div key={i} style={{ fontSize: 12, color: "#FCA5A5", marginBottom: 3 }}>• {f}</div>
                      ))}
                    </div>
                  )}

                  {/* Key insights */}
                  {garminAdjusted.keyInsights && (
                    <div style={s.card}>
                      <div style={s.secTitle}>Key Insights</div>
                      {garminAdjusted.keyInsights.map((ins, i) => {
                        const cols = ["#EF4444", C.blue, C.green, C.gold];
                        return (
                          <div key={i} style={s.insightCard(cols[i % cols.length])}>
                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                              <div style={{ fontSize: 22 }}>{ins.icon}</div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>{ins.title}</div>
                                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{ins.detail}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Plan adjustments */}
                  {garminAdjusted.planAdjustments && (
                    <div style={s.card}>
                      <div style={s.secTitle}>Plan Adjustments</div>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>AI-recommended changes based on your biometric data</div>
                      {garminAdjusted.planAdjustments.map((adj, i) => {
                        const typeInfo = {
                          intensity: { icon: "🏋️", col: C.accent,  label: "Intensity" },
                          recovery:  { icon: "😴", col: C.blue,    label: "Recovery" },
                          cardio:    { icon: "🏃", col: C.green,   label: "Cardio" },
                          nutrition: { icon: "🥗", col: C.gold,    label: "Nutrition" },
                        }[adj.type] || { icon: "💡", col: garminColor, label: adj.type };
                        return (
                          <div key={i} style={s.adjCard(typeInfo.col)}>
                            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <div style={{ fontSize: 18 }}>{typeInfo.icon}</div>
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: typeInfo.col, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{typeInfo.label}</div>
                                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{adj.recommendation}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {garminAdjusted.weeklyStructure && (
                        <div style={{ background: garminColor+"11", border: `1px solid ${garminColor}33`, borderRadius: 10, padding: 12, marginTop: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: garminColor, marginBottom: 4 }}>📅 WEEKLY STRUCTURE</div>
                          <div style={{ fontSize: 13, color: C.text }}>{garminAdjusted.weeklyStructure}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Re-analyse */}
                  <button onClick={() => garminData && analyseGarmin(garminData)} style={s.btn(garminColor)}>
                    🔄 Re-Analyse with Latest Profile
                  </button>
                </>
              )}
            </>
          )}

          {!garminData && !garminLoading && (
            <div style={{ ...s.card, textAlign: "center", padding: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⌚</div>
              <div style={{ color: C.muted, fontSize: 14 }}>No Garmin data uploaded yet.<br/>Upload a CSV above to unlock biometric-driven coaching.</div>
            </div>
          )}
        </div>
      )}

      {/* ══ HISTORY TAB ══════════════════════════════════════ */}
      {tab === "history" && (
        <div style={s.page}>
          <div style={s.secTitle}>Workout History</div>
          <div style={s.h1}>Your Progress</div>
          <div style={{ ...s.muted, marginBottom: 20 }}>{workoutLogs.length} sessions logged</div>
          {workoutLogs.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 36 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
              <div style={{ color: C.muted }}>No workouts logged yet. Start your first session from the Plan tab!</div>
            </div>
          ) : workoutLogs.map(log => (
            <div key={log.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={s.h3}>{log.dayName}</div>
                <span style={s.tag(C.accent)}>{log.tag}</span>
              </div>
              <div style={{ ...s.muted, fontSize: 12, marginBottom: 10 }}>{log.date}</div>
              {Object.entries(log.sets).map(([ex, sets]) => (
                <div key={ex} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{ex}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {sets.filter(s => s.reps || s.weight).map((set, i) => (
                      <span key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, color: C.muted }}>
                        Set {i+1}: {set.reps||"?"}r @ {set.weight||"?"}kg
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
