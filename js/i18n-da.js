// Danish names and phrases for the translation layer in i18n.js.

// ---------- Names ----------

const ING_DA = {
  chicken: 'Kyllingebryst', chickmince: 'Hakket kylling 7–10%', beef: 'Hakket oksekød 8–12%', beeflean: 'Hakket oksekød 4–7%',
  mixmince: 'Hakket okse- og svinekød 8–12%', pork: 'Svinemørbrad', porkchop: 'Svinekoteletter', ham: 'Skinkepålæg',
  salmon: 'Laksefilet', smokedsalmon: 'Røget laks', cod: 'Torskefilet', tuna: 'Tun i vand', eggs: 'Æg', skyr: 'Skyr naturel',
  cottage: 'Hytteost', cheese: 'Skiveost 30+', milk: 'Letmælk 1,5%', tofu: 'Tofu, fast', oats: 'Havregryn', rice: 'Jasminris',
  pasta: 'Pasta', noodles: 'Fuldkornsnudler', bulgur: 'Bulgur', tortilla: 'Tortillawraps', lentils: 'Røde linser',
  chickpeas: 'Kikærter (dåse)', beans: 'Kidneybønner (dåse)', tomatoes: 'Hakkede tomater (dåse)', coconut: 'Kokosmælk, let',
  teriyaki: 'Teriyakisauce', pb: 'Peanutbutter', pesto: 'Grøn pesto', rye: 'Rugbrød', potatoes: 'Kartofler',
  sweetpot: 'Søde kartofler', onion: 'Løg', pepper: 'Peberfrugter', carrots: 'Gulerødder', banana: 'Bananer', apple: 'Æbler',
  wokveg: 'Wokgrøntsager', broccoli: 'Broccoli', greenbeans: 'Grønne bønner', berries: 'Blandede bær', oil: 'Olie',
  spices: 'Salt, peber & krydderier',
};

const RECIPE_DA = {
  crb: 'Kyllingebowl med ris', chili: 'Chili con carne med ris', burrito: 'Burritobowl med kylling', bolo: 'Pasta bolognese',
  salmon: 'Laks med kartofler & broccoli', traybake: 'Svinemørbrad i fad med kartofler', curry: 'Kyllingekarry med ris',
  cod: 'Torsk med ris & broccoli', pesto: 'Pestopasta med kylling', tunapasta: 'Pastasalat med tun', dal: 'Rød linsedal med ris',
  tofu: 'Wokket tofu med ris', eggrice: 'Stegte ris med æg',
  skyroats: 'Proteingrød med skyr', ryeeggs: 'Rugbrød med æg & ost', cottagebowl: 'Hytteost med banan', hamrye: 'Rugbrød med skinke',
  skyrberries: 'Skyr med bær', pbbanana: 'Rugbrød med peanutbutter & banan', tofuscramble: 'Tofuscramble på rugbrød',
  apples: 'Havregrød med æble & mælk', proteinoats: 'Overnight oats med skyr', salmonrye: 'Røget laks på rugbrød',
  eggwrap: 'Wrap med æg & ost', scrambledrye: 'Røræg på rugbrød', applepb: 'Æble, peanutbutter & skyr',
  cottagerye: 'Rugbrød med hytteost & skinke', hummusrye: 'Kikærtemos på rugbrød',
};

const MIX_DA = {
  protein: { chicken: 'kylling', chickmince: 'hakket kylling', beeflean: 'magert oksekød', mixmince: 'okse & svin', pork: 'svinemørbrad', porkchop: 'koteletter', salmon: 'laks', cod: 'torsk', tuna: 'tun', eggs: 'æg', tofu: 'tofu', chickpeas: 'kikærter', lentils: 'linser' },
  carb: { rice: 'ris', pasta: 'pasta', potatoes: 'kartofler', noodles: 'nudler', tortilla: 'wraps', bulgur: 'bulgur', sweetpot: 'søde kartofler' },
  veg: { broccoli: 'broccoli', wokveg: 'wokgrønt', peppers: 'peberfrugt', carrots: 'gulerødder', greenbeans: 'grønne bønner' },
  flavour: { teriyaki: 'teriyaki', curry: 'karry', tomato: 'tomat & urter', taco: 'taco', pesto: 'pesto', lemon: 'citron & urter' },
};

function mixNameDa({ p, c, v, f }) {
  const P = MIX_DA.protein[p], C = MIX_DA.carb[c], V = MIX_DA.veg[v];
  if (f === 'taco') return c === 'tortilla' ? `Tacowraps med ${P} & ${V}` : `Tacobowl med ${P}, ${C} & ${V}`;
  if (f === 'teriyaki') return `Teriyaki-${P} med ${C} & ${V}`;
  if (f === 'curry') return `Karry med ${P}, ${C} & ${V}`;
  if (f === 'tomato') return `${cap1(P)} i tomat & urter med ${C} & ${V}`;
  if (f === 'pesto') return `Pesto-${P} med ${C} & ${V}`;
  return `${cap1(P)} med citron & urter, ${C} & ${V}`;
}

const PORTION_DA = {
  chicken: 'kylling', 'cooked rice': 'kogte ris', vegetables: 'grøntsager', chili: 'chili', 'chicken & beans': 'kylling & bønner',
  cheese: 'ost', bolognese: 'bolognese', 'cooked pasta': 'kogt pasta', salmon: 'laks', potatoes: 'kartofler', broccoli: 'broccoli',
  pork: 'svinemørbrad', 'potatoes & veg': 'kartofler & grønt', curry: 'karry', cod: 'torsk', 'pesto pasta': 'pestopasta',
  'pasta salad': 'pastasalat', dal: 'dal', 'tofu & veg': 'tofu & grønt', 'fried rice': 'stegte ris', 'cooked noodles': 'kogte nudler',
  'wraps (keep separate)': 'wraps (pakkes for sig)', 'cooked bulgur': 'kogt bulgur', 'sweet potato': 'søde kartofler',
};

function registerRecipeDa(r) {
  const da = r.mix ? mixNameDa(r.mix) : RECIPE_DA[r.id];
  if (da) addNames({ [r.name]: da });
  if (r.mix) {
    const m = r.mix;
    const P = MIX_DA.protein[m.p], V = MIX_DA.veg[m.v], F = MIX_DA.flavour[m.f];
    const n = {};
    (r.portion || []).forEach(([label]) => {
      if (PORTION_DA[label]) return;
      const en = label;
      let d = en;
      if (en.includes(' with pesto')) d = `${P} med pesto`;
      else if (en.endsWith(' & veg')) d = `${F} ${P} & grønt`;
      else if (en === MIX.veg[m.v].label.toLowerCase()) d = V;
      else if (en === MIX.protein[m.p].label.toLowerCase()) d = P;
      else d = `${F} ${P}`;
      n[en] = d;
    });
    addNames(n);
  }
}

(function registerNames() {
  const n = {};
  Object.entries(ING_DA).forEach(([id, da]) => {
    if (!ING[id]) return;
    n[ING[id].name] = da;
    n[ING[id].name.toLowerCase()] = da.toLowerCase();
  });
  Object.assign(n, PORTION_DA);
  // Nouns used in prep step titles ("Cook the chicken", "Start the rice").
  Object.assign(n, { chicken: 'kylling', beef: 'oksekød', pork: 'svinekød', salmon: 'laks', cod: 'torsk', tuna: 'tun', eggs: 'æg', tofu: 'tofu', dal: 'dal', rice: 'ris', pasta: 'pasta', potatoes: 'kartofler', noodles: 'nudler', bulgur: 'bulgur', lentils: 'linser', carbs: 'kulhydrater' });
  // Meal parts (mix & match chips)
  Object.assign(n, {
    Chicken: 'Kylling', 'Chicken Mince': 'Hakket kylling', 'Lean Beef': 'Magert oksekød', 'Beef & Pork': 'Okse & svin', 'Pork Tenderloin': 'Svinemørbrad',
    'Pork Chops': 'Koteletter', Salmon: 'Laks', Cod: 'Torsk', Tuna: 'Tun', Egg: 'Æg', Tofu: 'Tofu', Chickpea: 'Kikærter', Lentil: 'Linser',
    Rice: 'Ris', Pasta: 'Pasta', Potatoes: 'Kartofler', Noodles: 'Nudler', Wraps: 'Wraps', Bulgur: 'Bulgur', 'Sweet Potato': 'Søde kartofler', 'Sweet potato': 'Søde kartofler',
    Broccoli: 'Broccoli', 'Wok Veg': 'Wokgrønt', Peppers: 'Peberfrugt', Carrots: 'Gulerødder', 'Green Beans': 'Grønne bønner',
    Teriyaki: 'Teriyaki', Curry: 'Karry', 'Tomato & Herb': 'Tomat & urter', Taco: 'Taco', Pesto: 'Pesto', 'Lemon & Herb': 'Citron & urter',
  });
  // Proteins, allergies, slots, aisles
  Object.assign(n, {
    Beef: 'Oksekød', Pork: 'Svinekød', Fish: 'Fisk', Eggs: 'Æg', Dairy: 'Mejeri', 'Plant-based': 'Plantebaseret',
    Gluten: 'Gluten', Lactose: 'Laktose', Milk: 'Mælk', Peanuts: 'Jordnødder', 'Tree nuts': 'Nødder', Shellfish: 'Skaldyr', Soy: 'Soja', Sesame: 'Sesam',
    Breakfast: 'Morgenmad', Lunch: 'Frokost', Dinner: 'Aftensmad', Snack: 'Snack', 'Evening snack': 'Aftensnack',
    breakfast: 'morgenmad', lunch: 'frokost', dinner: 'aftensmad', snack: 'snack', 'evening snack': 'aftensnack',
    'Meat & fish': 'Kød & fisk', 'Dairy & eggs': 'Mejeri & æg', 'Fruit & veg': 'Frugt & grønt', Bread: 'Brød', 'Dry goods': 'Kolonial', Frozen: 'Frost', Other: 'Andet',
  });
  // Days and months
  Object.assign(n, {
    Mon: 'man', Tue: 'tir', Wed: 'ons', Thu: 'tor', Fri: 'fre', Sat: 'lør', Sun: 'søn',
    Monday: 'mandag', Tuesday: 'tirsdag', Wednesday: 'onsdag', Thursday: 'torsdag', Friday: 'fredag', Saturday: 'lørdag', Sunday: 'søndag',
    Jan: 'jan.', Feb: 'feb.', Mar: 'mar.', Apr: 'apr.', May: 'maj', Jun: 'jun.', Jul: 'jul.', Aug: 'aug.', Sep: 'sep.', Oct: 'okt.', Nov: 'nov.', Dec: 'dec.',
  });
  STORES.forEach((st) => { n[st.name] = st.name; });
  Object.assign(n, { Mushrooms: 'Svampe', Tuna: 'Tun', 'Cottage cheese': 'Hytteost', Beans: 'Bønner', Coriander: 'Koriander', Olives: 'Oliven', Tomatoes: 'Tomater', Onion: 'Løg' });
  addNames(n);
  RECIPES.forEach(registerRecipeDa);
  // Library meals were built before MIX_DA existed; give them their Danish steps now.
  MIX_LIBRARY.forEach((r) => { const fresh = buildMix(r.id); r.steps_da = fresh.steps_da; });
})();

// ---------- Phrases and templates ----------
// Keys are the English text with numbers as {n}, names as {s} and durations as {d}.
// Text joined with " · " is also translated part by part, so short parts are listed separately.
Object.assign(I18N.templates, {
  // Welcome & onboarding
  English: 'English', Dansk: 'Dansk', Plan: 'Plan', Shop: 'Indkøb', Prep: 'Prep',
  '{n} days': '{n} dage', 'on macro': 'rammer dine makroer', '{n} kr': '{n} kr', '{n} stores': '{n} butikker', '{n} store': '{n} butik', '{n} meals': '{n} måltider',
  'Eat for your goals. Spend less. Think less.': 'Spis efter dine mål. Brug færre penge. Tænk mindre.',
  "Tell us your macros, budget and stores. We'll plan your meals, your shopping list and your {s} meal prep.": 'Fortæl os dine makroer, dit budget og dine butikker. Så planlægger vi dine måltider, din indkøbsliste og din meal prep om {s}en.',
  'Get Started': 'Kom i gang', 'I already have an account': 'Jeg har allerede en konto', '{n} of {n}': '{n} af {n}',
  'What are you eating for?': 'Hvad spiser du efter?', 'This helps us label your plan. You set the exact numbers next.': 'Det hjælper os med at navngive din plan. De præcise tal sætter du på næste side.',
  'Gain muscle': 'Tag på i muskler', 'Eat in a surplus with plenty of protein': 'Spis i overskud med masser af protein', 'Lose fat': 'Tab fedt',
  'Eat in a deficit and keep protein high': 'Spis i underskud, og hold proteinet højt', Maintain: 'Hold vægten', 'Stay where you are, eat well': 'Bliv hvor du er, og spis godt',
  Custom: 'Egne tal', "I'll set my own numbers": 'Jeg sætter selv mine tal', Continue: 'Fortsæt', Back: 'Tilbage', 'Save & return': 'Gem og gå tilbage',
  'Your daily targets': 'Dine daglige mål', 'Already have your numbers? Just enter them. We plan around exactly what you put here.': 'Kender du allerede dine tal? Så skriv dem bare ind. Vi planlægger præcis efter det, du skriver her.',
  Calories: 'Kalorier', kcal: 'kcal', Protein: 'Protein', g: 'g', Carbs: 'Kulhydrat', Fat: 'Fedt',
  'Your macros add up to {n} kcal. Close enough.': 'Dine makroer giver {n} kcal. Tæt nok på.',
  "Your macros add up to {n} kcal, {n} less than your calorie target. We'll plan to your macros.": 'Dine makroer giver {n} kcal, {n} mindre end dit kaloriemål. Vi planlægger efter dine makroer.',
  "Your macros add up to {n} kcal, {n} more than your calorie target. We'll plan to your macros.": 'Dine makroer giver {n} kcal, {n} mere end dit kaloriemål. Vi planlægger efter dine makroer.',
  'Use {n} kcal': 'Brug {n} kcal', 'Not sure? Suggest a split from my calories.': 'I tvivl? Foreslå en fordeling ud fra mine kalorier.',
  'Eat less on rest days': 'Spis mindre på hviledage', "A lower calorie target for days you don't train.": 'Et lavere kaloriemål på dage, hvor du ikke træner.',
  'Rest-day calories': 'Kalorier på hviledage', 'Training days': 'Træningsdage',
  'Protein stays the same every day. On rest days breakfasts and snacks get smaller; containers stay the same.': 'Proteinet er det samme hver dag. På hviledage bliver morgenmad og snacks mindre; madkasserne er de samme.',
  ' You need at least 3 meals a day for this (set it on the Planning step).': ' Det kræver mindst 3 måltider om dagen (sæt det under Planlægning).',
  'Enter between {n} and {n} kcal.': 'Skriv mellem {n} og {n} kcal.', 'Enter between {n} and {n} g.': 'Skriv mellem {n} og {n} g.', 'FoodMadeEasy plans for at least {n} kcal/day.': 'FoodMadeEasy planlægger for mindst {n} kcal om dagen.', 'Enter a number.': 'Skriv et tal.',
  'What do you eat?': 'Hvad spiser du?', 'Only what matters for planning. You can change this anytime.': 'Kun det, der betyder noget for planen. Du kan altid ændre det.',
  Diet: 'Kost', 'No restrictions': 'Ingen begrænsninger', Vegetarian: 'Vegetar', Pescatarian: 'Pescetar', Vegan: 'Veganer', Other: 'Andet',
  Allergies: 'Allergier', None: 'Ingen', '+ Add': '+ Tilføj', 'Type and press enter': 'Skriv og tryk enter',
  "We'll never plan meals with these. Always check product labels, because allergen data may be incomplete.": 'Vi planlægger aldrig måltider med disse. Tjek altid varedeklarationen, for allergendata kan være ufuldstændige.',
  'Proteins you like': 'Proteiner du kan lide', "Greyed-out proteins aren't in a vegetarian plan.": 'Grå proteiner indgår ikke i en vegetarplan.', "Greyed-out proteins aren't in a vegan plan.": 'Grå proteiner indgår ikke i en veganplan.', "Greyed-out proteins aren't in a pescatarian plan.": 'Grå proteiner indgår ikke i en pescetarplan.',
  'Carbs you like': 'Kulhydrater du kan lide', "Foods you won't eat": 'Madvarer du ikke spiser', Optional: 'Valgfrit', 'Add foods to skip': 'Tilføj madvarer, du vil springe over', 'e.g. mushrooms, {s}': 'fx svampe, {s}',
  'Tell us briefly, e.g. halal, no red meat': 'Fortæl kort, fx halal, intet rødt kød', 'Pick at least one protein': 'Vælg mindst ét protein', 'Pick at least one carb': 'Vælg mindst ét kulhydrat',
  'How should your week work?': 'Hvordan skal din uge se ud?', 'Meals and budget matter most. The rest fine-tunes your plan.': 'Måltider og budget betyder mest. Resten finjusterer planen.',
  'Meals per day': 'Måltider om dagen', 'Weekly grocery budget': 'Madbudget pr. uge', 'kr / week': 'kr / uge', "For food only. We'll try to come in under it.": 'Kun til mad. Vi prøver at holde os under.',
  Variety: 'Variation', Low: 'Lav', 'Same few meals, cheapest and fastest prep': 'De samme få retter, billigst og hurtigst prep', Balanced: 'Balanceret', 'A few different meals each week': 'Nogle forskellige retter hver uge',
  High: 'Høj', 'More variety, more prep time': 'Mere variation, mere prep-tid', 'Meal prep': 'Meal prep', 'One session': 'Én session', 'Cook once. {s}–{s} meals go in the freezer.': 'Lav mad én gang. Måltider til {s}–{s} kommer i fryseren.',
  'Two sessions, fridge only': 'To sessioner, kun køleskab', 'Cook {s} and {s}. Nothing gets frozen.': 'Lav mad {s} og {s}. Intet bliver frosset.',
  'Cooking effort': 'Madlavning', Minimal: 'Minimal', Normal: 'Normal', 'I enjoy cooking': 'Jeg kan lide at lave mad', 'Just get it done': 'Bare få det overstået', 'A regular {s} session': 'En helt almindelig {s}', 'Happy to spend more time': 'Bruger gerne mere tid',
  Fewer: 'Færre', More: 'Flere', "That's below what we can plan for a week.": 'Det er under, hvad vi kan planlægge en uge for.', 'Enter up to {n} kr.': 'Skriv op til {n} kr.',
  'Where do you shop?': 'Hvor handler du?', "Pick every store you'd be happy to use. We'll find the best offers across them.": 'Vælg alle de butikker, du gerne vil bruge. Vi finder de bedste tilbud på tværs af dem.',
  'How many stores will you visit each week?': 'Hvor mange butikker vil du handle i hver uge?', 'Up to {n}': 'Op til {n}', 'Fewer stores = easier shopping. More stores = bigger savings.': 'Færre butikker = nemmere indkøb. Flere butikker = større besparelse.',
  'Pick one to continue': 'Vælg én for at fortsætte', 'Fill in all four targets': 'Udfyld alle fire mål', 'Enter your weekly budget': 'Skriv dit ugebudget', 'Budget must be between {n} and {n} kr': 'Budgettet skal være mellem {n} og {n} kr', 'Pick at least one store': 'Vælg mindst én butik',
  // Summary
  "Here's what we'll plan around": 'Det her planlægger vi ud fra', Goal: 'Mål', Edit: 'Ret', Targets: 'Mål', Food: 'Mad', Planning: 'Planlægning', Stores: 'Butikker',
  '{n} kcal': '{n} kcal', '{n}P': '{n}P', '{n}C': '{n}K', '{n}F': '{n}F', 'rest days {n} kcal': 'hviledage {n} kcal', 'No allergies': 'Ingen allergier', '{n} proteins': '{n} proteiner', '{n} protein': '{n} protein', '{n} carbs': '{n} kulhydrater', '{n} carb': '{n} kulhydrat',
  'Skipping: {s}': 'Springer over: {s}', 'Skipping: mushrooms': 'Springer over: svampe', '{n} meals/day': '{n} måltider/dag', '{n} kr/week': '{n} kr/uge', 'Low variety': 'Lav variation', 'Balanced variety': 'Balanceret variation', 'High variety': 'Høj variation',
  'Minimal effort': 'Minimal indsats', 'Normal effort': 'Normal indsats', 'Enjoys cooking effort': 'Kan lide at lave mad', '{n} prep session': '{n} prep-session', '{n} prep sessions': '{n} prep-sessioner', 'up to {n} per week': 'op til {n} pr. uge', '{n} store per week': '{n} butik pr. uge',
  'Plan starts': 'Planen starter', 'Shop and prep on {s} {n} {s}.': 'Handl og prep {s} {n}. {s}', Change: 'Skift', 'You can change any of this later. Nothing is locked in.': 'Du kan ændre alt senere. Intet er låst.', 'Build My First Week': 'Byg min første uge', 'Change start date': 'Skift startdato',
  "Connect to the internet to build your week.": 'Opret forbindelse til internettet for at bygge din uge.',
  // Foods to avoid sheet
  'Common picks': 'Ofte valgt', Done: 'Færdig', 'Search foods': 'Søg madvarer', 'No match. Add ‘{s}’ anyway': 'Intet match. Tilføj ‘{s}’ alligevel',
  // Account
  'Save your setup': 'Gem din opsætning', "Create a free account and we'll build your week right away.": 'Opret en gratis konto, så bygger vi din uge med det samme.', 'Continue with Apple': 'Fortsæt med Apple', 'Continue with Google': 'Fortsæt med Google', or: 'eller',
  Email: 'E-mail', Password: 'Adgangskode', Show: 'Vis', Hide: 'Skjul', 'Use at least {n} characters.': 'Brug mindst {n} tegn.', 'Create Account': 'Opret konto', 'By continuing you agree to our': 'Ved at fortsætte accepterer du vores', Terms: 'Vilkår', and: 'og', 'Privacy Policy': 'Privatlivspolitik',
  'Already have an account?': 'Har du allerede en konto?', 'Log in': 'Log ind', 'Prototype: accounts are stored only in this browser.': 'Prototype: konti gemmes kun i denne browser.', 'you@example.com': 'dig@eksempel.dk', 'At least {n} characters': 'Mindst {n} tegn',
  "There's already an account with this email.": 'Der findes allerede en konto med denne e-mail.', 'Log in instead?': 'Log ind i stedet?', "You're offline. Your week, list and prep steps still work.": 'Du er offline. Din uge, liste og prep-trin virker stadig.',
  "You're offline. Connect to create your account. Your setup is saved on this phone.": 'Du er offline. Opret forbindelse for at oprette din konto. Din opsætning er gemt på telefonen.', "You're offline. Connect to log in.": 'Du er offline. Opret forbindelse for at logge ind.',
  'Welcome back': 'Velkommen tilbage', "That email and password don't match. Try again or reset your password.": 'E-mail og adgangskode passer ikke sammen. Prøv igen, eller nulstil din adgangskode.', 'Log In': 'Log ind', 'Forgot password?': 'Glemt adgangskode?', 'New here?': 'Ny her?', 'Get started': 'Kom i gang',
  'Prototype: try “Continue with Apple”, or log in with an account you created in this browser.': 'Prototype: prøv “Fortsæt med Apple”, eller log ind med en konto, du har oprettet i denne browser.', 'Too many attempts. Try again in a few minutes, or reset your password.': 'For mange forsøg. Prøv igen om et par minutter, eller nulstil din adgangskode.',
  'Reset your password': 'Nulstil din adgangskode', "Enter your email and we'll send you a link.": 'Skriv din e-mail, så sender vi dig et link.', 'Send Reset Link': 'Send link', 'Check your email': 'Tjek din e-mail', 'We sent a reset link to': 'Vi har sendt et link til',
  ". It's valid for {n} hour. Check spam if it's not there.": '. Det virker i {n} time. Tjek spam, hvis du ikke kan finde det.', 'Resend in {n}s': 'Send igen om {n} s', 'Prototype:': 'Prototype:', 'open the reset link': 'åbn linket', 'to continue.': 'for at fortsætte.', 'Open Email App': 'Åbn mail-appen', 'Back to log in': 'Tilbage til log ind', Resend: 'Send igen',
  'Set a new password': 'Vælg en ny adgangskode', For: 'Til', 'New password': 'Ny adgangskode', 'Save Password': 'Gem adgangskode', 'This link has expired.': 'Linket er udløbet.',
  'You already have a saved profile': 'Du har allerede en gemt profil', 'Which setup should we plan with?': 'Hvilken opsætning skal vi planlægge med?', 'Keep my new setup': 'Behold min nye opsætning', 'Replaces your saved targets and preferences.': 'Erstatter dine gemte mål og præferencer.', 'Use my saved profile': 'Brug min gemte profil', 'Discards what you just entered.': 'Kasserer det, du lige har skrevet.',
  // Home
  'Good morning': 'Godmorgen', 'Good afternoon': 'God eftermiddag', 'Good evening': 'Godaften', 'Your food week': 'Din maduge', "Let's plan your week": 'Lad os planlægge din uge',
  'Meals that hit {n} kcal and {n}P, a shopping list under {n} kr, and a prep plan. About {n} seconds.': 'Måltider der rammer {n} kcal og {n}P, en indkøbsliste under {n} kr og en prep-plan. Tager ca. {n} sekunder.',
  'Build My Week': 'Byg min uge', 'Pick my own meals': 'Vælg selv mine retter', Home: 'Hjem', Profile: 'Profil', 'Send feedback': 'Send feedback', Cancel: 'Annullér',
  'Week of {n} {s} – {n} {s}': 'Ugen {n}. {s} – {n}. {s}', 'Next up': 'Næste skridt', 'Time to shop': 'Tid til at handle', '{n} items': '{n} varer', '{n} item': '{n} vare', '{n} kr est.': 'ca. {n} kr', 'Open Shopping List': 'Åbn indkøbslisten', Ready: 'Klar',
  'Your week is ready to review': 'Din uge er klar til gennemsyn', 'Next week is ready to review': 'Næste uge er klar til gennemsyn', 'Next week': 'Næste uge', '{n} kr est.': 'ca. {n} kr', '{n} prepped meals': '{n} preppede måltider', 'Review Your Week': 'Se din uge',
  Shopping: 'Indkøb', 'Shopping in progress': 'Indkøb i gang', 'Continue Shopping': 'Fortsæt indkøb', 'Groceries done ✓': 'Indkøb klaret ✓', 'Prep {n} meals in {d}': 'Prep {n} måltider på {d}', '{n} recipe, one session.': '{n} opskrift, én session.', '{n} recipes, one session.': '{n} opskrifter, én session.',
  '{n} recipes for {s}–{s}. The rest on {s}.': '{n} opskrifter til {s}–{s}. Resten {s}.', '{n} recipe for {s}–{s}. The rest on {s}.': '{n} opskrift til {s}–{s}. Resten {s}.',
  'Start Meal Prep': 'Start meal prep', 'Meal prep paused': 'Meal prep sat på pause', 'Step {n} of {n}': 'Trin {n} af {n}', 'Continue Meal Prep': 'Fortsæt meal prep',
  'Mid-week prep': 'Midtugeprep', 'Prep {n} meals for {s}–{s}': 'Prep {n} måltider til {s}–{s}', 'About {d}. Check the use-by dates on fresh meat.': 'Ca. {d}. Tjek sidste anvendelsesdato på frisk kød.',
  'Week ending': 'Ugen slutter', 'Your week ends {s}.': 'Din uge slutter {s}.', "Next week's offers are in.": 'Næste uges tilbud er kommet.', 'Plan Next Week': 'Planlæg næste uge', "Rate this week's meals": 'Bedøm ugens retter',
  Tonight: 'I aften', 'Move {s}\'s {s} from the freezer to the fridge.': 'Flyt {s}s {s} fra fryseren til køleskabet.', 'Move {s}\'s {s} and {s} from the freezer to the fridge.': 'Flyt {s}s {s} og {s} fra fryseren til køleskabet.',
  'Nothing to move tonight': 'Intet at flytte i aften', "{s}'s meals are already in the fridge.": '{s}s måltider står allerede i køleskabet.', '{s}: mid-week prep': '{s}: midtugeprep',
  'Cook {n} meals for {s}–{s}, about {d}. Check the use-by dates on fresh meat.': 'Lav {n} måltider til {s}–{s}, ca. {d}. Tjek sidste anvendelsesdato på frisk kød.', 'All set': 'Alt klar', 'Everything for the rest of the week is in the fridge.': 'Alt til resten af ugen står i køleskabet.',
  Today: 'I dag', Tomorrow: 'I morgen', 'Starts {s} {n} {s}': 'Starter {s} {n}. {s}', '{n} kcal · {n}P': '{n} kcal · {n}P', Fridge: 'Køleskab', '{n} min': '{n} min',
  'avg kcal/day': 'gns. kcal/dag', 'avg protein/day': 'gns. protein/dag', estimated: 'anslået', '{n} under': '{n} under', '{n} over': '{n} over', budget: 'budget', 'on budget': 'på budget', '{n} planned meals': '{n} planlagte måltider',
  'Start meal prep now': 'Start meal prep nu', "You can prep before you've finished shopping.": 'Du kan godt preppe, før du er færdig med at handle.',
  // Generating
  'Building your week…': 'Bygger din uge…', 'Checking your nutrition targets…': 'Tjekker dine ernæringsmål…', "Finding this week's offers at {s} and {s}…": 'Finder ugens tilbud i {s} og {s}…', "Finding this week's offers at {s}…": 'Finder ugens tilbud i {s}…', "Finding this week's offers at {s} and {s} and more…": 'Finder ugens tilbud i {s}, {s} og flere…',
  'Matching meals to your macros…': 'Matcher retter til dine makroer…', 'Keeping it under {n} kr…': 'Holder det under {n} kr…', 'Building your shopping list…': 'Bygger din indkøbsliste…', 'Still working. Lots of offers to compare this week.': 'Arbejder stadig. Der er mange tilbud at sammenligne i denne uge.',
  'Stop building your week?': 'Stop med at bygge din uge?', 'Keep going': 'Fortsæt', Stop: 'Stop',
  // Your week is ready
  'Your week is ready': 'Din uge er klar', 'Next week is ready': 'Næste uge er klar', 'kcal/day': 'kcal/dag', 'target {n}': 'mål {n}', 'avg kcal/day': 'gns. kcal/dag', '{n} training, {n} rest': '{n} træning, {n} hvile', '{n} g': '{n} g', 'protein/day': 'protein/dag',
  'estimated total': 'anslået i alt', 'under budget': 'under budget', 'over budget': 'over budget', 'prepped for the week': 'preppet til ugen', '{s} prep': 'Prep {s}', '{s} + {s} prep': '{s} + {s} prep', "What's in your week": 'Det får du i ugen', 'Uses {n} offers': 'Bruger {n} tilbud', 'Uses {n} offer': 'Bruger {n} tilbud', about: 'ca.',
  'saved vs. regular prices': 'sparet i forhold til normalpris', 'No matching offers this week. We used standard estimated prices.': 'Ingen matchende tilbud i denne uge. Vi har brugt almindelige anslåede priser.',
  "Prices are rough estimates this week. We couldn't get current offers, so we used typical prices.": 'Priserne er grove skøn i denne uge. Vi kunne ikke hente aktuelle tilbud, så vi har brugt typiske priser.',
  'Your picked meals come to a bit more than your budget. Swap one for something cheaper, or raise the budget.': 'Dine valgte retter koster lidt mere end dit budget. Byt én ud med noget billigere, eller hæv budgettet.',
  'Closest we could get with your stores. Try up to {n} stores a week, or a bigger budget.': 'Det tætteste vi kunne komme med dine butikker. Prøv op til {n} butikker om ugen eller et større budget.',
  'Closest we could get with your stores and budget. Adding a store or raising the budget would help.': 'Det tætteste vi kunne komme med dine butikker og dit budget. En butik mere eller et større budget vil hjælpe.', Adjust: 'Justér',
  'Use This Plan': 'Brug denne plan', 'Use This Plan for Next Week': 'Brug planen til næste uge', 'Review Meals': 'Se retterne', 'Generate Another': 'Lav en ny', 'Account created': 'Konto oprettet', 'Your week is set. Next: shopping.': 'Din uge er klar. Næste skridt: indkøb.',
  // Plan
  'Your Week': 'Din uge', 'Review your week': 'Gennemse din uge', Draft: 'Kladde', 'not active yet': 'ikke aktiv endnu', 'Last week': 'Sidste uge', 'Read-only': 'Kun visning', 'this plan has ended': 'planen er slut',
  "Next week's plan is ready to review": 'Næste uges plan er klar til gennemsyn', '{n} under budget': '{n} under budget', '{n} over budget': '{n} over budget', avg: 'gns.',
  '{n} recipes': '{n} opskrifter', '{n} recipe': '{n} opskrift', '{n} containers': '{n} madkasser', '{n} container': '{n} madkasse', '{d} total': '{d} i alt', '2 sessions': '2 sessioner', '{n} sessions': '{n} sessioner', View: 'Se',
  '{s} prep · first done': 'Prep {s} · første er klaret', '{s} + {s} prep · first done': '{s} + {s} prep · første er klaret', 'Prepped {s} {n} {s}': 'Preppet {s} {n}. {s}', 'Plan options': 'Planvalg',
  'Training day': 'Træningsdag', 'Rest day': 'Hviledag', 'On target': 'På mål', 'Prep {s}': 'Prep {s}', '✓ Prepped': '✓ Preppet', 'Meal actions': 'Handlinger for retten', '{n} serving': '{n} portion', '{n} servings': '{n} portioner', '{n} container': '{n} madkasse', '{n}%': '{n}%',
  '{s} is {n} kcal under.': '{s} mangler {n} kcal.', '{s} is {n} kcal over.': '{s} er {n} kcal over.', '{s} is {n} g protein short.': '{s} mangler {n} g protein.', 'Replace {s}': 'Erstat {s}', 'Connect to swap meals.': 'Opret forbindelse for at bytte retter.',
  'Rebuild week': 'Byg ugen om', 'Get a new plan for these dates.': 'Få en ny plan for de samme datoer.', 'Liked meals come back more often. Disliked ones never return.': 'Retter du kan lide, kommer oftere igen. Dem du ikke kan lide, kommer aldrig igen.', 'Edit preferences': 'Ret præferencer',
  'Replace meal': 'Erstat retten', 'Adjust portion': 'Justér portion', 'View recipe': 'Se opskrift',
  // Recipe
  'Mix & match': 'Mix & match', 'Meal-prep friendly': 'God til meal prep', 'Ready in {d}': 'Klar på {d}', 'High protein': 'Højt protein', 'Freezes well': 'Kan fryses', 'Nutrition per serving': 'Næring pr. portion', Serving: 'Portion', Portion: 'Portionsstørrelse',
  'Would you eat this again?': 'Vil du spise det igen?', Yes: 'Ja', No: 'Nej', 'This week': 'Denne uge', '{s} {s}–{s}': '{s} {s}–{s}', 'Prepped {s}': 'Preppes {s}', Ingredients: 'Ingredienser', 'Per serving': 'Pr. portion', 'How to make it': 'Sådan gør du', 'Storing it': 'Opbevaring',
  '{n} g dry': '{n} g tør vægt', '{n} kg dry': '{n} kg tør vægt', '{n} ml': '{n} ml', 'to taste': 'efter smag', '{n} wraps': '{n} wraps', '{n} wrap': '{n} wrap', '{n} eggs': '{n} æg', '{n} egg': '{n} æg',
  'Fridge {n} days': 'Køleskab {n} dage', 'Freezer {n} months. Thaw overnight in the fridge.': 'Fryser {n} måneder. Tø op i køleskabet natten over.', "Fridge {n} days. This one doesn't freeze well, so it's best early in the week.": 'Køleskab {n} dage. Den tåler ikke frost, så den er bedst tidligt på ugen.',
  'Always check product labels. Allergen data may be incomplete.': 'Tjek altid varedeklarationen. Allergendata kan være ufuldstændige.', 'Replace Meal': 'Erstat retten', 'Change the parts': 'Skift delene ud', 'Choose This Meal': 'Vælg denne ret',
  'Make all {n} servings {n}%?': 'Gør alle {n} portioner {n}%?', 'Adds ~{n} kcal': 'Tilføjer ca. {n} kcal', 'Removes ~{n} kcal': 'Fjerner ca. {n} kcal', '{n}P per serving and ~{n} kr to your list.': '{n}P pr. portion og ca. {n} kr til din liste.', '{n}P per serving and ~{n} kr from your list.': '{n}P pr. portion og ca. {n} kr fra din liste.',
  "You've already prepped this. The change only affects your numbers, not your containers.": 'Du har allerede preppet den. Ændringen påvirker kun dine tal, ikke dine madkasser.', Apply: 'Anvend', 'Portion updated': 'Portion opdateret', 'list +{n} item': 'liste +{n} vare', 'list +{n} items': 'liste +{n} varer', 'list {n} item': 'liste {n} vare', 'Portion restored': 'Portion gendannet',
  // Replace
  'Everything else in your week stays the same.': 'Resten af ugen er uændret.', 'All {n} servings': 'Alle {n} portioner', 'Only {s} {s}': 'Kun {s} {s}', Suggestions: 'Forslag', 'Build your own': 'Byg din egen',
  "You've already bought some items. We'll add what's new to your list.": 'Du har allerede købt nogle varer. Vi tilføjer det nye til din liste.', "You've already prepped this meal. Swapping only changes your plan, not your containers.": 'Du har allerede preppet retten. Et bytte ændrer kun din plan, ikke dine madkasser.',
  '{n} kr/week': '{n} kr/uge', 'Same cost': 'Samme pris', 'Macros stay on target': 'Makroerne holder sig på mål', '{n}P per day': '{n}P pr. dag', 'Same prep time': 'Samme prep-tid', 'No prep change': 'Ingen ændring i prep', '+{d} prep': '+{d} prep', '-{d} prep': '−{d} prep', '+{n} recipe to prep': '+{n} opskrift at preppe', '{d} on the day': '{d} på dagen',
  'Show different options': 'Vis andre forslag', "Don't suggest {s} again": 'Foreslå ikke {s} igen', 'Swap Meal': 'Byt retten', Preview: 'Forhåndsvis', 'No other meals fit': 'Ingen andre retter passer', 'No other meals fit this slot with your settings.': 'Ingen andre retter passer til dette måltid med dine indstillinger.', 'Start over': 'Start forfra',
  "Couldn't swap right now. Your plan hasn't changed.": 'Kunne ikke bytte lige nu. Din plan er uændret.', Carb: 'Kulhydrat', Veg: 'Grønt', Flavour: 'Smag',
  'That’s the meal you have now. Change a part to build something new.': 'Det er den ret, du har nu. Skift en del ud for at bygge noget nyt.', 'That combination doesn’t fit your food settings.': 'Den kombination passer ikke til dine madindstillinger.',
  'Swapped to {s}': 'Byttet til {s}', 'Daily protein': 'Protein pr. dag', '{n} → {n} g': '{n} → {n} g', 'Weekly cost': 'Pris pr. uge', '{n} → {n} kr': '{n} → {n} kr', 'Shopping list': 'Indkøbsliste', '+{n} item': '+{n} vare', '+{n} items': '+{n} varer', '−{n} item': '−{n} vare', '−{n} items': '−{n} varer', '{n} item, {n} item': '{n} vare, {n} vare', '{n} items, {n} items': '{n} varer, {n} varer', '{n} items, {n} item': '{n} varer, {n} vare', '{n} item, {n} items': '{n} vare, {n} varer',
  'Same items, new amounts': 'Samme varer, nye mængder', Prep: 'Prep', 'same {n} recipes, {d}': 'samme {n} opskrifter, {d}', '{n} recipes, {d}': '{n} opskrifter, {d}', 'same {n} recipe, {d}': 'samme {n} opskrift, {d}', '{n} recipe, {d}': '{n} opskrift, {d}', Undo: 'Fortryd', 'View shopping list': 'Se indkøbsliste', 'Swap undone': 'Bytte fortrudt',
  'Rebuild your week?': 'Byg din uge om?', 'Your current plan stays active until you choose the new one.': 'Din nuværende plan gælder, indtil du vælger den nye.', "You've checked off {n} items. A new plan may need different groceries.": 'Du har krydset {n} varer af. En ny plan kan kræve andre varer.', "You've checked off {n} item. A new plan may need different groceries.": 'Du har krydset {n} vare af. En ny plan kan kræve andre varer.',
  "You've already prepped this week. Rebuilding is usually best for next week.": 'Du har allerede preppet denne uge. Det er som regel bedst at bygge om til næste uge.', 'Rebuild Week': 'Byg ugen om', 'Pick my own meals instead': 'Vælg selv retterne i stedet',
  // Pick your meals
  'Pick your meals': 'Vælg dine retter', "Choose what goes in your containers. We'll size the portions to your targets, add breakfasts and snacks, and build the shopping list.": 'Vælg, hvad der skal i dine madkasser. Vi tilpasser portionerne til dine mål, tilføjer morgenmad og snacks og bygger indkøbslisten.',
  'all week': 'hele ugen', '{s} · all week': '{s} · hele ugen', 'Lunch & dinner · all week': 'Frokost & aftensmad · hele ugen', 'Pick a combination': 'Vælg en kombination', 'Two of your slots are the same meal. That works, but you could pick something different for variety.': 'To af dine pladser har samme ret. Det virker, men du kan vælge noget andet for variationens skyld.',
  // Shopping
  'Estimated total': 'Anslået i alt', '{n} stores ·': '{n} butikker ·', '{n} store ·': '{n} butik ·', '{n} kr saved with offers': '{n} kr sparet på tilbud', '· {n} kr saved with offers': '· {n} kr sparet på tilbud', '{n} of {n} items': '{n} af {n} varer',
  'Store options': 'Butiksvalg', 'Cheapest: {s}': 'Billigst: {s}', 'Cheapest: {s} + {s}': 'Billigst: {s} + {s}', 'Cheapest: {s} + {s} + {s}': 'Billigst: {s} + {s} + {s}', 'Only {s}': 'Kun {s}', '{n} kr ·': '{n} kr ·', '{n} trip': '{n} tur', '{n} trips': '{n} ture', '· {n} trip': '· {n} tur', '· {n} trips': '· {n} ture', Switch: 'Skift',
  "Items you've ticked stay ticked.": 'Varer du har krydset af, forbliver krydset af.', 'This list covers both prep sessions. Check the use-by dates on fresh meat for Wednesday.': 'Listen dækker begge prep-sessioner. Tjek sidste anvendelsesdato på frisk kød til onsdag.',
  '{n} × {n} kg': '{n} × {n} kg', '{n} × {n} g': '{n} × {n} g', '{n} × {n} L': '{n} × {n} L', '{n} × {n} pcs': '{n} × {n} stk', '{n} kr each': '{n} kr stk', Offer: 'Tilbud', 'ends {s}': 'slutter {s}', 'Offer ended': 'Tilbud slut', 'est. {n} kr': 'ca. {n} kr', New: 'Ny', 'Have it': 'Har den',
  '{n} bought': '{n} købt', 'buy {n} more': 'køb {n} mere', 'Assumed at home': 'Regnes med hjemme', 'not priced': 'ikke prissat', Salt: 'Salt', Pepper: 'Peber', 'Cooking oil': 'Madolie', 'Paprika, cumin & chili': 'Paprika, spidskommen & chili', 'Curry powder': 'Karry',
  'Missing any? Pick it up at your first store.': 'Mangler du noget? Køb det i den første butik.', "Prices are estimates from this week's offers and regular prices. Your receipt may differ slightly.": 'Priserne er skøn ud fra ugens tilbud og normalpriser. Din kvittering kan afvige lidt.',
  'List options': 'Listevalg', 'Mark {s} as bought': 'Markér {s} som købt', 'Unmark {s} as bought': 'Fjern markering af {s}', '✓ All bought here': '✓ Alt købt her', 'Bought ({n})': 'Købt ({n})', 'Offline · your checks will sync later.': 'Offline · dine afkrydsninger synkroniseres senere.', Offline: 'Offline', 'your checks will sync later.': 'dine afkrydsninger synkroniseres senere.',
  'Removed · no longer needed: {s}': 'Fjernet · ikke længere nødvendig: {s}', Dismiss: 'Luk', 'Prices are rough estimates this week.': 'Priserne er grove skøn i denne uge.', 'Shopping done ·': 'Indkøb klaret ·', 'Shopping done': 'Indkøb klaret', '✓ Shopping done': '✓ Indkøb klaret',
  'No shopping list yet': 'Ingen indkøbsliste endnu', 'Your shopping list will appear after you create a weekly plan.': 'Din indkøbsliste dukker op, når du har lavet en ugeplan.', 'Almost there': 'Næsten klar', 'Accept your plan to get your shopping list.': 'Godkend din plan for at få din indkøbsliste.',
  Price: 'Pris', 'offer, normally {n} kr': 'tilbud, normalt {n} kr', 'offer ended': 'tilbud slut', 'Valid until': 'Gælder til', 'In the avis as': 'I avisen som', "Real offer from {s}'s tilbudsavis ({n} week {n}). Regular price is estimated.": 'Rigtigt tilbud fra {s}s tilbudsavis (uge {n2}, {n1}). Normalprisen er anslået.',
  'You need': 'Du skal bruge', '· buying': '· køber', 'buying': 'køber', '({n} g extra)': '({n} g ekstra)', '({n} kg extra)': '({n} kg ekstra)', '({n} extra)': '({n} ekstra)', 'Used in': 'Bruges i', 'Mark as Bought': 'Markér som købt', Unmark: 'Fjern markering', 'Already have it': 'Har det allerede', 'I need to buy it': 'Jeg skal købe den',
  'Marked as have it': 'Markeret som "har den"', 'Mark all as bought': 'Markér alt som købt', 'Uncheck all': 'Fjern alle afkrydsninger', 'Share list': 'Del listen', 'List reset': 'Listen er nulstillet', 'List copied to clipboard': 'Listen er kopieret', "Couldn't share or copy the list here": 'Kunne ikke dele eller kopiere listen her', 'Shopping at {s}': 'Handler i {s}', 'Shopping at {s} + {s}': 'Handler i {s} + {s}', 'Shopping at {s} + {s} + {s}': 'Handler i {s} + {s} + {s}',
  'Next up: meal prep, about {d} for {n} meals.': 'Næste skridt: meal prep, ca. {d} til {n} måltider.', Later: 'Senere',
  'How prices are estimated': 'Sådan anslår vi priser', "We use each store's current weekly offers plus typical shelf prices. Prices are the same across a chain, so your local branch may differ a little.": 'Vi bruger hver butiks aktuelle ugetilbud plus typiske hyldepriser. Priserne er de samme i hele kæden, så din lokale butik kan afvige lidt.',
  'You buy whole packages, so we round up: if you need {n} kg of {s} and it comes in {n} kg packs, your list says {n} × {n} kg.': 'Du køber hele pakker, så vi runder op: Skal du bruge {n} kg {s}, og den findes i pakker à {n} kg, står der {n} × {n} kg på din liste.',
  'Offers have end dates. When one ends mid-week, the list switches to the regular price.': 'Tilbud har en slutdato. Slutter et tilbud midt i ugen, skifter listen til normalprisen.', 'In this prototype all prices and offers are made up.': 'I denne prototype er tilbud fra tilbudsaviser rigtige; normalpriser er anslåede.', 'Got it': 'Forstået',
  // Meal prep
  Close: 'Luk', 'Nothing to prep yet': 'Intet at preppe endnu', "Create a weekly plan first. We'll turn it into a step-by-step session.": 'Lav først en ugeplan. Så gør vi den til en session trin for trin.', 'No cooking needed this week': 'Ingen madlavning i denne uge', 'All your meals are 5-minute assemble-and-eat meals.': 'Alle dine måltider samles på 5 minutter.', 'View Plan': 'Se planen',
  "We've combined your recipes so you cook each thing once.": 'Vi har kombineret dine opskrifter, så du kun laver hver ting én gang.', "Session {n} of {n}: meals for {s}–{s}. We've combined your recipes so you cook each thing once.": 'Session {n} af {n}: måltider til {s}–{s}. Vi har kombineret dine opskrifter, så du kun laver hver ting én gang.',
  recipes: 'opskrifter', recipe: 'opskrift', containers: 'madkasser', '✓ Prepped {s} {n} {s}': '✓ Preppet {s} {n}. {s}', '✓ First session done {s} {n} {s}. Check the use-by dates on the meat you bought for today.': '✓ Første session klaret {s} {n}. {s}. Tjek sidste anvendelsesdato på kødet til i dag.',
  "You haven't finished shopping. You can still start.": 'Du er ikke færdig med at handle. Du kan godt starte alligevel.', 'Recipes being prepped': 'Opskrifter der preppes', '{n} containers · {s} {s}–{s}': '{n} madkasser · {s} {s}–{s}', "What you'll cook": 'Det skal du lave', Vegetables: 'Grøntsager', "You'll need": 'Du skal bruge',
  '{n} large pots': '{n} store gryder', '{n} large pot': '{n} stor gryde', '{n} frying pan': '{n} stegepande', 'baking trays': 'bageplader', 'Breakfasts and snacks are {n}-minute assemble-and-eat meals. Make them on the day.': 'Morgenmad og snacks samles på {n} minutter. Lav dem på dagen.',
  'Restart from step 1': 'Start forfra fra trin 1', 'Prep again': 'Prep igen', 'Continue · Step {n} of {n}': 'Fortsæt · trin {n} af {n}', 'Picked up where you left off': 'Du fortsætter, hvor du slap',
  'Pause meal prep?': 'Sæt meal prep på pause?', "We'll save your place.": 'Vi husker, hvor du er.', Pause: 'Pause', 'Previous step': 'Forrige trin',
  'Heat the oven to {n}°C': 'Tænd ovnen på {n}°C', 'Line one or two baking trays while it heats.': 'Læg bagepapir på en eller to bageplader, mens den varmer op.', 'Start the {s}': 'Sæt {s} over', 'Start the carbs': 'Sæt kulhydraterne over', 'Start the dal': 'Start dal', 'Open the tuna': 'Åbn tunen',
  '{n} kg {s} (dry)': '{n} kg {s} (tør vægt)', '{n} g {s} (dry)': '{n} g {s} (tør vægt)', '{n} kg {s}': '{n} kg {s}', '{n} g {s}': '{n} g {s}', 'Prep the vegetables': 'Forbered grøntsagerne', 'Peel and dice. Keep each recipe’s vegetables in its own bowl.': 'Skræl og skær i tern. Hold hver opskrifts grøntsager i sin egen skål.',
  'Cook the {s}': 'Tilbered {s}', 'Cook the vegetables': 'Tilbered grøntsagerne', 'Steam or pan-fry straight from frozen, {n}–{d}. Don’t overcook; they reheat later.': 'Damp eller steg direkte fra frost, {n}–{d}. Undgå at koge dem for længe; de bliver varmet op senere.', 'Finish: {s}': 'Gør færdig: {s}',
  'Let everything cool': 'Lad det hele køle af', 'Spread it out for {n}–{n} minutes before portioning. Warm food in sealed containers spoils faster.': 'Bred det ud i {n}–{n} minutter, før du portionerer. Varm mad i lukkede bokse bliver hurtigere dårlig.',
  'Start {d} timer': 'Start timer på {d}', 'While they cook, go to the next step.': 'Gå videre til næste trin, mens det koger.', 'While it cooks, go to the next step.': 'Gå videre til næste trin, mens det koger.', 'Which recipe is this for?': 'Hvilken opskrift er det til?', 'For: {s}': 'Til: {s}', 'For: {s}, {s}': 'Til: {s}, {s}', 'For {s}': 'Til {s}',
  "Timer running. You'll get an alert when it's done.": 'Timeren kører. Du får besked, når den er færdig.', '{s} timer started': 'Timer for {s} startet', '⏰ {s} timer is done': '⏰ Timeren for {s} er færdig', Done: 'Færdig', 'Start Portioning': 'Start portionering',
  Portioning: 'Portionering', 'Containers {n}–{n}': 'Madkasse {n}–{n}', 'Add to each': 'Kom i hver', 'No scale? Split each batch evenly across the {n} containers.': 'Ingen vægt? Fordel hver portion ligeligt i de {n} madkasser.', 'Fridge:': 'Køleskab:', 'Freezer:': 'Fryser:', 'Label the lids, e.g.': 'Skriv på lågene, fx',
  "This one doesn't freeze well. Keep all of it in the fridge and eat it in the first half of the week if you can.": 'Den tåler ikke frost. Hold den på køl, og spis den helst i første halvdel af ugen.', 'Finish Prep': 'Afslut prep',
  'Meal prep done': 'Meal prep klaret', 'First prep done': 'Første prep klaret', '{n} meals prepared': '{n} måltider lavet', 'Tonight: nothing.': 'I aften: ingenting.', 'Tonight: nothing. Your {s} {s} is in the fridge.': 'I aften: ingenting. Din {s}s{s} står i køleskabet.',
  'Tonight: nothing. Next prep: {s} evening, for {s}–{s}.': 'I aften: ingenting. Næste prep: {s} aften, til {s}–{s}.', 'Tonight: nothing. Everything for the rest of the week is in the fridge.': 'I aften: ingenting. Alt til resten af ugen står i køleskabet.', Finish: 'Afslut', 'Your week is prepped.': 'Din uge er preppet.',
  // Primer & notifications
  'Want a nudge next weekend?': 'Vil du have en påmindelse næste weekend?', 'Move {s}\'s meals to the fridge.': 'Flyt {s}s måltider i køleskabet.', 'Turn On Reminders': 'Slå påmindelser til', 'Not now': 'Ikke nu', 'Reminders on': 'Påmindelser slået til',
  '“FoodMadeEasy” Would Like to Send You Notifications': '“FoodMadeEasy” vil gerne sende dig notifikationer', 'Notifications may include alerts, sounds and icon badges.': 'Notifikationer kan være beskeder, lyde og symboler på app-ikonet.', "Don't Allow": 'Tillad ikke', Allow: 'Tillad',
  // Ratings
  'How was this week?': 'Hvordan var ugen?', Liked: 'Kunne lide', Disliked: 'Kunne ikke lide', 'Liked meals come back more often. Disliked meals are never planned.': 'Retter du kan lide, kommer oftere igen. Retter du ikke kan lide, bliver aldrig planlagt.', 'Liked 👍': 'Kan lide 👍', 'Disliked 👎': 'Kan ikke lide 👎',
  'Nothing yet. Tap 👍 on a recipe you enjoyed.': 'Intet endnu. Tryk 👍 på en opskrift, du kunne lide.', 'Nothing yet. Tap 👎 on a recipe to stop seeing it.': 'Intet endnu. Tryk 👎 på en opskrift for at slippe for den.', 'Remove rating': 'Fjern bedømmelse', 'Your meals': 'Dine retter', 'Rate meals with 👍 or 👎 to steer your plans': 'Bedøm retter med 👍 eller 👎 for at styre dine planer',
  "Saved. You'll see it more often.": 'Gemt. Du vil se den oftere.', "Got it. We won't plan it again.": 'Forstået. Vi planlægger den ikke igen.', "Got it. We won't plan it again. It's still in this week; replace it from the Plan tab.": 'Forstået. Vi planlægger den ikke igen. Den er stadig i denne uge; erstat den under Plan.',
  '{n} liked': '{n} kan lide', '{n} disliked': '{n} kan ikke lide',
  // Profile & settings
  Feedback: 'Feedback', "Tell us what's confusing, broken or missing": 'Fortæl os, hvad der er forvirrende, i stykker eller mangler', 'Changes apply to your next plan. We\'ll ask before changing this week.': 'Ændringer gælder fra din næste plan. Vi spørger, før vi ændrer denne uge.',
  Settings: 'Indstillinger', 'Daily targets': 'Daglige mål', Save: 'Gem', "Couldn't save. Your changes are still here.": 'Kunne ikke gemme. Dine ændringer er her stadig.', Retry: 'Prøv igen', 'Connect to save': 'Opret forbindelse for at gemme', 'Discard changes?': 'Kassér ændringer?', Discard: 'Kassér', 'Profile saved': 'Profil gemt', 'applies to your next plan': 'gælder fra din næste plan',
  'Apply to this week?': 'Gælder det for denne uge?', 'Your targets changed from {n} to {n} kcal.': 'Dine mål er ændret fra {n} til {n} kcal.', 'Your protein target changed from {n} to {n} g.': 'Dit proteinmål er ændret fra {n} til {n} g.', 'Your budget changed from {n} kr to {n} kr.': 'Dit budget er ændret fra {n} kr til {n} kr.', 'You now eat {n} meals a day.': 'Du spiser nu {n} måltider om dagen.',
  'Your stores changed.': 'Dine butikker er ændret.', 'Your food preferences changed.': 'Dine madpræferencer er ændret.', '{n} meal this week contains a new allergy: {s}.': '{n} ret i denne uge indeholder en ny allergi: {s}.', '{n} meals this week contain a new allergy: {s}, {s}.': '{n} retter i denne uge indeholder en ny allergi: {s}, {s}.',
  'Rebuild this week': 'Byg denne uge om', 'Get a new plan with your new settings.': 'Få en ny plan med dine nye indstillinger.', 'Keep this week, use for next week': 'Behold denne uge, brug det fra næste uge', 'Nothing changes until your next plan.': 'Intet ændres før din næste plan.', Confirm: 'Bekræft',
  Account: 'Konto', 'Sign-in method': 'Login-metode', Apple: 'Apple', Google: 'Google', 'Email and password': 'E-mail og adgangskode', 'Change password': 'Skift adgangskode', 'Confirm your email so you can recover your account.': 'Bekræft din e-mail, så du kan gendanne din konto.',
  Preferences: 'Præferencer', Language: 'Sprog', Notifications: 'Notifikationer', On: 'Til', Off: 'Fra', Units: 'Enheder', 'Metric (g, kg)': 'Metrisk (g, kg)', Currency: 'Valuta', DKK: 'DKK', About: 'Om', Version: 'Version', 'Prototype {n}': 'Prototype {n}', 'Log out': 'Log ud', 'Delete account': 'Slet konto',
  'Log out?': 'Log ud?', 'Your plan is saved to your account.': 'Din plan er gemt på din konto.', 'Reminders are off. Turn them on to get a nudge when offers change and when to move meals to the fridge.': 'Påmindelser er slået fra. Slå dem til for at få besked, når tilbuddene skifter, og når måltider skal i køleskabet.',
  'Weekly planning reminder': 'Ugentlig planlægningspåmindelse', '“Next week\'s offers are in.”': '“Næste uges tilbud er kommet.”', 'Meal-prep reminder': 'Meal prep-påmindelse', 'Prep day, {n}:{n}': 'Prep-dag, {n}:{n}', 'Move-to-fridge reminder': 'Påmindelse om at flytte til køleskab', '{n}:{n} the evening before a freezer day': '{n}:{n} aftenen før en frysedag',
  'Notifications are off for FoodMadeEasy. Turn them on in Settings.': 'Notifikationer er slået fra for FoodMadeEasy. Slå dem til i Indstillinger.', 'Open Settings': 'Åbn Indstillinger', 'Prototype: pretended you allowed notifications in iOS Settings': 'Prototype: lod som om, du tillod notifikationer i Indstillinger',
  'Delete your account?': 'Slet din konto?', 'This deletes your profile, your plans and your shopping lists.': 'Det sletter din profil, dine planer og dine indkøbslister.', "This can't be undone.": 'Det kan ikke fortrydes.', 'I understand': 'Jeg forstår', 'Delete Account': 'Slet konto',
  'Confirm with Face ID': 'Bekræft med Face ID', 'Confirm with your password': 'Bekræft med din adgangskode', 'Confirm with Google': 'Bekræft med Google', 'Prototype: this stands in for re-authentication.': 'Prototype: dette erstatter et nyt login.', Delete: 'Slet', 'Your account has been deleted.': 'Din konto er slettet.',
  // Feedback
  'What happened, and what did you expect?': 'Hvad skete der, og hvad forventede du?', "Something's broken": 'Noget virker ikke', Confusing: 'Forvirrende', Idea: 'Idé', 'Price or portion looks wrong': 'Pris eller portion ser forkert ud',
  "Include what I'm looking at and my plan settings": 'Medtag hvad jeg ser på og mine planindstillinger', 'What gets included': 'Det bliver medtaget', 'Share Feedback': 'Del feedback', 'Email instead': 'Send som e-mail i stedet', "E.g. I couldn't find where to change my budget": 'Fx: Jeg kunne ikke finde, hvor jeg ændrer mit budget',
  'Thanks for the feedback!': 'Tak for din feedback!', 'Feedback copied. Paste it in a message to the FoodMadeEasy team.': 'Feedback kopieret. Indsæt det i en besked til FoodMadeEasy-holdet.', "Couldn't share or copy here. Take a screenshot instead.": 'Kunne ikke dele eller kopiere her. Tag et skærmbillede i stedet.',
  // Next week
  'Plan {s} {n} {s} – {s} {n} {s}': 'Planlæg {s} {n}. {s} – {s} {n}. {s}', 'Repeat this week': 'Gentag denne uge', 'Same meals, new prices. Est. {n} kr.': 'Samme retter, nye priser. Ca. {n} kr.', 'Some meals no longer fit your settings.': 'Nogle retter passer ikke længere til dine indstillinger.',
  'Build a new week': 'Byg en ny uge', "Fresh meals from this week's offers.": 'Nye retter ud fra ugens tilbud.', 'Choose protein, carb, veg and flavour yourself.': 'Vælg selv protein, kulhydrat, grønt og smag.', 'Change something first': 'Ændr noget først', 'Update targets, food, budget or stores.': 'Opdatér mål, mad, budget eller butikker.', 'Build Next Week': 'Byg næste uge',
  'Repeat last week': 'Gentag sidste uge',
  // Errors
  "We couldn't make a realistic plan with these settings.": 'Vi kunne ikke lave en realistisk plan med disse indstillinger.', 'The cheapest plan that hits {n} kcal and {n} g protein costs about': 'Den billigste plan, der rammer {n} kcal og {n} g protein, koster ca.',
  '. Your budget is {n} kr.': '. Dit budget er {n} kr.', '. Your budget is {n} kr. With low variety it comes to about {n} kr.': '. Dit budget er {n} kr. Med lav variation koster den ca. {n} kr.', 'Increase Budget to {n} kr': 'Hæv budgettet til {n} kr', 'Increase budget to {n} kr': 'Hæv budgettet til {n} kr', 'Reduce variety': 'Mindre variation', 'Reduce Variety': 'Mindre variation', 'Edit targets': 'Ret mål', 'Edit Targets': 'Ret mål',
  'With your food settings, the most protein we can fit is about': 'Med dine madindstillinger kan vi højst nå ca.', '{n} g a day': '{n} g protein om dagen', '. Your target is {n} g.': '. Dit mål er {n} g.', 'Allow more foods': 'Tillad flere madvarer', 'Allowing more stores per week can also bring the price down.': 'Flere butikker om ugen kan også få prisen ned.',
  'Not enough meals match your food settings.': 'For få retter passer til dine madindstillinger.', 'Only {n} {s}/{s} recipe fits, and your variety setting needs {n}.': 'Kun {n} opskrift til {s}/{s} passer, og din variation kræver {n}.', 'Only {n} {s}/{s} recipes fit, and your variety setting needs {n}.': 'Kun {n} opskrifter til {s}/{s} passer, og din variation kræver {n}.',
  'No {s}/{s} recipes fit, and your variety setting needs {n}.': 'Ingen opskrifter til {s}/{s} passer, og din variation kræver {n}.', 'Allowing all proteins': 'At tillade alle proteiner', 'Allowing all carbs': 'At tillade alle kulhydrater', 'Dropping the diet filter': 'At fjerne kostfiltret', 'Allowing {s}': 'At tillade {s}', 'Allowing mushrooms': 'At tillade svampe',
  'adds {n} meals.': 'giver {n} retter mere.', 'adds {n} meal.': 'giver {n} ret mere.', 'Allow More Foods': 'Tillad flere madvarer', 'Lower variety': 'Mindre variation', "We couldn't build your week": 'Vi kunne ikke bygge din uge', 'Something went wrong on our side. Your settings are saved.': 'Noget gik galt hos os. Dine indstillinger er gemt.',
  "We're looking into it. Try again in a few minutes.": 'Vi kigger på det. Prøv igen om et par minutter.', 'Try Again': 'Prøv igen', 'Edit Preferences': 'Ret præferencer', 'No connection': 'Ingen forbindelse', 'FoodMadeEasy needs the internet to get started.': 'FoodMadeEasy skal bruge internettet for at komme i gang.',
  '{s} {n} {s}': '{s} {n}. {s}', '{s} {n} {s} – {s} {n} {s}': '{s} {n}. {s} – {s} {n}. {s}',
  'Contains:': 'Indeholder:', 'No match.': 'Intet match.', Add: 'Tilføj', anyway: 'alligevel', '· {n}P': '· {n}P', '{n} serving ·': '{n} portion ·', '{n} servings ·': '{n} portioner ·', '· {n} under budget': '· {n} under budget', '· {n} over budget': '· {n} over budget',
  '{n} kg': '{n} kg', '{n} L': '{n} L', '±{n} kr': '±{n} kr', '{n} kr ·': '{n} kr ·',
  // Toasts & misc
  'Filled in a starting point. Tweak anything.': 'Udfyldt med et udgangspunkt. Justér frit.', 'Enter your calories first': 'Skriv dine kalorier først', "You're offline. Connect to continue.": 'Du er offline. Opret forbindelse for at fortsætte.', 'Password updated': 'Adgangskode opdateret', 'Sent again': 'Sendt igen',
  'New plan built.': 'Ny plan bygget.', 'Back to your previous plan': 'Tilbage til din forrige plan', 'Budget set to {n} kr': 'Budget sat til {n} kr', 'Variety set to Low': 'Variation sat til lav', 'Back online': 'Online igen', synced: 'synkroniseret', 'Marked as have it · −{n} kr': 'Markeret som "har den" · −{n} kr',
  "You're offline. Connect to swap meals.": 'Du er offline. Opret forbindelse for at bytte retter.', "You're offline. Connect to build your week.": 'Du er offline. Opret forbindelse for at bygge din uge.', "You're offline. Connect to edit your profile.": 'Du er offline. Opret forbindelse for at rette din profil.',
  'Log out first to run onboarding again.': 'Log ud først for at køre opstarten igen.', 'Finish onboarding first (or use the example user).': 'Gør opstarten færdig først (eller brug eksempelbrugeren).',
  // Prototype tools
  'Prototype tools': 'Prototypeværktøjer', 'FoodMadeEasy V1 clickable prototype. All prices, offers and accounts are fake and live only in this browser.': 'Klikbar prototype af FoodMadeEasy V1. Tilbud fra tilbudsaviser er rigtige; normalpriser og konti er falske og findes kun i denne browser.',
  'Today is': 'I dag er det', '{n} day': '{n} dag', '({n} d)': '({n} d)', '{n} d': '{n} d', Reset: 'Nulstil', 'Simulate offline': 'Simulér offline', 'Fail next plan build': 'Lad næste planbygning fejle', 'Grocery data unavailable': 'Prisdata utilgængelige', 'Fill onboarding with example user': 'Udfyld opstart med eksempelbruger', 'Reset prototype': 'Nulstil prototypen',
  'Jump to a screen': 'Hop til en skærm', Welcome: 'Velkommen', 'Tip: after accepting a plan, use “+1 day” to walk through the week (fridge reminders, week ending, next week).': 'Tip: Når du har godkendt en plan, kan du bruge “+1 dag” til at gå gennem ugen (påmindelser, ugens afslutning, næste uge).',
  'Reset the prototype?': 'Nulstil prototypen?', 'Deletes all fake accounts, plans and settings in this browser.': 'Sletter alle testkonti, planer og indstillinger i denne browser.', '{n} day': '{n} dag', '+{n} day': '+{n} dag', '−{n} day': '−{n} dag',
});

// Keys written with literal numbers ("Restart from step 1") must match text where numbers became {n}.
Object.keys(I18N.templates).forEach((k) => {
  if (!/\d/.test(k)) return;
  const nk = k.replace(NUM_RE, '{n}');
  if (!(nk in I18N.templates)) I18N.templates[nk] = I18N.templates[k].replace(NUM_RE, '{n}');
});
