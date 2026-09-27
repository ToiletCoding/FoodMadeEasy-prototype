// Tiny render loop, navigation, and shared components.

const SCREENS = {};
const SHEETS = {};
const ACT = {};
const TABS = [
  { id: 'home', label: 'Home', icon: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>' },
  { id: 'plan', label: 'Plan', icon: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>' },
  { id: 'shop', label: 'Shop', icon: '<path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>' },
  { id: 'profile', label: 'Profile', icon: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>' },
];

// ---------- Navigation ----------

function go(name, props = {}) {
  U.route = { name, props };
  U.stack = [];
  U.sheet = null;
  render({ scrollTop: true });
}
function push(name, props = {}) {
  U.stack.push(U.route);
  U.route = { name, props };
  render({ scrollTop: true });
}
function back() {
  if (U.stack.length) { U.route = U.stack.pop(); render(); } else go('home');
}
function openSheet(name, props = {}) { U.sheet = { name, props }; render(); }
function closeSheet() { U.sheet = null; render(); }
function dialog(opts) { U.dialog = opts; render(); }

function toast(msg, opts = {}) {
  const t = { id: uid(), msg, undo: opts.undo, kind: opts.kind || 'info' };
  U.toasts = [t];
  renderToasts();
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { U.toasts = U.toasts.filter((x) => x.id !== t.id); renderToasts(); }, opts.ms || (opts.undo ? 6000 : 2800));
}

// Real system notification when allowed (installed app / secure context); silent otherwise.
function notify(title, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted' || S.settings.permission !== 'granted') return;
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then((reg) => (reg ? reg.showNotification(title, { body, icon: 'icons/icon-192.png', tag: title }) : new Notification(title, { body }))).catch(() => {});
    } else new Notification(title, { body });
  } catch (e) { /* notifications unavailable */ }
}

function haptic(ms = 8) {
  try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(ms); } catch (e) { /* no-op */ }
}

// ---------- Rendering ----------

function render(opts = {}) {
  housekeeping();
  save();
  const root = document.getElementById('app');
  const active = document.activeElement;
  const focusKey = active && active.dataset && active.dataset.bind;
  const sel = focusKey && active.selectionStart != null ? [active.selectionStart, active.selectionEnd] : null;
  const bodyEl = root.querySelector('.screen > .body');
  const scroll = bodyEl ? bodyEl.scrollTop : 0;
  const sheetBody = root.querySelector('.sheet .sheet-body');
  const sheetScroll = sheetBody ? sheetBody.scrollTop : 0;

  const scr = SCREENS[U.route.name];
  let html = scr ? scr(U.route.props || {}) : `<div class="screen"><main class="body pad">Unknown screen ${esc(U.route.name)}</main></div>`;
  if (U.sheet && SHEETS[U.sheet.name]) {
    html += `<div class="scrim" data-act="closeSheet"></div><div class="sheet ${U.sheet.props.tall ? 'tall' : ''}" role="dialog" aria-modal="true"><div class="grab"></div>${SHEETS[U.sheet.name](U.sheet.props)}</div>`;
  }
  if (U.dialog) {
    const d = U.dialog;
    html += `<div class="scrim dim"></div><div class="dialog" role="alertdialog"><h3>${esc(d.title)}</h3>${d.body ? `<p>${esc(d.body)}</p>` : ''}
      <div class="dialog-actions"><button class="btn text" data-act="dialogCancel">${esc(d.cancel || 'Cancel')}</button>
      <button class="btn text ${d.danger ? 'danger' : 'strong'}" data-act="dialogOk">${esc(d.ok || 'OK')}</button></div></div>`;
  }
  html += '<div class="toasts" id="toasts"></div>';
  root.innerHTML = html;
  renderToasts();

  const nb = root.querySelector('.screen > .body');
  if (nb) nb.scrollTop = opts.scrollTop ? 0 : scroll;
  const ns = root.querySelector('.sheet .sheet-body');
  if (ns && U.sheet && !opts.sheetTop) ns.scrollTop = sheetScroll;
  if (focusKey) {
    const el = root.querySelector(`[data-bind="${focusKey}"]`);
    if (el) { el.focus(); if (sel) try { el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignore */ } }
  }
  const auto = root.querySelector('[data-autofocus]');
  if (auto && !focusKey) auto.focus();
  const hook = scr && scr.after;
  if (hook) hook(root);
  renderDevPanel();
}

function renderToasts() {
  const el = document.getElementById('toasts');
  if (!el) return;
  el.innerHTML = U.toasts.map((t) => `<div class="toast ${t.kind}"><span>${t.msg}</span>${t.undo ? `<button class="toast-undo" data-act="toastUndo" data-id="${t.id}">Undo</button>` : ''}</div>`).join('');
}

// ---------- Events ----------

document.addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  const fn = ACT[el.dataset.act];
  if (!fn) { console.warn('No action', el.dataset.act); return; }
  ev.preventDefault();
  fn(el.dataset, el, ev);
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!el.dataset.bind) return;
  setPath(el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
  if (el.dataset.live !== 'false') render();
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.enter) {
    ev.preventDefault();
    const fn = ACT[ev.target.dataset.enter];
    if (fn) fn(ev.target.dataset, ev.target, ev);
  }
  if (ev.key === 'Escape' && (U.sheet || U.dialog)) { U.dialog = null; U.sheet = null; render(); }
});

window.addEventListener('online', () => { render(); toast('Back online · synced'); });
window.addEventListener('offline', () => render());

// Bind paths look like "ob.kcal" or "edit.budget"; roots are resolved here.
function bindRoot(key) {
  if (key === 'ob') return S.onboarding.draft;
  if (key === 'edit') return U.edit;
  if (key === 'form') return U.form || (U.form = {});
  if (key === 'settings') return S.settings;
  return null;
}
function setPath(path, value) {
  const [root, ...rest] = path.split('.');
  let obj = bindRoot(root);
  if (!obj) return;
  for (let i = 0; i < rest.length - 1; i++) obj = obj[rest[i]];
  obj[rest[rest.length - 1]] = value;
}

ACT.closeSheet = () => closeSheet();
ACT.back = () => back();
ACT.tab = (d) => go(d.tab);
ACT.dialogCancel = () => { const d = U.dialog; U.dialog = null; render(); if (d.onCancel) d.onCancel(); };
ACT.dialogOk = () => { const d = U.dialog; U.dialog = null; render(); if (d.onOk) d.onOk(); };
ACT.toastUndo = (d) => {
  const t = U.toasts.find((x) => x.id === d.id);
  U.toasts = [];
  renderToasts();
  if (t && t.undo) t.undo();
};
ACT.noop = () => {};

// ---------- Components ----------

function btn(label, act, o = {}) {
  const attrs = Object.entries(o.data || {}).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  return `<button class="btn ${o.kind || 'primary'} ${o.cls || ''}" data-act="${act}"${attrs}${o.disabled ? ' disabled' : ''}>${o.busy ? '<span class="spinner"></span>' : label}</button>`;
}

function topbar({ title = '', left = '', right = '', large = false, sub = '' } = {}) {
  return `<header class="topbar ${large ? 'large' : ''}"><div class="tb-left">${left}</div><div class="tb-title">${title}</div><div class="tb-right">${right}</div></header>
  ${large ? `<div class="large-title"><h1>${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>` : ''}`;
}
const backBtn = (act = 'back', label = '') => `<button class="icon-btn" data-act="${act}" aria-label="Back">${icon('chev-left')}${label ? `<span>${label}</span>` : ''}</button>`;
const closeBtn = (act) => `<button class="icon-btn" data-act="${act}" aria-label="Close">${icon('x')}</button>`;

function icon(name) {
  const p = {
    'chev-left': '<path d="M15 5l-7 7 7 7"/>',
    'chev-right': '<path d="M9 5l7 7-7 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2 1.2M17.8 15.3l2 1.2M4.2 16.5l2-1.2M17.8 8.7l2-1.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 3h5"/>',
    share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/>',
    swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
    wifi: '<path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 5-2.6M19 12.5a10 10 0 0 0-3.2-2.1M12 20h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    fridge: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  }[name];
  return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${p || ''}</svg>`;
}

function tabbar(active) {
  return `<nav class="tabbar">${TABS.map((t) => `<button class="tab ${t.id === active ? 'on' : ''}" data-act="tab" data-tab="${t.id}" aria-label="${t.label}">
    <svg class="ic" viewBox="0 0 24 24">${t.icon}</svg><span>${t.label}</span></button>`).join('')}</nav>`;
}

function screen({ top = '', body = '', footer = '', tab = null, cls = '' }) {
  return `<div class="screen ${cls} ${tab ? 'has-tabs' : ''}">${top}${offlineBanner()}<main class="body">${body}</main>${footer ? `<footer class="cta">${footer}</footer>` : ''}${tab ? tabbar(tab) : ''}</div>`;
}

function offlineBanner() {
  return online() ? '' : `<div class="offline">${icon('wifi')}<span>You're offline. Your week, list and prep steps still work.</span></div>`;
}

function macroLine(m, o = {}) {
  return `<span class="macro ${o.cls || ''}"><b>${fmtNum(m.kcal)} kcal</b> · ${Math.round(m.p)}P · ${Math.round(m.c)}C · ${Math.round(m.f)}F</span>`;
}

function budgetStatus(total, budget) {
  const diff = budget - total;
  if (Math.abs(diff) < 5) return { cls: 'neutral', text: 'on budget' };
  return diff > 0 ? { cls: 'good', text: `${fmtNum(diff)} under budget` } : { cls: 'warn', text: `${fmtNum(-diff)} over budget` };
}

function costChip(total, budget) {
  const b = budgetStatus(total, budget);
  return `<span class="cost-chip"><b>${fmtKr(total)}</b> <span class="${b.cls}">${b.text}</span></span>`;
}

function thumb(rid, size = 56) {
  const r = RECIPE[rid];
  return `<div class="thumb" style="--tb:${r.bg};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px">${r.emoji}</div>`;
}

function chip(label, on, act, data = {}, o = {}) {
  const attrs = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  return `<button class="chip ${on ? 'on' : ''} ${o.cls || ''}" data-act="${act}"${attrs}${o.disabled ? ' disabled' : ''} aria-pressed="${on}">${label}</button>`;
}

function progress(frac, o = {}) {
  return `<div class="progress ${o.cls || ''}"><div style="width:${Math.max(0, Math.min(1, frac)) * 100}%"></div></div>`;
}

function empty({ art, title, text, action }) {
  return `<div class="empty"><div class="empty-art">${art}</div><h2>${title}</h2><p>${text}</p>${action || ''}</div>`;
}

function notice(text, o = {}) {
  return `<div class="notice ${o.kind || ''}">${icon(o.icon || 'info')}<div>${text}</div></div>`;
}

function skeleton(lines = 3) {
  return `<div class="skel-card"><div class="skel w60"></div>${'<div class="skel"></div>'.repeat(lines)}</div>`;
}
