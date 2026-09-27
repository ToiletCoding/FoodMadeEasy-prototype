// Mix & match: meals built from a protein, a carb, a vegetable and a flavour.
// Any valid combination becomes a full recipe (ingredients, steps, prep, portions) on demand,
// under the id "mix:<protein>:<carb>:<veg>:<flavour>". A library of classic pairings is
// generated from the same parts so the planner has plenty of meals to choose from.

const MIX = {
  protein: {
    chicken: { label: 'Chicken', ing: 'chicken', g: 180, type: 'chicken', emoji: '🍗', cook: 'Slice and pan-fry, 8 min, until cooked through.', cook_da: 'Skær i skiver, og steg på panden i 8 min, til den er gennemstegt.', min: 10 },
    chickmince: { label: 'Chicken Mince', ing: 'chickmince', g: 170, type: 'chicken', emoji: '🐔', cook: 'Brown in a large pan, 7 min, breaking it up.', cook_da: 'Brun i en stor pande, 7 min, og del det ud.', min: 8 },
    beeflean: { label: 'Lean Beef', ing: 'beeflean', g: 170, type: 'beef', emoji: '🥩', cook: 'Brown in a large pan, 6 min, breaking it up.', cook_da: 'Brun i en stor pande, 6 min, og del det ud.', min: 7 },
    mixmince: { label: 'Beef & Pork', ing: 'mixmince', g: 150, type: ['beef', 'pork'], emoji: '🍖', cook: 'Brown in a large pan, 6 min, breaking it up.', cook_da: 'Brun i en stor pande, 6 min, og del det ud.', min: 7 },
    pork: { label: 'Pork Tenderloin', ing: 'pork', g: 170, type: 'pork', emoji: '🥓', cook: 'Sear on all sides, then roast at 200°C for 18 min. Rest 5 min and slice.', cook_da: 'Brun på alle sider, og steg så ved 200°C i 18 min. Lad hvile 5 min, og skær i skiver.', min: 25, oven: true, wait: 18 },
    porkchop: { label: 'Pork Chops', ing: 'porkchop', g: 170, type: 'pork', emoji: '🍖', cook: 'Season and fry 4 min per side.', cook_da: 'Krydr, og steg 4 min på hver side.', min: 10 },
    salmon: { label: 'Salmon', ing: 'salmon', g: 150, type: 'fish', emoji: '🐟', cook: 'Season and bake at 200°C for 15 min.', cook_da: 'Krydr, og bag ved 200°C i 15 min.', min: 15, oven: true, wait: 15, noFreeze: true },
    cod: { label: 'Cod', ing: 'cod', g: 200, type: 'fish', emoji: '🐠', cook: 'Season with salt, pepper and lemon. Bake at 200°C for 15 min.', cook_da: 'Krydr med salt, peber og citron. Bag ved 200°C i 15 min.', min: 15, oven: true, wait: 15 },
    tuna: { label: 'Tuna', ing: 'tuna', g: 130, type: 'fish', emoji: '🥫', cook: 'Drain the tuna.', cook_da: 'Hæld vandet fra tunen.', min: 2, noFreeze: true },
    eggs: { label: 'Egg', ing: 'eggs', g: 180, type: 'eggs', emoji: '🍳', cook: 'Scramble in a large pan and set aside.', cook_da: 'Lav røræg i en stor pande, og sæt dem til side.', min: 6 },
    tofu: { label: 'Tofu', ing: 'tofu', g: 200, type: 'plant', emoji: '🥢', cook: 'Press, cube and fry until golden, 10 min.', cook_da: 'Pres, skær i tern, og steg til den er gylden, 10 min.', min: 12 },
    chickpeas: { label: 'Chickpea', ing: 'chickpeas', g: 220, type: 'plant', emoji: '🫘', cook: 'Drain, rinse and fry with the spices, 5 min.', cook_da: 'Hæld vandet fra, skyl, og steg med krydderierne, 5 min.', min: 6 },
    lentils: { label: 'Lentil', ing: 'lentils', g: 85, type: 'plant', emoji: '🥘', cook: 'Rinse the lentils. Fry the spices in a large pot for 1 min, add the lentils and twice the water, simmer 10 min.', cook_da: 'Skyl linserne. Steg krydderierne i en stor gryde i 1 min, tilsæt linserne og dobbelt så meget vand, og lad det simre 10 min.', min: 22 },
  },
  carb: {
    rice: { label: 'Rice', ing: 'rice', g: 100, cooked: 'cooked rice' },
    pasta: { label: 'Pasta', ing: 'pasta', g: 100, cooked: 'cooked pasta' },
    potatoes: { label: 'Potatoes', ing: 'potatoes', g: 330, oven: true, noFreeze: true, cooked: 'potatoes' },
    noodles: { label: 'Noodles', ing: 'noodles', g: 95, cooked: 'cooked noodles' },
    tortilla: { label: 'Wraps', ing: 'tortilla', g: 92, cooked: 'wraps (keep separate)' },
    bulgur: { label: 'Bulgur', ing: 'bulgur', g: 95, cooked: 'cooked bulgur' },
    sweetpot: { label: 'Sweet Potato', ing: 'sweetpot', g: 330, oven: true, cooked: 'sweet potato' },
  },
  veg: {
    broccoli: { label: 'Broccoli', ing: [['broccoli', 150]] },
    wokveg: { label: 'Wok Veg', ing: [['wokveg', 150]] },
    peppers: { label: 'Peppers', ing: [['pepper', 80], ['onion', 50]] },
    carrots: { label: 'Carrots', ing: [['carrots', 110], ['onion', 40]] },
    greenbeans: { label: 'Green Beans', ing: [['greenbeans', 150]] },
  },
  flavour: {
    teriyaki: { label: 'Teriyaki', ing: [['teriyaki', 40]], finish: 'Add the teriyaki sauce and toss for 2 min until glossy.', finish_da: 'Tilsæt teriyakisaucen, og vend i 2 min, til det er blankt.', wait: 0, carbs: ['rice', 'noodles'], exclude: ['lentils', 'tuna', 'chickpeas'], veg: 'wokveg', bg: '#f3dcc4', name: 'Teriyaki {p}' },
    curry: { label: 'Curry', ing: [['coconut', 100]], finish: 'Add the coconut milk and curry powder. Simmer 10 min.', finish_da: 'Tilsæt kokosmælk og karry. Lad det simre 10 min.', wait: 10, carbs: ['rice', 'noodles', 'bulgur', 'potatoes'], exclude: ['tuna', 'porkchop', 'pork'], veg: 'greenbeans', bg: '#f7e3b5', name: '{p} Curry' },
    tomato: { label: 'Tomato & Herb', ing: [['tomatoes', 150]], finish: 'Add the chopped tomatoes, oregano and basil. Simmer 15 min.', finish_da: 'Tilsæt hakkede tomater, oregano og basilikum. Lad det simre 15 min.', wait: 15, carbs: ['pasta', 'rice', 'bulgur', 'potatoes'], exclude: ['porkchop', 'pork', 'salmon'], veg: 'carrots', bg: '#f5d9c7', name: 'Tomato & Herb {p}' },
    taco: { label: 'Taco', ing: [['tomatoes', 70], ['beans', 60]], finish: 'Add taco spices, the tomatoes and the beans. Cook 8 min.', finish_da: 'Tilsæt tacokrydderi, tomater og bønner. Steg 8 min.', wait: 8, carbs: ['rice', 'tortilla', 'bulgur', 'sweetpot'], exclude: ['tuna', 'salmon', 'cod', 'pork'], veg: 'peppers', bg: '#e8ecc9', name: 'Taco {p}' },
    pesto: { label: 'Pesto', ing: [['pesto', 25]], finish: 'Stir in the pesto off the heat.', finish_da: 'Rør pestoen i, når panden er taget af varmen.', wait: 0, carbs: ['pasta', 'potatoes', 'rice'], exclude: ['lentils', 'chickpeas', 'tofu', 'porkchop', 'mixmince', 'eggs'], veg: 'broccoli', bg: '#dcebd2', name: 'Pesto {p}', dry: true },
    lemon: { label: 'Lemon & Herb', ing: [], finish: null, carbs: ['rice', 'pasta', 'potatoes', 'bulgur', 'sweetpot', 'noodles'], exclude: ['lentils', 'chickpeas', 'mixmince', 'beeflean', 'chickmince', 'tofu', 'eggs'], veg: 'greenbeans', bg: '#eef0d0', name: 'Lemon & Herb {p}', dry: true },
  },
};

function mixId(p, c, v, f) { return `mix:${p}:${c}:${v}:${f}`; }
function cap1(x) { return x.charAt(0).toUpperCase() + x.slice(1); }

function mixCompatible(p, c, v, f) {
  const F = MIX.flavour[f];
  return !!(MIX.protein[p] && MIX.carb[c] && MIX.veg[v] && F && F.carbs.includes(c) && !F.exclude.includes(p));
}

function buildMix(id) {
  const [, p, c, v, f] = id.split(':');
  if (!mixCompatible(p, c, v, f)) return null;
  const P = MIX.protein[p], C = MIX.carb[c], V = MIX.veg[v], F = MIX.flavour[f];
  const vegFrozen = V.ing.some(([x]) => ING[x].frozenVeg);
  const wraps = c === 'tortilla';
  const base = F.name.replace('{p}', P.label);
  const name = wraps ? `${base} Wraps with ${V.label}` : `${base} with ${C.label} & ${V.label}`;
  const ing = [[P.ing, P.g, 'p'], [C.ing, C.g, 'c'], ...V.ing.map(([x, g]) => [x, g, 'v']), ...F.ing.map(([x, g]) => [x, g, 'x']), ['oil', 8, 'x'], ['spices', 3, 'x']];
  const lower = (s) => s.toLowerCase();
  const steps = [];
  if (C.oven) steps.push('Heat the oven to 200°C.');
  if (CARB_COOK[C.ing]) steps.push(`Cook the ${lower(C.label)}: ${CARB_COOK[C.ing].how}`);
  steps.push(`${P.label}: ${P.cook}`);
  steps.push(vegFrozen ? `Steam or pan-fry the ${lower(V.label)} from frozen, 5 min.` : `Chop the ${lower(V.label)} and onion, then fry for 4 min.`);
  if (F.finish) steps.push(F.finish);
  else steps.push('Finish with lemon juice, a little olive oil, salt and chopped herbs.');
  steps.push(wraps ? 'Warm the wraps and fill them just before eating.' : 'Serve together.');
  // Danish steps (MIX_DA lives in i18n-da.js, which loads after this file; built lazily).
  const da = typeof MIX_DA !== 'undefined' ? MIX_DA : null;
  const stepsDa = da ? [
    ...(C.oven ? ['Tænd ovnen på 200°C.'] : []),
    ...(CARB_COOK[C.ing] ? [`${cap1(da.carb[c])}: ${CARB_COOK[C.ing].how_da}`] : []),
    `${cap1(da.protein[p])}: ${P.cook_da}`,
    vegFrozen ? `Damp eller steg ${da.veg[v]} direkte fra frost, 5 min.` : `Hak ${da.veg[v]} og løg, og steg i 4 min.`,
    F.finish_da || 'Afslut med citronsaft, lidt olivenolie, salt og hakkede krydderurter.',
    wraps ? 'Varm wraps, og fyld dem lige før servering.' : 'Server det hele sammen.',
  ] : null;
  const vegIds = V.ing.map(([x]) => x);
  const flavourIds = F.ing.map(([x]) => x);
  const portion = F.dry
    ? [[lower(P.label) + (f === 'pesto' ? ' with pesto' : ''), [P.ing, ...flavourIds]], [C.cooked, [C.ing]], [lower(V.label), vegIds]]
    : [[`${lower(F.label)} ${lower(P.label)}${vegFrozen ? '' : ' & veg'}`, [P.ing, ...flavourIds, ...(vegFrozen ? [] : vegIds)]], [C.cooked, [C.ing]], ...(vegFrozen ? [[lower(V.label), vegIds]] : [])];
  const carbMin = CARB_COOK[C.ing] ? CARB_COOK[C.ing].min : 0;
  return {
    id, name, kind: 'main', mix: { p, c, v, f },
    emoji: P.emoji, bg: F.bg, protein: P.type, carb: c,
    minutes: Math.round((Math.max(carbMin, P.min) + 14) / 5) * 5,
    oven: !!(P.oven || C.oven), freezes: !(P.noFreeze || C.noFreeze),
    ing, steps, steps_da: stepsDa, portion,
    prepProtein: P.cook, prepProtein_da: P.cook_da, wait: P.wait || 0,
    finish: F.finish || undefined, finish_da: F.finish_da || undefined, finishWait: F.wait || 0,
    steamVeg: !!F.dry || vegFrozen,
  };
}

// Library: each protein with each flavour it suits, on the flavour's classic carb and veg,
// plus a second carb for variety.
const MIX_LIBRARY = [];
Object.keys(MIX.protein).forEach((p) => Object.entries(MIX.flavour).forEach(([f, F]) => {
  if (F.exclude.includes(p)) return;
  F.carbs.slice(0, 2).forEach((c, i) => {
    const v = i === 0 ? F.veg : (F.veg === 'broccoli' ? 'greenbeans' : 'broccoli');
    const r = buildMix(mixId(p, c, v, f));
    if (r) { r.library = true; MIX_LIBRARY.push(r); }
  });
}));
MIX_LIBRARY.forEach((r) => { RECIPES.push(r); RECIPE_BASE[r.id] = r; });

// Recipe lookup that also resolves any user-built "mix:" id.
const RECIPE = new Proxy(RECIPE_BASE, {
  get(t, id) {
    if (typeof id !== 'string') return undefined;
    if (t[id]) return t[id];
    if (id.startsWith('mix:')) {
      const r = buildMix(id);
      if (r) { t[id] = r; if (typeof registerRecipeDa === 'function') registerRecipeDa(r); }
      return r || undefined;
    }
    return undefined;
  },
});
