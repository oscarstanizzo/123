/* NexDay Supply — catalogue data for the mock site.
   Everything the pages render comes from here: the mega menu, the /products
   directory, every category page and the search box. One source, so a new
   subcategory shows up in all five places at once.

   Category and subcategory names follow the live nexdaysupply.ca taxonomy.
   Product rows are generated (see makeProducts below) rather than typed out —
   this is a design mock, not a real inventory feed. */
(function () {
  'use strict';

  var categories = [
    {
      slug: 'foodservice',
      name: 'Foodservice, Restaurant & Grocery',
      short: 'Foodservice',
      icon: 'cup',
      blurb: 'Take-out packaging, cups, cutlery and front-of-house disposables for restaurants, cafés, caterers and grocery retail.',
      subs: [
        'Take-Out & To-Go Containers',
        'Pizza Boxes & Supplies',
        'Cups, Lids & Sleeves',
        'Cutlery, Straws & Stir Sticks',
        'Plates, Bowls & Trays',
        'Food Wrap, Foil & Film',
        'Bakery Packaging',
        'Deli & Butcher Supplies',
        'Catering & Buffet Supplies',
        'Napkins & Placemats',
        'Coffee & Beverage Supplies',
        'Food Storage Containers'
      ]
    },
    {
      slug: 'food-packaging',
      name: 'Food Packaging & Labels',
      short: 'Packaging & Labels',
      icon: 'label',
      blurb: 'Scale labels, date coding, band-it straps and barrier film for processors, butchers, delis and bakeries.',
      subs: [
        'Food Packaging Labels',
        'Meat, Fish & Poultry Labels',
        'Deli & Bakery Labels',
        'Produce & Scale Labels',
        'Band-It Label Straps',
        'Nutrition & Allergen Labels',
        'Date Coding & Day Dots',
        'Vacuum & Skin Pack Film',
        'Poly Bags & Food Bags',
        'Tamper-Evident Packaging'
      ]
    },
    {
      slug: 'cleaning-tools',
      name: 'Janitorial & Cleaning Tools',
      short: 'Janitorial',
      icon: 'broom',
      blurb: 'The cart, the mop and everything on it — commercial cleaning tools built for daily custodial routes.',
      subs: [
        'Brooms, Brushes & Dust Pans',
        'Mopping Supplies',
        'Buckets & Wringers',
        'Squeegees & Window Cleaning',
        'Cloths, Wipers & Microfibre',
        'Scrubbers, Sponges & Pads',
        'Janitor Carts & Caddies',
        'Broom Handles & Braces',
        'Wet Floor Signs & Safety Cones',
        'Vacuums & Floor Machines'
      ]
    },
    {
      slug: 'chemicals',
      name: 'Cleaning Chemicals & Sanitizers',
      short: 'Chemicals',
      icon: 'bottle',
      blurb: 'Disinfectants, degreasers, floor care and dilution control — with the SDS sheet on every product page.',
      subs: [
        'Disinfectants & Sanitizers',
        'Floor Care & Finishes',
        'Washroom & Bowl Cleaners',
        'Glass & Multi-Surface Cleaners',
        'Degreasers & Oven Cleaners',
        'Warewashing & Dish Chemicals',
        'Laundry Chemicals',
        'Hand Soaps & Dispensers',
        'Odour Control & Air Care',
        'Dilution Control Systems'
      ]
    },
    {
      slug: 'paper-products',
      name: 'Paper Products & Dispensers',
      short: 'Paper & Dispensers',
      icon: 'roll',
      blurb: 'Hand towels, bath tissue, facial and the dispensers they lock into — matched systems, not orphan refills.',
      subs: [
        'Paper Hand Towels',
        'Roll Towels & Dispensers',
        'Multifold & Singlefold Towels',
        'Centre-Pull Towels',
        'Bath Tissue & Toilet Paper',
        'Toilet Paper Dispensers',
        'Paper Towel Dispensers',
        'Facial Tissue',
        'Table Napkins & Dispensers',
        'Industrial Wipers & Rolls'
      ]
    },
    {
      slug: 'gloves',
      name: 'Disposable Gloves',
      short: 'Gloves',
      icon: 'glove',
      blurb: 'Nitrile, vinyl, latex and poly in every mil and size — food-safe, medical grade and general purpose.',
      subs: [
        'Nitrile Gloves',
        'Vinyl Gloves',
        'Latex Gloves',
        'Poly & Foodservice Gloves',
        'Powder-Free Gloves',
        'Powdered Gloves',
        'Medical Examination Gloves',
        'Food Safe & Sushi Gloves',
        'Cut-Resistant & Work Gloves',
        'Glove Dispensers'
      ]
    },
    {
      slug: 'safety',
      name: 'Safety Supplies & Protective Gear',
      short: 'Safety',
      icon: 'helmet',
      blurb: 'CSA and ANSI rated protection for the plant floor, the job site and the loading dock.',
      subs: [
        'Face Masks & Respirators',
        'Eye & Face Protection',
        'Hearing Protection',
        'Head Protection & Hard Hats',
        'Hi-Vis Apparel',
        'Protective Clothing & Coveralls',
        'First Aid Kits & Refills',
        'Spill Control & Absorbents',
        'Safety Signs & Barriers',
        'Fall Protection'
      ]
    },
    {
      slug: 'medical',
      name: 'Medical & Healthcare Supplies',
      short: 'Medical',
      icon: 'cross',
      blurb: 'Clinic, dental and long-term care consumables, stocked for repeat weekly replenishment.',
      subs: [
        'Exam Room Supplies',
        'Wound Care & Dressings',
        'Infection Control',
        'Personal Protective Equipment',
        'Diagnostics & Instruments',
        'Sharps Containers & Disposal',
        'Patient Care & Mobility',
        'Long-Term Care Supplies'
      ]
    },
    {
      slug: 'waste',
      name: 'Waste Receptacles & Can Liners',
      short: 'Waste & Liners',
      icon: 'bin',
      blurb: 'Liners by the skid, plus the indoor, outdoor and organics containers that go under them.',
      subs: [
        'Can Liners & Garbage Bags',
        'Compostable & Recycling Bags',
        'Indoor Waste Containers',
        'Outdoor & Public Space Bins',
        'Recycling & Organics Stations',
        'Ash & Cigarette Receptacles',
        'Sanisac Liners',
        'Sanitary Napkin Disposal'
      ]
    },
    {
      slug: 'amenities',
      name: 'Washroom & Guest Amenities',
      short: 'Guest Amenities',
      icon: 'soap',
      blurb: 'Bath and body amenities, vanity kits and feminine care for hotels, motels, B&Bs and short-term rentals.',
      subs: [
        'Bath & Body Amenities',
        'Guest Shampoo & Conditioner',
        'Guest Soaps',
        'Combs & Vanity Kits',
        'Cotton Swabs & Cotton Balls',
        'Deodorant & Antiperspirant',
        'Shower Caps & Slippers',
        'Dental & Shave Kits',
        'Feminine Hygiene Products',
        'Baby Changing & Family Care'
      ]
    },
    {
      slug: 'hospitality',
      name: 'Hotel, Motel & Hospitality',
      short: 'Hospitality',
      icon: 'bed',
      blurb: 'Housekeeping carts, linens, in-room service and the collateral that turns a room over on schedule.',
      subs: [
        'Housekeeping Carts & Caddies',
        'Linens, Towels & Bedding',
        'In-Room Coffee & Kettles',
        'Ice Buckets & Glassware',
        'Laundry Bags & Hampers',
        'Door Hangers & Room Collateral',
        'Luggage Carts & Racks',
        'Airbnb & Short-Term Rental Kits'
      ]
    },
    {
      slug: 'warehouse',
      name: 'Warehouse, Shipping & Facility',
      short: 'Warehouse & Facility',
      icon: 'box',
      blurb: 'Corrugate, stretch wrap, matting and grounds maintenance — the back-of-house half of the order.',
      subs: [
        'Corrugated Boxes & Mailers',
        'Stretch Wrap & Strapping',
        'Packing Tape & Dispensers',
        'Bubble Wrap & Void Fill',
        'Shipping Labels & Supplies',
        'Matting & Floor Protection',
        'Carts, Dollies & Hand Trucks',
        'Facility & Grounds Maintenance',
        'Ice Melt & Winter Supplies',
        'Shelving & Storage Bins'
      ]
    }
  ];

  /* Brands a distributor in this space carries. Demo content for the
     Shop By Brand page — not an endorsement or a real supplier list. */
  var brands = [
    '3M', 'Ansell', 'Bunzl', 'Cascades PRO', 'Chicopee', 'Dart', 'Diversey',
    'Durable Packaging', 'Ecolab', 'Georgia-Pacific', 'Handgards', 'Hospeco',
    'Kimberly-Clark Professional', 'Lysol Professional', 'Pactiv Evergreen',
    'Rubbermaid Commercial', 'Sabert', 'Scott', 'Tork', 'Unisource',
    'Vileda Professional', 'Wausau Paper'
  ];

  /* ---------- Generated product rows ----------
     A mulberry32 PRNG seeded from the subcategory name, so the same
     subcategory always renders the same products — no flicker between a
     page load and a filter change, and no 40,000-row JSON to ship. */
  function seedFrom(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rng(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) >>> 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var PACKS = ['case of 100', 'case of 250', 'case of 500', 'case of 1,000',
               '6 × 1 L case', '4 × 4 L case', 'carton of 12', 'carton of 24',
               'roll of 500', 'skid of 40 cases'];
  var GRADES = ['Commercial Grade', 'Heavy Duty', 'Premium', 'Economy',
                'Food Safe', 'Industrial', 'Eco-Preferable', 'Professional'];

  function makeProducts(categoryName, subName, count) {
    var r = rng(seedFrom(categoryName + '|' + subName));
    var singular = subName.replace(/ & .*$/, '').replace(/s$/, '');
    var out = [];
    for (var i = 0; i < count; i++) {
      var brand = brands[Math.floor(r() * brands.length)];
      var grade = GRADES[Math.floor(r() * GRADES.length)];
      var pack = PACKS[Math.floor(r() * PACKS.length)];
      var price = Math.round((8 + r() * 240) * 100) / 100;
      var list = Math.round(price * (1.08 + r() * 0.35) * 100) / 100;
      out.push({
        sku: 'ND-' + String(Math.floor(1000 + r() * 8999)) + '-' +
             subName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(),
        name: brand + ' ' + grade + ' ' + singular,
        sub: subName,
        pack: pack,
        price: price,
        list: list,
        rating: Math.round((3.8 + r() * 1.2) * 10) / 10,
        reviews: Math.floor(4 + r() * 180),
        eco: r() < 0.22,
        nexday: r() < 0.78,
        stock: r() < 0.9 ? 'In stock' : 'Ships in 2–3 days'
      });
    }
    return out;
  }

  function findCategory(slug) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].slug === slug) return categories[i];
    }
    return null;
  }

  /* Flat index for the search box: every category and subcategory. */
  function searchIndex() {
    var rows = [];
    categories.forEach(function (cat) {
      rows.push({ label: cat.name, kind: 'Category', href: 'category.html?c=' + cat.slug });
      cat.subs.forEach(function (sub) {
        rows.push({
          label: sub,
          kind: cat.short,
          href: 'category.html?c=' + cat.slug + '&s=' + encodeURIComponent(sub)
        });
      });
    });
    return rows;
  }

  window.NEXDAY = {
    categories: categories,
    brands: brands,
    findCategory: findCategory,
    makeProducts: makeProducts,
    searchIndex: searchIndex
  };
})();
