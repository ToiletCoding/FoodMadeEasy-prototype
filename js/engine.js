// Plan generation engine. Runs entirely on the device for the prototype.
// Produces a full week: meals + portions, a store-optimized shopping list with real
// package counts, and a combined meal-prep session.

const Engine = (() => {
  const DIET_EXCLUDE = { none: [], other: [], vegetarian: ['meat', 'fish'], pescatarian: ['meat'], vegan: ['meat', 'fish', 'dairy', 'egg'] };
  const DIET_PROTEINS = {
    vegetarian: ['eggs', 'dairy', 'plant'],
    pescatarian: ['fish', 'eggs', 'dairy', 'plant'],
    vegan: ['plant'],
  };

  // ---------- Eligibility ----------

  function termMatches(term, ingId) {
    const t = term.trim().toLowerCase().replace(/(es|s)$/, '');
    if (!t) return false;
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e?s)?\\b`, 'i');
    const ing = ING[ingId];
    return re.test(ing.name) || ing.tags.some((tag) => re.test(tag));
  }

  function ingBlockedBy(ingId, profile) {
    const ing = ING[ingId];
    if (ing.pantry) return null;
    const ex = DIET_EXCLUDE[profile.diet] || [];
    if (ing.tags.some((t) => ex.includes(t))) return { type: 'diet' };
    const allergen = (ing.allergens || []).find((a) => profile.allergies.includes(a));
    if (allergen) return { type: 'allergy', value: allergen };
    const custom = (profile.customAllergies || []).find((a) => termMatches(a, ingId));
    if (custom) return { type: 'allergy', value: custom };
    const avoid = (profile.avoid || []).find((a) => termMatches(a, ingId));
    if (avoid) return { type: 'avoid', value: avoid };
    return null;
  }

  function allowedProteins(profile) {
    const byDiet = DIET_PROTEINS[profile.diet];
    return profile.proteins.filter((p) => !byDiet || byDiet.includes(p));
  }

  function recipeAllowed(r, profile) {
    if ((profile.excludedRecipes || []).includes(r.id)) return false;
    const liked = allowedProteins(profile);
    if (![].concat(r.protein).every((x) => liked.includes(x))) return false;
    if (r.kind === 'main' && r.carb && profile.carbTypes && !profile.carbTypes.includes(r.carb)) return false;
    return r.ing.every(([id]) => !ingBlockedBy(id, profile));
  }

  function eligible(profile, kind) {
    return RECIPES.filter((r) => r.kind === kind && recipeAllowed(r, profile));
  }

  // Which single relaxation would add the most recipes? Allergies are never suggested.
  function mostLimitingFilter(profile, kind) {
    const base = eligible(profile, kind).length;
    const tries = [];
    (profile.avoid || []).forEach((a) => tries.push({ label: `Allowing ${a.toLowerCase()}`, p: { ...profile, avoid: profile.avoid.filter((x) => x !== a) }, fix: 'food' }));
    if (profile.diet !== 'none') tries.push({ label: 'Dropping the diet filter', p: { ...profile, diet: 'none' }, fix: 'food' });
    if (profile.proteins.length < PROTEINS.length) tries.push({ label: 'Allowing all proteins', p: { ...profile, proteins: PROTEINS.map((x) => x.id) }, fix: 'food' });
    if (profile.carbTypes && profile.carbTypes.length < CARBS.length) tries.push({ label: 'Allowing all carbs', p: { ...profile, carbTypes: CARBS.map((x) => x.id) }, fix: 'food' });
    let best = null;
    tries.forEach((t) => {
      const added = eligible(t.p, kind).length - base;
      if (added > 0 && (!best || added > best.added)) best = { ...t, added };
    });
    return best;
  }

  // ---------- Nutrition ----------

  function nutr(id, g) {
    const n = ING[id].n;
    return [(n[0] * g) / 100, (n[1] * g) / 100, (n[2] * g) / 100, (n[3] * g) / 100];
  }

  function roleScale(role, scale) {
    return role === 'p' ? scale.a : role === 'c' ? scale.b : 1;
  }

  function portionOf(plan, rid) {
    return (plan.portions[rid] || 1) * ((plan.userPortion && plan.userPortion[rid]) || 1);
  }

  // Per-serving ingredient amounts for a recipe in this plan.
  function servingIngs(plan, rid) {
    const r = RECIPE[rid];
    const pm = portionOf(plan, rid);
    return r.ing.map(([id, g, role]) => {
      const raw = g * roleScale(role, plan.scale) * pm;
      return [id, ING[id].pantry ? raw : round5(raw), role];
    });
  }

  function mealMacros(plan, rid) {
    const t = { kcal: 0, p: 0, c: 0, f: 0, g: 0 };
    servingIngs(plan, rid).forEach(([id, g]) => {
      const [k, p, c, f] = nutr(id, g);
      t.kcal += k; t.p += p; t.c += c; t.f += f;
      if (!ING[id].pantry) t.g += g * (ING[id].cooked || 1);
    });
    return t;
  }

  function dayTotals(plan, d) {
    const t = { kcal: 0, p: 0, c: 0, f: 0 };
    plan.meals[d].forEach((rid) => {
      const m = mealMacros(plan, rid);
      t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f;
    });
    return t;
  }

  function weekAvg(plan) {
    const t = { kcal: 0, p: 0, c: 0, f: 0 };
    for (let d = 0; d < 7; d++) {
      const x = dayTotals(plan, d);
      t.kcal += x.kcal / 7; t.p += x.p / 7; t.c += x.c / 7; t.f += x.f / 7;
    }
    return t;
  }

  // "On target" = kcal within ±5% and protein at least 95% of target.
  function dayStatus(plan, d) {
    const t = dayTotals(plan, d);
    const pr = plan.profile;
    const dk = t.kcal - pr.kcal;
    const dp = t.p - pr.protein;
    if (Math.abs(dk) > pr.kcal * 0.05) return { ok: false, label: `${signed(dk)} kcal`, dk, dp };
    if (t.p < pr.protein * 0.95) return { ok: false, label: `${signed(dp)}P`, dk, dp };
    return { ok: true, label: 'On target', dk, dp };
  }

  // Solve protein-role scale (a) and carb-role scale (b) so the weekly average hits kcal and protein.
  function solveScale(meals, profile, portions) {
    let K0 = 0, Kp = 0, Kc = 0, P0 = 0, Pp = 0, Pc = 0;
    meals.forEach((day) => day.forEach((rid) => {
      const pm = portions[rid] || 1;
      RECIPE[rid].ing.forEach(([id, g, role]) => {
        const [k, p] = nutr(id, g * pm);
        if (role === 'p') { Kp += k; Pp += p; } else if (role === 'c') { Kc += k; Pc += p; } else { K0 += k; P0 += p; }
      });
    }));
    [K0, Kp, Kc, P0, Pp, Pc] = [K0, Kp, Kc, P0, Pp, Pc].map((v) => v / 7);
    const Kt = profile.kcal, Pt = profile.protein;
    const clampA = (v) => Math.min(3, Math.max(0.5, v));
    const clampB = (v) => Math.min(3.2, Math.max(0.4, v));
    let a = 1, b = 1;
    const det = Kp * Pc - Kc * Pp;
    if (Kp > 0 && Math.abs(det) > 1e-6) {
      a = ((Kt - K0) * Pc - Kc * (Pt - P0)) / det;
      b = (Kp * (Pt - P0) - Pp * (Kt - K0)) / det;
    } else if (Kc > 0) {
      b = (Kt - K0 - Kp) / Kc;
    }
    if (a !== clampA(a)) { a = clampA(a); b = (Kt - K0 - a * Kp) / Kc; }
    if (b !== clampB(b)) { b = clampB(b); if (Kp > 0) a = clampA((Kt - K0 - b * Kc) / Kp); }
    return { a: Math.round(a * 100) / 100, b: Math.round(b * 100) / 100 };
  }

  // ---------- Prices and shopping ----------

  // Offers that apply on the shop day: real feeds (offers.js) where we have them, mock offers otherwise.
  function offersFor(shopDate, noData) {
    if (noData) return [];
    const real = OFFER_FEEDS.filter((f) => shopDate >= f.validFrom && shopDate <= f.validTo);
    const realStores = new Set(real.map((f) => f.store));
    const mock = OFFER_WEEKS[isoWeek(shopDate) % 2]
      .filter((o) => !realStores.has(o.store))
      .map((o) => ({ ...o, offerEnds: addDays(shopDate, o.ends) }));
    const actual = real.flatMap((f) => f.items.map((i) => ({ store: f.store, ing: i.ing, size: i.size, label: i.label, price: i.price, offerEnds: f.validTo, product: i.name, real: f.week })));
    return [...mock, ...actual];
  }

  function priceTable(shopDate, noData) {
    const offers = offersFor(shopDate, noData);
    const table = {};
    Object.entries(ING).forEach(([id, ing]) => {
      if (ing.pantry) return;
      table[id] = {};
      STORES.forEach((s) => {
        const vary = 0.93 + (hashStr(id + s.id) % 15) / 100;
        const opts = ing.packs
          .filter((p) => !p[3] || p[3].includes(s.id))
          .map(([size, label, base]) => ({ size, label, regular: Math.max(4, Math.round(base * s.level * vary)), offerEnds: null }));
        opts.forEach((o) => { o.price = o.regular; });
        const perGram = Math.min(...opts.map((o) => o.regular / o.size));
        offers.filter((o) => o.store === s.id && o.ing === id).forEach((o) => {
          const same = opts.find((x) => x.size === o.size);
          const regular = same ? same.regular : Math.max(4, Math.round(perGram * o.size * 1.05));
          if (o.price >= regular) return;
          const deal = { size: o.size, label: o.label || (same && same.label), regular, price: o.price, offerEnds: o.offerEnds, product: o.product || null, real: o.real || null };
          if (same) Object.assign(same, deal); else opts.push(deal);
        });
        table[id][s.id] = opts;
      });
    });
    return table;
  }

  function bestBuy(id, need, storeId, prices) {
    let best = null;
    prices[id][storeId].forEach((o) => {
      const count = Math.max(1, Math.ceil(need / o.size - 0.05)); // tolerate a shortfall under 5% of one pack
      const total = count * o.price;
      if (!best || total < best.total || (total === best.total && count < best.count)) best = { ...o, count, total, store: storeId };
    });
    return best;
  }

  function needsOf(plan) {
    const needs = {};
    plan.meals.forEach((day) => day.forEach((rid) => {
      servingIngs(plan, rid).forEach(([id, g]) => {
        if (ING[id].pantry) return;
        needs[id] = (needs[id] || 0) + g;
      });
    }));
    return needs;
  }

  function storeSubsets(stores, cap) {
    const out = [];
    for (let k = 1; k <= Math.min(cap, stores.length); k++) out.push(...combinations(stores, k));
    return out;
  }

  function optimizeStores(needs, stores, subsets, prices) {
    const ids = Object.keys(needs);
    const buys = {};
    ids.forEach((id) => { buys[id] = {}; stores.forEach((s) => { buys[id][s] = bestBuy(id, needs[id], s, prices); }); });
    let best = null;
    subsets.forEach((sub) => {
      let total = 0;
      const used = new Set();
      ids.forEach((id) => {
        let m = null;
        sub.forEach((s) => { if (!m || buys[id][s].total < m.total) m = buys[id][s]; });
        total += m.total;
        used.add(m.store);
      });
      if (!best || total < best.total - 0.5 || (Math.abs(total - best.total) <= 0.5 && used.size < best.subset.length)) {
        best = { total, subset: sub.filter((s) => used.has(s)) };
      }
    });
    return best;
  }

  function shoppingList(plan, today) {
    const prices = priceTable(plan.shopDate, plan.noData);
    const needs = needsOf(plan);
    const shop = plan.shop;
    const items = Object.entries(needs).map(([id, need]) => {
      let buy = null;
      plan.subset.forEach((s) => { const b = bestBuy(id, need, s, prices); if (!buy || b.total < buy.total) buy = b; });
      const offerEnded = !!(buy.offerEnds && today > buy.offerEnds);
      const price = offerEnded ? buy.regular : buy.price;
      const bought = Math.min(shop.checked[id] || 0, buy.count);
      return {
        id, name: ING[id].name, aisle: ING[id].aisle, store: buy.store, count: buy.count, size: buy.size, label: buy.label,
        price, regular: buy.regular, offer: !!buy.offerEnds && !offerEnded, offerEnds: buy.offerEnds, offerEnded,
        need, total: buy.count * price, bought, checked: bought >= buy.count, have: !!shop.have[id], isNew: !!shop.isNew[id],
        product: buy.product, real: buy.real,
      };
    });
    const stores = plan.subset.map((sid) => {
      const its = items.filter((i) => i.store === sid).sort((a, b) => AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle) || a.name.localeCompare(b.name));
      const active = its.filter((i) => !i.have);
      return {
        id: sid, name: STORES.find((s) => s.id === sid).name, items: its,
        total: active.reduce((s, i) => s + i.total, 0),
        done: active.filter((i) => i.checked).length, count: active.length,
      };
    }).filter((s) => s.items.length);
    const active = items.filter((i) => !i.have);
    return {
      items, stores,
      total: active.reduce((s, i) => s + i.total, 0),
      savings: active.filter((i) => i.offer).reduce((s, i) => s + (i.regular - i.price) * i.count, 0),
      offersUsed: active.filter((i) => i.offer).length,
      count: active.length,
      done: active.filter((i) => i.checked).length,
      removed: shop.removed || [],
    };
  }

  // ---------- Layout ----------

  function kCounts(variety, nMain, nLight) {
    if (variety === 'low') return { main: nMain ? 1 : 0, light: nLight ? 1 : 0 };
    if (variety === 'high') return { main: nMain ? (nMain === 2 ? 4 : 2) : 0, light: nLight >= 2 ? 3 : nLight ? 2 : 0 };
    return { main: nMain ? Math.min(2, nMain) : 0, light: nLight >= 2 ? 2 : nLight };
  }

  // Assign recipes to the 7 × slots grid. Mains are batch-prepped; lights are made on the day.
  function layout(slots, variety, mainIds, lightIds) {
    const lightSlots = slots.filter((s) => !MAIN_SLOTS.includes(s));
    const meals = [];
    for (let d = 0; d < 7; d++) {
      meals.push(slots.map((slot) => {
        if (MAIN_SLOTS.includes(slot)) {
          if (mainIds.length === 1) return mainIds[0];
          const si = slot === 'lunch' ? 0 : 1;
          if (mainIds.length === 4) return si === 0 ? (d < 4 ? mainIds[0] : mainIds[2]) : (d < 3 ? mainIds[1] : mainIds[3]);
          return mainIds[si % mainIds.length];
        }
        const li = lightSlots.indexOf(slot);
        if (lightIds.length === 1) return lightIds[0];
        if (variety === 'high') {
          if (li === 0) return d < 4 ? lightIds[0] : lightIds[1];
          return lightIds[lightIds.length - 1];
        }
        return li === 0 ? lightIds[0] : lightIds[1];
      }));
    }
    return meals;
  }

  // ---------- Generation ----------

  function scoreCandidate(c, profile) {
    const pr = profile;
    const kdev = Math.abs(c.avg.kcal - pr.kcal) / pr.kcal;
    const pshort = Math.max(0, (pr.protein - c.avg.p) / pr.protein);
    const fdev = Math.abs(c.avg.f - pr.fat) / pr.fat;
    const cdev = Math.abs(c.avg.c - pr.carbs) / Math.max(pr.carbs, 50);
    const macroPenalty = 2000 * Math.max(0, kdev - 0.03) + 3000 * Math.max(0, pshort - 0.02);
    // Soft: fat/carb split and realistic portions (a scale far from 1 means odd-looking meals).
    const splitPenalty = 500 * Math.max(0, fdev - 0.2) + 300 * Math.max(0, cdev - 0.2);
    const portionPenalty = 250 * Math.max(0, Math.abs(Math.log(c.scale.a)) - 0.45) + 250 * Math.max(0, Math.abs(Math.log(c.scale.b)) - 0.55);
    const over = Math.max(0, c.cost - pr.budget);
    const effort = pr.effort === 'minimal' ? Math.max(0, c.prepMin - 70) * 0.8 : pr.effort === 'enjoy' ? 0 : Math.max(0, c.prepMin - 100) * 0.4;
    return { macroPenalty, total: c.cost + macroPenalty + splitPenalty + portionPenalty + over * 2 + effort + c.freezePenalty + c.prefPenalty };
  }

  function evaluate(profile, slots, variety, mainIds, lightIds, prices, subsets, start) {
    const meals = layout(slots, variety, mainIds, lightIds);
    const portions = {};
    const scale = solveScale(meals, profile, portions);
    const plan = { meals, portions, scale, userPortion: {}, profile };
    const avg = weekAvg(plan);
    const needs = needsOf(plan);
    const opt = optimizeStores(needs, profile.stores, subsets, prices);
    const cooked = new Set(meals.flatMap((day) => day.filter((rid) => RECIPE[rid].kind === 'main')));
    const mins = [...cooked].map((rid) => RECIPE[rid].minutes).sort((x, y) => y - x);
    const prepMin = mins.length ? mins[0] + mins.slice(1).reduce((s, m) => s + m * 0.5, 0) : 0;
    let freezePenalty = 0;
    meals.forEach((day, d) => day.forEach((rid) => { if (d > 2 && RECIPE[rid].kind === 'main' && !RECIPE[rid].freezes) freezePenalty += 6; }));
    // Taste: omnivores rarely want a week of lentils, and two mains on the same protein feel repetitive.
    const proteinIng = (rid) => (RECIPE[rid].ing.find((x) => x[2] === 'p') || [rid])[0];
    const plantDiet = ['vegetarian', 'vegan'].includes(profile.diet);
    let prefPenalty = 0;
    mainIds.forEach((rid) => { if (!plantDiet && [].concat(RECIPE[rid].protein).includes('plant')) prefPenalty += 90; });
    prefPenalty += (mainIds.length - new Set(mainIds.map(proteinIng)).size) * 60;
    prefPenalty += (lightIds.length - new Set(lightIds.map(proteinIng)).size) * 20;
    return { meals, portions, scale, avg, cost: opt.total, subset: opt.subset, prepMin, freezePenalty, prefPenalty, mainIds, lightIds };
  }

  // Rough value of one base serving: kr per 1,000 kcal, penalised when protein density is below target.
  function valueScore(r, profile, prices) {
    let cost = 0, kcal = 0, prot = 0;
    r.ing.forEach(([id, g]) => {
      const [k, p] = nutr(id, g);
      kcal += k; prot += p;
      if (ING[id].pantry) return;
      let best = Infinity;
      profile.stores.forEach((s) => prices[id][s].forEach((o) => { best = Math.min(best, o.price / o.size); }));
      cost += best * g;
    });
    const target = profile.protein / profile.kcal;
    return (cost / Math.max(kcal, 1)) * 1000 + 600 * Math.max(0, target - prot / Math.max(kcal, 1));
  }

  function generate(profile, opts = {}) {
    const start = opts.start || profile.startDate;
    const shopDate = addDays(start, -1);
    const slots = SLOT_SETS[profile.mealsPerDay];
    const nMain = slots.filter((s) => MAIN_SLOTS.includes(s)).length;
    const nLight = slots.length - nMain;
    const variety = opts.variety || profile.variety;
    const k = kCounts(variety, nMain, nLight);
    const mains = eligible(profile, 'main');
    const lights = eligible(profile, 'light');
    const prices = priceTable(shopDate, opts.noData);
    const subsets = storeSubsets(profile.stores, profile.storeCap);

    if (opts.fail) return { status: 'failed' };

    let candidates = [];
    if (opts.repeat) {
      const mainIds = [...new Set(opts.repeat.meals.flat().filter((r) => RECIPE[r].kind === 'main'))];
      const lightIds = [...new Set(opts.repeat.meals.flat().filter((r) => RECIPE[r].kind === 'light'))];
      const stillOk = [...mainIds, ...lightIds].every((rid) => recipeAllowed(RECIPE[rid], profile));
      if (stillOk) {
        const c = evaluate(profile, slots, variety, mainIds, lightIds, prices, subsets, start);
        c.meals = clone(opts.repeat.meals);
        candidates.push(c);
      }
    }

    if (!candidates.length) {
      if ((!opts.fixedMains && mains.length < k.main) || lights.length < k.light) {
        const kind = mains.length < k.main ? 'main' : 'light';
        return {
          status: 'nomatch', kind, found: kind === 'main' ? mains.length : lights.length, needed: kind === 'main' ? k.main : k.light,
          limiter: mostLimitingFilter(profile, kind), variety,
        };
      }
      const rng = makeRng(opts.seed || 1);
      // With a large library, search a pool: the best-value recipes plus a few random ones for variety.
      const pool = (list, top, extra) => {
        const ranked = list.map((r) => [r.id, valueScore(r, profile, prices)]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
        const rest = ranked.slice(top);
        for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
        return [...ranked.slice(0, top), ...rest.slice(0, extra)];
      };
      const mainSets = opts.fixedMains ? [opts.fixedMains] : combinations(pool(mains, 16, 8), k.main);
      const lightSets = combinations(pool(lights, 8, 4), k.light);
      let pairs = [];
      mainSets.forEach((m) => lightSets.forEach((l) => pairs.push([m, l])));
      if (pairs.length > 1400) {
        for (let i = pairs.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pairs[i], pairs[j]] = [pairs[j], pairs[i]]; }
        pairs = pairs.slice(0, 1400);
      }
      candidates = pairs.map(([m, l]) => {
        // Shuffle which main goes to lunch vs dinner so repeated builds differ (not for meals the user picked).
        const mm = opts.fixedMains || rng() < 0.5 ? m : m.slice().reverse();
        return evaluate(profile, slots, variety, mm, l, prices, subsets, start);
      });
    }

    const avoidKey = opts.avoid ? [...opts.avoid].sort().join() : null;
    const jitterRng = makeRng((opts.seed || 1) * 7919);
    candidates.forEach((c) => {
      const s = scoreCandidate(c, profile);
      c.macroPenalty = s.macroPenalty;
      c.score = s.total + (opts.seed > 1 ? jitterRng() * 60 : 0);
      if (avoidKey && [...c.mainIds].sort().join() === avoidKey) c.score += 400;
    });
    candidates.sort((x, y) => x.score - y.score);
    const best = candidates[0];

    const kShort = (profile.kcal - best.avg.kcal) / profile.kcal;
    const pShort = (profile.protein - best.avg.p) / profile.protein;

    // Macros can't be reached with these foods, regardless of budget.
    const macroFeasible = candidates.filter((c) => c.macroPenalty < 1);
    if (!macroFeasible.length && (pShort > 0.08 || Math.abs(kShort) > 0.08)) {
      const maxP = Math.max(...candidates.map((c) => c.avg.p));
      return { status: 'tight', blocker: 'targets', maxProtein: maxP, bestCost: best.cost, variety };
    }

    const cheapest = (macroFeasible.length ? macroFeasible : candidates).reduce((m, c) => (c.cost < m.cost ? c : m));
    if (cheapest.cost > profile.budget * 1.1) {
      let lowCost = null;
      if (variety !== 'low' && !opts.variety) {
        const low = generate(profile, { ...opts, variety: 'low', probe: true });
        if (low.status === 'ok') lowCost = low.cost;
      }
      if (opts.probe) return { status: 'tight', cost: cheapest.cost };
      return {
        status: 'tight', blocker: lowCost !== null && lowCost <= profile.budget ? 'variety' : 'budget',
        cheapestCost: cheapest.cost, lowVarietyCost: lowCost, variety,
      };
    }

    const chosen = best.cost > profile.budget * 1.1 ? cheapest : best;
    const plan = {
      id: uid(), status: 'draft', createdAt: Date.now(), start, shopDate,
      profile: clone(profile), slots, variety,
      meals: chosen.meals, portions: chosen.portions, userPortion: {}, scale: chosen.scale, subset: chosen.subset,
      noData: !!opts.noData, seed: opts.seed || 1, picked: !!opts.fixedMains,
      shop: { checked: {}, have: {}, isNew: {}, removed: [], doneShown: false },
      prep: { step: 0, started: null, done: null, startedAt: null },
    };
    if (opts.probe) return { status: 'ok', cost: chosen.cost };
    return { status: 'ok', plan, cost: chosen.cost };
  }

  // ---------- Meal prep ----------

  function prepPlan(plan) {
    const cookedIds = [];
    const servings = {};
    plan.meals.forEach((day, d) => day.forEach((rid, si) => {
      if (RECIPE[rid].kind !== 'main') return;
      if (!servings[rid]) { servings[rid] = []; cookedIds.push(rid); }
      servings[rid].push({ d, slot: plan.slots[si], date: addDays(plan.start, d) });
    }));
    if (!cookedIds.length) return { empty: true, steps: [], portioning: [], recipes: [], containers: 0, minutes: 0, totals: [] };

    const batch = (rid) => servingIngs(plan, rid).map(([id, g, role]) => [id, g * servings[rid].length, role]);
    const sumBy = (list) => {
      const m = {};
      list.forEach(([id, g]) => { m[id] = (m[id] || 0) + g; });
      return Object.entries(m);
    };
    const qtyLine = (id, g) => (ING[id].piece ? fmtIngQty(id, g) : `${fmtIngQty(id, g)} ${ING[id].name.toLowerCase()}${ING[id].dry ? ' (dry)' : ''}`);
    const steps = [];
    const recipesIn = (pred) => cookedIds.filter(pred).map((rid) => RECIPE[rid].name);

    const usesOven = cookedIds.some((rid) => RECIPE[rid].oven || batch(rid).some(([id, , role]) => id === 'potatoes' && role === 'c'));
    if (usesOven) steps.push({ title: 'Heat the oven to 200°C', qty: [], how: 'Line one or two baking trays while it heats.', recipes: recipesIn((rid) => RECIPE[rid].oven) });

    const carbs = sumBy(cookedIds.flatMap((rid) => batch(rid).filter(([id, , role]) => role === 'c' && CARB_COOK[id])));
    if (carbs.length) {
      steps.push({
        title: carbs.length > 1 ? 'Start the carbs' : `Start the ${ING[carbs[0][0]].name.split(' ').pop().toLowerCase()}`,
        qty: carbs.map(([id, g]) => qtyLine(id, g)),
        how: carbs.map(([id]) => CARB_COOK[id].how).join(' '),
        wait: Math.max(...carbs.map(([id]) => CARB_COOK[id].min)),
        waitLabel: carbs.length > 1 ? 'Carbs' : ING[carbs[0][0]].name.split(' ').pop(),
        recipes: recipesIn((rid) => batch(rid).some(([id, , role]) => role === 'c')),
        meanwhile: 'While they cook, go to the next step.',
      });
    }

    const chop = sumBy(cookedIds.flatMap((rid) => batch(rid).filter(([id]) => ING[id].chop)));
    if (chop.length) {
      steps.push({ title: 'Prep the vegetables', qty: chop.map(([id, g]) => qtyLine(id, g)), how: 'Peel and dice. Keep each recipe’s vegetables in its own bowl.', recipes: recipesIn((rid) => batch(rid).some(([id]) => ING[id].chop)) });
    }

    const proteinCount = {};
    cookedIds.forEach((rid) => { const p = RECIPE[rid].ing.find((x) => x[2] === 'p'); if (p) proteinCount[p[0]] = (proteinCount[p[0]] || 0) + 1; });
    cookedIds.forEach((rid) => {
      const r = RECIPE[rid];
      const p = batch(rid).filter(([, , role]) => role === 'p');
      if (!p.length) return;
      const pid = p[0][0];
      const noun = { chicken: 'chicken', beef: 'beef', pork: 'pork', salmon: 'salmon', cod: 'cod', tuna: 'tuna', eggs: 'eggs', tofu: 'tofu', lentils: 'dal' }[pid] || ING[pid].name.toLowerCase();
      steps.push({
        title: pid === 'lentils' ? 'Start the dal' : pid === 'tuna' ? 'Open the tuna' : `Cook the ${noun}`,
        subtitle: proteinCount[pid] > 1 ? `For ${r.name}` : null,
        qty: p.map(([id, g]) => qtyLine(id, g)), how: r.prepProtein, wait: r.wait || 0, waitLabel: noun[0].toUpperCase() + noun.slice(1), recipes: [r.name],
      });
    });

    const steamVeg = sumBy(cookedIds.filter((rid) => !RECIPE[rid].finish || RECIPE[rid].steamVeg).flatMap((rid) => batch(rid).filter(([id]) => ING[id].frozenVeg)));
    if (steamVeg.length) {
      steps.push({ title: 'Cook the vegetables', qty: steamVeg.map(([id, g]) => qtyLine(id, g)), how: 'Steam or pan-fry straight from frozen, 5–6 min. Don’t overcook; they reheat later.', wait: 6, waitLabel: 'Veg', recipes: recipesIn((rid) => !RECIPE[rid].finish && batch(rid).some(([id]) => ING[id].frozenVeg)) });
    }

    cookedIds.forEach((rid) => {
      const r = RECIPE[rid];
      if (!r.finish) return;
      const rest = batch(rid).filter(([id, , role]) => role !== 'p' && role !== 'c' && !ING[id].pantry && !ING[id].chop && !(ING[id].frozenVeg && r.steamVeg));
      steps.push({ title: `Finish the ${r.name.replace(/ with .*/, '').toLowerCase()}`, qty: rest.map(([id, g]) => qtyLine(id, g)), how: r.finish, wait: r.finishWait || 0, waitLabel: 'Simmer', recipes: [r.name] });
    });

    steps.push({ title: 'Let everything cool', qty: [], how: 'Spread it out for 10–15 minutes before portioning. Warm food in sealed containers spoils faster.', wait: 10, waitLabel: 'Cooling', recipes: [] });

    let n = 1;
    const portioning = cookedIds.map((rid) => {
      const r = RECIPE[rid];
      const per = servingIngs(plan, rid);
      const parts = r.portion.map(([label, ids]) => [label, per.filter(([id]) => ids.includes(id)).reduce((s, [id, g]) => s + g * (ING[id].cooked || 1), 0)]).filter(([, g]) => g > 0);
      const sv = servings[rid].slice().sort((a, b) => a.d - b.d);
      const from = n; n += sv.length;
      const initials = r.name.split(/[\s,&]+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('').slice(0, 3);
      return {
        rid, name: r.name, from, to: n - 1, count: sv.length, parts: parts.map(([l, g]) => [l, round5(g)]),
        fridge: [...new Set(sv.filter((s) => s.d <= 2).map((s) => weekday(s.date)))],
        freezer: [...new Set(sv.filter((s) => s.d > 2).map((s) => weekday(s.date)))],
        freezes: r.freezes, label: `${initials} · ${weekday(sv[sv.length - 1].date)}`, firstLabel: `${initials} · ${weekday(sv[0].date)}`,
      };
    });

    const mins = cookedIds.map((rid) => RECIPE[rid].minutes).sort((a, b) => b - a);
    const containers = n - 1;
    const minutes = Math.round((mins[0] + mins.slice(1).reduce((s, m) => s + m * 0.5, 0) + containers * 1.5) / 5) * 5;
    const totals = sumBy(cookedIds.flatMap((rid) => batch(rid).filter(([id, , role]) => !ING[id].pantry && (role === 'p' || role === 'c'))));
    const vegTotal = cookedIds.flatMap((rid) => batch(rid).filter(([id, , role]) => role === 'v')).reduce((s, [, g]) => s + g, 0);
    return {
      recipes: cookedIds.map((rid) => ({ rid, name: RECIPE[rid].name, count: servings[rid].length, slots: [...new Set(servings[rid].map((s) => SLOT_LABEL[s.slot]))], days: servings[rid].map((s) => s.date) })),
      steps, portioning, containers, minutes, totals, vegTotal,
      kit: kitList(cookedIds, containers, usesOven),
    };
  }

  function kitList(cookedIds, containers, oven) {
    const kit = [];
    const pots = cookedIds.filter((rid) => RECIPE[rid].finish).length + (cookedIds.some((rid) => RECIPE[rid].ing.some(([id]) => CARB_COOK[id] && id !== 'potatoes')) ? 1 : 0);
    if (pots) kit.push(`${pots} large pot${pots > 1 ? 's' : ''}`);
    kit.push('1 frying pan');
    if (oven) kit.push('baking trays');
    kit.push(`${containers} containers`);
    return kit;
  }

  // ---------- Replacement ----------

  function cookedCount(plan) {
    return new Set(plan.meals.flat().filter((rid) => RECIPE[rid].kind === 'main')).size;
  }

  function positionsFor(plan, rid, scope) {
    const pos = [];
    plan.meals.forEach((day, d) => day.forEach((r, si) => {
      if (scope.type === 'one') { if (d === scope.d && si === scope.si) pos.push([d, si]); } else if (r === rid) pos.push([d, si]);
    }));
    return pos;
  }

  function withSwap(plan, rid, newId, scope) {
    const next = clone(plan);
    positionsFor(plan, rid, scope).forEach(([d, si]) => { next.meals[d][si] = newId; });
    if (!plan.meals.flat().includes(newId)) {
      // Match the replaced meal's kcal so the rest of the week stays on target.
      const oldK = mealMacros(plan, rid).kcal;
      next.portions[newId] = 1;
      next.userPortion[newId] = 1;
      const newK = mealMacros(next, newId).kcal;
      next.portions[newId] = Math.min(1.6, Math.max(0.7, Math.round((oldK / newK) * 20) / 20));
    }
    return next;
  }

  function swapContext(plan, today) {
    return {
      shop: shoppingList(plan, today).total, avg: weekAvg(plan),
      prep: plan.meals.flat().some((x) => RECIPE[x].kind === 'main') ? prepPlan(plan).minutes : 0,
      cooked: cookedCount(plan),
    };
  }

  // What swapping rid for newId would do to the week: macros, cost, prep.
  function evaluateSwap(plan, rid, newId, scope, today, ctx = swapContext(plan, today)) {
    const r = RECIPE[rid];
    const c = RECIPE[newId];
    const pr = plan.profile;
    const next = withSwap(plan, rid, newId, scope);
    const avg = weekAvg(next);
    const cost = shoppingList(next, today).total - ctx.shop;
    const onTarget = Math.abs(avg.kcal - pr.kcal) <= pr.kcal * 0.05 && avg.p >= pr.protein * 0.95;
    const dP = avg.p - ctx.avg.p;
    const dCooked = cookedCount(next) - ctx.cooked;
    let prep = 'No prep change';
    if (c.kind === 'main') {
      const prepMin = prepPlan(next).minutes - ctx.prep;
      prep = dCooked > 0 ? `+${dCooked} recipe to prep` : prepMin > 4 ? `+${Math.round(prepMin)} min prep` : prepMin < -4 ? `${Math.round(prepMin)} min prep` : 'Same prep time';
    } else prep = `${c.minutes} min on the day`;
    return {
      id: newId, plan: next, macros: mealMacros(next, newId), cost, onTarget, dP, prep,
      score: cost + (onTarget ? 0 : 40) + Math.max(0, -dP) * 4 + Math.max(0, dCooked) * 25 + (plan.meals.flat().includes(newId) ? 15 : 0) + (r.kind === 'main' && c.library ? 3 : 0),
    };
  }

  function alternatives(plan, rid, scope, today, exclude = []) {
    const r = RECIPE[rid];
    const ctx = swapContext(plan, today);
    const prices = priceTable(plan.shopDate, plan.noData);
    const cands = RECIPES.filter((c) => c.kind === r.kind && c.id !== rid && !exclude.includes(c.id) && recipeAllowed(c, plan.profile));
    // Pre-rank cheaply, then fully evaluate the best 14.
    const ranked = cands.map((c) => [c, valueScore(c, plan.profile, prices)]).sort((a, b) => a[1] - b[1]).slice(0, 14).map((x) => x[0]);
    return ranked.map((c) => evaluateSwap(plan, rid, c.id, scope, today, ctx)).sort((a, b) => a.score - b.score);
  }

  // Recompute the shopping state after the meals changed: new items are flagged, dropped ones listed.
  function reconcileShopping(before, after, today) {
    const a = shoppingList(before, today);
    const b = shoppingList(after, today);
    const beforeIds = new Set(a.items.map((i) => i.id));
    const afterIds = new Set(b.items.map((i) => i.id));
    after.shop.isNew = { ...after.shop.isNew };
    b.items.forEach((i) => {
      const old = a.items.find((x) => x.id === i.id);
      if (!beforeIds.has(i.id) || (old && i.count > old.count)) after.shop.isNew[i.id] = Date.now();
    });
    after.shop.removed = a.items.filter((i) => !afterIds.has(i.id)).map((i) => i.name);
    return {
      added: b.items.filter((i) => !beforeIds.has(i.id)).length,
      removed: after.shop.removed.length,
      cost: b.total - a.total,
      total: b.total,
    };
  }

  return {
    generate, eligible, recipeAllowed, ingBlockedBy, allowedProteins, mostLimitingFilter,
    servingIngs, mealMacros, dayTotals, weekAvg, dayStatus,
    shoppingList, prepPlan, alternatives, evaluateSwap, withSwap, reconcileShopping, cookedCount, priceTable,
  };
})();
