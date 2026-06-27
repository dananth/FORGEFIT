import { useState, useEffect } from "react";

const STORAGE_KEY = "fitness_coach_data";

// ── tiny palette ──────────────────────────────────────────────
const C = {
  bg: "#0A0A0F",
  surface: "#13131A",
  card: "#1C1C27",
  border: "#2A2A3D",
  accent: "#FF4D00",       // electric orange
  accentDim: "#FF4D0022",
  accentMid: "#FF4D0055",
  gold: "#F5C842",
  text: "#F0EEF8",
  muted: "#7A7A9A",
  green: "#22C55E",
  blue: "#3B82F6",
};

const px = (style) => ({ ...style });

// ── QUESTIONS ──────────────────────────────────────────────────
const QUESTIONS = [
  { id: "name",       label: "What's your name?",                                       type: "text",   placeholder: "e.g. Alex" },
  { id: "age",        label: "How old are you?",                                         type: "number", placeholder: "e.g. 28",   unit: "yrs" },
  { id: "gender",     label: "What's your biological sex?",                              type: "select", options: ["Male","Female"] },
  { id: "height",     label: "What's your height?",                                     type: "number", placeholder: "e.g. 175",  unit: "cm" },
  { id: "weight",     label: "What's your current weight?",                              type: "number", placeholder: "e.g. 85",   unit: "kg" },
  { id: "target",     label: "What's your target weight?",                               type: "number", placeholder: "e.g. 75",   unit: "kg" },
  { id: "goal",       label: "What's your primary goal?",                                type: "select", options: ["Fat Loss","Muscle Building","Body Recomposition"] },
  { id: "level",      label: "What's your training experience?",                         type: "select", options: ["Beginner (< 1 yr)","Intermediate (1-3 yrs)","Advanced (3+ yrs)"] },
  { id: "equipment",  label: "What equipment do you have access to?",                    type: "select", options: ["Full Gym","Dumbbells Only","Resistance Bands","Bodyweight Only"] },
  { id: "days",       label: "How many days per week can you train? (You can adjust later)", type: "select", options: ["2","3","4","5","6"] },
  { id: "sessionLen", label: "How long is your typical session?",                        type: "select", options: ["30 min","45 min","60 min","75+ min"] },
  { id: "injuries",   label: "Any injuries or limitations? (type 'none' if not)",        type: "text",   placeholder: "e.g. bad knees, shoulder impingement" },
];

// ── WORKOUT TEMPLATES ──────────────────────────────────────────
function buildPlan(profile) {
  const days = parseInt(profile.days);
  const isBeginner = profile.level.startsWith("Beginner");
  const isAdvanced = profile.level.startsWith("Advanced");
  const isLoss = profile.goal === "Fat Loss";
  const isBuild = profile.goal === "Muscle Building";
  const isRecomp = profile.goal === "Body Recomposition";

  // Rep/set scheme
  const scheme = isBuild
    ? { sets: "4", reps: "6-10", rest: "90-120s", note: "Heavier loads, progressive overload focus" }
    : isLoss
    ? { sets: "3", reps: "12-15", rest: "45-60s", note: "Higher reps, shorter rest to elevate HR" }
    : { sets: "3-4", reps: "8-12", rest: "60-90s", note: "Balanced for strength + conditioning" };

  // Weight guidance
  const weightGuide = isBeginner
    ? "Start at 50-60% of the weight where form breaks down. Add 2.5kg per week if all sets feel easy."
    : isAdvanced
    ? "Work at 70-85% 1RM. Use RPE 8-9 on final sets. Deload every 4th week."
    : "Work at 65-75% 1RM. Increase weight when you hit the top of your rep range with good form.";

  const exercises = {
    chest: [
      { name: "Barbell Bench Press", muscle: "Chest", reps: scheme.reps, sets: scheme.sets, weight: "Bodyweight → 60-100kg", youtube: "https://www.youtube.com/results?search_query=bench+press+form+technique", tip: "Retract scapulae, arch naturally, bar to nipple line" },
      { name: "Incline Dumbbell Press", muscle: "Upper Chest", reps: scheme.reps, sets: scheme.sets, weight: "10-30kg DB", youtube: "https://www.youtube.com/results?search_query=incline+dumbbell+press+form", tip: "30-45° incline, elbows at 75°, full stretch at bottom" },
      { name: "Cable Flyes", muscle: "Chest isolation", reps: "12-15", sets: "3", weight: "5-15kg per side", youtube: "https://www.youtube.com/results?search_query=cable+fly+technique", tip: "Slight elbow bend, squeeze at peak contraction" },
    ],
    back: [
      { name: "Barbell Deadlift", muscle: "Full back + hamstrings", reps: isBuild ? "4-6" : "8-10", sets: scheme.sets, weight: "60-180kg", youtube: "https://www.youtube.com/results?search_query=deadlift+form+tutorial", tip: "Hip hinge, bar close to shins, brace core hard" },
      { name: "Pull-Ups / Lat Pulldown", muscle: "Lats, Biceps", reps: scheme.reps, sets: scheme.sets, weight: "BW / 40-80kg", youtube: "https://www.youtube.com/results?search_query=pull+up+lat+pulldown+technique", tip: "Full ROM, dead hang to chest, retract shoulder blades" },
      { name: "Seated Cable Row", muscle: "Mid back, Rhomboids", reps: scheme.reps, sets: scheme.sets, weight: "40-80kg", youtube: "https://www.youtube.com/results?search_query=seated+cable+row+form", tip: "Drive elbows back, pause at contraction, no jerking" },
    ],
    legs: [
      { name: "Barbell Back Squat", muscle: "Quads, Glutes", reps: scheme.reps, sets: scheme.sets, weight: "40-120kg", youtube: "https://www.youtube.com/results?search_query=squat+form+tutorial", tip: "Knees track toes, hit depth, chest tall throughout" },
      { name: "Romanian Deadlift", muscle: "Hamstrings, Glutes", reps: "10-12", sets: "3-4", weight: "40-100kg", youtube: "https://www.youtube.com/results?search_query=romanian+deadlift+form", tip: "Hinge at hips, soft knee, bar drags down legs" },
      { name: "Leg Press", muscle: "Quads", reps: scheme.reps, sets: scheme.sets, weight: "80-200kg (plate)", youtube: "https://www.youtube.com/results?search_query=leg+press+form+technique", tip: "Feet shoulder-width, don't lock knees at top" },
      { name: "Calf Raises", muscle: "Calves", reps: "15-20", sets: "3", weight: "BW + 20-50kg", youtube: "https://www.youtube.com/results?search_query=calf+raises+technique", tip: "Full ROM, 2-second squeeze at top, slow descent" },
    ],
    shoulders: [
      { name: "Overhead Press (BB or DB)", muscle: "Front & Lateral Delt", reps: scheme.reps, sets: scheme.sets, weight: "20-70kg", youtube: "https://www.youtube.com/results?search_query=overhead+press+form+technique", tip: "Lock core, slight layback, bar overhead not forward" },
      { name: "Lateral Raises", muscle: "Lateral Delt", reps: "12-20", sets: "3-4", weight: "5-20kg DB", youtube: "https://www.youtube.com/results?search_query=lateral+raise+form+technique", tip: "Lead with elbows, slight forward lean, no swinging" },
      { name: "Face Pulls", muscle: "Rear Delt, Rotator Cuff", reps: "15-20", sets: "3", weight: "10-30kg", youtube: "https://www.youtube.com/results?search_query=face+pull+form+technique", tip: "Pull to forehead height, external rotation at end" },
    ],
    arms: [
      { name: "Barbell Curl", muscle: "Biceps", reps: scheme.reps, sets: "3", weight: "15-45kg", youtube: "https://www.youtube.com/results?search_query=barbell+curl+technique", tip: "No swinging, supinate at top, full stretch" },
      { name: "Tricep Pushdown", muscle: "Triceps", reps: scheme.reps, sets: "3", weight: "20-50kg", youtube: "https://www.youtube.com/results?search_query=tricep+pushdown+technique", tip: "Elbows glued to sides, fully extend, controlled return" },
      { name: "Hammer Curls", muscle: "Brachialis, Forearm", reps: "10-12", sets: "3", weight: "10-25kg DB", youtube: "https://www.youtube.com/results?search_query=hammer+curl+form", tip: "Neutral grip, slow eccentric" },
    ],
    core: [
      { name: "Plank", muscle: "Core", reps: "45-60s hold", sets: "3", weight: "BW", youtube: "https://www.youtube.com/results?search_query=plank+form+core", tip: "Neutral spine, glutes squeezed, breathe steadily" },
      { name: "Cable Crunches", muscle: "Abs", reps: "15-20", sets: "3", weight: "20-50kg", youtube: "https://www.youtube.com/results?search_query=cable+crunch+technique", tip: "Flex spine, don't pull with arms, focus on abs" },
    ],
  };

  // ── Day structures based on frequency ──────────────────────────
  const structures = {
    2: [
      { name: "Full Body A", focus: ["chest","back","legs","core"], tag: "Full Body", color: C.accent },
      { name: "Full Body B", focus: ["shoulders","back","legs","arms"], tag: "Full Body", color: C.gold },
    ],
    3: [
      { name: "Push Day", focus: ["chest","shoulders","arms"], tag: "Push", color: C.accent },
      { name: "Pull Day", focus: ["back","arms"], tag: "Pull", color: C.blue },
      { name: "Leg Day", focus: ["legs","core"], tag: "Legs", color: C.green },
    ],
    4: [
      { name: "Upper A (Push)", focus: ["chest","shoulders"], tag: "Push", color: C.accent },
      { name: "Lower A", focus: ["legs","core"], tag: "Legs", color: C.green },
      { name: "Upper B (Pull)", focus: ["back","arms"], tag: "Pull", color: C.blue },
      { name: "Lower B", focus: ["legs","core"], tag: "Legs", color: C.gold },
    ],
    5: [
      { name: "Chest + Triceps", focus: ["chest","arms"], tag: "Push", color: C.accent },
      { name: "Back + Biceps", focus: ["back","arms"], tag: "Pull", color: C.blue },
      { name: "Leg Day", focus: ["legs","core"], tag: "Legs", color: C.green },
      { name: "Shoulders + Arms", focus: ["shoulders","arms"], tag: "Shoulders", color: C.gold },
      { name: "Full Body Burn", focus: ["chest","back","legs","core"], tag: "Full Body", color: "#A855F7" },
    ],
    6: [
      { name: "Chest", focus: ["chest","core"], tag: "Chest", color: C.accent },
      { name: "Back", focus: ["back"], tag: "Back", color: C.blue },
      { name: "Legs", focus: ["legs"], tag: "Legs", color: C.green },
      { name: "Shoulders", focus: ["shoulders"], tag: "Shoulders", color: C.gold },
      { name: "Arms", focus: ["arms","core"], tag: "Arms", color: "#A855F7" },
      { name: "Full Body / Weak Points", focus: ["chest","back","legs"], tag: "Full Body", color: "#EC4899" },
    ],
  };

  const workoutDays = structures[days] || structures[3];

  // Quick fallback (20-25 min)
  const quickFallback = [
    { name: "Push-Ups", muscle: "Chest, Triceps", reps: "3×15", sets: "3", weight: "BW", youtube: "https://www.youtube.com/results?search_query=push+up+form+technique", tip: "Full ROM, controlled descent" },
    { name: "Dumbbell Rows", muscle: "Back", reps: "3×12 per side", sets: "3", weight: "10-25kg", youtube: "https://www.youtube.com/results?search_query=dumbbell+row+form", tip: "Brace core, elbow drives back" },
    { name: "Goblet Squat", muscle: "Legs, Glutes", reps: "3×15", sets: "3", weight: "10-30kg DB", youtube: "https://www.youtube.com/results?search_query=goblet+squat+form", tip: "Chest tall, deep squat, elbows inside knees" },
    { name: "DB Shoulder Press", muscle: "Shoulders", reps: "3×12", sets: "3", weight: "8-20kg", youtube: "https://www.youtube.com/results?search_query=dumbbell+shoulder+press+form", tip: "Slight forward lean, press overhead" },
    { name: "Plank", muscle: "Core", reps: "3×45s", sets: "3", weight: "BW", youtube: "https://www.youtube.com/results?search_query=plank+form", tip: "Neutral spine, steady breathing" },
  ];

  return { workoutDays, exercises, scheme, weightGuide, quickFallback };
}

// ── BMI + TDEE helper ──────────────────────────────────────────
function calcStats(profile) {
  const h = parseFloat(profile.height) / 100;
  const w = parseFloat(profile.weight);
  const age = parseFloat(profile.age);
  const isMale = profile.gender === "Male";
  if (!h || !w || !age) return null;
  const bmi = (w / (h * h)).toFixed(1);
  // Mifflin-St Jeor
  const bmr = isMale
    ? 10 * w + 6.25 * parseFloat(profile.height) - 5 * age + 5
    : 10 * w + 6.25 * parseFloat(profile.height) - 5 * age - 161;
  const days = parseInt(profile.days) || 3;
  const actMulti = days <= 2 ? 1.375 : days <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(bmr * actMulti);
  const target = profile.goal === "Fat Loss" ? tdee - 400 : profile.goal === "Muscle Building" ? tdee + 250 : tdee - 100;
  return { bmi, tdee, target };
}

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function FitnessCoach() {
  const [phase, setPhase] = useState("onboard");   // onboard | plan | log | history
  const [qIndex, setQIndex] = useState(0);
  const [profile, setProfile] = useState({});
  const [inputVal, setInputVal] = useState("");
  const [plan, setPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showQuick, setShowQuick] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [logSession, setLogSession] = useState(null);  // active logging session
  const [logSets, setLogSets] = useState({});           // exName → [{reps,weight}]
  const [toast, setToast] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

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
          setPhase("plan");
        }
      }
    } catch (_) {}
  }, []);

  function persist(prof, pl, logs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: prof, plan: pl, logs })); } catch (_) {}
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  // ── Onboarding flow ────────────────────────────────────────
  const currentQ = QUESTIONS[qIndex];

  function nextQ() {
    const val = inputVal.trim();
    if (!val) return;
    const newProfile = { ...profile, [currentQ.id]: val };
    setProfile(newProfile);
    setInputVal("");
    if (qIndex + 1 >= QUESTIONS.length) {
      // Build plan
      const built = buildPlan(newProfile);
      setPlan(built);
      persist(newProfile, built, workoutLogs);
      setPhase("plan");
    } else {
      setQIndex(qIndex + 1);
    }
  }

  // ── Ask AI coach ────────────────────────────────────────────
  async function askAI(question) {
    setLoadingAI(true);
    setAiResponse("");
    const stats = calcStats(profile);
    const systemPrompt = `You are an elite personal trainer and nutritionist. The user's profile:
Name: ${profile.name}, Age: ${profile.age}, Gender: ${profile.gender}
Height: ${profile.height}cm, Weight: ${profile.weight}kg, Target: ${profile.target}kg
Goal: ${profile.goal}, Level: ${profile.level}, Equipment: ${profile.equipment}
Training days/week: ${profile.days}, Session length: ${profile.sessionLen}
Injuries: ${profile.injuries}
TDEE: ~${stats?.tdee} kcal, Target calories: ~${stats?.target} kcal
Give concise, actionable advice in 3-5 sentences. Use specific numbers and examples where possible.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: question }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "Sorry, couldn't get a response.";
      setAiResponse(text);
    } catch (e) {
      setAiResponse("Network error. Please try again.");
    }
    setLoadingAI(false);
  }

  // ── Adjust days ────────────────────────────────────────────
  function adjustDays(d) {
    const newProfile = { ...profile, days: String(d) };
    const built = buildPlan(newProfile);
    setProfile(newProfile);
    setPlan(built);
    setSelectedDay(0);
    persist(newProfile, built, workoutLogs);
    showToast(`Plan updated to ${d} days/week`);
  }

  // ── Workout logging ────────────────────────────────────────
  function startLog(dayObj) {
    setLogSession({ day: dayObj, date: new Date().toISOString(), sets: {} });
    setLogSets({});
    setPhase("log");
  }

  function updateSet(exName, idx, field, value) {
    setLogSets(prev => {
      const sets = prev[exName] ? [...prev[exName]] : [];
      while (sets.length <= idx) sets.push({ reps: "", weight: "" });
      sets[idx] = { ...sets[idx], [field]: value };
      return { ...prev, [exName]: sets };
    });
  }

  function addSet(exName) {
    setLogSets(prev => {
      const sets = prev[exName] ? [...prev[exName]] : [];
      sets.push({ reps: "", weight: "" });
      return { ...prev, [exName]: sets };
    });
  }

  function finishLog() {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      dayName: logSession.day.name,
      tag: logSession.day.tag,
      sets: logSets,
    };
    const newLogs = [entry, ...workoutLogs];
    setWorkoutLogs(newLogs);
    persist(profile, plan, newLogs);
    setPhase("plan");
    showToast("Workout logged! 💪");
  }

  // ── Reset ──────────────────────────────────────────────────
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setPhase("onboard");
    setQIndex(0);
    setProfile({});
    setInputVal("");
    setPlan(null);
    setWorkoutLogs([]);
    setAiResponse("");
  }

  // ══ RENDER ══════════════════════════════════════════════════
  const s = {
    app: { background: C.bg, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: C.text, padding: "0 0 80px 0" },
    topBar: { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px", color: C.text },
    logoAccent: { color: C.accent },
    nav: { display: "flex", gap: 8 },
    navBtn: (active) => ({ background: active ? C.accentDim : "transparent", border: `1px solid ${active ? C.accent : C.border}`, color: active ? C.accent : C.muted, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all .2s" }),
    page: { maxWidth: 720, margin: "0 auto", padding: "24px 16px" },
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: 700, letterSpacing: 2, color: C.accent, textTransform: "uppercase", marginBottom: 16 },
    h1: { fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 },
    h2: { fontSize: 20, fontWeight: 700, marginBottom: 12 },
    h3: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
    muted: { color: C.muted, fontSize: 14 },
    btn: (color = C.accent) => ({ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginTop: 12 }),
    btnSm: (color = C.accent, outline = false) => ({ background: outline ? "transparent" : color, color: outline ? color : "#fff", border: `2px solid ${color}`, borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
    input: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", color: C.text, fontSize: 16, width: "100%", outline: "none", boxSizing: "border-box" },
    tag: (color) => ({ background: color + "22", color, border: `1px solid ${color + "44"}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 700, display: "inline-block" }),
    exCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 10 },
    pill: (color = C.accent) => ({ background: color + "22", color, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, display: "inline-block", marginRight: 6 }),
    quickBanner: { background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}11)`, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
    statGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 },
    statCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, textAlign: "center" },
    statVal: { fontSize: 22, fontWeight: 800, color: C.accent },
    statLabel: { fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 2 },
    logRow: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
    logInput: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 14, flex: 1 },
    dayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 },
    dayCard: (active, color) => ({ background: active ? color + "22" : C.surface, border: `2px solid ${active ? color : C.border}`, borderRadius: 12, padding: "14px 10px", textAlign: "center", cursor: "pointer", transition: "all .2s" }),
    aiBubble: { background: `linear-gradient(135deg, #3B82F622, #3B82F611)`, border: `1px solid ${C.blue}44`, borderRadius: 12, padding: 16, marginTop: 12 },
    toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.green, color: "#fff", padding: "12px 24px", borderRadius: 50, fontWeight: 700, fontSize: 14, zIndex: 999, whiteSpace: "nowrap" },
  };

  const stats = plan ? calcStats(profile) : null;

  // ══ ONBOARDING ══════════════════════════════════════════════
  if (phase === "onboard") {
    const progress = ((qIndex) / QUESTIONS.length) * 100;
    return (
      <div style={s.app}>
        <div style={s.topBar}>
          <div style={s.logo}><span style={s.logoAccent}>FORGE</span>FIT</div>
          <div style={{ fontSize: 13, color: C.muted }}>{qIndex + 1} of {QUESTIONS.length}</div>
        </div>
        <div style={s.page}>
          {/* Progress */}
          <div style={{ background: C.surface, borderRadius: 4, height: 4, marginBottom: 32, overflow: "hidden" }}>
            <div style={{ background: C.accent, height: "100%", width: `${progress}%`, borderRadius: 4, transition: "width .4s" }} />
          </div>

          <div style={s.card}>
            <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Question {qIndex + 1}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, lineHeight: 1.3 }}>{currentQ.label}</div>

            {currentQ.type === "select" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {currentQ.options.map(opt => (
                  <button key={opt} onClick={() => { setInputVal(opt); setTimeout(() => { const e = { target: { value: opt } }; setInputVal(opt); }, 0); }}
                    style={{ ...s.input, background: inputVal === opt ? C.accentDim : C.surface, border: `2px solid ${inputVal === opt ? C.accent : C.border}`, textAlign: "left", cursor: "pointer", color: C.text, fontWeight: inputVal === opt ? 700 : 400 }}>
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  style={s.input}
                  type={currentQ.type}
                  placeholder={currentQ.placeholder}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && nextQ()}
                  autoFocus
                />
                {currentQ.unit && <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 14 }}>{currentQ.unit}</span>}
              </div>
            )}

            <button style={s.btn()} onClick={nextQ} disabled={!inputVal.trim()}>
              {qIndex + 1 >= QUESTIONS.length ? "Build My Plan →" : "Next →"}
            </button>
          </div>

          {qIndex > 0 && (
            <button onClick={() => { setQIndex(qIndex - 1); setInputVal(profile[QUESTIONS[qIndex - 1].id] || ""); }}
              style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, padding: "8px 0" }}>
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══ WORKOUT LOG SESSION ════════════════════════════════════
  if (phase === "log" && logSession) {
    const day = logSession.day;
    const exList = day.focus.flatMap(f => plan.exercises[f] || []);

    return (
      <div style={s.app}>
        <div style={s.topBar}>
          <div style={s.logo}><span style={s.logoAccent}>FORGE</span>FIT</div>
          <button onClick={() => setPhase("plan")} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 14 }}>✕ Cancel</button>
        </div>
        <div style={s.page}>
          <div style={s.sectionTitle}>Logging Workout</div>
          <div style={s.h1}>{day.name}</div>
          <div style={{ ...s.muted, marginBottom: 24 }}>{new Date().toDateString()}</div>

          {exList.map(ex => {
            const sets = logSets[ex.name] || [{ reps: "", weight: "" }];
            return (
              <div key={ex.name} style={s.card}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={s.h3}>{ex.name}</div>
                  <a href={ex.youtube} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>▶ FORM</a>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Target: {ex.sets} sets × {ex.reps} | {ex.weight}</div>

                <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>SET</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>REPS</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>WEIGHT (kg)</div>
                </div>
                {sets.map((set, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr", gap: 8, marginBottom: 6 }}>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 14, paddingTop: 8 }}>{i + 1}</div>
                    <input style={s.logInput} placeholder="e.g. 10" type="number" value={set.reps} onChange={e => updateSet(ex.name, i, "reps", e.target.value)} />
                    <input style={s.logInput} placeholder="e.g. 60" type="number" value={set.weight} onChange={e => updateSet(ex.name, i, "weight", e.target.value)} />
                  </div>
                ))}
                <button onClick={() => addSet(ex.name)} style={{ ...s.btnSm(C.muted, true), marginTop: 4 }}>+ Add Set</button>
              </div>
            );
          })}

          <button style={s.btn(C.green)} onClick={finishLog}>✓ Finish & Save Workout</button>
        </div>
      </div>
    );
  }

  // ══ HISTORY PAGE ════════════════════════════════════════════
  if (phase === "history") {
    return (
      <div style={s.app}>
        <div style={s.topBar}>
          <div style={s.logo}><span style={s.logoAccent}>FORGE</span>FIT</div>
          <div style={s.nav}>
            <button style={s.navBtn(false)} onClick={() => setPhase("plan")}>Plan</button>
            <button style={s.navBtn(true)}>History</button>
          </div>
        </div>
        <div style={s.page}>
          <div style={s.sectionTitle}>Workout History</div>
          <div style={s.h1}>Your Progress</div>
          <div style={{ ...s.muted, marginBottom: 24 }}>{workoutLogs.length} sessions logged</div>

          {workoutLogs.length === 0 ? (
            <div style={{ ...s.card, textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ color: C.muted }}>No workouts logged yet. Start your first session!</div>
            </div>
          ) : workoutLogs.map(log => (
            <div key={log.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={s.h3}>{log.dayName}</div>
                <span style={s.tag(C.accent)}>{log.tag}</span>
              </div>
              <div style={{ ...s.muted, fontSize: 13, marginBottom: 12 }}>{log.date}</div>
              {Object.entries(log.sets).map(([ex, sets]) => (
                <div key={ex} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ex}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {sets.filter(s => s.reps || s.weight).map((set, i) => (
                      <span key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, color: C.muted }}>
                        Set {i + 1}: {set.reps || "?"} reps @ {set.weight || "?"}kg
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ══ PLAN PAGE ═══════════════════════════════════════════════
  if (phase !== "plan" || !plan) return null;

  const dayObj = plan.workoutDays[selectedDay];
  const exForDay = dayObj.focus.flatMap(f => plan.exercises[f] || []);

  return (
    <div style={s.app}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.topBar}>
        <div style={s.logo}><span style={s.logoAccent}>FORGE</span>FIT</div>
        <div style={s.nav}>
          <button style={s.navBtn(true)}>Plan</button>
          <button style={s.navBtn(false)} onClick={() => setPhase("history")}>History ({workoutLogs.length})</button>
          <button style={{ ...s.navBtn(false), borderColor: "#FF4D4444", color: "#FF6666" }} onClick={reset}>Reset</button>
        </div>
      </div>

      <div style={s.page}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={s.sectionTitle}>Your Plan</div>
          <div style={s.h1}>Hey, {profile.name} 👋</div>
          <div style={s.muted}>{profile.goal} · {profile.days} days/week · {profile.level}</div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={s.statGrid}>
            <div style={s.statCard}>
              <div style={s.statVal}>{stats.bmi}</div>
              <div style={s.statLabel}>BMI</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statVal, color: C.gold }}>{stats.tdee}</div>
              <div style={s.statLabel}>TDEE (kcal)</div>
            </div>
            <div style={s.statCard}>
              <div style={{ ...s.statVal, color: C.green }}>{stats.target}</div>
              <div style={s.statLabel}>Target (kcal)</div>
            </div>
          </div>
        )}

        {/* Adjust days */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Weekly Frequency</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[2,3,4,5,6].map(d => (
              <button key={d} onClick={() => adjustDays(d)}
                style={{ background: parseInt(profile.days) === d ? C.accent : C.surface, color: parseInt(profile.days) === d ? "#fff" : C.muted, border: `1px solid ${parseInt(profile.days) === d ? C.accent : C.border}`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                {d}×
              </button>
            ))}
          </div>
          <div style={{ ...s.muted, marginTop: 8, fontSize: 12 }}>{plan.scheme.note}</div>
        </div>

        {/* Quick fallback banner */}
        <div style={s.quickBanner}>
          <div>
            <div style={{ fontWeight: 700, color: C.gold, marginBottom: 2 }}>⚡ Short on time?</div>
            <div style={{ fontSize: 13, color: C.muted }}>20-min express workout — all you need</div>
          </div>
          <button onClick={() => setShowQuick(!showQuick)} style={s.btnSm(C.gold, !showQuick)}>
            {showQuick ? "Hide Quick Plan" : "Show Quick Plan"}
          </button>
        </div>

        {/* Quick workout */}
        {showQuick && (
          <div style={{ ...s.card, border: `1px solid ${C.gold}44`, marginTop: -6 }}>
            <div style={{ ...s.sectionTitle, color: C.gold }}>⚡ 20-Min Express</div>
            <div style={{ ...s.muted, marginBottom: 12, fontSize: 13 }}>3 sets each · 30-45s rest · keep moving</div>
            {plan.quickFallback.map(ex => (
              <div key={ex.name} style={{ ...s.exCard, borderLeft: `3px solid ${C.gold}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{ex.name}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{ex.muscle}</div>
                  </div>
                  <a href={ex.youtube} target="_blank" rel="noopener noreferrer"
                    style={{ background: C.gold + "22", color: C.gold, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                    ▶ FORM
                  </a>
                </div>
                <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={s.pill(C.gold)}>{ex.reps}</span>
                  <span style={s.pill(C.muted)}>{ex.weight}</span>
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: C.muted, fontStyle: "italic" }}>💡 {ex.tip}</div>
              </div>
            ))}
          </div>
        )}

        {/* Day selector */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Select Workout Day</div>
          <div style={s.dayGrid}>
            {plan.workoutDays.map((day, i) => (
              <div key={i} style={s.dayCard(selectedDay === i, day.color)} onClick={() => setSelectedDay(i)}>
                <div style={{ fontSize: 11, fontWeight: 700, color: day.color, marginBottom: 4 }}>{day.tag}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{day.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercises for selected day */}
        <div style={s.card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={s.sectionTitle}>{dayObj.tag}</div>
              <div style={s.h2}>{dayObj.name}</div>
            </div>
            <button onClick={() => startLog(dayObj)} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Log This →
            </button>
          </div>

          {/* Scheme */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div><span style={{ color: C.muted, fontSize: 12 }}>Sets </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.sets}</span></div>
            <div><span style={{ color: C.muted, fontSize: 12 }}>Reps </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.reps}</span></div>
            <div><span style={{ color: C.muted, fontSize: 12 }}>Rest </span><span style={{ fontWeight: 700, color: C.accent }}>{plan.scheme.rest}</span></div>
          </div>

          {exForDay.map((ex, i) => (
            <div key={i} style={{ ...s.exCard, borderLeft: `3px solid ${dayObj.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{ex.muscle}</div>
                </div>
                <a href={ex.youtube} target="_blank" rel="noopener noreferrer"
                  style={{ background: "#FF000022", color: "#FF4444", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                  ▶ YouTube
                </a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                <span style={s.pill()}>{ex.sets} sets</span>
                <span style={s.pill(C.blue)}>{ex.reps} reps</span>
                <span style={s.pill(C.muted)}>{ex.weight}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>💡 {ex.tip}</div>
            </div>
          ))}

          {/* Weight guide */}
          <div style={{ background: C.accentDim, border: `1px solid ${C.accentMid}`, borderRadius: 10, padding: 12, marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, marginBottom: 4 }}>📊 WEIGHT PROGRESSION</div>
            <div style={{ fontSize: 13, color: C.muted }}>{plan.weightGuide}</div>
          </div>
        </div>

        {/* AI Coach */}
        <div style={s.card}>
          <div style={s.sectionTitle}>AI Coach</div>
          <div style={s.h3}>Ask Your Coach</div>
          <div style={{ ...s.muted, marginBottom: 12, fontSize: 13 }}>Get personalised advice based on your profile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {[
              "What should I eat to hit my goal?",
              "How do I break through a plateau?",
              "How do I track progressive overload?",
              "What supplements should I consider?",
            ].map(q => (
              <button key={q} onClick={() => askAI(q)}
                style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", color: C.text, textAlign: "left", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                {q}
              </button>
            ))}
          </div>
          {loadingAI && (
            <div style={{ color: C.muted, fontSize: 14, padding: "12px 0" }}>🤔 Coach is thinking...</div>
          )}
          {aiResponse && !loadingAI && (
            <div style={s.aiBubble}>
              <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, marginBottom: 8 }}>🏋️ YOUR COACH SAYS</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: C.text }}>{aiResponse}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
