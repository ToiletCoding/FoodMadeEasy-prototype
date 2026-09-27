// S31–S37 (profile, settings, notifications) and S40–S42 (generation errors).

// ---------- S31 Profile ----------

SCREENS.profile = () => {
  const a = acct();
  const pr = a.profile;
  const d = { ...pr };
  const rows = summaryRows(d);
  const card = (section, title, lines) => `<button class="card profile-card" data-act="editSection" data-s="${section}" ${online() ? '' : 'disabled'}>
    <span class="grow"><small>${title}</small>${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</span>${icon('chev-right')}</button>`;
  return screen({
    tab: 'profile',
    top: topbar({ title: 'Profile', large: true, sub: esc(S.user.email), right: `<button class="icon-btn" data-act="openSettings" aria-label="Settings">${icon('gear')}</button>` }),
    body: `<div class="pad">
      ${langSwitch()}
      ${card('targets', 'Targets', [rows[0][2], rows[1][2]])}
      ${card('food', 'Food', [rows[2][2]])}
      ${card('planning', 'Planning', [rows[3][2]])}
      ${card('stores', 'Stores', [rows[4][2]])}
      ${(() => { const r = Object.values(pr.ratings || {}); const up = r.filter((v) => v === 1).length, down = r.filter((v) => v === -1).length;
        return `<button class="card profile-card" data-act="openRatings"><span class="grow"><small>Your meals</small><span>${up || down ? `${up} liked · ${down} disliked` : 'Rate meals with 👍 or 👎 to steer your plans'}</span></span>${icon('chev-right')}</button>`; })()}
      <button class="card profile-card" data-act="openFeedback"><span class="grow"><small>Feedback</small><span>Tell us what's confusing, broken or missing</span></span>${icon('chev-right')}</button>
      <p class="fine center">Changes apply to your next plan. We'll ask before changing this week.</p>
      <p class="fine center version-line">\u2063${esc(APP_VERSION)}</p></div>`,
  });
};
ACT.openSettings = () => push('settings');

// ---------- S32 Edit Profile Section ----------

const SECTION_TITLES = { targets: 'Targets', food: 'Food', planning: 'Planning', stores: 'Stores' };

ACT.editSection = (d) => {
  if (!online()) { toast("You're offline. Connect to edit your profile."); return; }
  const pr = acct().profile;
  U.edit = { ...clone(pr), kcal: String(pr.kcal), protein: String(pr.protein), carbs: String(pr.carbs), fat: String(pr.fat), budget: String(pr.budget), restOn: !!pr.restKcal, restKcal: pr.restKcal ? String(pr.restKcal) : '', trainingDays: pr.trainingDays || [1, 2, 4, 5] };
  U.editOrig = JSON.stringify(U.edit);
  U.sheet = null;
  if (U.route.name === 'profile') push('edit', { section: d.s }); else { go('profile'); push('edit', { section: d.s }); }
};

function editValid(section) {
  const e = U.edit;
  if (section === 'targets') return STEP_DEFS.goal.valid(e) && STEP_DEFS.targets.valid(e);
  return STEP_DEFS[section].valid(e);
}

SCREENS.edit = ({ section }) => {
  const e = U.edit;
  const changed = JSON.stringify(e) !== U.editOrig;
  const ok = editValid(section);
  const body = section === 'targets'
    ? `<div class="section-label">Goal</div>${STEP_DEFS.goal.body(e, 'edit')}<div class="section-label">Daily targets</div>${STEP_DEFS.targets.body(e, 'edit')}`
    : STEP_DEFS[section].body(e, 'edit');
  return screen({
    top: topbar({ left: backBtn('editBack'), title: SECTION_TITLES[section] }),
    body: `<div class="pad">${U.saveError ? notice("Couldn't save. Your changes are still here.", { kind: 'warn' }) : ''}${body}</div>`,
    footer: btn(U.saveError ? 'Retry' : 'Save', 'saveSection', { disabled: !changed || !ok || !online(), busy: U.busy }) + (!online() ? '<div class="cta-hint">Connect to save</div>' : ''),
  });
};
ACT.editBack = () => {
  if (JSON.stringify(U.edit) !== U.editOrig) dialog({ title: 'Discard changes?', ok: 'Discard', danger: true, onOk: () => { U.saveError = false; back(); } });
  else back();
};
ACT.saveSection = () => {
  const a = acct();
  U.busy = true; render();
  setTimeout(() => {
    U.busy = false;
    if (!online()) { U.saveError = true; render(); return; }
    U.saveError = false;
    const before = a.profile;
    const after = finalizeProfile({ ...U.edit, startDate: before.startDate });
    a.profile = after;
    const affects = ['kcal', 'restKcal', 'trainingDays', 'prepMode', 'protein', 'carbs', 'fat', 'diet', 'allergies', 'customAllergies', 'proteins', 'avoid', 'mealsPerDay', 'budget', 'variety', 'effort', 'stores']
      .some((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    back();
    if (a.plan && affects) {
      const unsafe = [...new Set(a.plan.meals.flat())].filter((rid) => RECIPE[rid].ing.some(([id]) => {
        const b = Engine.ingBlockedBy(id, after);
        return b && b.type === 'allergy';
      }));
      U.applyChanges = { before, after, unsafe, choice: unsafe.length ? 'rebuild' : 'keep' };
      openSheet('applyChanges', {});
    } else {
      toast('Profile saved', { kind: 'good' });
      if (U.returnToNextWeek) { U.returnToNextWeek = false; go('home'); ACT.openNextWeek(); }
    }
  }, 600);
};

// ---------- S33 Apply Changes ----------

function changeSummary(b, a) {
  if (b.kcal !== a.kcal) return `Your targets changed from ${fmtNum(b.kcal)} to ${fmtNum(a.kcal)} kcal.`;
  if (b.protein !== a.protein) return `Your protein target changed from ${b.protein} to ${a.protein} g.`;
  if (b.budget !== a.budget) return `Your budget changed from ${fmtKr(b.budget)} to ${fmtKr(a.budget)}.`;
  if (b.mealsPerDay !== a.mealsPerDay) return `You now eat ${a.mealsPerDay} meals a day.`;
  if (JSON.stringify(b.stores) !== JSON.stringify(a.stores)) return 'Your stores changed.';
  return 'Your food preferences changed.';
}
SHEETS.applyChanges = () => {
  const x = U.applyChanges;
  const names = x.unsafe.map((rid) => RECIPE[rid].name);
  return `<div class="sheet-head"><h2>Apply to this week?</h2><p class="muted">${esc(changeSummary(x.before, x.after))}</p></div>
    <div class="sheet-body">
    ${x.unsafe.length ? notice(`${x.unsafe.length} meal${x.unsafe.length > 1 ? 's' : ''} this week contain${x.unsafe.length > 1 ? '' : 's'} a new allergy: ${names.map(esc).join(', ')}.`, { kind: 'warn' }) : ''}
    <div class="stack">
      <button class="option-card ${x.choice === 'rebuild' ? 'on' : ''}" data-act="applyChoice" data-v="rebuild"><span><b>Rebuild this week</b><small>Get a new plan with your new settings.</small></span><span class="radio"></span></button>
      <button class="option-card ${x.choice === 'keep' ? 'on' : ''}" data-act="applyChoice" data-v="keep"><span><b>Keep this week, use for next week</b><small>Nothing changes until your next plan.</small></span><span class="radio"></span></button>
    </div></div>
    <div class="sheet-foot">${btn('Confirm', 'applyConfirm')}</div>`;
};
ACT.applyChoice = (d) => { U.applyChanges.choice = d.v; render(); };
ACT.applyConfirm = () => {
  const x = U.applyChanges;
  U.sheet = null;
  if (x.choice === 'rebuild') { openSheet('rebuild', {}); return; }
  render();
  toast('Profile saved · applies to your next plan', { kind: 'good' });
  if (U.returnToNextWeek) { U.returnToNextWeek = false; go('home'); ACT.openNextWeek(); }
};

// ---------- S34 Settings ----------

SCREENS.settings = () => {
  const method = { apple: 'Apple', google: 'Google', email: 'Email and password' }[S.user.method];
  const row = (label, value, act, o = {}) => `<button class="set-row ${o.danger ? 'danger' : ''}" ${act ? `data-act="${act}"` : 'disabled'}><span class="grow">${label}</span>${value ? `<span class="muted">${value}</span>` : ''}${act && !o.danger ? icon('chev-right') : ''}</button>`;
  return screen({
    top: topbar({ left: backBtn(), title: 'Settings' }),
    body: `<div class="pad">
      <div class="section-label">Account</div>
      <div class="card list-card">${row('Email', esc(S.user.email))}${row('Sign-in method', method)}
        ${S.user.method === 'email' ? row('Change password', '', 'settingsPassword') : ''}</div>
      ${S.user.method === 'email' ? '<p class="fine">Confirm your email so you can recover your account.</p>' : ''}
      <div class="section-label">Preferences</div>
      <div class="card list-card">${row('Language', lang() === 'da' ? 'Dansk' : 'English', 'toggleLang')}${row('Notifications', S.settings.permission === 'granted' ? 'On' : S.settings.permission === 'denied' ? 'Off' : '', 'openNotifs')}${row('Units', 'Metric (g, kg)')}${row('Currency', 'DKK')}</div>
      <div class="section-label">About</div>
      <div class="card list-card">${row('Send feedback', '', 'openFeedback')}${row('How prices are estimated', '', 'openPricesInfo')}${row('Privacy Policy', '', 'noop')}${row('Terms', '', 'noop')}${row('Version', 'Prototype 0.1')}</div>
      <div class="card list-card">${row('Log out', '', 'logout', { danger: true })}${row('Delete account', '', 'openDelete', { danger: true })}</div>
      <div class="section-label">Prototype tools</div>
      <div class="card list-card dev-inline">${devControls()}</div></div>`,
  });
};
ACT.settingsPassword = () => { U.form = { email: S.user.email }; push('forgot'); };
ACT.openNotifs = () => push('notifs');
ACT.openPricesInfo = () => openSheet('pricesInfo', {});
SHEETS.pricesInfo = () => `<div class="sheet-head"><h2>How prices are estimated</h2></div><div class="sheet-body">
  <p class="body-text">We use each store's current weekly offers plus typical shelf prices. Prices are the same across a chain, so your local branch may differ a little.</p>
  <p class="body-text">You buy whole packages, so we round up: if you need 1.8 kg of chicken and it comes in 1 kg packs, your list says 2 × 1 kg.</p>
  <p class="body-text">Offers have end dates. When one ends mid-week, the list switches to the regular price.</p>
  <p class="fine">In this prototype all prices and offers are made up.</p></div>
  <div class="sheet-foot">${btn('Got it', 'closeSheet')}</div>`;
ACT.logout = () => dialog({
  title: 'Log out?', body: 'Your plan is saved to your account.', ok: 'Log out', danger: true,
  onOk: () => { S.user = null; U.form = {}; go('welcome'); },
});
ACT.openDelete = () => { U.form = { understand: false }; push('deleteAccount'); };

// ---------- S35 Notifications ----------

SCREENS.notifs = () => {
  const st = S.settings;
  const denied = st.permission === 'denied';
  const unknown = st.permission === 'unknown';
  const tog = (key, label, sub) => `<label class="toggle-row ${denied || unknown ? 'disabled' : ''}"><span class="grow"><b>${label}</b><small>${sub}</small></span>
    <input type="checkbox" class="switch" data-bind="settings.${key}" ${st[key] ? 'checked' : ''} ${denied || unknown ? 'disabled' : ''}></label>`;
  return screen({
    top: topbar({ left: backBtn(), title: 'Notifications' }),
    body: `<div class="pad">
      ${denied ? `${notice('Notifications are off for FoodMadeEasy. Turn them on in Settings.', { kind: 'warn' })}${btn('Open Settings', 'fakeOsSettings', { kind: 'secondary' })}` : ''}
      ${unknown ? `${notice('Reminders are off. Turn them on to get a nudge when offers change and when to move meals to the fridge.')}${btn('Turn On Reminders', 'openPrimer', { kind: 'secondary' })}` : ''}
      <div class="card list-card">
        ${tog('planning', 'Weekly planning reminder', `${st.planningTime} · “Next week's offers are in.”`)}
        ${tog('prep', 'Meal-prep reminder', `Prep day, ${st.prepTime}`)}
        ${tog('fridge', 'Move-to-fridge reminder', '20:00 the evening before a freezer day')}
      </div></div>`,
  });
};
ACT.fakeOsSettings = () => { S.settings.permission = 'granted'; toast('Prototype: pretended you allowed notifications in iOS Settings'); render(); };
ACT.openPrimer = () => openSheet('primer', {});

// ---------- S36 Delete Account ----------

SCREENS.deleteAccount = () => {
  const f = U.form || (U.form = {});
  return screen({
    top: topbar({ left: backBtn(), title: 'Delete account' }),
    body: `<div class="pad"><h1 class="q">Delete your account?</h1>
      <p class="body-text">This deletes your profile, your plans and your shopping lists.</p>
      <p class="body-text"><b>This can't be undone.</b></p>
      <label class="check-row"><input type="checkbox" data-bind="form.understand" ${f.understand ? 'checked' : ''}> I understand</label></div>`,
    footer: btn('Delete Account', 'deleteAccount', { kind: 'danger', disabled: !f.understand || !online(), busy: U.busy }),
  });
};
ACT.deleteAccount = () => dialog({
  title: `Confirm with ${S.user.method === 'email' ? 'your password' : S.user.method === 'apple' ? 'Face ID' : 'Google'}`,
  body: 'Prototype: this stands in for re-authentication.', ok: 'Delete', danger: true,
  onOk: () => {
    U.busy = true; render();
    setTimeout(() => {
      U.busy = false;
      delete S.accounts[S.user.email];
      delete S.data[S.user.email];
      S.user = null;
      go('welcome');
      toast('Your account has been deleted.');
    }, 700);
  },
});

// ---------- S37 Notification Primer ----------

SHEETS.primer = () => `<div class="sheet-body center-col"><div class="big-emoji">🔔</div><h2>Want a nudge next weekend?</h2>
  <div class="card list-card primer-ex"><div class="ing-row"><span><b>Sunday 10:00</b></span><span>Next week's offers are in.</span></div>
  <div class="ing-row"><span><b>20:00</b></span><span>Move Thursday's meals to the fridge.</span></div></div></div>
  <div class="sheet-foot">${btn('Turn On Reminders', 'primerYes')}${btn('Not now', 'primerNo', { kind: 'text' })}</div>`;
ACT.primerYes = async () => {
  U.sheet = null;
  if ('Notification' in window && window.isSecureContext) {
    let res = 'denied';
    try { res = await Notification.requestPermission(); } catch (e) { /* unsupported */ }
    S.settings.permission = res === 'granted' ? 'granted' : res === 'denied' ? 'denied' : 'unknown';
    render();
    if (res === 'granted') toast('Reminders on', { kind: 'good' });
    return;
  }
  dialog({
    title: '“FoodMadeEasy” Would Like to Send You Notifications', body: 'Notifications may include alerts, sounds and icon badges.', ok: 'Allow', cancel: "Don't Allow",
    onOk: () => { S.settings.permission = 'granted'; render(); toast('Reminders on', { kind: 'good' }); },
    onCancel: () => { S.settings.permission = 'denied'; render(); },
  });
};
ACT.primerNo = () => { closeSheet(); toast('Your week is prepped.', { kind: 'good' }); };

// ---------- S40 Plan Generation Failed ----------

SCREENS.genFailed = () => {
  const fails = (U.gen && U.gen.fails) || 1;
  return screen({
    top: topbar({ left: closeBtn('errorClose') }),
    body: `<div class="pad center-col"><div class="big-emoji">🍳</div><h1 class="q">We couldn't build your week</h1>
      <p class="helper">Something went wrong on our side. Your settings are saved.</p>
      ${fails >= 3 ? "<p class=\"helper\">We're looking into it. Try again in a few minutes.</p>" : ''}</div>`,
    footer: `${btn('Try Again', 'retryGen', { disabled: !online() })}${btn('Edit Preferences', 'errorEdit', { kind: 'text', data: { s: 'planning' } })}`,
  });
};
ACT.retryGen = () => startGeneration(U.gen ? U.gen.opts : { origin: 'new' });
ACT.errorClose = () => { const back = U.gen && U.gen.returnTo; U.gen = null; if (back && ['home', 'plan', 'shop', 'profile'].includes(back.name)) go(back.name); else go('home'); };
ACT.errorEdit = (d) => { U.gen = null; ACT.editSection({ s: d.s || 'planning' }); };

// ---------- S41 Constraints Too Tight ----------

SCREENS.tight = ({ r }) => {
  const pr = acct().profile;
  let explain = '';
  let primary = '';
  const secondary = [];
  if (r.blocker === 'targets') {
    explain = `With your food settings, the most protein we can fit is about <b>${Math.round(r.maxProtein)} g a day</b>. Your target is ${pr.protein} g.`;
    primary = btn('Edit Targets', 'errorEdit', { data: { s: 'targets' } });
    secondary.push(btn('Allow more foods', 'errorEdit', { kind: 'text', data: { s: 'food' } }));
  } else {
    const need = Math.ceil(r.cheapestCost / 50) * 50;
    explain = `The cheapest plan that hits ${fmtNum(pr.kcal)} kcal and ${pr.protein} g protein costs about <b>${fmtKr(r.cheapestCost)}</b>. Your budget is ${fmtKr(pr.budget)}.`;
    if (r.blocker === 'variety') {
      explain += ` With low variety it comes to about ${fmtKr(r.lowVarietyCost)}.`;
      primary = btn('Reduce Variety', 'fixVariety');
      secondary.push(btn(`Increase budget to ${fmtKr(need)}`, 'fixBudget', { kind: 'text', data: { v: need } }));
    } else {
      primary = btn(`Increase Budget to ${fmtKr(need)}`, 'fixBudget', { data: { v: need } });
      if (pr.variety !== 'low') secondary.push(btn('Reduce variety', 'fixVariety', { kind: 'text' }));
    }
    secondary.push(btn('Edit targets', 'errorEdit', { kind: 'text', data: { s: 'targets' } }));
  }
  return screen({
    top: topbar({ left: closeBtn('errorClose') }),
    body: `<div class="pad center-col"><div class="big-emoji">⚖️</div><h1 class="q">We couldn't make a realistic plan with these settings.</h1>
      <p class="helper">${explain}</p>
      ${pr.stores.length > pr.storeCap ? `<p class="fine">Allowing more stores per week can also bring the price down.</p>` : ''}</div>`,
    footer: `${primary}<div class="stack-text">${secondary.join('')}</div>`,
  });
};
ACT.fixBudget = (d) => { const a = acct(); a.profile.budget = Number(d.v); toast(`Budget set to ${fmtKr(d.v)}`); startGeneration(U.gen ? U.gen.opts : { origin: 'new' }); };
ACT.fixVariety = () => { const a = acct(); a.profile.variety = 'low'; toast('Variety set to Low'); startGeneration(U.gen ? U.gen.opts : { origin: 'new' }); };

// ---------- S42 Not Enough Meal Matches ----------

SCREENS.nomatch = ({ r }) => {
  const kindTxt = r.kind === 'main' ? 'lunch/dinner' : 'breakfast/snack';
  return screen({
    top: topbar({ left: closeBtn('errorClose') }),
    body: `<div class="pad center-col"><div class="big-emoji">🥦</div><h1 class="q">Not enough meals match your food settings.</h1>
      <p class="helper">${r.found === 0 ? `No ${kindTxt} recipes fit` : `Only ${r.found} ${kindTxt} recipe${r.found > 1 ? 's' : ''} fit${r.found > 1 ? '' : 's'}`}, and your variety setting needs ${r.needed}.</p>
      ${r.limiter ? `<p class="helper"><b>${esc(r.limiter.label)}</b> adds ${r.limiter.added} meal${r.limiter.added > 1 ? 's' : ''}.</p>` : ''}</div>`,
    footer: `${btn('Allow More Foods', 'errorEdit', { data: { s: 'food' } })}<div class="stack-text">${r.variety !== 'low' && r.found > 0 ? btn('Lower variety', 'fixVariety', { kind: 'text' }) : ''}</div>`,
  });
};

// ---------- Your meals (ratings) ----------

ACT.openRatings = () => push('ratings');
SCREENS.ratings = () => {
  const r = acct().profile.ratings || {};
  const list = (v) => Object.keys(r).filter((id) => r[id] === v && RECIPE[id]);
  const section = (title, ids, v) => `<div class="section-label">${title}</div>${ids.length ? `<div class="card list-card">${ids.map((id) => `<div class="rate-item">${thumb(id, 40)}<span class="grow">${esc(RECIPE[id].name)}</span>
    <button class="icon-btn" data-act="rate" data-rid="${id}" data-v="${v}" aria-label="Remove rating">${icon('x')}</button></div>`).join('')}</div>` : `<p class="fine">${v === 1 ? 'Nothing yet. Tap 👍 on a recipe you enjoyed.' : 'Nothing yet. Tap 👎 on a recipe to stop seeing it.'}</p>`}`;
  return screen({
    top: topbar({ left: backBtn(), title: 'Your meals' }),
    body: `<div class="pad"><p class="helper">Liked meals come back more often. Disliked meals are never planned.</p>
      ${section('Liked 👍', list(1), 1)}${section('Disliked 👎', list(-1), -1)}</div>`,
  });
};

// ---------- Feedback (testers) ----------

const FB_KINDS = [['bug', 'Something\'s broken'], ['confusing', 'Confusing'], ['idea', 'Idea'], ['numbers', 'Price or portion looks wrong']];

function feedbackContext() {
  const a = acct();
  const where = U.stack.length ? `${U.stack.map((r) => r.name).join(' > ')} > ${U.route.name}` : U.route.name;
  const lines = [`Screen: ${where}`, `App: ${APP_VERSION} · ${lang()} · simulated date ${today()}`, `Device: ${navigator.userAgent.replace(/\s*\([^)]*\)\s*/g, ' ').slice(0, 80)} · ${innerWidth}×${innerHeight}`];
  if (a && a.profile) {
    const pr = a.profile;
    lines.push(`Profile: ${pr.kcal} kcal${pr.restKcal ? ` (rest ${pr.restKcal})` : ''} · ${pr.protein}P ${pr.carbs}C ${pr.fat}F · ${pr.mealsPerDay} meals/day · ${pr.budget} kr · ${pr.variety} · ${pr.prepMode || 'one'} prep · stores ${pr.stores.join('+')} (max ${pr.storeCap}) · diet ${pr.diet}`);
    lines.push(`Home state: ${homeState()}`);
  }
  const p = a && (a.plan || a.draft);
  if (p) {
    const sl = Engine.shoppingList(p, today());
    lines.push(`Plan ${p.start}: ${[...new Set(p.meals.flat())].map((r) => RECIPE[r].name).join(', ')} · est. ${Math.round(sl.total)} kr at ${p.subset.join('+')}`);
  }
  return lines.join('\n');
}

ACT.openFeedback = () => {
  U.fb = { kind: null, ctx: true, screen: U.route.name };
  U.form = { ...(U.form || {}), fbText: '' };
  openSheet('feedback', { tall: true });
};
SHEETS.feedback = () => {
  const f = U.fb;
  const hasText = (U.form.fbText || '').trim().length > 0;
  return `<div class="sheet-head"><h2>Send feedback</h2><p class="muted">What happened, and what did you expect?</p></div>
    <div class="sheet-body">
      <div class="chips">${FB_KINDS.map(([id, l]) => chip(l, f.kind === id, 'fbKind', { v: id })).join('')}</div>
      <textarea class="text-input fb-text" data-bind="form.fbText" data-live="false" rows="5" placeholder="E.g. I couldn't find where to change my budget" data-autofocus>${esc(U.form.fbText || '')}</textarea>
      <label class="check-row"><input type="checkbox" data-act="fbCtx" ${f.ctx ? 'checked' : ''}> Include what I'm looking at and my plan settings</label>
      ${f.ctx ? `<details class="fb-ctx"><summary>What gets included</summary><pre>\u2063${esc(feedbackContext())}</pre></details>` : ''}
    </div>
    <div class="sheet-foot">${btn('Share Feedback', 'fbSend')}
      ${FEEDBACK_EMAIL ? `<a class="btn text" href="mailto:${esc(FEEDBACK_EMAIL)}?subject=${encodeURIComponent('FoodMadeEasy feedback')}&body=${encodeURIComponent(feedbackText())}" target="_blank" rel="noopener">Email instead</a>` : ''}</div>`;
};
function feedbackText() {
  const f = U.fb || {};
  const kind = (FB_KINDS.find((k) => k[0] === f.kind) || [null, 'Feedback'])[1];
  return `FoodMadeEasy feedback · ${kind}\n\n${(U.form.fbText || '').trim() || '(no text)'}${f.ctx ? `\n\n---\n${feedbackContext()}` : ''}`;
}
ACT.fbKind = (d) => { U.fb.kind = U.fb.kind === d.v ? null : d.v; render(); };
ACT.fbCtx = () => { U.fb.ctx = !U.fb.ctx; render(); };
ACT.fbSend = async () => {
  const text = feedbackText();
  try {
    if (!navigator.share) throw new Error('no share');
    await navigator.share({ title: 'FoodMadeEasy feedback', text });
    closeSheet();
    toast('Thanks for the feedback!', { kind: 'good' });
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    try {
      await navigator.clipboard.writeText(text);
      closeSheet();
      toast('Feedback copied. Paste it in a message to the FoodMadeEasy team.', { ms: 6000 });
    } catch (e2) {
      toast("Couldn't share or copy here. Take a screenshot instead.", { kind: 'warn' });
    }
  }
};
