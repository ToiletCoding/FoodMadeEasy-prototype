// Real weekly offers, logged by hand from the chains' tilbudsaviser.
// Full logs (every item, matched or not) live in docs/offers/.
// When a feed covers the shop day, it replaces that store's mock offers.
// Each item: ing = our ingredient id, size in grams (pieces × piece weight for eggs), price in kr.

const OFFER_FEEDS = [
  {
    store: 'netto', week: '2026-W40', validFrom: '2026-09-26', validTo: '2026-10-02',
    source: 'Netto tilbudsavis uge 40 · docs/offers/netto-2026-uge40.md',
    items: [
      { ing: 'chicken', name: 'Kyllingebrystfilet eller -inderfilet', size: 400, label: '400 g', price: 29 },
      { ing: 'chickmince', name: 'Hakket dansk kyllingekød 7-10% eller kyllingelårfilet', size: 400, label: '400 g', price: 25 },
      { ing: 'beeflean', name: 'Velsmag hakket oksekød 4-7%', size: 350, label: '350 g', price: 39.95 },
      { ing: 'mixmince', name: 'Velsmag hakket okse- og grisekød 8-12%', size: 1000, label: '1 kg', price: 69 },
      { ing: 'porkchop', name: 'Netto danske koteletter eller nakkekoteletter', size: 400, label: '400 g', price: 20 },
      { ing: 'eggs', name: 'Dava danske frilandsæg', size: 480, label: '8 pcs', price: 24 },
      { ing: 'smokedsalmon', name: 'Gravad, kold- eller varmrøget laks', size: 100, label: '100 g', price: 19 },
      { ing: 'cheese', name: 'Mammen skiveost', size: 140, label: '140 g', price: 14 },
      { ing: 'pasta', name: '1881 bronze pasta', size: 500, label: '500 g', price: 10 },
      { ing: 'noodles', name: 'Fuldkornsnudler', size: 250, label: '250 g', price: 7 },
      { ing: 'tortilla', name: 'Mex & Co. tortilla wraps', size: 370, label: '370 g', price: 9 },
      { ing: 'potatoes', name: 'Samsø nemme kartofler', size: 650, label: '650 g', price: 10 },
      { ing: 'apple', name: 'Danske æbler', size: 1500, label: '1.5 kg', price: 18 },
      { ing: 'pesto', name: 'Løgismose pesto, hummus eller haydari', size: 150, label: '150 g', price: 20 },
    ],
  },
];
