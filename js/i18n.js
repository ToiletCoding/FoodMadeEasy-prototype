// Danish/English. Screens are written in English; this layer translates each rendered
// screen's text. A text segment is matched by:
//   1. exact phrase                                   "Open Shopping List"
//   2. template with numbers {n} and names {s}        "{n} items · {n} stores · {n} kr est."
// Names are recipes, ingredients, meal parts, slots, weekdays and months; each is translated
// through NAMES_DA. Numbers are reformatted Danish style (3,200 → 3.200, 1.5 → 1,5).
// Untranslated segments are collected in window.__i18nMissing for development.

function lang() { return (typeof S !== 'undefined' && S.lang) || 'da'; }

const I18N = { phrases: {}, templates: {}, names: {} };
window.__i18nMissing = new Map();

function daNum(s) {
  // English-formatted number → Danish.
  return s.replace(/,/g, '\u0000').replace(/\./g, ',').replace(/\u0000/g, '.');
}

let nameRe = null;
let nameReSize = 0;
function namePattern() {
  const keys = Object.keys(I18N.names);
  if (!nameRe || keys.length !== nameReSize) {
    nameReSize = keys.length;
    const alt = keys.sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    nameRe = alt ? new RegExp(`(?<![\\p{L}])(${alt})(?![\\p{L}])`, 'gu') : null;
  }
  return nameRe;
}

const NUM_RE = /[−+-]?\d+(?:[.,]\d+)*/g;
// Durations from fmtDuration(): "~1h 20m", "~45 min", "1h"
const DUR_RE = /~?\d+h(?: \d+m)?|~?\d+ min\b/g;
const SKIP = '\u2063'; // text already in the target language (e.g. Danish recipe steps)

function daDuration(s) {
  return s.replace(/(\d+)h(?: (\d+)m)?/, (m, h, mm) => (mm ? `${h} t ${mm} min` : `${h} t`));
}

// Pick the Danish variant of a data field when there is one: tx(recipe, 'steps').
function tx(o, k) {
  const v = lang() === 'da' && o && o[`${k}_da`];
  if (!v) return o ? o[k] : undefined;
  return Array.isArray(v) ? v.map((x) => SKIP + x) : SKIP + v;
}

function fillTemplate(tpl, names, nums, durs = []) {
  let si = 0, ni = 0, di = 0;
  return tpl.replace(/\{(s|n|d)(\d*)\}/g, (m, kind, idx) => {
    if (kind === 's') { const v = idx ? names[idx - 1] : names[si++]; return v == null ? '' : (I18N.names[v] || v); }
    if (kind === 'd') { const v = idx ? durs[idx - 1] : durs[di++]; return v == null ? '' : daDuration(v); }
    const v = idx ? nums[idx - 1] : nums[ni++];
    return v == null ? '' : daNum(v);
  });
}

function trText(text, nested) {
  if (text.includes(SKIP)) return text.replace(/\u2063/g, '');
  const core = text.trim();
  if (!core || !/\p{L}/u.test(core)) return lang() === 'da' ? daNum(text) : text;
  const lead = text.slice(0, text.indexOf(core[0]));
  const tail = text.slice(lead.length + core.length);
  if (I18N.phrases[core] != null) return lead + I18N.phrases[core] + tail;
  if (I18N.names[core] != null) return lead + I18N.names[core] + tail;
  const names = [];
  const nums = [];
  const durs = [];
  const re = namePattern();
  let key = re ? core.replace(re, (m) => { names.push(m); return '\u0001'; }) : core;
  key = key.replace(DUR_RE, (m) => { durs.push(m); return '\u0002'; });
  key = key.replace(NUM_RE, (m) => { nums.push(m); return '{n}'; }).replace(/\u0001/g, '{s}').replace(/\u0002/g, '{d}');
  const tpl = I18N.templates[key] != null ? I18N.templates[key] : I18N.phrases[key];
  if (tpl != null) return lead + fillTemplate(tpl, names, nums, durs) + tail;
  // Summaries like "4 meals/day · 600 kr/week · Balanced variety": translate each part.
  if (core.includes(' · ')) return lead + core.split(' · ').map((part) => trText(part, true)).join(' · ') + tail;
  if (!/^[{}snd\s·,&+×–\-/()%:.~]*$/.test(key)) window.__i18nMissing.set(key, core);
  // Fallback: at least translate names and number formatting.
  return lead + fillTemplate(key, names, nums, durs) + tail;
}

const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[e]));
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function i18nHtml(html) {
  if (lang() !== 'da') return html;
  return html
    .replace(/>([^<]+)</g, (m, t) => `>${encode(trText(decode(t)))}<`)
    .replace(/\b(placeholder|aria-label|title)="([^"]*)"/g, (m, attr, v) => `${attr}="${encode(trText(decode(v))).replace(/"/g, '&quot;')}"`);
}

function addNames(map) { Object.assign(I18N.names, map); nameRe = null; }
