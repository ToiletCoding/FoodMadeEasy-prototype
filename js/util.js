// Date, number and string helpers shared by the engine and the UI.

const DAY_MS = 86400000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function isoDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
function diffDays(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / DAY_MS);
}
function weekday(iso) { return WEEKDAYS[parseISO(iso).getDay()]; }
function weekdayLong(iso) { return WEEKDAYS_LONG[parseISO(iso).getDay()]; }
function fmtDay(iso) {
  const d = parseISO(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function fmtShort(iso) {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function fmtRange(start) {
  return `${fmtShort(start)} – ${fmtShort(addDays(start, 6))}`;
}
function nextMonday(todayIso) {
  const dow = parseISO(todayIso).getDay();
  const delta = dow === 1 ? 0 : (8 - dow) % 7;
  return addDays(todayIso, delta);
}
function isoWeek(iso) {
  const d = parseISO(iso);
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / DAY_MS + 1) / 7);
}

function fmtNum(n) { return Math.round(n).toLocaleString('en-US'); }
function fmtKr(n) { return `${fmtNum(n)} kr`; }
function round5(g) { return Math.max(5, Math.round(g / 5) * 5); }
function fmtG(g) {
  if (g >= 1000) {
    const kg = Math.round(g / 50) * 50 / 1000;
    return `${kg.toFixed(2).replace(/\.?0+$/, '')} kg`;
  }
  return `${round5(g)} g`;
}
function fmtIngQty(id, g) {
  const ing = ING[id];
  if (ing.piece) {
    const n = Math.max(1, Math.round(g / ing.piece));
    return `${n} ${ing.pieceName}${n === 1 ? '' : 's'}`;
  }
  return fmtG(g);
}
function fmtDuration(min) {
  const m = Math.round(min / 5) * 5;
  if (m < 60) return `~${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `~${h}h ${r}m` : `~${h}h`;
}
function signed(n, unit = '') {
  const r = Math.round(n);
  if (r === 0) return `±0${unit}`;
  return `${r > 0 ? '+' : '−'}${Math.abs(r)}${unit}`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function combinations(arr, k) {
  const out = [];
  const rec = (start, pick) => {
    if (pick.length === k) { out.push(pick.slice()); return; }
    for (let i = start; i < arr.length; i++) { pick.push(arr[i]); rec(i + 1, pick); pick.pop(); }
  };
  if (k === 0) return [[]];
  rec(0, []);
  return out;
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function uid() { return Math.random().toString(36).slice(2, 10); }
