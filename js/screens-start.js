// S01–S14: launch, onboarding, account.

const OB_STEPS = ['goal', 'targets', 'food', 'planning', 'stores'];

function draftFor(root) { return root === 'edit' ? U.edit : S.onboarding.draft; }

// ---------- S01 Splash ----------

SCREENS.splash = () => `<div class="screen splash"><div class="wordmark"><span class="logo-dot"></span>FoodMadeEasy</div></div>`;
SCREENS.splash.after = () => {
  clearTimeout(SCREENS.splash.t);
  SCREENS.splash.t = setTimeout(routeFromLaunch, 900);
};

function routeFromLaunch() {
  if (U.route.name !== 'splash') return;
  if (!S.user) {
    if (S.onboarding.started && S.onboarding.step) return go('ob', { step: S.onboarding.step });
    return go('welcome');
  }
  const a = acct();
  if (!a.profile) return go('ob', { step: S.onboarding.step || 'goal' });
  go('home');
}

// ---------- S02 Welcome ----------

SCREENS.welcome = () => screen({
  cls: 'welcome',
  body: `<div class="hero-art">
      <div class="hero-card c1"><span>🍗</span><b>Plan</b><small>7 days · on macro</small></div>
      <div class="hero-card c2"><span>🛒</span><b>Shop</b><small>487 kr · 2 stores</small></div>
      <div class="hero-card c3"><span>🥡</span><b>Prep</b><small>14 meals · ~1h 20m</small></div>
    </div>
    <div class="pad">
      <h1 class="display">Eat for your goals. Spend less. Think less.</h1>
      <p class="lead">Tell us your macros, budget and stores. We'll plan your meals, your shopping list and your Sunday meal prep.</p>
    </div>`,
  footer: `${btn('Get Started', 'startOnboarding')}${btn('I already have an account', 'toLogin', { kind: 'text' })}`,
});
ACT.startOnboarding = () => {
  S.onboarding.started = true;
  S.onboarding.step = 'goal';
  go('ob', { step: 'goal' });
};
ACT.toLogin = () => push('login', {});

// ---------- Shared onboarding frame ----------

SCREENS.ob = ({ step, fromSummary }) => {
  S.onboarding.step = step;
  const d = S.onboarding.draft;
  const idx = OB_STEPS.indexOf(step);
  const def = STEP_DEFS[step];
  const ok = def.valid(d);
  const left = fromSummary ? '' : idx > 0 ? backBtn('obBack') : backBtn('obExit');
  return screen({
    top: `<header class="topbar ob-top"><div class="tb-left">${left}</div>
      <div class="ob-progress">${OB_STEPS.map((s, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tb-right step-label">${idx + 1} of 5</div></header>`,
    body: `<div class="pad"><h1 class="q">${def.title}</h1><p class="helper">${def.helper}</p>${def.body(d, 'ob')}</div>`,
    footer: `${!ok && def.hint ? `<div class="cta-hint">${def.hint(d)}</div>` : ''}${btn(fromSummary ? 'Save & return' : 'Continue', 'obNext', { disabled: !ok })}`,
  });
};

ACT.obBack = () => {
  const i = OB_STEPS.indexOf(U.route.props.step);
  go('ob', { step: OB_STEPS[i - 1] });
};
ACT.obExit = () => { go('welcome'); };
ACT.obNext = () => {
  const { step, fromSummary } = U.route.props;
  if (fromSummary) return go('summary');
  const i = OB_STEPS.indexOf(step);
  if (i < OB_STEPS.length - 1) go('ob', { step: OB_STEPS[i + 1] });
  else { S.onboarding.step = 'summary'; go('summary'); }
};

// ---------- Step definitions (reused by Profile S32) ----------

function targetErrors(d) {
  const rules = { kcal: [1200, 6000, 'kcal'], protein: [40, 400, 'g'], carbs: [0, 800, 'g'], fat: [20, 300, 'g'] };
  const errs = {};
  Object.entries(rules).forEach(([k, [lo, hi, u]]) => {
    const v = d[k];
    if (v === '' || v == null) { errs[k] = 'required'; return; }
    const n = Number(v);
    if (!Number.isFinite(n)) errs[k] = 'Enter a number.';
    else if (k === 'kcal' && n < 1200 && String(v).length >= 4) errs[k] = 'FoodMadeEasy plans for at least 1,200 kcal/day.';
    else if (n > hi || (n < lo && String(v).length >= String(hi).length)) errs[k] = `Enter between ${fmtNum(lo)} and ${fmtNum(hi)} ${u}.`;
    else if (n < lo) errs[k] = 'required';
  });
  return errs;
}

const STEP_DEFS = {
  goal: {
    title: 'What are you eating for?',
    helper: 'This helps us label your plan. You set the exact numbers next.',
    valid: (d) => !!d.goal,
    hint: () => 'Pick one to continue',
    body: (d, root) => `<div class="stack">${GOALS.map((g) => `
      <button class="option-card ${d.goal === g.id ? 'on' : ''}" data-act="setField" data-root="${root}" data-k="goal" data-v="${g.id}" aria-pressed="${d.goal === g.id}">
        <span class="oc-icon">${g.icon}</span><span><b>${g.label}</b><small>${g.desc}</small></span><span class="radio"></span></button>`).join('')}</div>`,
  },
  targets: {
    title: 'Your daily targets',
    helper: 'Already have your numbers? Just enter them. We plan around exactly what you put here.',
    valid: (d) => Object.keys(targetErrors(d)).length === 0,
    hint: () => 'Fill in all four targets',
    body: (d, root) => {
      const errs = targetErrors(d);
      const field = (k, label, unit, big) => {
        const e = errs[k] && errs[k] !== 'required' ? errs[k] : '';
        return `<label class="num-field ${big ? 'big' : ''} ${e ? 'err' : ''}"><span class="nf-label">${label}</span>
          <span class="nf-row"><input type="text" inputmode="numeric" autocomplete="off" data-bind="${root}.${k}" value="${esc(d[k])}" placeholder="${{ kcal: '3200', protein: '190', carbs: '380', fat: '100' }[k]}" maxlength="4"><span class="unit">${unit}</span></span>
          ${e ? `<span class="field-err">${e}</span>` : ''}</label>`;
      };
      let check = '';
      if (!errs.protein && !errs.carbs && !errs.fat && !errs.kcal) {
        const mk = 4 * d.protein + 4 * d.carbs + 9 * d.fat;
        const diff = mk - d.kcal;
        check = Math.abs(diff) <= d.kcal * 0.05
          ? `<div class="check good">${icon('check')} Your macros add up to ${fmtNum(mk)} kcal. Close enough.</div>`
          : `<div class="check warn">Your macros add up to ${fmtNum(mk)} kcal, ${fmtNum(Math.abs(diff))} ${diff < 0 ? 'less' : 'more'} than your calorie target. We'll plan to your macros.
             <button class="link" data-act="useMacroKcal" data-root="${root}" data-v="${Math.round(mk)}">Use ${fmtNum(mk)} kcal</button></div>`;
      }
      return `${field('kcal', 'Calories', 'kcal', true)}
        <div class="macro-grid">${field('protein', 'Protein', 'g')}${field('carbs', 'Carbs', 'g')}${field('fat', 'Fat', 'g')}</div>
        ${check}
        <button class="link" data-act="suggestSplit" data-root="${root}">Not sure? Suggest a split from my calories.</button>`;
    },
  },
  food: {
    title: 'What do you eat?',
    helper: 'Only what matters for planning. You can change this anytime.',
    valid: (d) => Engine.allowedProteins(d).length > 0,
    hint: () => 'Pick at least one protein',
    body: (d, root) => {
      const diets = [['none', 'No restrictions'], ['vegetarian', 'Vegetarian'], ['pescatarian', 'Pescatarian'], ['vegan', 'Vegan'], ['other', 'Other']];
      const allowed = Engine.allowedProteins({ ...d, proteins: PROTEINS.map((p) => p.id) });
      const noneOn = !d.allergies.length && !d.customAllergies.length;
      return `<div class="section-label">Diet</div>
        <div class="chips">${diets.map(([id, l]) => chip(l, d.diet === id, 'setField', { root, k: 'diet', v: id })).join('')}</div>
        ${d.diet === 'other' ? `<input class="text-input" type="text" data-bind="${root}.dietOther" value="${esc(d.dietOther)}" placeholder="Tell us briefly, e.g. halal, no red meat">` : ''}
        <div class="section-label">Allergies</div>
        <div class="chips">${chip('None', noneOn, 'clearAllergies', { root })}
          ${ALLERGIES.map((a) => chip(a, d.allergies.includes(a), 'toggleList', { root, k: 'allergies', v: a })).join('')}
          ${d.customAllergies.map((a) => chip(`${esc(a)} ×`, true, 'removeCustomAllergy', { root, v: a })).join('')}
          ${U.addingAllergy === root
            ? `<input class="chip-input" type="text" data-bind="form.allergyText" data-live="false" data-enter="addAllergy" data-root="${root}" placeholder="Type and press enter" data-autofocus>`
            : chip('+ Add', false, 'startAddAllergy', { root }, { cls: 'add' })}</div>
        <p class="fine">We'll never plan meals with these. Always check product labels, because allergen data may be incomplete.</p>
        <div class="section-label">Proteins you like</div>
        <div class="chips">${PROTEINS.map((p) => {
          const ok = allowed.includes(p.id);
          return chip(p.label, ok && d.proteins.includes(p.id), 'toggleList', { root, k: 'proteins', v: p.id }, { disabled: !ok });
        }).join('')}</div>
        ${allowed.length < PROTEINS.length ? `<p class="fine">Greyed-out proteins aren't in a ${d.diet} plan.</p>` : ''}
        <div class="section-label">Foods you won't eat <span class="opt">Optional</span></div>
        <button class="row-btn" data-act="openAvoid" data-root="${root}">
          <span>${d.avoid.length ? d.avoid.map((a) => `<span class="tag">${esc(a)}</span>`).join('') : '<span class="muted">Add foods to skip · e.g. mushrooms, tuna</span>'}</span>${icon('chev-right')}</button>`;
    },
  },
  planning: {
    title: 'How should your week work?',
    helper: 'Meals and budget matter most. The rest fine-tunes your plan.',
    valid: (d) => Number(d.budget) >= 150 && Number(d.budget) <= 5000,
    hint: (d) => (d.budget === '' ? 'Enter your weekly budget' : 'Budget must be between 150 and 5,000 kr'),
    body: (d, root) => {
      const slots = SLOT_SETS[d.mealsPerDay].map((s) => SLOT_LABEL[s]).join(' · ');
      const b = Number(d.budget);
      const budgetErr = d.budget !== '' && String(d.budget).length >= 3 && (b < 150 || b > 5000) ? (b < 150 ? "That's below what we can plan for a week." : 'Enter up to 5,000 kr.') : '';
      const vars = [['low', 'Low', 'Same few meals, cheapest and fastest prep'], ['balanced', 'Balanced', 'A few different meals each week'], ['high', 'High', 'More variety, more prep time']];
      const efforts = [['minimal', 'Minimal', 'Just get it done'], ['normal', 'Normal', 'A regular Sunday session'], ['enjoy', 'I enjoy cooking', 'Happy to spend more time']];
      return `<div class="section-label">Meals per day</div>
        <div class="stepper-row"><div class="stepper">
          <button data-act="stepMeals" data-root="${root}" data-v="-1" ${d.mealsPerDay <= 2 ? 'disabled' : ''} aria-label="Fewer">−</button>
          <b>${d.mealsPerDay}</b>
          <button data-act="stepMeals" data-root="${root}" data-v="1" ${d.mealsPerDay >= 6 ? 'disabled' : ''} aria-label="More">+</button></div>
          <span class="muted small">${slots}</span></div>
        <div class="section-label">Weekly grocery budget</div>
        <label class="num-field big ${budgetErr ? 'err' : ''}"><span class="nf-row"><input type="text" inputmode="numeric" data-bind="${root}.budget" value="${esc(d.budget)}" placeholder="600" maxlength="4"><span class="unit">kr / week</span></span>
          ${budgetErr ? `<span class="field-err">${budgetErr}</span>` : ''}</label>
        <div class="chips tight">${[400, 600, 800, 1000].map((v) => chip(fmtNum(v), Number(d.budget) === v, 'setField', { root, k: 'budget', v: String(v) })).join('')}</div>
        <p class="fine">For food only. We'll try to come in under it.</p>
        <div class="section-label">Variety</div>
        <div class="stack tight">${vars.map(([id, l, desc]) => `<button class="option-card slim ${d.variety === id ? 'on' : ''}" data-act="setField" data-root="${root}" data-k="variety" data-v="${id}"><span><b>${l}</b><small>${desc}</small></span><span class="radio"></span></button>`).join('')}</div>
        <div class="section-label">Cooking effort</div>
        <div class="seg three">${efforts.map(([id, l]) => `<button class="${d.effort === id ? 'on' : ''}" data-act="setField" data-root="${root}" data-k="effort" data-v="${id}">${l}</button>`).join('')}</div>
        <p class="fine">${efforts.find((e) => e[0] === d.effort)[2]}</p>`;
    },
  },
  stores: {
    title: 'Where do you shop?',
    helper: "Pick every store you'd be happy to use. We'll find the best offers across them.",
    valid: (d) => d.stores.length > 0,
    hint: () => 'Pick at least one store',
    body: (d, root) => `<div class="store-list">${STORES.map((s) => `
        <button class="store-row ${d.stores.includes(s.id) ? 'on' : ''}" data-act="toggleList" data-root="${root}" data-k="stores" data-v="${s.id}" aria-pressed="${d.stores.includes(s.id)}">
          <span class="store-logo" style="--sc:${s.color}">${esc(s.short.slice(0, 1))}</span><span class="grow">${esc(s.name)}</span><span class="checkbox"></span></button>`).join('')}</div>
      ${d.stores.length > 1 ? `<div class="section-label">How many stores will you visit each week?</div>
        <div class="seg three">${[[1, '1'], [2, 'Up to 2'], [3, 'Up to 3']].map(([v, l]) => `<button class="${d.storeCap === v ? 'on' : ''}" data-act="setField" data-root="${root}" data-k="storeCap" data-v="${v}" data-num="1">${l}</button>`).join('')}</div>
        <p class="fine">Fewer stores = easier shopping. More stores = bigger savings.</p>` : ''}`,
  },
};

ACT.setField = (dt) => {
  const d = draftFor(dt.root);
  d[dt.k] = dt.num ? Number(dt.v) : dt.v;
  if (dt.k === 'diet') d.proteins = PROTEINS.map((p) => p.id).filter((p) => Engine.allowedProteins({ ...d, proteins: [p] }).length);
  render();
};
ACT.toggleList = (dt) => {
  const d = draftFor(dt.root);
  const list = d[dt.k];
  const i = list.indexOf(dt.v);
  if (i >= 0) list.splice(i, 1); else list.push(dt.v);
  render();
};
ACT.clearAllergies = (dt) => { const d = draftFor(dt.root); d.allergies = []; d.customAllergies = []; render(); };
ACT.startAddAllergy = (dt) => { U.addingAllergy = dt.root; U.form = { ...(U.form || {}), allergyText: '' }; render(); };
ACT.addAllergy = (dt) => {
  const v = (U.form.allergyText || '').trim();
  const d = draftFor(dt.root);
  if (v) {
    const known = ALLERGIES.find((a) => a.toLowerCase() === v.toLowerCase());
    if (known) { if (!d.allergies.includes(known)) d.allergies.push(known); } else if (!d.customAllergies.includes(v)) d.customAllergies.push(v);
  }
  U.addingAllergy = null;
  render();
};
ACT.removeCustomAllergy = (dt) => { const d = draftFor(dt.root); d.customAllergies = d.customAllergies.filter((x) => x !== dt.v); render(); };
ACT.stepMeals = (dt) => { const d = draftFor(dt.root); d.mealsPerDay = Math.min(6, Math.max(2, d.mealsPerDay + Number(dt.v))); render(); };
ACT.useMacroKcal = (dt) => { draftFor(dt.root).kcal = dt.v; render(); };
ACT.suggestSplit = (dt) => {
  const d = draftFor(dt.root);
  const k = Number(d.kcal);
  if (!k || k < 1200) { toast('Enter your calories first'); return; }
  const [p, c, f] = d.goal === 'lose' ? [0.35, 0.4, 0.25] : [0.25, 0.5, 0.25];
  d.protein = String(Math.round((k * p) / 4 / 5) * 5);
  d.carbs = String(Math.round((k * c) / 4 / 5) * 5);
  d.fat = String(Math.round((k * f) / 9));
  render();
  toast('Filled in a starting point. Tweak anything.');
};

// ---------- S06 Foods to Avoid (sheet) ----------

ACT.openAvoid = (dt) => { U.form = { ...(U.form || {}), avoidQuery: '' }; openSheet('avoid', { root: dt.root, tall: true }); };
SHEETS.avoid = ({ root }) => {
  const d = draftFor(root);
  const q = (U.form.avoidQuery || '').trim();
  const pool = [...new Set([...COMMON_AVOID, ...Object.values(ING).filter((i) => !i.pantry).map((i) => i.name.replace(/ \(.*\)|,.*| \d.*$/g, ''))])];
  const matches = q ? pool.filter((x) => x.toLowerCase().includes(q.toLowerCase()) && !d.avoid.includes(x)).slice(0, 8) : [];
  return `<div class="sheet-head"><h2>Foods you won't eat</h2></div>
    <div class="sheet-body">
      <input class="text-input search" type="search" data-bind="form.avoidQuery" value="${esc(q)}" placeholder="Search foods" data-enter="addAvoidQuery" data-root="${root}" data-autofocus>
      ${d.avoid.length ? `<div class="chips">${d.avoid.map((a) => chip(`${esc(a)} ×`, true, 'removeAvoid', { root, v: a })).join('')}</div>` : ''}
      ${q ? `<div class="list">${matches.map((m) => `<button class="list-row" data-act="addAvoid" data-root="${root}" data-v="${esc(m)}">${esc(m)}</button>`).join('')}
          ${!matches.some((m) => m.toLowerCase() === q.toLowerCase()) ? `<button class="list-row accent" data-act="addAvoid" data-root="${root}" data-v="${esc(q)}">${matches.length ? '' : 'No match. '}Add ‘${esc(q)}’ anyway</button>` : ''}</div>`
        : `<div class="section-label">Common picks</div><div class="chips">${COMMON_AVOID.filter((c) => !d.avoid.includes(c)).map((c) => chip(c, false, 'addAvoid', { root, v: c })).join('')}</div>`}
    </div>
    <div class="sheet-foot">${btn('Done', 'closeSheet')}</div>`;
};
ACT.addAvoid = (dt) => { const d = draftFor(dt.root); if (!d.avoid.includes(dt.v)) d.avoid.push(dt.v); U.form.avoidQuery = ''; render(); };
ACT.addAvoidQuery = (dt) => { const v = (U.form.avoidQuery || '').trim(); if (v) ACT.addAvoid({ root: dt.root, v }); };
ACT.removeAvoid = (dt) => { const d = draftFor(dt.root); d.avoid = d.avoid.filter((x) => x !== dt.v); render(); };

// ---------- S09 Setup Summary ----------

function summaryRows(d) {
  const diet = { none: 'No restrictions', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', vegan: 'Vegan', other: d.dietOther || 'Other' }[d.diet];
  const allergies = [...d.allergies, ...d.customAllergies];
  const nProt = Engine.allowedProteins(d).length;
  return [
    ['goal', 'Goal', (GOALS.find((g) => g.id === d.goal) || {}).label || '—'],
    ['targets', 'Targets', `${fmtNum(d.kcal)} kcal · ${d.protein}P · ${d.carbs}C · ${d.fat}F`],
    ['food', 'Food', `${diet} · ${allergies.length ? `No ${allergies.join(', ').toLowerCase()}` : 'No allergies'} · ${nProt} protein${nProt === 1 ? '' : 's'}${d.avoid.length ? ` · Skipping: ${d.avoid.join(', ').toLowerCase()}` : ''}`],
    ['planning', 'Planning', `${d.mealsPerDay} meals/day · ${fmtNum(d.budget)} kr/week · ${{ low: 'Low', balanced: 'Balanced', high: 'High' }[d.variety]} variety · ${{ minimal: 'Minimal', normal: 'Normal', enjoy: 'Enjoys cooking' }[d.effort]} effort`],
    ['stores', 'Stores', `${d.stores.map((s) => STORES.find((x) => x.id === s).name).join(', ')}${d.stores.length > 1 ? ` · ${d.storeCap === 1 ? '1 store' : `up to ${d.storeCap}`} per week` : ''}`],
  ];
}

SCREENS.summary = () => {
  const d = S.onboarding.draft;
  if (!d.startDate || d.startDate < today()) d.startDate = nextMonday(today());
  return screen({
    top: topbar({ left: backBtn('summaryBack') }),
    body: `<div class="pad"><h1 class="q">Here's what we'll plan around</h1>
      <div class="card list-card">${summaryRows(d).map(([step, label, val]) => `
        <button class="sum-row" data-act="editStep" data-step="${step}"><span class="grow"><small>${label}</small><span>${esc(val)}</span></span><span class="edit">Edit</span></button>`).join('')}</div>
      <label class="card date-row"><span class="grow"><small>Plan starts</small><b>${fmtDay(d.startDate)}</b><span class="muted small">Shop and prep on ${fmtDay(addDays(d.startDate, -1))}.</span></span>
        <input type="date" data-bind="ob.startDate" value="${d.startDate}" min="${today()}" max="${addDays(today(), 7)}" aria-label="Change start date"><span class="edit">Change</span></label>
      <p class="helper center">You can change any of this later. Nothing is locked in.</p></div>`,
    footer: btn('Build My First Week', 'buildFirst', { disabled: !online() }) + (online() ? '' : '<div class="cta-hint">Connect to the internet to build your week.</div>'),
  });
};
ACT.summaryBack = () => go('ob', { step: 'stores' });
ACT.editStep = (dt) => go('ob', { step: dt.step, fromSummary: true });
ACT.buildFirst = () => {
  if (!S.user) { push('signup', { returnTo: 'generate' }); return; }
  completeOnboarding();
};

function completeOnboarding() {
  const a = acct();
  a.profile = finalizeProfile(S.onboarding.draft);
  S.onboarding = { step: null, draft: defaultDraft(), started: false };
  startGeneration({ origin: 'first', start: a.profile.startDate });
}

// ---------- S10 Create Account ----------

function authButtons() {
  return `<button class="btn social apple" data-act="social" data-m="apple"><span class="s-ic"></span>Continue with Apple</button>
    <button class="btn social google" data-act="social" data-m="google"><span class="s-ic">G</span>Continue with Google</button>
    <div class="divider"><span>or</span></div>`;
}

SCREENS.signup = ({ returnTo }) => {
  const f = U.form || (U.form = {});
  const emailOk = /^\S+@\S+\.\S+$/.test(f.email || '');
  const pwOk = (f.password || '').length >= 8;
  return screen({
    top: topbar({ left: backBtn() }),
    body: `<div class="pad"><h1 class="q">Save your setup</h1><p class="helper">Create a free account and we'll build your week right away.</p>
      ${!online() ? notice("You're offline. Connect to create your account. Your setup is saved on this phone.", { kind: 'warn', icon: 'wifi' }) : ''}
      ${authButtons()}
      <label class="field"><span>Email</span><input type="email" autocomplete="email" data-bind="form.email" value="${esc(f.email || '')}" placeholder="you@example.com"></label>
      ${f.err === 'taken' ? `<div class="field-err block">There's already an account with this email. <button class="link" data-act="toLoginFromSignup">Log in instead?</button></div>` : ''}
      <label class="field"><span>Password</span><span class="pw-row"><input type="${f.show ? 'text' : 'password'}" autocomplete="new-password" data-bind="form.password" value="${esc(f.password || '')}" placeholder="At least 8 characters">
        <button class="link" data-act="togglePw">${f.show ? 'Hide' : 'Show'}</button></span></label>
      ${f.password && !pwOk ? '<div class="field-hint">Use at least 8 characters.</div>' : ''}
      ${btn('Create Account', 'createAccount', { kind: emailOk && pwOk ? 'primary' : 'secondary', disabled: !emailOk || !pwOk || !online(), busy: U.busy })}
      <p class="fine center">By continuing you agree to our <a href="#" data-act="noop">Terms</a> and <a href="#" data-act="noop">Privacy Policy</a>.</p>
      <p class="center">Already have an account? <button class="link" data-act="toLoginFromSignup">Log in</button></p>
      <p class="proto-note">Prototype: accounts are stored only in this browser.</p></div>`,
  });
};
ACT.togglePw = () => { U.form.show = !U.form.show; render(); };
ACT.toLoginFromSignup = () => { U.form = { email: (U.form || {}).email }; push('login', { fromSignup: true }); };
ACT.social = (dt) => {
  if (!online()) { toast("You're offline. Connect to continue."); return; }
  const email = dt.m === 'apple' ? 'apple-demo@fme.test' : 'google-demo@fme.test';
  if (!S.accounts[email]) S.accounts[email] = { method: dt.m, name: 'Rasmus' };
  signIn(email, dt.m, !S.data[email] || !S.data[email].profile);
};
ACT.createAccount = () => {
  const f = U.form;
  const email = f.email.trim().toLowerCase();
  if (S.accounts[email]) { f.err = 'taken'; render(); return; }
  U.busy = true; render();
  setTimeout(() => {
    U.busy = false;
    S.accounts[email] = { method: 'email', pw: hashStr(f.password), name: email.split('@')[0].replace(/[^a-z]/gi, ' ').trim().split(' ')[0] };
    signIn(email, 'email', true);
  }, 700);
};

function signIn(email, method, isNew) {
  S.user = { email, method };
  U.form = {};
  const a = acct();
  const hasOnboarding = S.onboarding.started && S.onboarding.draft.goal;
  if (hasOnboarding && S.onboarding.step === 'summary') {
    if (a.profile) { U.pendingNew = isNew; go('conflict'); return; }
    U.accountCreated = isNew;
    completeOnboarding();
    return;
  }
  if (!a.profile) { S.onboarding.started = true; go('ob', { step: S.onboarding.step && S.onboarding.step !== 'summary' ? S.onboarding.step : 'goal' }); return; }
  go('home');
  toast(isNew ? 'Account created' : 'Welcome back');
}

// Login from S10 when the account already has a profile.
SCREENS.conflict = () => screen({
  top: topbar({}),
  body: `<div class="pad"><h1 class="q">You already have a saved profile</h1><p class="helper">Which setup should we plan with?</p>
    <div class="stack">
      <button class="option-card" data-act="resolveConflict" data-v="new"><span><b>Keep my new setup</b><small>Replaces your saved targets and preferences.</small></span>${icon('chev-right')}</button>
      <button class="option-card" data-act="resolveConflict" data-v="saved"><span><b>Use my saved profile</b><small>Discards what you just entered.</small></span>${icon('chev-right')}</button>
    </div></div>`,
});
ACT.resolveConflict = (dt) => {
  if (dt.v === 'new') { completeOnboarding(); return; }
  S.onboarding = { step: null, draft: defaultDraft(), started: false };
  const a = acct();
  if (a.plan || a.draft) go('home');
  else startGeneration({ origin: 'first' });
};

// ---------- S11 Log In ----------

SCREENS.login = () => {
  const f = U.form || (U.form = {});
  const ok = /^\S+@\S+\.\S+$/.test(f.email || '') && (f.password || '').length > 0;
  return screen({
    top: topbar({ left: backBtn() }),
    body: `<div class="pad"><h1 class="q">Welcome back</h1>
      ${!online() ? notice("You're offline. Connect to log in.", { kind: 'warn', icon: 'wifi' }) : ''}
      ${authButtons()}
      <label class="field"><span>Email</span><input type="email" autocomplete="email" data-bind="form.email" value="${esc(f.email || '')}" placeholder="you@example.com"></label>
      <label class="field ${f.err ? 'err' : ''}"><span>Password</span><span class="pw-row"><input type="${f.show ? 'text' : 'password'}" autocomplete="current-password" data-bind="form.password" value="${esc(f.password || '')}" data-enter="login">
        <button class="link" data-act="togglePw">${f.show ? 'Hide' : 'Show'}</button></span></label>
      ${f.err ? `<div class="field-err block">${f.err}</div>` : ''}
      ${btn('Log In', 'login', { disabled: !ok || !online() || (f.fails >= 5), busy: U.busy })}
      <p class="center"><button class="link" data-act="toForgot">Forgot password?</button></p>
      <p class="center">New here? <button class="link" data-act="startOnboarding">Get started</button></p>
      <p class="proto-note">Prototype: try “Continue with Apple”, or log in with an account you created in this browser.</p></div>`,
  });
};
ACT.login = () => {
  const f = U.form;
  const email = (f.email || '').trim().toLowerCase();
  U.busy = true; render();
  setTimeout(() => {
    U.busy = false;
    const acc = S.accounts[email];
    if (!acc || acc.pw !== hashStr(f.password || '')) {
      f.fails = (f.fails || 0) + 1;
      f.password = '';
      f.err = f.fails >= 5 ? 'Too many attempts. Try again in a few minutes, or reset your password.' : "That email and password don't match. Try again or reset your password.";
      render();
      return;
    }
    signIn(email, 'email', false);
  }, 600);
};
ACT.toForgot = () => push('forgot', {});

// ---------- S12–S14 Password reset ----------

SCREENS.forgot = () => {
  const f = U.form || (U.form = {});
  const ok = /^\S+@\S+\.\S+$/.test(f.email || '');
  return screen({
    top: topbar({ left: backBtn() }),
    body: `<div class="pad"><h1 class="q">Reset your password</h1><p class="helper">Enter your email and we'll send you a link.</p>
      <label class="field"><span>Email</span><input type="email" data-bind="form.email" value="${esc(f.email || '')}" placeholder="you@example.com" data-autofocus></label></div>`,
    footer: btn('Send Reset Link', 'sendReset', { disabled: !ok || !online(), busy: U.busy }),
  });
};
ACT.sendReset = () => {
  U.busy = true; render();
  setTimeout(() => { U.busy = false; U.resetSentAt = Date.now(); push('checkEmail', { email: U.form.email }); }, 600);
};
SCREENS.checkEmail = ({ email }) => {
  const wait = Math.max(0, 30 - Math.floor((Date.now() - (U.resetSentAt || 0)) / 1000));
  return screen({
    top: topbar({ left: backBtn() }),
    body: `<div class="pad center-col"><div class="big-emoji">✉️</div><h1 class="q">Check your email</h1>
      <p class="helper">We sent a reset link to <b>${esc(email)}</b>. It's valid for 1 hour. Check spam if it's not there.</p>
      <button class="link" data-act="resend" ${wait ? 'disabled' : ''}>${wait ? `Resend in ${wait}s` : 'Resend'}</button>
      <p class="proto-note">Prototype: <button class="link" data-act="openResetLink">open the reset link</button> to continue.</p></div>`,
    footer: `${btn('Open Email App', 'noop')}${btn('Back to log in', 'backToLogin', { kind: 'text' })}`,
  });
};
SCREENS.checkEmail.after = () => {
  clearTimeout(SCREENS.checkEmail.t);
  if (Date.now() - (U.resetSentAt || 0) < 31000) SCREENS.checkEmail.t = setTimeout(() => { if (U.route.name === 'checkEmail' && !U.sheet) render(); }, 1000);
};
ACT.resend = () => { U.resetSentAt = Date.now(); toast('Sent again'); render(); };
ACT.backToLogin = () => go('login');
ACT.openResetLink = () => go('newPassword', { email: U.form.email });
SCREENS.newPassword = ({ email }) => {
  const f = U.form || (U.form = {});
  return screen({
    top: topbar({}),
    body: `<div class="pad"><h1 class="q">Set a new password</h1><p class="helper">For ${esc(email)}</p>
      <label class="field"><span>New password</span><span class="pw-row"><input type="${f.show ? 'text' : 'password'}" data-bind="form.newPw" value="${esc(f.newPw || '')}" placeholder="At least 8 characters" data-autofocus>
      <button class="link" data-act="togglePw">${f.show ? 'Hide' : 'Show'}</button></span></label></div>`,
    footer: btn('Save Password', 'savePassword', { disabled: (f.newPw || '').length < 8, busy: U.busy }),
  });
};
ACT.savePassword = () => {
  const email = (U.route.props.email || '').trim().toLowerCase();
  if (!S.accounts[email]) S.accounts[email] = { method: 'email', name: email.split('@')[0] };
  S.accounts[email].pw = hashStr(U.form.newPw);
  signIn(email, 'email', false);
  toast('Password updated');
};
