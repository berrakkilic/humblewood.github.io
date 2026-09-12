function slug(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const SHOP_DEFINITIONS = [
  {
    id: 'seed-stall',
    name: 'The Seed Stall',
    items: [
      ['Redroot seeds', 3, '3 cp'],
      ['Moon turnip seeds', 5, '5 cp'],
      ['Brackenmill giant-squash seeds', 5, '5 cp'],
      ['Sweetclover seed', 2, '2 cp'],
      ['Beetle treats', 2, '2 cp'],
      ['Festival seed pouch', 1, '1 cp'],
      ['Farmer’s assortment', 20, '2 sp'],
      ['Blank packet', 10, '1 sp'],
      ['Snapvine seeds', 80, '8 sp'],
      ['Glowbud seeds', 50, '5 sp'],
      ['Whistlegrass', 20, '2 sp']
    ]
  },
  {
    id: 'normals-abnormals',
    name: 'Normal’s Abnormals',
    items: [
      ['Minor Healing Draught', 500, '5 gp', { initialStock: 3 }],
      ['Potion of Healing', 5000, '50 gp', { initialStock: 1 }],
      ['Healer’s kit', 500, '5 gp'],
      ['Herbalism kit', 500, '5 gp'],
      ['Antitoxin', 5000, '50 gp', { initialStock: 1 }],
      ['Beetle-calming balm', 20, '2 sp'],
      ['Small jar labelled “NO”', 300, '3 gp'],
      ['Sneezing Powder', 80, '8 sp'],
      ['Stickywort Paste', 50, '5 sp'],
      ['Bloodstop Moss', 100, '1 gp'],
      ['Wake-Up Pebbles', 30, '3 sp'],
      ['Mothbane Chalk', 40, '4 sp'],
      ['Smoke Pearl', 200, '2 gp']
    ]
  },
  {
    id: 'festival-trinkets',
    name: 'Festival Trinkets & Ceremony Stall',
    items: [
      ['Bloom ribbons', 1, '3 for 1 cp', { inventoryQuantity: 3 }],
      ['Flower crown', 2, '2 cp'],
      ['Festival handbell', 50, '5 sp'],
      ['Savior mask', 10, '1 sp'],
      ['Three-loop Savior pendant', 20, '2 sp'],
      ['“Mother Keeps” token', 5, '5 cp'],
      ['Lucky beetle charm', 5, '5 cp'],
      ['Painted seed vial', 5, '5 cp'],
      ['Festival chalk', 1, '3 for 1 cp', { inventoryQuantity: 3 }],
      ['Festival lantern-paper', 5, '5 cp'],
      ['Wax writing tablet', 30, '3 sp']
    ]
  },
  {
    id: 'eliza-pennygleams',
    name: 'Eliza Pennygleam’s Things & Stuff',
    items: [
      ['Little packet of western tea', 20, '2 sp'],
      ['Box of assorted buttons', 5, '5 cp'],
      ['Fine ribbons', 1, '1 cp/ft', { inventoryName: 'Fine ribbons (ft)' }],
      ['Carved wooden beetle', 10, '1 sp'],
      ['Foreign coin', 20, '2 sp'],
      ['Cheap brass brooch', 50, '5 sp'],
      ['Old map of the central Wood', 50, '5 sp'],
      ['Current road map toward Alderheart', 100, '1 gp'],
      ['Hempen rope, 50 ft', 100, '1 gp'],
      ['Steel mirror', 500, '5 gp'],
      ['Tiny vial of Thrymwood perfume', 500, '5 gp'],
      ['Mystery wrapped parcel', 30, '3 sp'],
      ['A Traveller’s Pocket Guide to the Wood', 80, '8 sp'],
      ['Things That Bite, Sting, or Otherwise Object to Being Touched', 100, '1 gp'],
      ['One Hundred and Seven Knots, Thirty of Them Useful', 50, '5 sp'],
      ['The Frugal Adventurer', 40, '4 sp'],
      ['An Extremely Outdated Guide to Alderheart', 30, '3 sp']
    ]
  },
  {
    id: 'brightsparks-curiosities',
    name: 'Brightspark’s Curiosities',
    items: [
      ['“Precision” timekeeper', 200, '2 gp'],
      ['Bell-Wire Alarm', 80, '8 sp'],
      ['Brightspark’s Third Hand', 100, '1 gp'],
      ['Pocket Listening Cone', 80, '8 sp'],
      ['Fold-Out Looking Mirror', 100, '1 gp'],
      ['Spring-Snapper', 60, '6 sp'],
      ['Brightspark Emergency Grappler', 200, '2 gp'],
      ['The Beginner Inventor: Please Read Before Losing a Finger', 70, '7 sp']
    ]
  }
];

const SHOP_ITEMS = new Map();

SHOP_DEFINITIONS.forEach(shop => {
  shop.items.forEach(([name, priceCopper, priceLabel, options = {}]) => {
    const item = Object.freeze({
      id: `${shop.id}:${slug(name)}`,
      shopId: shop.id,
      shopName: shop.name,
      name,
      inventoryName: options.inventoryName || name,
      inventoryQuantity: options.inventoryQuantity || 1,
      priceCopper,
      priceLabel,
      initialStock: Number.isInteger(options.initialStock) ? options.initialStock : null
    });
    SHOP_ITEMS.set(item.id, item);
  });
});

function shopItem(itemId) {
  return SHOP_ITEMS.get(String(itemId || '')) || null;
}

function initialShopStock() {
  return Object.fromEntries(
    [...SHOP_ITEMS.values()]
      .filter(item => item.initialStock !== null)
      .map(item => [item.id, item.initialStock])
  );
}

function normalizeShopStock(stock) {
  const source = stock && typeof stock === 'object' ? stock : {};
  return Object.fromEntries(
    [...SHOP_ITEMS.values()]
      .filter(item => item.initialStock !== null)
      .map(item => {
        const stored = Number(source[item.id]);
        const quantity = Number.isInteger(stored)
          ? Math.max(0, Math.min(item.initialStock, stored))
          : item.initialStock;
        return [item.id, quantity];
      })
  );
}

function publicShopCatalog() {
  return Object.fromEntries(
    [...SHOP_ITEMS.values()].map(item => [item.id, {
      id: item.id,
      name: item.name,
      priceLabel: item.priceLabel,
      inventoryQuantity: item.inventoryQuantity,
      limited: item.initialStock !== null
    }])
  );
}

module.exports = {
  SHOP_DEFINITIONS,
  SHOP_ITEMS,
  initialShopStock,
  normalizeShopStock,
  publicShopCatalog,
  shopItem,
  slug
};
