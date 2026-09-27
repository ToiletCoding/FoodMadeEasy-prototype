// S15–S23 and S38: generation, result, Home, Plan, recipe, replace, rebuild, plan next week.

function planFor(which) {
  const a = acct();
  if (which === 'preview') return U.previewPlan;
  if (which === 'draft') return a.draft;
  if (which === 'archive') return a.prevPlan || a.lastPlan;
  return a.plan;
}
function nextStart() {
  const a = acct();
  if (a.plan) return addDays(a.plan.start, 7);
  return nextMonday(today());
}
function mainServings(plan) { return plan.meals.flat().filter((r) => RECIPE[r].kind === 'main').length; }
function storeNames(ids) { return ids.map((s) => STORES.find((x) => x.id === s).name).join(' and '); }

// ---------- S15 Generating ----------

function startGeneration(o) {
  if (!online()) { toast("You're offline. Connect to build your week.", { kind: 'warn' }); return; }
  const a = acct();
  const start = o.start || (o.origin === 'rebuild' && a.plan ? a.plan.start : nextStart());
  const profile = { ...a.profile, startDate: start };
  const returnTo = U.route.name === 'generating' ? (U.gen && U.gen.returnTo) : { ...U.route };
  U.gen = { running: true, origin: o.origin, step: 0, result: null, opts: o, start, returnTo, t0: Date.now(), fails: (U.gen && U.gen.fails) || 0 };
  go('generating');
  setTimeout(() => {
    if (!U.gen) return;
    const fail = S.dev.failNext;
    S.dev.failNext = false;
    U.gen.result = Engine.generate(profile, { start, seed: o.seed, avoid: o.avoid, repeat: o.repeat, fixedMains: o.fixedMains, noData: S.dev.noData, fail });
  }, 60);
  clearInterval(U.genTimer);
  U.genTimer = setInterval(tickGeneration, 850);
}

function tickGeneration() {
  const g = U.gen;
  if (!g || U.route.name !== 'generating') { clearInterval(U.genTimer); return; }
  if (g.step < 5) g.step++;
  if (g.step >= 5 && g.result) { clearInterval(U.genTimer); setTimeout(finishGeneration, 350); }
  const el = document.querySelector('.gen-list');
  if (el) el.outerHTML = genList(g);
  const slow = document.querySelector('.gen-slow');
  if (slow && Date.now() - g.t0 > 20000) slow.hidden = false;
}

function finishGeneration() {
  const g = U.gen;
  if (!g) return;
  const r = g.result;
  const a = acct();
  g.running = false;
  if (r.status === 'ok') {
    U.prevDraft = g.origin === 'another' ? a.draft : null;
    a.draft = r.plan;
    U.gen = null;
    go('ready');
    if (U.accountCreated) { toast('Account created'); U.accountCreated = false; }
    if (U.prevDraft) toast('New plan built.', { undo: () => { a.draft = U.prevDraft; U.prevDraft = null; render(); toast('Back to your previous plan'); }, ms: 10000 });
    return;
  }
  if (r.status === 'failed') { g.fails = (g.fails || 0) + 1; go('genFailed'); return; }
  go(r.status === 'tight' ? 'tight' : 'nomatch', { r });
}

function genList(g) {
  const a = acct();
  const pr = a.profile;
  const steps = [
    'Checking your nutrition targets…',
    `Finding this week's offers at ${storeNames(pr.stores.slice(0, 2))}${pr.stores.length > 2 ? ' and more' : ''}…`,
    'Matching meals to your macros…',
    `Keeping it under ${fmtKr(pr.budget)}…`,
    'Building your shopping list…',
  ];
  return `<ul class="gen-list">${steps.map((s, i) => `<li class="${i < g.step ? 'done' : i === g.step ? 'now' : ''}">
    <span class="gl-ic">${i < g.step ? icon('check') : i === g.step ? '<span class="spinner dark"></span>' : ''}</span>${esc(s)}</li>`).join('')}</ul>`;
}

SCREENS.generating = () => {
  const g = U.gen || { step: 0 };
  return screen({
    cls: 'gen',
    top: topbar({ left: `<button class="link" data-act="cancelGen">Cancel</button>` }),
    body: `<div class="pad center-col"><div class="gen-art"><span>🥣</span><span>🛒</span><span>🥡</span></div>
      <h1 class="q">Building your week…</h1>${genList(g)}
      <p class="helper gen-slow" hidden>Still working. Lots of offers to compare this week.</p></div>`,
  });
};
ACT.cancelGen = () => dialog({
  title: 'Stop building your week?', ok: 'Stop', cancel: 'Keep going', danger: true,
  onOk: () => { clearInterval(U.genTimer); const back = U.gen && U.gen.returnTo; U.gen = null; if (back && back.name !== 'generating') go(back.name, back.props); else go('home'); },
});

// ---------- S16 Your Week Is Ready ----------

SCREENS.ready = () => {
  const a = acct();
  const p = a.draft;
  if (!p) return SCREENS.home();
  const pr = p.profile;
  const avg = Engine.weekAvg(p);
  const sl = Engine.shoppingList(p, today());
  const prep = Engine.prepPlan(p);
  const over = sl.total > pr.budget + 4;
  const b = budgetStatus(sl.total, pr.budget);
  const counts = {};
  p.meals.flat().forEach((r) => { counts[r] = (counts[r] || 0) + 1; });
  const kTarget = Engine.avgTarget(pr, p.start);
  const kOff = Math.abs(avg.kcal - kTarget) > kTarget * 0.05;
  const two = pr.prepMode === 'two';
  const stat = (big, small, cls = '') => `<div class="stat ${cls}"><b>${big}</b><small>${small}</small></div>`;
  const isNext = a.plan && p.start > a.plan.start;
  return screen({
    cls: 'ready',
    top: topbar({ left: isNext || U.stack.length ? backBtn('readyBack') : '' }),
    body: `<div class="pad">
      <div class="ready-head"><div class="burst">✓</div><h1 class="display">${isNext ? 'Next week is ready' : 'Your week is ready'}</h1><div class="sub">${fmtDay(p.start)} – ${fmtDay(addDays(p.start, 6))}</div></div>
      <div class="stat-grid">
        ${stat(`${fmtNum(avg.kcal)}`, pr.restKcal ? `avg kcal/day · ${fmtNum(pr.kcal)} training, ${fmtNum(pr.restKcal)} rest` : `kcal/day · target ${fmtNum(pr.kcal)}`, kOff ? 'warn' : '')}
        ${stat(`${Math.round(avg.p)} g`, `protein/day · target ${pr.protein}`, avg.p < pr.protein * 0.95 ? 'warn' : '')}
        ${stat(fmtKr(sl.total), 'estimated total')}
        ${stat(`${fmtNum(Math.abs(pr.budget - sl.total))} kr`, over ? 'over budget' : 'under budget', over ? 'warn' : 'good')}
        ${stat(`${mainServings(p)} meals`, 'prepped for the week')}
        ${two ? stat(`${fmtDuration(prep.sessions[0].minutes)} + ${fmtDuration(prep.sessions[1].minutes).replace('~', '')}`, `${weekday(p.shopDate)} + ${weekday(addDays(p.start, 2))} prep`)
          : stat(prep.minutes ? fmtDuration(prep.minutes) : '—', `${weekday(p.shopDate)} prep`)}
      </div>
      ${over ? notice(`${p.picked ? 'Your picked meals come to a bit more than your budget. Swap one for something cheaper, or raise the budget.'
        : pr.storeCap < pr.stores.length ? `Closest we could get with your stores. Try up to ${Math.min(3, pr.stores.length)} stores a week, or a bigger budget.`
        : 'Closest we could get with your stores and budget. Adding a store or raising the budget would help.'} <button class="link" data-act="editSection" data-s="${!p.picked && pr.storeCap < pr.stores.length ? 'stores' : 'planning'}">Adjust</button>`, { kind: 'warn' }) : ''}
      <div class="section-label">What's in your week</div>
      <div class="meal-strip">${Object.entries(counts).map(([rid, n]) => `<button class="ms-item" data-act="openRecipe" data-rid="${rid}" data-which="draft">${thumb(rid, 64)}<span>${esc(RECIPE[rid].name)}</span><small>×${n}</small></button>`).join('')}</div>
      ${p.noData ? notice('Prices are rough estimates this week. We couldn\'t get current offers, so we used typical prices.', { kind: 'warn' })
        : sl.offersUsed ? `<p class="savings">Uses ${sl.offersUsed} offer${sl.offersUsed === 1 ? '' : 's'} · about <b>${fmtKr(sl.savings)}</b> saved vs. regular prices</p>`
        : notice('No matching offers this week. We used standard estimated prices.')}
    </div>`,
    footer: `${btn(isNext ? 'Use This Plan for Next Week' : 'Use This Plan', 'acceptDraft')}
      <div class="row2">${btn('Review Meals', 'reviewDraft', { kind: 'secondary' })}${btn('Generate Another', 'generateAnother', { kind: 'text' })}</div>`,
  });
};
ACT.readyBack = () => (U.stack.length ? back() : go('home'));
ACT.acceptDraft = () => {
  const a = acct();
  const d = a.draft;
  if (!d) return;
  d.status = 'active';
  d.origMeals = clone(d.meals);
  d.shop.isNew = {};
  d.shop.removed = [];
  if (a.plan && d.start > a.plan.start) a.prevPlan = a.plan;
  a.plan = d;
  a.draft = null;
  haptic(15);
  go('home');
  toast('Your week is set. Next: shopping.', { kind: 'good' });
};
ACT.reviewDraft = () => push('plan', { which: 'draft' });
ACT.generateAnother = () => {
  const p = acct().draft;
  const mains = [...new Set(p.meals.flat().filter((r) => RECIPE[r].kind === 'main'))];
  startGeneration({ origin: 'another', start: p.start, seed: (p.seed || 1) + 1 + Math.floor(Math.random() * 1000), avoid: mains });
};

// ---------- S18 Home ----------

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function freezerTip(plan) {
  const t = tomorrow();
  if (twoSessions(plan)) {
    if (!allPrepped(plan)) {
      const s1 = Engine.prepPlan(plan, 1);
      return { title: `${weekdayLong(midweekDate(plan))}: mid-week prep`, text: `Cook ${s1.containers} meals for ${weekday(addDays(plan.start, 3))}–${weekday(planEnd(plan))}, about ${fmtDuration(s1.minutes).replace('~', '')}. Check the use-by dates on fresh meat.` };
    }
    return { title: 'All set', text: 'Everything for the rest of the week is in the fridge.' };
  }
  if (!inPlan(plan, t)) return null;
  const d = diffDays(plan.start, t);
  if (d < 3) return { title: 'Nothing to move tonight', text: `${weekdayLong(t)}'s meals are already in the fridge.` };
  const slots = plan.meals[d].map((rid, si) => (RECIPE[rid].kind === 'main' ? SLOT_LABEL[plan.slots[si]].toLowerCase() : null)).filter(Boolean);
  if (!slots.length) return null;
  return { title: 'Tonight', text: `Move ${weekdayLong(t)}'s ${slots.join(' and ')} from the freezer to the fridge.` };
}

SCREENS.home = () => {
  const a = acct();
  if (!a) return SCREENS.welcome();
  const st = homeState();
  const p = a.plan;
  const name = (S.accounts[S.user.email] || {}).name || '';
  const t = today();
  const header = `<div class="home-head"><div><div class="muted small"><span>${greeting()}</span>${name ? `<span>, </span><span>${esc(name)}</span>` : ''}</div>
      <h1>${p ? `Week of ${fmtRange(p.start)}` : a.draft ? `Week of ${fmtRange(a.draft.start)}` : 'Your food week'}</h1></div>
      <button class="avatar" data-act="tab" data-tab="profile" aria-label="Profile">${esc((name || S.user.email)[0].toUpperCase())}</button></div>`;

  if (st === 'H0') {
    const pr = a.profile;
    return screen({
      tab: 'home',
      body: `<div class="pad">${header}
        <div class="card hero-empty">${empty({
          art: '🥣🛒🥡', title: "Let's plan your week",
          text: `Meals that hit ${fmtNum(pr.kcal)} kcal and ${pr.protein}P, a shopping list under ${fmtKr(pr.budget)}, and a prep plan. About 15 seconds.`,
          action: `${btn('Build My Week', 'buildWeek', { disabled: !online() })}${btn('Pick my own meals', 'openMixer', { kind: 'text' })}${a.lastPlan ? btn('Repeat last week', 'openNextWeek', { kind: 'text' }) : ''}`,
        })}</div></div>`,
    });
  }

  let sl = null, prep = null;
  if (p) { sl = Engine.shoppingList(p, t); prep = Engine.prepPlan(p, curSession(p)); }
  const midweek = p && twoSessions(p) && p.prep.session === 1;
  let card = '';
  const more = (st === 'H3' || st === 'H4') ? `<button class="icon-btn card-more" data-act="openSheetAct" data-sheet="homeMore" aria-label="More">${icon('dots')}</button>` : '';
  if (st === 'H1') {
    const dsl = Engine.shoppingList(a.draft, t);
    card = `<div class="eyebrow">${p ? 'Next week' : 'Ready'}</div><h2>${p ? 'Next week is ready to review' : 'Your week is ready to review'}</h2>
      <p>${fmtKr(dsl.total)} est. · ${mainServings(a.draft)} prepped meals</p>${btn('Review Your Week', 'openReady')}`;
  } else if (st === 'H3') {
    card = `<div class="eyebrow">Next up</div><h2>Time to shop</h2><p>${sl.count} items · ${sl.stores.length} store${sl.stores.length > 1 ? 's' : ''} · ${fmtKr(sl.total)} est.</p>${btn('Open Shopping List', 'tab', { data: { tab: 'shop' } })}`;
  } else if (st === 'H4') {
    card = `<div class="eyebrow">Shopping</div><h2>Shopping in progress</h2><p>${sl.done} of ${sl.count} items</p>${progress(sl.done / sl.count)}${btn('Continue Shopping', 'tab', { data: { tab: 'shop' } })}`;
  } else if (st === 'H5') {
    card = midweek
      ? `<div class="eyebrow">Mid-week prep</div><h2>Prep ${prep.containers} meals for ${weekday(addDays(p.start, 3))}–${weekday(planEnd(p))}</h2><p>About ${fmtDuration(prep.minutes).replace('~', '')}. Check the use-by dates on fresh meat.</p>${btn('Start Meal Prep', 'openPrep')}`
      : `<div class="eyebrow">Groceries done ✓</div><h2>Prep ${prep.containers} meals in ${fmtDuration(prep.minutes)}</h2><p>${prep.recipes.length} recipe${prep.recipes.length > 1 ? 's' : ''}${twoSessions(p) ? ` for ${weekday(p.start)}–${weekday(addDays(p.start, 2))}. The rest on ${weekdayLong(midweekDate(p))}.` : ', one session.'}</p>${btn('Start Meal Prep', 'openPrep')}`;
  } else if (st === 'H6') {
    card = `<div class="eyebrow">Meal prep paused</div><h2>Step ${Math.min(p.prep.step, totalPrepSteps(prep))} of ${totalPrepSteps(prep)}</h2>${progress(p.prep.step / totalPrepSteps(prep))}${btn('Continue Meal Prep', 'openPrep')}`;
  } else if (st === 'H8') {
    card = `<div class="eyebrow">Week ending</div><h2>Your week ends ${weekdayLong(planEnd(p))}.</h2><p>Next week's offers are in.</p>${btn('Plan Next Week', 'openNextWeek', { disabled: !online() })}${btn("Rate this week's meals", 'openRateWeek', { kind: 'text' })}`;
  }
  const tip = st === 'H7' ? freezerTip(p) : null;
  const cardHtml = card ? `<div class="card action-card">${more}${card}</div>` : tip ? `<div class="card tip-card">${icon(tip.title === 'Tonight' ? 'snow' : tip.title === 'All set' || tip.title.startsWith('Nothing') ? 'fridge' : 'clock')}<div><b>${tip.title}</b><p>${tip.text}</p></div></div>` : '';

  // Today's meals (from H3 on).
  let todayHtml = '';
  const tp = todaysPlan() || (p && t < p.start ? p : null);
  if (tp && st !== 'H1') {
    const upcoming = t < tp.start;
    const di = upcoming ? 0 : diffDays(tp.start, t);
    const tot = Engine.dayTotals(tp, di);
    const label = upcoming ? (diffDays(t, tp.start) === 1 ? 'Tomorrow' : `Starts ${fmtDay(tp.start)}`) : 'Today';
    const prepped = mealPrepped(tp, di);
    todayHtml = `<div class="section-head"><h3>${label}</h3><span class="muted small">${fmtNum(tot.kcal)} kcal · ${Math.round(tot.p)}P</span></div>
      <div class="card list-card">${tp.meals[di].map((rid, si) => {
        const m = Engine.mealMacros(tp, rid, di);
        const isMain = RECIPE[rid].kind === 'main';
        const badge = isMain ? (prepped ? `<span class="badge">${icon('fridge')}Fridge</span>` : '') : '<span class="badge soft">5 min</span>';
        return `<button class="meal-row" data-act="openRecipe" data-rid="${rid}" data-which="${tp === a.plan ? 'plan' : 'archive'}">
          <span class="slot">${SLOT_LABEL[tp.slots[si]]}</span>${thumb(rid, 40)}<span class="grow"><b>${esc(RECIPE[rid].name)}</b><small>${fmtNum(m.kcal)} kcal · ${Math.round(m.p)}P</small></span>${badge}</button>`;
      }).join('')}</div>`;
  }

  let summary = '';
  if (p) {
    const avg = Engine.weekAvg(p);
    const b = budgetStatus(sl.total, p.profile.budget);
    summary = `<button class="card week-card" data-act="tab" data-tab="plan">
      <div class="wc-row"><span><b>${fmtNum(avg.kcal)}</b><small>avg kcal/day</small></span><span><b>${Math.round(avg.p)} g</b><small>avg protein/day</small></span></div>
      <div class="wc-row"><span><b>${fmtKr(sl.total)}</b><small>estimated</small></span><span><b class="${b.cls}">${b.text.replace(' budget', '')}</b><small>budget</small></span></div>
      <div class="wc-foot">${p.meals.flat().length} planned meals ${icon('chev-right')}</div></button>`;
    const shopState = sl.done >= sl.count && sl.count ? 'done' : sl.done ? 'half' : 'todo';
    const prepState = allPrepped(p) ? 'done' : p.prep.step || anyPrepped(p) ? 'half' : 'todo';
    const dot = (s) => `<i class="ps ${s}">${s === 'done' ? icon('check') : ''}</i>`;
    summary += `<div class="progress-strip">
      <button data-act="tab" data-tab="plan">${dot('done')}Plan</button><span class="ps-line"></span>
      <button data-act="tab" data-tab="shop">${dot(shopState)}Shop</button><span class="ps-line"></span>
      <button data-act="openPrep">${dot(prepState)}Prep</button></div>`;
  }

  const bodyParts = st === 'H7' ? [todayHtml, cardHtml, summary] : [cardHtml, todayHtml, summary];
  return screen({ tab: 'home', body: `<div class="pad">${header}${bodyParts.join('')}</div>` });
};
ACT.buildWeek = () => startGeneration({ origin: 'new' });
ACT.openReady = () => push('ready');
ACT.openSheetAct = (d) => openSheet(d.sheet, { ...d });
SHEETS.homeMore = () => `<div class="sheet-body menu">
  <button class="menu-row" data-act="openPrep">Start meal prep now<small>You can prep before you've finished shopping.</small></button></div>`;

// ---------- S19 Plan (and S17 draft mode) ----------

SCREENS.plan = ({ which }) => {
  const a = acct();
  if (!which) which = a.plan ? 'plan' : a.draft ? 'draft' : 'plan';
  const p = planFor(which);
  const isTab = !U.stack.length;
  if (!p) {
    return screen({
      tab: 'plan', top: topbar({ title: 'Your Week', large: true }),
      body: `<div class="pad">${empty({ art: '📅', title: 'No plan yet', text: 'Your 7 days of meals will show up here.', action: btn('Create Weekly Plan', 'buildWeek', { disabled: !online() }) })}</div>`,
    });
  }
  const draft = which === 'draft';
  const archive = which === 'archive';
  const t = today();
  if (U.planDayFor !== p.id) { U.planDayFor = p.id; U.planDay = inPlan(p, t) ? diffDays(p.start, t) : 0; }
  const d = U.planDay;
  const avg = Engine.weekAvg(p);
  const sl = Engine.shoppingList(p, t);
  const prep = Engine.prepPlan(p);
  const status = Engine.dayStatus(p, d);
  const tot = Engine.dayTotals(p, d);
  const pills = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(p.start, i);
    const s = Engine.dayStatus(p, i);
    return `<button class="day-pill ${i === d ? 'on' : ''} ${iso === t ? 'today' : ''}" data-act="pickDay" data-d="${i}"><small>${weekday(iso)}</small><b>${parseISO(iso).getDate()}</b>${s.ok ? '' : '<i class="amber-dot"></i>'}</button>`;
  }).join('');

  let fix = '';
  if (!status.ok) {
    const light = p.meals[d].map((rid, si) => [rid, si]).sort((x, y) => Engine.mealMacros(p, x[0], d).kcal - Engine.mealMacros(p, y[0], d).kcal)[0];
    fix = `<div class="fix-tip">${weekdayLong(addDays(p.start, d))} is ${status.dk < 0 ? `${fmtNum(-status.dk)} kcal under` : status.dk > 0 && Math.abs(status.dk) > status.target * 0.05 ? `${fmtNum(status.dk)} kcal over` : `${Math.round(-status.dp)} g protein short`}.
      ${archive ? '' : `<button class="link" data-act="openReplace" data-rid="${light[0]}" data-d="${d}" data-si="${light[1]}" data-which="${which}">Replace ${SLOT_LABEL[p.slots[light[1]]].toLowerCase()}</button>`}</div>`;
  }

  const cards = p.meals[d].map((rid, si) => {
    const r = RECIPE[rid];
    const m = Engine.mealMacros(p, rid, d);
    const isMain = r.kind === 'main';
    const prepDay = twoSessions(p) && d > 2 ? weekday(midweekDate(p)) : weekday(p.shopDate);
    const badge = isMain ? (mealPrepped(p, d) ? '<span class="badge">✓ Prepped</span>' : `<span class="badge">Prep ${prepDay}</span>`) : `<span class="badge soft">${r.minutes} min</span>`;
    const pm = ((p.userPortion && p.userPortion[rid]) || 1) * (isMain ? 1 : Engine.lightMult(p, d));
    return `<div class="meal-card ${U.highlight === rid ? 'flash' : ''}">
      <button class="mc-main" data-act="openRecipe" data-rid="${rid}" data-which="${which}" data-d="${d}" data-si="${si}">
        <span class="slot">${SLOT_LABEL[p.slots[si]]}</span>
        <span class="mc-row">${thumb(rid, 56)}<span class="grow"><b>${esc(r.name)}</b>${macroLine(m)}<small class="muted">${isMain ? '1 container' : '1 serving'} · ${fmtNum(m.g)} g${pm !== 1 ? ` · ${Math.round(pm * 100)}%` : ''}</small></span></span>
        ${badge}</button>
      ${archive ? '' : `<button class="icon-btn mc-more" data-act="openSheetAct" data-sheet="mealMenu" data-rid="${rid}" data-d="${d}" data-si="${si}" data-which="${which}" aria-label="Meal actions">${icon('dots')}</button>`}
    </div>`;
  }).join('');
  U.highlight = null;

  const top = isTab && !draft
    ? topbar({ title: 'Your Week', large: true, sub: `${fmtDay(p.start)} – ${fmtDay(addDays(p.start, 6))}`, right: `<button class="icon-btn" data-act="openSheetAct" data-sheet="planMenu" aria-label="Plan options">${icon('dots')}</button>` })
    : topbar({ title: archive ? 'Last week' : draft ? 'Review your week' : 'Your Week', left: backBtn() });

  return screen({
    tab: isTab ? 'plan' : null,
    top,
    body: `${draft ? '<div class="draft-banner">Draft · not active yet</div>' : ''}
      ${archive ? '<div class="draft-banner muted">Read-only · this plan has ended</div>' : ''}
      ${!draft && !archive && a.draft ? `<button class="draft-banner accent" data-act="openReady">Next week's plan is ready to review ${icon('chev-right')}</button>` : ''}
      <div class="summary-strip">${costChip(sl.total, p.profile.budget)}<span class="macro">avg <b>${fmtNum(avg.kcal)} kcal</b> · ${Math.round(avg.p)}P</span></div>
      <div class="pad">
      ${prep.containers && !draft ? `<button class="card prep-card" data-act="openPrep" ${archive ? 'disabled' : ''}>${icon(allPrepped(p) ? 'check' : 'clock')}
        <span class="grow"><b>${allPrepped(p) ? `Prepped ${fmtDay(p.prep.doneDate || p.shopDate)}` : prep.two ? `${weekdayLong(p.shopDate)} + ${weekdayLong(midweekDate(p))} prep${anyPrepped(p) ? ' · first done' : ''}` : `${weekdayLong(p.shopDate)} prep`}</b>
        <small>${prep.two ? '2 sessions' : `${prep.recipes.length} recipe${prep.recipes.length > 1 ? 's' : ''}`} · ${prep.containers} containers · ${fmtDuration(prep.minutes)}${prep.two ? ' total' : ''}</small></span>
        <span class="link">View</span></button>` : ''}
      <div class="day-pills">${pills}</div>
      ${status.training !== null ? `<div class="day-type">${status.training ? 'Training day' : 'Rest day'} · ${fmtNum(status.target)} kcal</div>` : ''}
      <div class="day-total">${macroLine(tot)}<span class="status ${status.ok ? 'good' : 'warn'}">${status.label}</span></div>
      ${fix}
      <div class="meal-list" data-swipe="day">${cards}</div>
      ${!online() && !archive ? '<p class="fine center">Connect to swap meals.</p>' : ''}
      </div>`,
    footer: draft ? `<div class="draft-bar"><span>${costChip(sl.total, p.profile.budget)}</span>${btn('Use This Plan', 'acceptDraft')}</div>` : '',
  });
};
SCREENS.plan.after = (root) => {
  const list = root.querySelector('[data-swipe="day"]');
  if (!list) return;
  let x0 = null;
  list.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  list.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 60) { U.planDay = Math.max(0, Math.min(6, U.planDay + (dx < 0 ? 1 : -1))); render(); }
  });
};
ACT.pickDay = (d) => { U.planDay = Number(d.d); render(); };

SHEETS.planMenu = () => {
  const a = acct();
  return `<div class="sheet-body menu">
    <button class="menu-row" data-act="openRebuild">Rebuild week<small>Get a new plan for these dates.</small></button>
    <button class="menu-row" data-act="openRateWeek">Rate this week's meals<small>Liked meals come back more often. Disliked ones never return.</small></button>
    <button class="menu-row" data-act="menuEditPrefs">Edit preferences</button>
    ${a.prevPlan || a.lastPlan ? '<button class="menu-row" data-act="openArchive">Last week<small>Read-only</small></button>' : ''}</div>`;
};
ACT.menuEditPrefs = () => { U.sheet = null; go('profile'); };
ACT.openArchive = () => { U.sheet = null; push('plan', { which: 'archive' }); };

SHEETS.mealMenu = ({ rid, d, si, which }) => `<div class="sheet-head"><h2>${esc(RECIPE[rid].name)}</h2></div><div class="sheet-body menu">
  <button class="menu-row" data-act="openReplace" data-rid="${rid}" data-d="${d}" data-si="${si}" data-which="${which}" ${online() ? '' : 'disabled'}>${icon('swap')} Replace meal${online() ? '' : '<small>Connect to swap meals.</small>'}</button>
  <button class="menu-row" data-act="openRecipe" data-rid="${rid}" data-which="${which}" data-portion="1">Adjust portion</button>
  <button class="menu-row" data-act="openRecipe" data-rid="${rid}" data-which="${which}">View recipe</button></div>`;

// ---------- S20 Recipe Detail ----------

ACT.openRecipe = (d) => { U.sheet = null; U.batchView = false; push('recipe', { rid: d.rid, which: d.which || 'plan', d: d.d, si: d.si, portion: !!d.portion }); };

SCREENS.recipe = ({ rid, which, d, si, portion, preview }) => {
  const p = planFor(which);
  const r = RECIPE[rid];
  const m = Engine.mealMacros(p, rid);
  const ings = Engine.servingIngs(p, rid);
  const servings = p.meals.flat().filter((x) => x === rid).length;
  const pm = (p.userPortion && p.userPortion[rid]) || 1;
  const isMain = r.kind === 'main';
  const readOnly = which === 'archive' || preview;
  const slotsUsed = [...new Set(p.meals.flatMap((day) => day.map((x, i) => (x === rid ? SLOT_LABEL[p.slots[i]] : null))).filter(Boolean))];
  const daysUsed = p.meals.map((day, i) => (day.includes(rid) ? weekday(addDays(p.start, i)) : null)).filter(Boolean);
  const dayText = daysUsed.length === 7 ? 'Mon–Sun' : daysUsed.join(', ');
  const bar = (label, g, max, cls) => `<div class="mbar"><span>${label}</span><div class="mb-track"><div class="${cls}" style="width:${Math.min(100, (g / max) * 100)}%"></div></div><b>${Math.round(g)} g</b></div>`;
  const tags = [r.mix ? 'Mix & match' : null, isMain ? 'Meal-prep friendly' : 'Ready in 5 min', m.p >= 40 ? 'High protein' : null, isMain && r.freezes ? 'Freezes well' : null].filter(Boolean);
  const allergens = [...new Set(r.ing.flatMap(([id]) => ING[id].allergens || []))];
  const batch = U.batchView;
  return screen({
    cls: 'recipe',
    top: topbar({ left: backBtn(), title: '' }),
    body: `<div class="recipe-hero" style="--tb:${r.bg}"><span>${r.emoji}</span></div>
      <div class="pad">
      <h1 class="q">${esc(r.name)}</h1>
      <div class="chips static">${tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="section-label">Nutrition per serving</div>
      <div class="card nutri"><div class="kcal-big"><b>${fmtNum(m.kcal)}</b><small>kcal</small></div>
        <div class="bars">${bar('Protein', m.p, 80, 'p')}${bar('Carbs', m.c, 160, 'c')}${bar('Fat', m.f, 60, 'f')}</div></div>
      <div class="kv"><span>Serving</span><b>${isMain ? '1 container' : '1 serving'} · ${fmtNum(m.g)} g</b></div>
      ${readOnly ? '' : `<div class="section-label" id="portion">Portion</div>
      <div class="seg four">${[0.75, 1, 1.25, 1.5].map((v) => `<button class="${Math.abs(pm - v) < 0.01 ? 'on' : ''}" data-act="pickPortion" data-rid="${rid}" data-v="${v}" data-which="${which}" ${online() ? '' : 'disabled'}>${v * 100}%</button>`).join('')}</div>`}
      ${readOnly && !archiveRate(which) ? '' : rateRow(rid)}
      <div class="kv"><span>This week</span><b>${servings} serving${servings > 1 ? 's' : ''} · ${slotsUsed.join(' & ')}${dayText ? ` ${dayText}` : ''}${isMain ? ` · Prepped ${weekday(p.shopDate)}` : ''}</b></div>
      <div class="section-head"><h3>Ingredients</h3>
        <div class="seg mini"><button class="${batch ? '' : 'on'}" data-act="batchView" data-v="0">Per serving</button><button class="${batch ? 'on' : ''}" data-act="batchView" data-v="1">This week</button></div></div>
      <div class="card list-card ing-list">${ings.filter(([id]) => !ING[id].pantry || id === 'oil').map(([id, g]) => `<div class="ing-row"><span>${esc(ING[id].name)}</span><b>${ING[id].pantry ? (batch ? `${Math.round(g * servings)} ml` : `${Math.round(g)} ml`) : fmtIngQty(id, batch ? g * servings : g)}${ING[id].dry ? ' dry' : ''}</b></div>`).join('')}
        ${r.ing.some(([id]) => id === 'spices') ? '<div class="ing-row"><span>Salt, pepper & spices</span><b class="muted">to taste</b></div>' : ''}</div>
      <div class="section-head"><h3>How to make it</h3><span class="muted small">${r.minutes} min</span></div>
      <ol class="steps">${tx(r, 'steps').map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      ${isMain ? `<div class="section-head"><h3>Storing it</h3></div><p class="body-text">${r.freezes ? 'Fridge 3 days · Freezer 2 months. Thaw overnight in the fridge.' : "Fridge 3 days. This one doesn't freeze well, so it's best early in the week."}</p>` : ''}
      <p class="fine">${allergens.length ? `<span>Contains:</span> ${allergens.map((x) => `<span>${x}</span>`).join(', ')}. ` : ''}<span>Always check product labels. Allergen data may be incomplete.</span></p>
      </div>`,
    footer: preview ? btn('Choose This Meal', 'choosePreview', { data: { rid } })
      : readOnly ? '' : `${btn('Replace Meal', 'openReplace', { data: { rid, d: d ?? '', si: si ?? '', which }, disabled: !online() })}${isMain ? btn('Change the parts', 'openReplace', { kind: 'text', data: { rid, d: d ?? '', si: si ?? '', which, mode: 'build' }, disabled: !online() }) : ''}`,
  });
};
SCREENS.recipe.after = (root) => {
  if (U.route.props.portion) { const el = root.querySelector('#portion'); if (el) el.scrollIntoView({ block: 'start' }); U.route.props.portion = false; }
};
ACT.batchView = (d) => { U.batchView = d.v === '1'; render(); };
ACT.pickPortion = (d) => {
  const p = planFor(d.which);
  const cur = (p.userPortion && p.userPortion[d.rid]) || 1;
  if (Math.abs(cur - Number(d.v)) < 0.01) return;
  openSheet('portion', { rid: d.rid, v: Number(d.v), which: d.which });
};
SHEETS.portion = ({ rid, v, which }) => {
  const p = planFor(which);
  const next = clone(p);
  next.userPortion[rid] = v;
  const before = Engine.mealMacros(p, rid);
  const after = Engine.mealMacros(next, rid);
  const cost = Engine.shoppingList(next, today()).total - Engine.shoppingList(p, today()).total;
  const n = p.meals.flat().filter((x) => x === rid).length;
  const prepped = anyPrepped(p) && RECIPE[rid].kind === 'main';
  return `<div class="sheet-head"><h2>Make all ${n} servings ${v * 100}%?</h2></div><div class="sheet-body">
    <p class="body-text">${after.kcal >= before.kcal ? 'Adds' : 'Removes'} ~${fmtNum(Math.abs(after.kcal - before.kcal))} kcal · ${Math.round(Math.abs(after.p - before.p))}P per serving and ${cost >= 0 ? '~' + fmtKr(cost) + ' to' : '~' + fmtKr(-cost) + ' from'} your list.</p>
    ${prepped ? notice("You've already prepped this. The change only affects your numbers, not your containers.", { kind: 'warn' }) : ''}
    </div><div class="sheet-foot">${btn('Apply', 'applyPortion', { data: { rid, v, which }, busy: U.busy })}${btn('Cancel', 'closeSheet', { kind: 'text' })}</div>`;
};
ACT.applyPortion = (d) => {
  const a = acct();
  const key = d.which === 'draft' ? 'draft' : 'plan';
  const before = a[key];
  const after = clone(before);
  after.userPortion[d.rid] = Number(d.v);
  U.busy = true; render();
  setTimeout(() => {
    U.busy = false;
    const ch = Engine.reconcileShopping(before, after, today());
    a[key] = after;
    closeSheet();
    const listNote = ch.added ? ` · list +${ch.added} item${ch.added > 1 ? 's' : ''}` : '';
    toast(`Portion updated${listNote}`, { undo: () => { a[key] = before; render(); toast('Portion restored'); } });
  }, 450);
};

// ---------- S21 Replace Meal / S22 Replacement Confirmed ----------

ACT.openReplace = (d) => {
  if (!online()) { toast("You're offline. Connect to swap meals."); return; }
  const p = planFor(d.which);
  const rid = d.rid;
  const count = p.meals.flat().filter((x) => x === rid).length;
  let dd = d.d === '' || d.d == null ? null : Number(d.d);
  let si = d.si === '' || d.si == null ? null : Number(d.si);
  if (dd == null) { outer: for (let i = 0; i < 7; i++) for (let j = 0; j < p.slots.length; j++) if (p.meals[i][j] === rid) { dd = i; si = j; break outer; } }
  U.replace = { rid, d: dd, si, which: d.which, scope: RECIPE[rid].kind === 'main' && count > 1 ? 'all' : 'one', selected: null, exclude: [], dont: false, mode: d.mode || 'suggest' };
  U.sheet = null;
  openSheet('replace', { tall: true });
};

function replaceAlts() {
  const R = U.replace;
  const p = planFor(R.which);
  const scope = R.scope === 'all' ? { type: 'all' } : { type: 'one', d: R.d, si: R.si };
  const key = JSON.stringify([p.id, p.meals, p.userPortion, R.rid, scope, R.exclude]);
  if (R.cacheKey !== key) { R.cacheKey = key; R.cache = Engine.alternatives(p, R.rid, scope, today(), R.exclude).slice(0, 4); }
  return R.cache;
}

SHEETS.replace = () => {
  const R = U.replace;
  const p = planFor(R.which);
  const r = RECIPE[R.rid];
  const count = p.meals.flat().filter((x) => x === R.rid).length;
  const build = R.mode === 'build';
  const alts = build ? [] : replaceAlts();
  const shopStarted = R.which === 'plan' && Object.keys(p.shop.checked).length > 0;
  const prepped = R.which === 'plan' && anyPrepped(p) && r.kind === 'main';
  const oneLabel = `Only ${weekday(addDays(p.start, R.d))} ${SLOT_LABEL[p.slots[R.si]].toLowerCase()}`;
  return `<div class="sheet-head"><h2>Replace ${esc(r.name)}</h2><p class="muted">Everything else in your week stays the same.</p></div>
    <div class="sheet-body">
    ${count > 1 ? `<div class="seg two">${[['all', `All ${count} servings`], ['one', oneLabel]].map(([v, l]) => `<button class="${R.scope === v ? 'on' : ''}" data-act="replaceScope" data-v="${v}">${l}</button>`).join('')}</div>` : ''}
    ${r.kind === 'main' ? `<div class="seg two">${[['suggest', 'Suggestions'], ['build', 'Build your own']].map(([v, l]) => `<button class="${(R.mode || 'suggest') === v ? 'on' : ''}" data-act="replaceMode" data-v="${v}">${l}</button>`).join('')}</div>` : ''}
    ${shopStarted ? notice("You've already bought some items. We'll add what's new to your list.", { kind: 'warn' }) : ''}
    ${prepped ? notice("You've already prepped this meal. Swapping only changes your plan, not your containers.", { kind: 'warn' }) : ''}
    ${build ? replaceBuildBody() : alts.length ? `<div class="alt-list">${alts.map((x) => {
      const c = RECIPE[x.id];
      const cost = Math.round(x.cost);
      return `<div class="alt-card ${R.selected === x.id ? 'on' : ''}" data-act="pickAlt" data-id="${x.id}" role="button" tabindex="0">
        <button class="alt-thumb" data-act="previewAlt" data-id="${x.id}" aria-label="Preview">${thumb(x.id, 52)}</button>
        <div class="grow"><b>${esc(c.name)}</b>${macroLine(x.macros)}
          <div class="alt-meta"><span class="${cost > 0 ? '' : 'good'}">${cost === 0 ? 'Same cost' : `${signed(cost)} kr/week`}</span>
          <span class="${x.onTarget ? 'good' : 'warn'}">${x.onTarget ? 'Macros stay on target' : `${signed(x.dP)}P per day`}</span><span>${x.prep}</span></div></div>
        <span class="radio"></span></div>`;
    }).join('')}</div>
    <button class="link" data-act="moreAlts">Show different options</button>
    <label class="check-row"><input type="checkbox" data-bind="form.dontSuggest" ${U.form && U.form.dontSuggest ? 'checked' : ''} data-live="false"> Don't suggest ${esc(r.name)} again</label>`
    : `${empty({ art: '🤔', title: 'No other meals fit', text: 'No other meals fit this slot with your settings.', action: `${btn('Allow more foods', 'editSection', { data: { s: 'food' }, kind: 'secondary' })}${R.exclude.length ? btn('Start over', 'resetAlts', { kind: 'text' }) : ''}` })}`}
    ${R.error ? notice("Couldn't swap right now. Your plan hasn't changed.", { kind: 'warn' }) : ''}
    </div>
    <div class="sheet-foot">${btn('Swap Meal', 'doSwap', { disabled: !R.selected, busy: U.busy })}</div>`;
};
ACT.replaceScope = (d) => { U.replace.scope = d.v; U.replace.selected = null; U.replace.buildEval = null; render(); };
ACT.replaceMode = (d) => { U.replace.mode = d.v; U.replace.selected = null; render({ sheetTop: true }); };
ACT.pickAlt = (d) => { U.replace.selected = d.id; render(); };
ACT.moreAlts = () => { const R = U.replace; R.exclude = [...R.exclude, ...R.cache.map((x) => x.id)]; R.selected = null; render({ sheetTop: true }); };
ACT.resetAlts = () => { U.replace.exclude = []; render(); };
ACT.previewAlt = (d) => {
  const alt = U.replace.cache.find((x) => x.id === d.id);
  U.previewPlan = alt.plan;
  U.sheet = null;
  push('recipe', { rid: d.id, which: 'preview', preview: true });
};
ACT.choosePreview = (d) => { U.replace.selected = d.rid; back(); openSheet('replace', { tall: true }); };

ACT.doSwap = () => {
  const R = U.replace;
  const a = acct();
  const key = R.which === 'draft' ? 'draft' : 'plan';
  const before = a[key];
  const alt = R.mode === 'build' ? R.buildEval : R.cache.find((x) => x.id === R.selected);
  U.busy = true; render();
  setTimeout(() => {
    U.busy = false;
    const after = alt.plan;
    if (U.form && U.form.dontSuggest) {
      a.profile.excludedRecipes = [...new Set([...(a.profile.excludedRecipes || []), R.rid])];
      after.profile.excludedRecipes = a.profile.excludedRecipes;
      U.form.dontSuggest = false;
    }
    const ch = Engine.reconcileShopping(before, after, today());
    const prepBefore = Engine.prepPlan(before);
    const prepAfter = Engine.prepPlan(after);
    a[key] = after;
    U.highlight = R.selected;
    U.swapResult = {
      name: RECIPE[R.selected].name, which: R.which, before,
      rows: [
        ['Daily protein', `${Math.round(Engine.weekAvg(before).p)} → ${Math.round(Engine.weekAvg(after).p)} g`],
        ['Weekly cost', `${fmtNum(ch.total - ch.cost)} → ${fmtKr(ch.total)}`, budgetStatus(ch.total, after.profile.budget).text],
        ['Shopping list', ch.added || ch.removed ? `${ch.added ? `+${ch.added} item${ch.added > 1 ? 's' : ''}` : ''}${ch.added && ch.removed ? ', ' : ''}${ch.removed ? `−${ch.removed} item${ch.removed > 1 ? 's' : ''}` : ''}` : 'Same items, new amounts'],
        ['Prep', `${prepAfter.recipes.length === prepBefore.recipes.length ? 'same ' : ''}${prepAfter.recipes.length} recipe${prepAfter.recipes.length === 1 ? '' : 's'}, ${fmtDuration(prepAfter.minutes)}`],
      ],
    };
    haptic(12);
    U.sheet = { name: 'swapped', props: {} };
    render();
  }, 650);
};

SHEETS.swapped = () => {
  const x = U.swapResult;
  return `<div class="sheet-body center-col"><div class="burst small">✓</div><h2>Swapped to ${esc(x.name)}</h2>
    <div class="card list-card change-list">${x.rows.map(([k, v, s]) => `<div class="ing-row"><span>${k}</span><b>${v}${s ? `<small class="muted"> · ${s}</small>` : ''}</b></div>`).join('')}</div></div>
    <div class="sheet-foot">${btn('Done', 'swapDone')}<div class="row2">${btn('Undo', 'swapUndo', { kind: 'text' })}${x.which === 'plan' ? btn('View shopping list', 'swapToShop', { kind: 'text' }) : ''}</div></div>`;
};
ACT.swapDone = () => { U.sheet = null; if (U.route.name === 'recipe') back(); else render(); };
ACT.swapUndo = () => {
  const a = acct();
  a[U.swapResult.which === 'draft' ? 'draft' : 'plan'] = U.swapResult.before;
  U.sheet = null;
  if (U.route.name === 'recipe') back(); else render();
  toast('Swap undone');
};
ACT.swapToShop = () => go('shop');

// ---------- S23 Rebuild Week ----------

ACT.openRebuild = () => { U.sheet = null; openSheet('rebuild', {}); };
SHEETS.rebuild = () => {
  const p = acct().plan;
  const sl = Engine.shoppingList(p, today());
  return `<div class="sheet-head"><h2>Rebuild your week?</h2></div><div class="sheet-body">
    <p class="body-text">Your current plan stays active until you choose the new one.</p>
    ${sl.done ? notice(`You've checked off ${sl.done} item${sl.done > 1 ? 's' : ''}. A new plan may need different groceries.`, { kind: 'warn' }) : ''}
    ${anyPrepped(p) ? notice("You've already prepped this week. Rebuilding is usually best for next week.", { kind: 'warn' }) : ''}
    </div><div class="sheet-foot">${btn('Rebuild Week', 'doRebuild', { disabled: !online() })}${btn('Pick my own meals instead', 'openMixer', { kind: 'text', data: { origin: 'rebuild', start: p.start } })}${btn('Cancel', 'closeSheet', { kind: 'text' })}</div>`;
};
ACT.doRebuild = () => { U.sheet = null; startGeneration({ origin: 'rebuild', seed: 3 + Math.floor(Math.random() * 1000), avoid: [...new Set(acct().plan.meals.flat().filter((r) => RECIPE[r].kind === 'main'))] }); };

// ---------- S38 Plan Next Week ----------

ACT.openNextWeek = () => {
  const a = acct();
  const src = a.plan || a.lastPlan;
  const start = nextStart();
  let est = null;
  if (src) {
    const r = Engine.generate({ ...a.profile, startDate: start }, { start, repeat: { meals: src.meals }, noData: S.dev.noData });
    if (r.status === 'ok') est = r.cost;
  }
  const swapped = src && JSON.stringify([...new Set(src.meals.flat())].sort()) !== JSON.stringify([...new Set((src.origMeals || src.meals).flat())].sort());
  U.nextWeek = { start, est, choice: est != null && !swapped ? 'repeat' : 'new', src };
  openSheet('nextWeek', {});
};
SHEETS.nextWeek = () => {
  const n = U.nextWeek;
  const card = (id, title, text, dis) => `<button class="option-card ${n.choice === id ? 'on' : ''}" data-act="nextChoice" data-v="${id}" ${dis ? 'disabled' : ''}><span><b>${title}</b><small>${text}</small></span><span class="radio"></span></button>`;
  return `<div class="sheet-head"><h2>Plan ${fmtDay(n.start)} – ${fmtDay(addDays(n.start, 6))}</h2></div><div class="sheet-body"><div class="stack">
    ${card('repeat', 'Repeat this week', n.est != null ? `Same meals, new prices. Est. ${fmtKr(n.est)}.` : "Some meals no longer fit your settings.", n.est == null)}
    ${card('new', 'Build a new week', "Fresh meals from this week's offers.")}
    <button class="option-card" data-act="openMixer" data-origin="next" data-start="${n.start}"><span><b>Pick my own meals</b><small>Choose protein, carb, veg and flavour yourself.</small></span>${icon('chev-right')}</button>
    <button class="option-card" data-act="nextChange"><span><b>Change something first</b><small>Update targets, food, budget or stores.</small></span>${icon('chev-right')}</button>
    </div></div><div class="sheet-foot">${btn('Build Next Week', 'buildNext', { disabled: !online() })}</div>`;
};
ACT.nextChoice = (d) => { U.nextWeek.choice = d.v; render(); };
ACT.nextChange = () => { U.sheet = null; U.returnToNextWeek = true; go('profile'); };
ACT.buildNext = () => {
  const n = U.nextWeek;
  U.sheet = null;
  startGeneration({ origin: 'next', start: n.start, repeat: n.choice === 'repeat' ? { meals: n.src.meals } : null, seed: 5 + Math.floor(Math.random() * 1000) });
};

// ---------- Meal ratings ----------

function archiveRate(which) { return which === 'archive'; }
function myRating(rid) { const pr = acct().profile; return (pr.ratings || {})[rid] || 0; }

function rateRow(rid) {
  const v = myRating(rid);
  return `<div class="rate-row"><span>Would you eat this again?</span>
    <button class="rate ${v === 1 ? 'on' : ''}" data-act="rate" data-rid="${rid}" data-v="1" aria-pressed="${v === 1}" aria-label="Yes">👍</button>
    <button class="rate ${v === -1 ? 'on bad' : ''}" data-act="rate" data-rid="${rid}" data-v="-1" aria-pressed="${v === -1}" aria-label="No">👎</button></div>`;
}

ACT.rate = (d) => {
  const pr = acct().profile;
  pr.ratings = pr.ratings || {};
  const v = Number(d.v);
  const prev = pr.ratings[d.rid] || 0;
  if (prev === v) delete pr.ratings[d.rid]; else pr.ratings[d.rid] = v;
  render();
  const plan = acct().plan;
  const inWeek = plan && plan.meals.flat().includes(d.rid);
  if (pr.ratings[d.rid] === -1) {
    toast(inWeek ? "Got it. We won't plan it again. It's still in this week; replace it from the Plan tab." : "Got it. We won't plan it again.", { undo: () => { if (prev) pr.ratings[d.rid] = prev; else delete pr.ratings[d.rid]; render(); } });
  } else if (pr.ratings[d.rid] === 1) toast("Saved. You'll see it more often.");
};

ACT.openRateWeek = () => { U.sheet = null; openSheet('rateWeek', { tall: true }); };
SHEETS.rateWeek = () => {
  const p = acct().plan || acct().lastPlan;
  const ids = [...new Set(p.meals.flat())];
  return `<div class="sheet-head"><h2>How was this week?</h2><p class="muted">Liked meals come back more often. Disliked ones never return.</p></div>
    <div class="sheet-body"><div class="card list-card">${ids.map((rid) => `<div class="rate-item">${thumb(rid, 40)}<span class="grow">${esc(RECIPE[rid].name)}</span>
      <button class="rate ${myRating(rid) === 1 ? 'on' : ''}" data-act="rate" data-rid="${rid}" data-v="1" aria-label="Liked">👍</button>
      <button class="rate ${myRating(rid) === -1 ? 'on bad' : ''}" data-act="rate" data-rid="${rid}" data-v="-1" aria-label="Disliked">👎</button></div>`).join('')}</div></div>
    <div class="sheet-foot">${btn('Done', 'closeSheet')}</div>`;
};
