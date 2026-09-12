const assert = require('assert');
const {
  SHOP_ITEMS, initialShopStock, normalizeShopStock, publicShopCatalog, shopItem
} = require('../src/server/shop-catalog');
const {
  deductCoins, planInventoryPurchase, walletCopper
} = require('../src/server/socket/shop');

assert.equal(SHOP_ITEMS.size, 60);
assert.equal(shopItem('seed-stall:redroot-seeds').priceCopper, 3);
assert.equal(shopItem('festival-trinkets:bloom-ribbons').inventoryQuantity, 3);
assert.equal(shopItem('eliza-pennygleams:fine-ribbons').inventoryName, 'Fine ribbons (ft)');
assert.equal(shopItem('brightsparks-curiosities:mechanical-seed-sorter-prototype'), null);
assert.deepEqual(publicShopCatalog()['seed-stall:redroot-seeds'], {
  id: 'seed-stall:redroot-seeds',
  name: 'Redroot seeds',
  priceLabel: '3 cp',
  inventoryQuantity: 1,
  limited: false
});

const originalStock = initialShopStock();
assert.deepEqual(originalStock, {
  'normals-abnormals:minor-healing-draught': 3,
  'normals-abnormals:potion-of-healing': 1,
  'normals-abnormals:antitoxin': 1
});
assert.deepEqual(normalizeShopStock({
  'normals-abnormals:minor-healing-draught': 2,
  'normals-abnormals:potion-of-healing': -4,
  'unknown:item': 99
}), {
  'normals-abnormals:minor-healing-draught': 2,
  'normals-abnormals:potion-of-healing': 0,
  'normals-abnormals:antitoxin': 1
});

const fields = { pp: '1', gp: '2', ep: '1', sp: '3', cp: '4' };
assert.equal(walletCopper(fields), 1284);
assert.equal(deductCoins(fields, 85), true);
assert.deepEqual(fields, { pp: '1', gp: '1', ep: '0', sp: '9', cp: '9' });

const changeFromGold = { pp: '0', gp: '1', ep: '0', sp: '0', cp: '0' };
assert.equal(deductCoins(changeFromGold, 3), true);
assert.deepEqual(changeFromGold, { pp: '0', gp: '0', ep: '0', sp: '9', cp: '7' });

const blepWallet = { pp: '0', gp: '3', ep: '0', sp: '0', cp: '0' };
assert.equal(deductCoins(blepWallet, 20), true);
assert.deepEqual(blepWallet, { pp: '0', gp: '2', ep: '0', sp: '8', cp: '0' });

const inventory = [
  { id: 'pack', name: 'Backpack', qty: 1, location: 'carried', isContainer: true, containerId: null },
  { id: 'ribbon', name: 'Bloom ribbons', qty: 3, location: 'backpack', isContainer: false, containerId: 'pack' }
];
const plan = planInventoryPurchase(inventory, shopItem('festival-trinkets:bloom-ribbons'));
assert.equal(plan.existing.id, 'ribbon');

console.log('Shop purchase checks passed.');
