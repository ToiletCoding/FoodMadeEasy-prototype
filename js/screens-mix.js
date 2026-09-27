// Mix & match UI: the meal builder (protein · carb · veg · flavour), used in
// S21 Replace Meal ("Build your own") and S44 Pick Your Meals.

const MIX_PARTS = [['p', 'protein', 'Protein'], ['c', 'carb', 'Carb'], ['v', 'veg', 'Veg'], ['f', 'flavour', 'Flavour']];

function mixAllowed(profile, sel) {
  const r = buildMix(mixId(sel.p, sel.c, sel.v, sel.f));
  return !!r && Engine.recipeAllowed(r, profile);
}

// Is this single part usable for the profile at all (diet, allergies, foods to skip, liked lists)?
function partAllowed(profile, kind, key) {
  const liked = Engine.allowedProteins(profile);
  const blocked = (id) => !!Engine.ingBlockedBy(id, profile);
  if (kind === 'p') { const P = MIX.protein[key]; return [].concat(P.type).every((t) => liked.includes(t)) && !blocked(P.ing); }
  if (kind === 'c') return (!profile.carbTypes || profile.carbTypes.includes(key)) && !blocked(MIX.carb[key].ing);
  if (kind === 'v') return MIX.veg[key].ing.every(([id]) => !blocked(id));
  return MIX.flavour[key].ing.every(([id]) => !blocked(id));
}

// After one part changes, repair the others so the combination stays valid.
function normalizeMix(profile, sel, changed) {
  const ok = () => mixAllowed(profile, sel);
  if (ok()) return sel;
  const keys = (kind) => Object.keys(MIX[{ p: 'protein', c: 'carb', v: 'veg', f: 'flavour' }[kind]]).filter((k) => partAllowed(profile, kind, k));
  const order = changed === 'f' ? ['c', 'p', 'v'] : changed === 'c' ? ['f', 'p', 'v'] : ['f', 'c', 'v'];
  for (const kind of order) {
    const orig = sel[kind];
    for (const k of keys(kind)) { sel[kind] = k; if (ok()) return sel; }
    sel[kind] = orig;
  }
  for (const f of keys('f')) for (const c of keys('c')) { sel.f = f; sel.c = c; if (ok()) return sel; }
  return sel;
}

function defaultMix(profile, i = 0, fromRid) {
  const r = fromRid && RECIPE[fromRid];
  if (r && r.mix) return { ...r.mix };
  const presets = [
    { p: 'chicken', c: 'rice', v: 'broccoli', f: 'teriyaki' },
    { p: 'beeflean', c: 'pasta', v: 'carrots', f: 'tomato' },
    { p: 'porkchop', c: 'potatoes', v: 'greenbeans', f: 'lemon' },
    { p: 'chickmince', c: 'tortilla', v: 'peppers', f: 'taco' },
  ];
  const sel = { ...presets[i % presets.length] };
  if (r) {
    const pIng = (r.ing.find((x) => x[2] === 'p') || [])[0];
    const pKey = Object.keys(MIX.protein).find((k) => MIX.protein[k].ing === pIng);
    if (pKey) sel.p = pKey;
    if (r.carb && MIX.carb[r.carb]) sel.c = r.carb;
  }
  ['p', 'c', 'v', 'f'].forEach((kind) => {
    if (!partAllowed(profile, kind, sel[kind])) {
      const first = Object.keys(MIX[{ p: 'protein', c: 'carb', v: 'veg', f: 'flavour' }[kind]]).find((k) => partAllowed(profile, kind, k));
      if (first) sel[kind] = first;
    }
  });
  return normalizeMix(profile, sel, 'p');
}

function mixChips(profile, sel, target) {
  return MIX_PARTS.map(([kind, group, label]) => {
    const chips = Object.entries(MIX[group]).map(([key, part]) => {
      if (!partAllowed(profile, kind, key)) return '';
      const test = { ...sel, [kind]: key };
      const fits = kind === 'f' || kind === 'c' ? mixCompatible(test.p, test.c, test.v, test.f) : true;
      const text = kind === 'p' ? `${part.emoji} ${part.label}` : part.label;
      return chip(text, sel[kind] === key, 'mixPick', { t: target, k: kind, v: key }, { cls: fits ? '' : 'dim' });
    }).join('');
    return `<div class="mix-row"><div class="mix-label">${label}</div><div class="chips mix-chips">${chips}</div></div>`;
  }).join('');
}

function mixSelFor(target) {
  if (target === 'replace') return U.replace.mix;
  return U.mixer.slots[Number(target.split(':')[1])];
}

ACT.mixPick = (d) => {
  const sel = mixSelFor(d.t);
  sel[d.k] = d.v;
  normalizeMix(acct().profile, sel, d.k);
  if (d.t === 'replace') U.replace.buildEval = null;
  render();
};

// ---------- S21 "Build your own" tab ----------

function replaceBuildBody() {
  const R = U.replace;
  const p = planFor(R.which);
  const profile = p.profile;
  if (!R.mix) R.mix = defaultMix(profile, 0, R.rid);
  const newId = mixId(R.mix.p, R.mix.c, R.mix.v, R.mix.f);
  const valid = mixAllowed(profile, R.mix) && newId !== R.rid;
  if (valid && (!R.buildEval || R.buildEval.id !== newId || R.buildEval.scope !== R.scope)) {
    const scope = R.scope === 'all' ? { type: 'all' } : { type: 'one', d: R.d, si: R.si };
    R.buildEval = { ...Engine.evaluateSwap(p, R.rid, newId, scope, today()), scope: R.scope };
  }
  const x = valid ? R.buildEval : null;
  const r = valid ? RECIPE[newId] : null;
  R.selected = valid ? newId : null;
  return `<div class="mix-builder">${mixChips(profile, R.mix, 'replace')}</div>
    ${x ? `<div class="card mix-preview">${thumb(newId, 52)}<div class="grow"><b>${esc(r.name)}</b>${macroLine(x.macros)}
      <div class="alt-meta"><span class="${x.cost > 0 ? '' : 'good'}">${Math.round(x.cost) === 0 ? 'Same cost' : `${signed(x.cost)} kr/week`}</span>
      <span class="${x.onTarget ? 'good' : 'warn'}">${x.onTarget ? 'Macros stay on target' : `${signed(x.dP)}P per day`}</span><span>${x.prep}</span></div></div></div>`
    : `<p class="fine center">${newId === R.rid ? 'That’s the meal you have now. Change a part to build something new.' : 'That combination doesn’t fit your food settings.'}</p>`}`;
}

// ---------- S44 Pick Your Meals ----------

function mainSlotLabels(profile) {
  const slots = SLOT_SETS[profile.mealsPerDay];
  const nMain = slots.filter((s) => MAIN_SLOTS.includes(s)).length;
  const k = profile.variety === 'low' ? 1 : profile.variety === 'high' && nMain === 2 ? 4 : Math.min(2, nMain);
  if (k === 1) return ['Lunch & dinner · all week'];
  if (k === 2) return ['Lunch · all week', 'Dinner · all week'];
  return ['Lunch · Mon–Thu', 'Dinner · Mon–Wed', 'Lunch · Fri–Sun', 'Dinner · Thu–Sun'];
}

ACT.openMixer = (d) => {
  const a = acct();
  U.sheet = null;
  const labels = mainSlotLabels(a.profile);
  const src = a.plan || a.lastPlan;
  const prevMains = src ? [...new Set(src.meals.flat().filter((rid) => RECIPE[rid].kind === 'main'))] : [];
  U.mixer = {
    origin: d.origin || 'new', start: d.start || null,
    slots: labels.map((_, i) => defaultMix(a.profile, i, prevMains[i])),
  };
  push('mixer');
};

SCREENS.mixer = () => {
  const a = acct();
  const labels = mainSlotLabels(a.profile);
  const M = U.mixer;
  const ids = M.slots.map((s) => mixId(s.p, s.c, s.v, s.f));
  const allOk = M.slots.every((s) => mixAllowed(a.profile, s));
  const dupes = new Set(ids).size < ids.length;
  return screen({
    top: topbar({ left: backBtn(), title: 'Pick your meals' }),
    body: `<div class="pad"><p class="helper">Choose what goes in your containers. We'll size the portions to your targets, add breakfasts and snacks, and build the shopping list.</p>
      ${M.slots.map((sel, i) => {
        const r = buildMix(ids[i]);
        return `<div class="card mixer-card"><div class="mixer-head">${r ? thumb(ids[i], 44) : ''}<div class="grow"><small>${labels[i]}</small><b>${r ? esc(r.name) : 'Pick a combination'}</b></div></div>
          ${mixChips(a.profile, sel, `slot:${i}`)}</div>`;
      }).join('')}
      ${dupes ? notice('Two of your slots are the same meal. That works, but you could pick something different for variety.', { kind: 'warn' }) : ''}</div>`,
    footer: btn('Build My Week', 'buildFromMixer', { disabled: !allOk || !online() }),
  });
};

ACT.buildFromMixer = () => {
  const M = U.mixer;
  const ids = M.slots.map((s) => mixId(s.p, s.c, s.v, s.f));
  startGeneration({ origin: M.origin, start: M.start || undefined, fixedMains: ids, seed: 7 + Math.floor(Math.random() * 1000) });
};
