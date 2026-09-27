// Mock data for the prototype. Prices are plausible DKK shelf prices, not real quotes.

const STORES = [
  { id: 'rema', name: 'REMA 1000', short: 'REMA', color: '#1c3f94', level: 1.0 },
  { id: 'netto', name: 'Netto', short: 'Netto', color: '#f2c200', level: 0.98 },
  { id: 'lidl', name: 'Lidl', short: 'Lidl', color: '#0050aa', level: 0.97 },
  { id: 'fotex', name: 'føtex', short: 'føtex', color: '#00205b', level: 1.08 },
  { id: 'bilka', name: 'Bilka', short: 'Bilka', color: '#0077c8', level: 1.02 },
  { id: 'k365', name: '365discount', short: '365', color: '#e4002b', level: 0.96 },
];

const AISLES = ['Meat & fish', 'Dairy & eggs', 'Fruit & veg', 'Bread', 'Dry goods', 'Frozen', 'Other'];

// n = per 100 g: [kcal, protein, carbs, fat]
// packs = [grams, label, regular price at REMA level, optional store whitelist]
// cooked = weight factor from raw/dry to cooked (used for portioning)
const ING = {
  chicken: { name: 'Chicken breast', aisle: 'Meat & fish', n: [106, 23, 0, 1.5], tags: ['chicken', 'meat'], packs: [[1000, '1 kg', 65], [2500, '2.5 kg', 155, ['bilka', 'fotex']]], cooked: 0.75 },
  beef: { name: 'Minced beef 8–12%', aisle: 'Meat & fish', n: [170, 19, 0, 10], tags: ['beef', 'meat'], packs: [[500, '500 g', 40], [1000, '1 kg', 75, ['bilka', 'fotex', 'rema']]], cooked: 0.8 },
  pork: { name: 'Pork tenderloin', aisle: 'Meat & fish', n: [110, 21, 0, 2.5], tags: ['pork', 'meat'], packs: [[500, '500 g', 49]], cooked: 0.75 },
  ham: { name: 'Sliced ham', aisle: 'Meat & fish', n: [110, 19, 1, 3.5], tags: ['pork', 'meat'], packs: [[150, '150 g', 15]] },
  salmon: { name: 'Salmon fillets', aisle: 'Frozen', n: [200, 20, 0, 13], tags: ['fish'], allergens: ['Fish'], packs: [[500, '500 g', 79]], cooked: 0.85 },
  cod: { name: 'Cod fillets', aisle: 'Frozen', n: [75, 17, 0, 0.7], tags: ['fish'], allergens: ['Fish'], packs: [[800, '800 g', 45]], cooked: 0.85 },
  tuna: { name: 'Tuna in water', aisle: 'Dry goods', n: [110, 25, 0, 1], tags: ['fish'], allergens: ['Fish'], packs: [[390, '3 × 130 g', 30]] },
  eggs: { name: 'Eggs', aisle: 'Dairy & eggs', n: [140, 12.5, 0.7, 10], tags: ['egg'], allergens: ['Eggs'], packs: [[600, '10 pcs', 32], [1800, '30 pcs', 79, ['bilka', 'k365', 'lidl']]], piece: 60, pieceName: 'egg' },
  skyr: { name: 'Skyr, natural', aisle: 'Dairy & eggs', n: [63, 11, 4, 0.2], tags: ['dairy'], allergens: ['Milk', 'Lactose'], packs: [[1000, '1 kg', 22]] },
  cottage: { name: 'Cottage cheese', aisle: 'Dairy & eggs', n: [90, 12.5, 2.5, 3.5], tags: ['dairy'], allergens: ['Milk', 'Lactose'], packs: [[400, '400 g', 16]] },
  cheese: { name: 'Cheese 30+, sliced', aisle: 'Dairy & eggs', n: [270, 30, 0, 16], tags: ['dairy'], allergens: ['Milk'], packs: [[450, '450 g', 45]] },
  milk: { name: 'Milk 1.5%', aisle: 'Dairy & eggs', n: [46, 3.5, 4.8, 1.5], tags: ['dairy'], allergens: ['Milk', 'Lactose'], packs: [[1000, '1 L', 11]] },
  tofu: { name: 'Tofu, firm', aisle: 'Dairy & eggs', n: [125, 13, 2, 7.5], tags: ['plant'], allergens: ['Soy'], packs: [[400, '400 g', 25]] },
  oats: { name: 'Rolled oats', aisle: 'Dry goods', n: [370, 13, 60, 7], tags: [], allergens: ['Gluten'], packs: [[1000, '1 kg', 12]] },
  rice: { name: 'Jasmine rice', aisle: 'Dry goods', n: [350, 7, 78, 0.6], tags: [], packs: [[1000, '1 kg', 15], [2000, '2 kg', 28, ['bilka', 'fotex', 'netto']]], cooked: 2.5, dry: true },
  pasta: { name: 'Pasta', aisle: 'Dry goods', n: [355, 12.5, 71, 1.5], tags: [], allergens: ['Gluten'], packs: [[500, '500 g', 8], [1000, '1 kg', 14]], cooked: 2.2, dry: true },
  lentils: { name: 'Red lentils', aisle: 'Dry goods', n: [340, 24, 50, 1.5], tags: ['plant'], packs: [[500, '500 g', 15]], cooked: 2.5, dry: true },
  beans: { name: 'Kidney beans (can)', aisle: 'Dry goods', n: [80, 5, 11, 0.4], tags: ['plant'], packs: [[400, '400 g', 7]] },
  tomatoes: { name: 'Chopped tomatoes (can)', aisle: 'Dry goods', n: [22, 1.2, 3.5, 0.2], tags: [], packs: [[400, '400 g', 6]] },
  coconut: { name: 'Coconut milk, light', aisle: 'Dry goods', n: [90, 1, 2.5, 8.5], tags: [], packs: [[400, '400 ml', 12]] },
  pb: { name: 'Peanut butter', aisle: 'Dry goods', n: [600, 25, 15, 48], tags: [], allergens: ['Peanuts'], packs: [[350, '350 g', 25]] },
  pesto: { name: 'Green pesto', aisle: 'Dry goods', n: [450, 5, 5, 45], tags: [], allergens: ['Tree nuts', 'Milk'], packs: [[190, '190 g', 20]] },
  rye: { name: 'Rye bread', aisle: 'Bread', n: [210, 6.5, 38, 2.8], tags: [], allergens: ['Gluten'], packs: [[1000, '1 kg', 20]] },
  potatoes: { name: 'Potatoes', aisle: 'Fruit & veg', n: [75, 2, 16, 0.1], tags: [], packs: [[2000, '2 kg', 18]] },
  onion: { name: 'Onions', aisle: 'Fruit & veg', n: [40, 1, 8, 0.1], tags: [], packs: [[1000, '1 kg', 10]], chop: true },
  pepper: { name: 'Bell peppers', aisle: 'Fruit & veg', n: [30, 1, 6, 0.3], tags: [], packs: [[500, '3 pcs', 20]], chop: true },
  carrots: { name: 'Carrots', aisle: 'Fruit & veg', n: [40, 0.8, 8, 0.2], tags: [], packs: [[1000, '1 kg', 10]], chop: true },
  banana: { name: 'Bananas', aisle: 'Fruit & veg', n: [90, 1.1, 20, 0.3], tags: [], packs: [[1000, '1 kg', 14]] },
  apple: { name: 'Apples', aisle: 'Fruit & veg', n: [52, 0.3, 12, 0.2], tags: [], packs: [[1000, '1 kg', 15]] },
  wokveg: { name: 'Wok vegetables', aisle: 'Frozen', n: [40, 2, 6, 0.3], tags: [], packs: [[750, '750 g', 20]], frozenVeg: true },
  broccoli: { name: 'Broccoli', aisle: 'Frozen', n: [30, 3, 3, 0.4], tags: [], packs: [[750, '750 g', 18]], frozenVeg: true },
  berries: { name: 'Mixed berries', aisle: 'Frozen', n: [45, 0.8, 8, 0.3], tags: [], packs: [[750, '750 g', 30]] },
  oil: { name: 'Oil', pantry: true, n: [900, 0, 0, 100], tags: [] },
  spices: { name: 'Salt, pepper & spices', pantry: true, n: [0, 0, 0, 0], tags: [] },
};

const PANTRY_NOTE = ['Salt', 'Pepper', 'Cooking oil', 'Paprika, cumin & chili', 'Curry powder'];

// How carbs are started in a prep session.
const CARB_COOK = {
  rice: { how: 'Rinse, then simmer with 1.5× the water, lid on, 12 min. Rest 10 min.', min: 22 },
  pasta: { how: 'Boil in well-salted water for 9 min. Drain and toss with a little oil.', min: 12 },
  potatoes: { how: 'Cut into chunks, toss with oil and salt. Roast at 200°C for 35 min.', min: 35 },
  lentils: { how: 'They cook in the sauce. Rinse them now and set aside.', min: 0 },
};

// Two offer weeks that alternate, so "next week" has different offers.
// price = offer price for that pack; ends = days after the shop day the offer is valid.
const OFFER_WEEKS = [
  [
    { store: 'rema', ing: 'chicken', size: 1000, price: 49, ends: 6 },
    { store: 'rema', ing: 'rice', size: 1000, price: 12, ends: 6 },
    { store: 'rema', ing: 'skyr', size: 1000, price: 17, ends: 3 },
    { store: 'netto', ing: 'beef', size: 500, price: 30, ends: 5 },
    { store: 'netto', ing: 'eggs', size: 600, price: 25, ends: 5 },
    { store: 'netto', ing: 'oats', size: 1000, price: 9, ends: 5 },
    { store: 'netto', ing: 'wokveg', size: 750, price: 15, ends: 5 },
    { store: 'lidl', ing: 'salmon', size: 500, price: 59, ends: 4 },
    { store: 'lidl', ing: 'pasta', size: 1000, price: 10, ends: 4 },
    { store: 'lidl', ing: 'cottage', size: 400, price: 12, ends: 4 },
    { store: 'fotex', ing: 'pork', size: 500, price: 39, ends: 6 },
    { store: 'fotex', ing: 'cheese', size: 450, price: 35, ends: 6 },
    { store: 'bilka', ing: 'chicken', size: 2500, price: 119, ends: 6 },
    { store: 'bilka', ing: 'rice', size: 2000, price: 22, ends: 6 },
    { store: 'k365', ing: 'potatoes', size: 2000, price: 12, ends: 5 },
    { store: 'k365', ing: 'banana', size: 1000, price: 10, ends: 5 },
    { store: 'k365', ing: 'beans', size: 400, price: 5, ends: 5 },
  ],
  [
    { store: 'rema', ing: 'beef', size: 1000, price: 59, ends: 6 },
    { store: 'rema', ing: 'oats', size: 1000, price: 9, ends: 6 },
    { store: 'netto', ing: 'chicken', size: 1000, price: 52, ends: 5 },
    { store: 'netto', ing: 'skyr', size: 1000, price: 16, ends: 5 },
    { store: 'netto', ing: 'tomatoes', size: 400, price: 4, ends: 5 },
    { store: 'lidl', ing: 'rice', size: 1000, price: 11, ends: 4 },
    { store: 'lidl', ing: 'eggs', size: 1800, price: 59, ends: 4 },
    { store: 'lidl', ing: 'tofu', size: 400, price: 18, ends: 4 },
    { store: 'fotex', ing: 'salmon', size: 500, price: 55, ends: 6 },
    { store: 'fotex', ing: 'rye', size: 1000, price: 15, ends: 6 },
    { store: 'bilka', ing: 'beef', size: 1000, price: 62, ends: 6 },
    { store: 'bilka', ing: 'broccoli', size: 750, price: 12, ends: 6 },
    { store: 'k365', ing: 'pasta', size: 1000, price: 9, ends: 5 },
    { store: 'k365', ing: 'cod', size: 800, price: 35, ends: 5 },
  ],
];

// role: p = protein (scaled to hit protein), c = carb (scaled to hit kcal), v = veg, x = other
// portion = how a container is filled: [label, [ingredient ids]]
const RECIPES = [
  {
    id: 'crb', name: 'Chicken Rice Bowl', kind: 'main', emoji: '🍗', bg: '#f6e7c8', minutes: 35, oven: true, freezes: true, protein: 'chicken',
    ing: [['chicken', 200, 'p'], ['rice', 110, 'c'], ['wokveg', 150, 'v'], ['oil', 8, 'x'], ['spices', 3, 'x']],
    steps: ['Heat the oven to 200°C.', 'Season the chicken with salt, pepper and paprika. Bake 22 min.', 'Cook the rice.', 'Pan-fry the vegetables in a little oil, 6 min.', 'Slice the chicken and serve over rice with the vegetables.'],
    prepProtein: 'Season with salt, pepper and paprika. Bake at 200°C for 22 min.', wait: 22,
    portion: [['chicken', ['chicken']], ['cooked rice', ['rice']], ['vegetables', ['wokveg']]],
  },
  {
    id: 'chili', name: 'Beef Chili with Rice', kind: 'main', emoji: '🌶️', bg: '#f7d6cc', minutes: 45, freezes: true, protein: 'beef',
    ing: [['beef', 150, 'p'], ['rice', 100, 'c'], ['tomatoes', 130, 'x'], ['beans', 80, 'x'], ['onion', 50, 'v'], ['pepper', 60, 'v'], ['spices', 4, 'x']],
    steps: ['Chop the onion and pepper.', 'Brown the beef in a large pot, 6 min.', 'Add onion, pepper, cumin, paprika and chili. Cook 3 min.', 'Add tomatoes and beans. Simmer 15 min.', 'Serve with rice.'],
    prepProtein: 'Brown in a large pot, 6 min, breaking it up.',
    finish: 'Add the onion, pepper and spices, then the tomatoes and beans. Simmer 15 min.', finishWait: 15,
    portion: [['chili', ['beef', 'tomatoes', 'beans', 'onion', 'pepper']], ['cooked rice', ['rice']]],
  },
  {
    id: 'burrito', name: 'Chicken Burrito Bowl', kind: 'main', emoji: '🌯', bg: '#e8ecc9', minutes: 35, freezes: true, protein: 'chicken',
    ing: [['chicken', 180, 'p'], ['rice', 100, 'c'], ['beans', 70, 'x'], ['pepper', 60, 'v'], ['tomatoes', 60, 'x'], ['cheese', 20, 'x'], ['spices', 3, 'x']],
    steps: ['Dice the chicken and pepper.', 'Fry the chicken with cumin and paprika, 8 min.', 'Add pepper, beans and tomatoes. Cook 5 min.', 'Serve over rice, topped with cheese.'],
    prepProtein: 'Dice, then fry with cumin and paprika, 8 min.',
    finish: 'Add the pepper, beans and tomatoes to the chicken. Cook 5 min.', finishWait: 5,
    portion: [['chicken & beans', ['chicken', 'beans', 'pepper', 'tomatoes']], ['cooked rice', ['rice']], ['cheese', ['cheese']]],
  },
  {
    id: 'bolo', name: 'Pasta Bolognese', kind: 'main', emoji: '🍝', bg: '#f5d9c7', minutes: 40, freezes: true, protein: 'beef',
    ing: [['beef', 140, 'p'], ['pasta', 110, 'c'], ['tomatoes', 150, 'x'], ['onion', 40, 'v'], ['carrots', 40, 'v'], ['spices', 3, 'x']],
    steps: ['Chop the onion and carrot finely.', 'Brown the beef, 6 min.', 'Add onion and carrot, cook 4 min.', 'Add tomatoes, simmer 20 min.', 'Cook the pasta and mix.'],
    prepProtein: 'Brown in a large pot, 6 min.',
    finish: 'Add the onion and carrots, then the tomatoes. Simmer 20 min.', finishWait: 20,
    portion: [['bolognese', ['beef', 'tomatoes', 'onion', 'carrots']], ['cooked pasta', ['pasta']]],
  },
  {
    id: 'salmon', name: 'Salmon, Potatoes & Broccoli', kind: 'main', emoji: '🐟', bg: '#f9dccf', minutes: 40, oven: true, freezes: false, protein: 'fish',
    ing: [['salmon', 150, 'p'], ['potatoes', 350, 'c'], ['broccoli', 150, 'v'], ['oil', 8, 'x'], ['spices', 2, 'x']],
    steps: ['Heat the oven to 200°C.', 'Roast potato chunks with oil and salt, 35 min.', 'Add the salmon for the last 15 min.', 'Steam the broccoli, 5 min.'],
    prepProtein: 'Season and add to the oven tray for the last 15 min.', wait: 15,
    portion: [['salmon', ['salmon']], ['potatoes', ['potatoes']], ['broccoli', ['broccoli']]],
  },
  {
    id: 'traybake', name: 'Pork & Potato Traybake', kind: 'main', emoji: '🥔', bg: '#efe2c4', minutes: 45, oven: true, freezes: true, protein: 'pork',
    ing: [['pork', 170, 'p'], ['potatoes', 350, 'c'], ['carrots', 120, 'v'], ['onion', 50, 'v'], ['oil', 8, 'x'], ['spices', 2, 'x']],
    steps: ['Heat the oven to 200°C.', 'Toss potatoes, carrots and onion with oil. Roast 35 min.', 'Sear the pork, then roast 18 min on top.', 'Rest 5 min and slice.'],
    prepProtein: 'Sear on all sides, then roast on top of the vegetables for 18 min.', wait: 18,
    portion: [['pork', ['pork']], ['potatoes & veg', ['potatoes', 'carrots', 'onion']]],
  },
  {
    id: 'curry', name: 'Chicken Curry with Rice', kind: 'main', emoji: '🍛', bg: '#f7e3b5', minutes: 35, freezes: true, protein: 'chicken',
    ing: [['chicken', 180, 'p'], ['rice', 100, 'c'], ['coconut', 100, 'x'], ['onion', 50, 'v'], ['wokveg', 100, 'v'], ['spices', 4, 'x']],
    steps: ['Dice the chicken and onion.', 'Fry the onion with curry powder, 3 min.', 'Add chicken, cook 6 min.', 'Add coconut milk and vegetables. Simmer 10 min.', 'Serve with rice.'],
    prepProtein: 'Dice and fry with the onion and curry powder, 8 min.',
    finish: 'Add the coconut milk and vegetables to the chicken. Simmer 10 min.', finishWait: 10,
    portion: [['curry', ['chicken', 'coconut', 'onion', 'wokveg']], ['cooked rice', ['rice']]],
  },
  {
    id: 'cod', name: 'Cod with Rice & Broccoli', kind: 'main', emoji: '🐠', bg: '#dfe9f2', minutes: 30, oven: true, freezes: true, protein: 'fish',
    ing: [['cod', 200, 'p'], ['rice', 110, 'c'], ['broccoli', 150, 'v'], ['oil', 8, 'x'], ['spices', 2, 'x']],
    steps: ['Heat the oven to 200°C.', 'Season the cod and bake 15 min.', 'Cook the rice.', 'Steam the broccoli, 5 min.'],
    prepProtein: 'Season with salt, pepper and lemon. Bake at 200°C for 15 min.', wait: 15,
    portion: [['cod', ['cod']], ['cooked rice', ['rice']], ['broccoli', ['broccoli']]],
  },
  {
    id: 'pesto', name: 'Chicken Pesto Pasta', kind: 'main', emoji: '🌿', bg: '#dcebd2', minutes: 30, freezes: true, steamVeg: true, protein: 'chicken',
    ing: [['chicken', 170, 'p'], ['pasta', 100, 'c'], ['pesto', 25, 'x'], ['broccoli', 100, 'v']],
    steps: ['Cook the pasta.', 'Fry the sliced chicken, 8 min.', 'Steam the broccoli.', 'Mix everything with the pesto.'],
    prepProtein: 'Slice and fry, 8 min.',
    finish: 'Mix the chicken, pasta and broccoli with the pesto.', finishWait: 0,
    portion: [['pesto pasta', ['chicken', 'pasta', 'pesto', 'broccoli']]],
  },
  {
    id: 'tunapasta', name: 'Tuna Pasta Salad', kind: 'main', emoji: '🥗', bg: '#e3eef0', minutes: 20, freezes: false, protein: 'fish',
    ing: [['tuna', 130, 'p'], ['pasta', 100, 'c'], ['pepper', 60, 'v'], ['cottage', 60, 'x'], ['spices', 2, 'x']],
    steps: ['Cook the pasta and cool it under cold water.', 'Dice the pepper.', 'Mix pasta, tuna, pepper and cottage cheese. Season.'],
    prepProtein: 'Drain the tuna.',
    finish: 'Mix the cooled pasta with the tuna, pepper and cottage cheese.', finishWait: 0,
    portion: [['pasta salad', ['tuna', 'pasta', 'pepper', 'cottage']]],
  },
  {
    id: 'dal', name: 'Red Lentil Dal with Rice', kind: 'main', emoji: '🥘', bg: '#f6dcae', minutes: 35, freezes: true, protein: 'plant',
    ing: [['lentils', 90, 'p'], ['rice', 80, 'c'], ['tomatoes', 120, 'x'], ['coconut', 60, 'x'], ['onion', 50, 'v'], ['spices', 4, 'x']],
    steps: ['Fry the onion with curry powder, 4 min.', 'Add lentils, tomatoes, coconut milk and 2× water.', 'Simmer 20 min, stirring.', 'Serve with rice.'],
    prepProtein: 'Fry the onion with curry powder in a large pot, 4 min.',
    finish: 'Add the lentils, tomatoes, coconut milk and twice the water. Simmer 20 min.', finishWait: 20,
    portion: [['dal', ['lentils', 'tomatoes', 'coconut', 'onion']], ['cooked rice', ['rice']]],
  },
  {
    id: 'tofu', name: 'Tofu Stir-fry with Rice', kind: 'main', emoji: '🥢', bg: '#eef0d8', minutes: 30, freezes: false, protein: 'plant',
    ing: [['tofu', 200, 'p'], ['rice', 100, 'c'], ['wokveg', 150, 'v'], ['oil', 8, 'x'], ['spices', 2, 'x']],
    steps: ['Press and cube the tofu.', 'Fry until golden, 10 min.', 'Add vegetables, stir-fry 5 min.', 'Serve with rice.'],
    prepProtein: 'Cube and fry until golden, 10 min.',
    finish: 'Add the vegetables to the tofu. Stir-fry 5 min.', finishWait: 5,
    portion: [['tofu & veg', ['tofu', 'wokveg']], ['cooked rice', ['rice']]],
  },
  {
    id: 'eggrice', name: 'Egg Fried Rice', kind: 'main', emoji: '🍳', bg: '#f8eec0', minutes: 25, freezes: true, protein: 'eggs',
    ing: [['eggs', 180, 'p'], ['rice', 110, 'c'], ['wokveg', 150, 'v'], ['oil', 8, 'x']],
    steps: ['Cook the rice (day-old rice is best).', 'Scramble the eggs, set aside.', 'Stir-fry the vegetables, 5 min.', 'Add rice and eggs, fry 3 min.'],
    prepProtein: 'Scramble in a large pan and set aside.',
    finish: 'Stir-fry the vegetables, then add the rice and eggs. Fry 3 min.', finishWait: 0,
    portion: [['fried rice', ['eggs', 'rice', 'wokveg']]],
  },
  // Light meals: breakfasts and snacks, assembled on the day.
  {
    id: 'skyroats', name: 'Skyr Protein Oats', kind: 'light', emoji: '🥣', bg: '#ece4f4', minutes: 5, protein: 'dairy',
    ing: [['skyr', 250, 'p'], ['oats', 70, 'c'], ['berries', 80, 'x']],
    steps: ['Mix skyr and oats in a bowl.', 'Top with berries (straight from the freezer is fine).'],
  },
  {
    id: 'ryeeggs', name: 'Rye Bread, Eggs & Cheese', kind: 'light', emoji: '🥚', bg: '#f3ead5', minutes: 5, protein: 'eggs',
    ing: [['rye', 110, 'c'], ['eggs', 120, 'p'], ['cheese', 20, 'x']],
    steps: ['Boil or fry the eggs.', 'Serve on rye bread with cheese.'],
  },
  {
    id: 'cottagebowl', name: 'Cottage Cheese & Banana', kind: 'light', emoji: '🍌', bg: '#f6f0c8', minutes: 2, protein: 'dairy',
    ing: [['cottage', 250, 'p'], ['banana', 120, 'c']],
    steps: ['Slice the banana over the cottage cheese.'],
  },
  {
    id: 'hamrye', name: 'Ham & Rye Sandwich', kind: 'light', emoji: '🥪', bg: '#f2e1d9', minutes: 3, protein: 'pork',
    ing: [['rye', 100, 'c'], ['ham', 75, 'p']],
    steps: ['Top rye bread with ham.'],
  },
  {
    id: 'skyrberries', name: 'Skyr with Berries', kind: 'light', emoji: '🫐', bg: '#e3e6f5', minutes: 2, protein: 'dairy',
    ing: [['skyr', 300, 'p'], ['berries', 100, 'x'], ['oats', 30, 'c']],
    steps: ['Top the skyr with berries and a handful of oats.'],
  },
  {
    id: 'pbbanana', name: 'Peanut Butter Banana Rye', kind: 'light', emoji: '🥜', bg: '#f0e0c8', minutes: 3, protein: 'plant',
    ing: [['rye', 100, 'c'], ['pb', 25, 'x'], ['banana', 100, 'x']],
    steps: ['Spread peanut butter on rye bread.', 'Top with sliced banana.'],
  },
  {
    id: 'tofuscramble', name: 'Tofu Scramble on Rye', kind: 'light', emoji: '🍞', bg: '#eef2d2', minutes: 8, protein: 'plant',
    ing: [['tofu', 150, 'p'], ['rye', 100, 'c'], ['pepper', 50, 'x'], ['spices', 1, 'x']],
    steps: ['Crumble the tofu into a hot pan with the pepper.', 'Season with turmeric, salt and pepper. Fry 5 min.', 'Serve on rye bread.'],
  },
  {
    id: 'apples', name: 'Apple & Milk Oats', kind: 'light', emoji: '🍎', bg: '#f5dcd6', minutes: 5, protein: 'dairy',
    ing: [['oats', 70, 'c'], ['milk', 250, 'p'], ['apple', 120, 'x']],
    steps: ['Soak the oats in milk (overnight or 5 min).', 'Grate the apple on top.'],
  },
];

const RECIPE = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

const ALLERGIES = ['Gluten', 'Lactose', 'Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Fish', 'Shellfish', 'Soy', 'Sesame'];
const PROTEINS = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'beef', label: 'Beef' },
  { id: 'pork', label: 'Pork' },
  { id: 'fish', label: 'Fish' },
  { id: 'eggs', label: 'Eggs' },
  { id: 'dairy', label: 'Dairy', hint: 'skyr, quark, cottage cheese' },
  { id: 'plant', label: 'Plant-based' },
];
const COMMON_AVOID = ['Mushrooms', 'Tuna', 'Cottage cheese', 'Beans', 'Broccoli', 'Pork', 'Coriander', 'Olives', 'Tomatoes', 'Onion'];

const GOALS = [
  { id: 'gain', label: 'Gain muscle', desc: 'Eat in a surplus with plenty of protein', icon: '💪' },
  { id: 'lose', label: 'Lose fat', desc: 'Eat in a deficit and keep protein high', icon: '🔥' },
  { id: 'maintain', label: 'Maintain', desc: 'Stay where you are, eat well', icon: '⚖️' },
  { id: 'custom', label: 'Custom', desc: "I'll set my own numbers", icon: '🎯' },
];

const SLOT_SETS = {
  2: ['lunch', 'dinner'],
  3: ['breakfast', 'lunch', 'dinner'],
  4: ['breakfast', 'lunch', 'dinner', 'snack'],
  5: ['breakfast', 'snack', 'lunch', 'snack2', 'dinner'],
  6: ['breakfast', 'snack', 'lunch', 'snack2', 'dinner', 'evening'],
};
const SLOT_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', snack2: 'Snack', evening: 'Evening snack' };
const MAIN_SLOTS = ['lunch', 'dinner'];
