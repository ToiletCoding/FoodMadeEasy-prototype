// S27–S30: Meal Prep Mode (full-screen modal flow).

function totalPrepSteps(prep) { return prep.steps.length + prep.portioning.length; }

ACT.openPrep = () => {
  U.sheet = null;
  const origin = U.route.name === 'prep' ? U.prepOrigin : { ...U.route };
  U.prepOrigin = origin;
  go('prep', { view: 'overview' });
};

function closePrep() {
  releaseWakeLock();
  const o = U.prepOrigin || { name: 'home', props: {} };
  go(['home', 'plan', 'shop', 'profile'].includes(o.name) ? o.name : 'home', o.props);
}

let wakeLock = null;
async function holdWakeLock() {
  try { if (!wakeLock && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* not supported */ }
}
function releaseWakeLock() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; }

SCREENS.prep = ({ view }) => {
  const a = acct();
  const p = a.plan;
  const closeTop = (act = 'prepClose', right = '') => `<header class="topbar"><div class="tb-left">${closeBtn(act)}</div><div class="tb-title">Meal prep</div><div class="tb-right">${right}</div></header>`;
  if (!p) {
    return screen({ cls: 'prep', top: closeTop(), body: `<div class="pad">${empty({ art: '🥡', title: 'Nothing to prep yet', text: "Create a weekly plan first. We'll turn it into a step-by-step session.", action: btn('Build My Week', 'buildWeek') })}</div>` });
  }
  const prep = Engine.prepPlan(p);
  if (prep.empty) {
    return screen({ cls: 'prep', top: closeTop(), body: `<div class="pad">${empty({ art: '🥣', title: 'No cooking needed this week', text: 'All your meals are 5-minute assemble-and-eat.', action: btn('View Plan', 'tab', { data: { tab: 'plan' } }) })}</div>` });
  }
  const N = totalPrepSteps(prep);
  if (view === 'complete') return prepComplete(p, prep);
  if (view === 'steps' && p.prep.step >= 1) return prepStep(p, prep, N, closeTop);
  return prepOverview(p, prep, N, closeTop);
};
SCREENS.prep.after = () => {
  if (U.route.props.view === 'steps') holdWakeLock();
  startTimerTicker();
};

function prepOverview(p, prep, N, closeTop) {
  const sl = Engine.shoppingList(p, today());
  const inProgress = p.prep.step >= 1 && !p.prep.done;
  const cta = p.prep.done ? '' : inProgress ? btn(`Continue · Step ${p.prep.step} of ${N}`, 'prepContinue') : btn('Start Meal Prep', 'prepStart');
  return screen({
    cls: 'prep',
    top: closeTop(),
    body: `<div class="pad">
      <h1 class="q">${weekdayLong(p.shopDate)} prep</h1>
      <p class="helper">We've combined your recipes so you cook each thing once.</p>
      <div class="prep-summary"><span><b>${prep.recipes.length}</b> recipe${prep.recipes.length > 1 ? 's' : ''}</span><span><b>${prep.containers}</b> containers</span><span><b>${fmtDuration(prep.minutes)}</b></span></div>
      ${p.prep.done ? notice(`✓ Prepped ${fmtDay(p.prep.doneDate)}`, { kind: 'good', icon: 'check' }) : ''}
      ${!p.prep.done && sl.done < sl.count ? notice("You haven't finished shopping. You can still start.", { kind: 'warn' }) : ''}
      <div class="section-label">Recipes being prepped</div>
      <div class="card list-card">${prep.recipes.map((r) => `<button class="meal-row" data-act="openRecipe" data-rid="${r.rid}" data-which="plan">${thumb(r.rid, 40)}<span class="grow"><b>${esc(r.name)}</b><small>${r.count} container${r.count > 1 ? 's' : ''} · ${r.slots.join(' & ')} ${r.days.length === 7 ? 'Mon–Sun' : r.days.map(weekday).join(', ')}</small></span>${icon('chev-right')}</button>`).join('')}</div>
      <div class="section-label">What you'll cook</div>
      <div class="card list-card">${prep.totals.map(([id, g]) => `<div class="ing-row"><span>${esc(ING[id].name)}</span><b>${fmtIngQty(id, g)}${ING[id].dry ? ' dry' : ''}</b></div>`).join('')}
        ${prep.vegTotal ? `<div class="ing-row"><span>Vegetables</span><b>${fmtG(prep.vegTotal)}</b></div>` : ''}</div>
      <div class="section-label">You'll need</div>
      <div class="chips static">${prep.kit.map((k) => `<span class="tag">${k}</span>`).join('')}</div>
      ${p.slots.some((s) => !MAIN_SLOTS.includes(s)) ? '<p class="fine">Breakfasts and snacks are 5-minute assemble-and-eat meals. Make them on the day.</p>' : ''}
      ${inProgress ? '<p class="center"><button class="link" data-act="prepRestart">Restart from step 1</button></p>' : ''}
      ${p.prep.done ? '<p class="center"><button class="link" data-act="prepRestart">Prep again</button></p>' : ''}
    </div>`,
    footer: cta,
  });
}

ACT.prepClose = () => closePrep();
ACT.prepStart = () => {
  const p = acct().plan;
  p.prep = { step: 1, started: true, startedAt: Date.now(), done: null, timers: [] };
  go('prep', { view: 'steps' });
};
ACT.prepContinue = () => { go('prep', { view: 'steps' }); toast('Picked up where you left off'); };
ACT.prepRestart = () => {
  const p = acct().plan;
  p.prep = { step: 0, started: false, startedAt: null, done: null, timers: [] };
  render();
};

function timerPills(p) {
  const ts = (p.prep.timers || []).filter((t) => t.endsAt > Date.now() - 1000);
  if (!ts.length) return '';
  return `<div class="timer-pills">${ts.map((t) => `<span class="timer-pill" data-ends="${t.endsAt}" data-label="${esc(t.label)}">${icon('timer')}${esc(t.label)} · <b>${fmtClock(t.endsAt - Date.now())}</b></span>`).join('')}</div>`;
}
function fmtClock(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function prepStep(p, prep, N, closeTop) {
  const k = p.prep.step;
  const seg = `<div class="seg-progress">${Array.from({ length: N }, (_, i) => `<i class="${i < k - 1 ? 'done' : i === k - 1 ? 'now' : ''}"></i>`).join('')}</div>`;
  const top = closeTop('prepPause', `<span class="muted small">Step ${k} of ${N}</span>`);
  let body;
  let cta;
  if (k <= prep.steps.length) {
    const s = prep.steps[k - 1];
    const running = (p.prep.timers || []).some((t) => t.key === `s${k}` && t.endsAt > Date.now());
    body = `${seg}${timerPills(p)}<div class="pad prep-step">
      ${s.subtitle ? `<div class="eyebrow">${esc(s.subtitle)}</div>` : ''}
      <h1 class="step-title">${esc(s.title)}</h1>
      ${s.qty.length ? `<div class="qty-block">${s.qty.map((q) => `<div>${esc(q)}</div>`).join('')}</div>` : ''}
      <p class="how">${esc(s.how)}</p>
      ${s.wait ? (running ? `<div class="notice good">${icon('timer')}<div>Timer running. You'll get an alert when it's done.</div></div>` : `<button class="timer-chip" data-act="startTimer" data-min="${s.wait}" data-label="${esc(s.waitLabel || s.title)}" data-key="s${k}">${icon('timer')} Start ${s.wait} min timer</button>`) : ''}
      ${s.meanwhile || (s.wait >= 10 && k < prep.steps.length) ? `<p class="meanwhile">${s.meanwhile || 'While it cooks, go to the next step.'}</p>` : ''}
      ${s.recipes.length ? (U.showFor === k ? `<p class="fine">For: ${s.recipes.map(esc).join(', ')}</p>` : `<button class="link small" data-act="showFor" data-k="${k}">Which recipe is this for?</button>`) : ''}
    </div>`;
    cta = k === prep.steps.length ? 'Start Portioning' : 'Done';
  } else {
    const pr = prep.portioning[k - prep.steps.length - 1];
    const days = (arr) => (arr.length > 2 ? `${arr[0]}–${arr[arr.length - 1]}` : arr.join(', '));
    body = `${seg}${timerPills(p)}<div class="pad prep-step">
      <div class="eyebrow">Portioning</div>
      <h1 class="step-title">Containers ${pr.from}–${pr.to}</h1><div class="sub">${esc(pr.name)}</div>
      <div class="section-label">Add to each</div>
      <div class="qty-block portions">${pr.parts.map(([l, g]) => `<div><b>${fmtG(g)}</b> ${esc(l)}</div>`).join('')}</div>
      <p class="how">No scale? Split each batch evenly across the ${pr.count} containers.</p>
      <div class="card storage">
        ${pr.fridge.length ? `<div>${icon('fridge')} <span>Fridge: <b>${pr.fridge.join(', ')}</b></span></div>` : ''}
        ${pr.freezer.length ? `<div>${icon('snow')} <span>Freezer: <b>${days(pr.freezer)}</b></span></div>` : ''}
        <div class="muted small">Label the lids, e.g. “${esc(pr.firstLabel)}”</div>
      </div>
      ${!pr.freezes && pr.freezer.length ? notice("This one doesn't freeze well. Keep all of it in the fridge and eat it in the first half of the week if you can.", { kind: 'warn' }) : ''}
    </div>`;
    cta = k === N ? 'Finish Prep' : 'Done';
  }
  return screen({
    cls: 'prep steps',
    top,
    body,
    footer: `<div class="prep-cta">${k > 1 ? `<button class="btn secondary back-step" data-act="prepBack" aria-label="Previous step">${icon('chev-left')}</button>` : ''}${btn(cta, 'prepDone', { cls: 'tall' })}</div>`,
  });
}

ACT.showFor = (d) => { U.showFor = Number(d.k); render(); };
ACT.prepDone = () => {
  const p = acct().plan;
  const prep = Engine.prepPlan(p);
  haptic(12);
  U.showFor = null;
  if (p.prep.step >= totalPrepSteps(prep)) {
    p.prep.done = true;
    p.prep.doneDate = today();
    p.prep.finishedAt = Date.now();
    p.prep.timers = [];
    releaseWakeLock();
    go('prep', { view: 'complete' });
    return;
  }
  p.prep.step++;
  render({ scrollTop: true });
};
ACT.prepBack = () => { const p = acct().plan; p.prep.step = Math.max(1, p.prep.step - 1); render({ scrollTop: true }); };
ACT.prepPause = () => dialog({ title: 'Pause meal prep?', body: "We'll save your place.", ok: 'Pause', cancel: 'Keep going', onOk: closePrep });
ACT.startTimer = (d) => {
  const p = acct().plan;
  p.prep.timers = [...(p.prep.timers || []).filter((t) => t.endsAt > Date.now()), { key: d.key, label: d.label, endsAt: Date.now() + Number(d.min) * 60000 }];
  render();
  toast(`${d.label} timer started`);
};

function startTimerTicker() {
  if (U.timerTick) return;
  U.timerTick = setInterval(() => {
    const a = acct();
    const p = a && a.plan;
    if (!p || !p.prep || !(p.prep.timers || []).length) return;
    document.querySelectorAll('.timer-pill').forEach((el) => {
      const b = el.querySelector('b');
      if (b) b.textContent = fmtClock(Number(el.dataset.ends) - Date.now());
    });
    const finished = p.prep.timers.filter((t) => t.endsAt <= Date.now());
    if (finished.length) {
      p.prep.timers = p.prep.timers.filter((t) => t.endsAt > Date.now());
      finished.forEach((t) => { haptic(200); toast(`⏰ ${t.label} timer is done`, { kind: 'good', ms: 6000 }); });
      if (U.route.name === 'prep') render();
      save();
    }
  }, 1000);
}

// ---------- S30 Prep Complete ----------

function prepComplete(p, prep) {
  const elapsed = p.prep.finishedAt && p.prep.startedAt ? (p.prep.finishedAt - p.prep.startedAt) / 60000 : null;
  const time = elapsed && elapsed > 5 && elapsed < 240 ? fmtDuration(elapsed) : fmtDuration(prep.minutes);
  const firstMain = p.meals[0].findIndex((rid) => RECIPE[rid].kind === 'main');
  const next = firstMain >= 0 ? `Your ${weekdayLong(p.start)} ${SLOT_LABEL[p.slots[firstMain]].toLowerCase()} is in the fridge.` : '';
  return screen({
    cls: 'prep complete',
    body: `<div class="pad center-col celebrate"><div class="confetti">🎉</div><h1 class="display">Meal prep done</h1>
      <p class="lead"><b>${prep.containers} meals prepared</b> · ${time}</p>
      <p class="muted">Tonight: nothing. ${next}</p></div>`,
    footer: btn('Finish', 'prepFinish'),
  });
}
ACT.prepFinish = () => {
  U.prepOrigin = null;
  go('home');
  if (S.settings.permission === 'unknown' && !S.settings.primerShown) {
    S.settings.primerShown = true;
    openSheet('primer', {});
  } else toast('Your week is prepped.', { kind: 'good' });
};
