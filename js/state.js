// App state, persistence and derived "where is the user in the week" logic.

const STORE_KEY = 'fme-prototype-v1';
const APP_VERSION = 'Version 5b5c3d1 · 2026-09-27';
// Where testers' "Email feedback" goes. Empty = share/copy only (the app is public, so no address is baked in by default).
const FEEDBACK_EMAIL = '';

function defaultDraft() {
  return {
    goal: null, kcal: '', protein: '', carbs: '', fat: '',
    diet: 'none', dietOther: '', allergies: [], customAllergies: [], proteins: PROTEINS.map((p) => p.id), carbTypes: CARBS.map((c) => c.id), avoid: [], excludedRecipes: [],
    mealsPerDay: 4, budget: '', variety: 'balanced', effort: 'normal', prepMode: 'one',
    restOn: false, restKcal: '', trainingDays: [1, 2, 4, 5], ratings: {},
    stores: [], storeCap: 2, startDate: null,
  };
}

function exampleDraft() {
  return {
    ...defaultDraft(), goal: 'gain', kcal: '3200', protein: '190', carbs: '380', fat: '100',
    avoid: ['Mushrooms'], budget: '600', stores: ['rema', 'netto'],
  };
}

function defaultState() {
  return {
    user: null, // { email, method, name }
    accounts: {}, // email -> { pw, method, name }
    data: {}, // email -> { profile, plan, draft, lastPlan, prevPlan }
    onboarding: { step: null, draft: defaultDraft(), started: false },
    settings: { permission: 'unknown', primerShown: false, planning: true, planningTime: 'Sun 10:00', prep: true, prepTime: '14:00', fridge: true },
    dev: { dayOffset: 0, offline: false, failNext: false, noData: false },
  };
}

let S = defaultState();
try {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) S = { ...defaultState(), ...JSON.parse(raw) };
} catch (e) { /* storage unavailable: run in memory */ }

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}

function resetAll() {
  S = defaultState();
  save();
}

// Ephemeral UI state (never persisted).
const U = {
  route: { name: 'splash', props: {} },
  stack: [],
  sheet: null,
  dialog: null,
  toasts: [],
  gen: null,
  justChecked: {},
  collapsed: {},
  busy: false,
};

function today() {
  return isoDate(new Date(Date.now() + S.dev.dayOffset * DAY_MS));
}
function tomorrow() { return addDays(today(), 1); }
function online() { return navigator.onLine !== false && !S.dev.offline; }

function acct() {
  if (!S.user) return null;
  if (!S.data[S.user.email]) S.data[S.user.email] = { profile: null, plan: null, draft: null, lastPlan: null, prevPlan: null };
  return S.data[S.user.email];
}

function planEnd(plan) { return addDays(plan.start, 6); }
function inPlan(plan, iso) { return plan && iso >= plan.start && iso <= planEnd(plan); }

// Archive plans whose last day has passed.
function housekeeping() {
  const a = acct();
  if (!a) return;
  const t = today();
  if (a.prevPlan && t > planEnd(a.prevPlan)) { a.lastPlan = a.prevPlan; a.prevPlan = null; }
  if (a.plan && t > planEnd(a.plan)) { a.lastPlan = a.plan; a.plan = null; }
  if (a.draft && t > planEnd(a.draft)) a.draft = null;
  Object.values(S.data).forEach((d) => {
    const p = d.plan;
    if (!p) return;
    Object.keys(p.shop.isNew || {}).forEach((k) => { if (Date.now() - p.shop.isNew[k] > DAY_MS) delete p.shop.isNew[k]; });
  });
}

// Maps product state to the Home variant (spec §B5).
function homeState() {
  const a = acct();
  if (!a || !a.profile) return 'none';
  if (U.gen && U.gen.running) return 'H2';
  if (a.draft) return 'H1';
  const p = a.plan;
  if (!p) return 'H0';
  const t = today();
  const daysLeft = diffDays(t, planEnd(p));
  if (daysLeft <= 2 && t >= p.start) return 'H8';
  if (allPrepped(p)) return 'H7';
  if (p.prep.step > 0) return 'H6';
  if (twoSessions(p) && p.prep.session === 1) return t >= midweekDate(p) ? 'H5' : 'H7';
  const sl = Engine.shoppingList(p, t);
  if (sl.count && sl.done >= sl.count) return 'H5';
  if (sl.done > 0) return 'H4';
  return 'H3';
}

function todaysPlan() {
  const a = acct();
  if (!a) return null;
  const t = today();
  return [a.plan, a.prevPlan].find((p) => inPlan(p, t)) || null;
}

// Meal prep sessions: "one" = single session + freezer; "two" = Sun (Mon–Wed) + Wed (Thu–Sun), fridge only.
function twoSessions(p) { return p.profile.prepMode === 'two'; }
function curSession(p) { return twoSessions(p) ? (p.prep.session || 0) : null; }
function allPrepped(p) { return !!p.prep.done && (!twoSessions(p) || p.prep.session === 1); }
function anyPrepped(p) { return !!p.prep.done || (twoSessions(p) && p.prep.session === 1); }
function midweekDate(p) { return addDays(p.start, 2); }
function mealPrepped(p, d) {
  if (!twoSessions(p)) return !!p.prep.done;
  return d <= 2 ? anyPrepped(p) : allPrepped(p);
}

function finalizeProfile(d) {
  const rest = d.restOn && Number(d.restKcal) >= 1200;
  return {
    ...d,
    restKcal: rest ? Number(d.restKcal) : null,
    trainingDays: d.trainingDays || [1, 2, 4, 5],
    ratings: d.ratings || {},
    kcal: Number(d.kcal), protein: Number(d.protein), carbs: Number(d.carbs), fat: Number(d.fat),
    budget: Number(d.budget), mealsPerDay: Number(d.mealsPerDay),
    startDate: d.startDate || nextMonday(today()),
  };
}
