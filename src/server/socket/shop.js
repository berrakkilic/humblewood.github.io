const crypto = require('crypto');
const { shopItem } = require('../shop-catalog');

const COINS = [
  ['pp', 1000],
  ['gp', 100],
  ['ep', 50],
  ['sp', 10],
  ['cp', 1]
];

function coinCount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
}

function walletCopper(fields) {
  return COINS.reduce((total, [field, copper]) => total + coinCount(fields[field]) * copper, 0);
}

function deductCoins(fields, priceCopper) {
  let owed = Math.max(0, Math.floor(Number(priceCopper) || 0));
  if (walletCopper(fields) < owed) return false;

  const purse = Object.fromEntries(COINS.map(([field]) => [field, coinCount(fields[field])]));
  const breakOrder = [
    ['sp', 'cp', 10],
    ['ep', 'sp', 5],
    ['gp', 'sp', 10],
    ['pp', 'gp', 10]
  ];

  while (owed > 0) {
    const spendable = COINS.find(([field, value]) => purse[field] > 0 && value <= owed);
    if (spendable) {
      purse[spendable[0]] -= 1;
      owed -= spendable[1];
      continue;
    }

    const exchange = breakOrder.find(([field]) => purse[field] > 0);
    if (!exchange) return false;
    const [from, to, quantity] = exchange;
    purse[from] -= 1;
    purse[to] += quantity;
  }

  COINS.forEach(([field]) => { fields[field] = String(purse[field]); });
  return true;
}

function targetBackpack(inventory) {
  return inventory.find(entry => entry.isContainer && /^backpack$/i.test(entry.name.trim())) || null;
}

function planInventoryPurchase(inventory, item) {
  const backpack = targetBackpack(inventory);
  const containerId = backpack?.id || null;
  const existing = inventory.find(entry => (
    entry.name.toLowerCase() === item.inventoryName.toLowerCase() &&
    (entry.containerId || null) === containerId &&
    entry.location === 'backpack'
  ));
  if (existing) {
    if (existing.qty + item.inventoryQuantity > 9999) {
      return { error: `You cannot carry any more ${item.inventoryName}.` };
    }
    return { existing };
  }
  if (inventory.length >= 300) return { error: 'Your backpack has no room for another item.' };
  return { backpack };
}

function addToBackpack(inventory, item, plan) {
  if (plan.existing) {
    plan.existing.qty += item.inventoryQuantity;
    return;
  }
  inventory.push({
    id: `shop-${crypto.randomUUID()}`,
    name: item.inventoryName,
    qty: item.inventoryQuantity,
    location: 'backpack',
    isContainer: false,
    containerId: plan.backpack?.id || null
  });
}

function registerShopHandlers(socket, room) {
  const {
    cloneJson, emitCharacterUpdate, normalizeCharacter, ownsCharacter, persistState
  } = room;
  const { io, state } = room;

  function result(payload, ok, message, extra = {}) {
    socket.emit('shop:purchase:result', {
      requestId: String(payload?.requestId || '').slice(0, 100),
      itemId: String(payload?.itemId || '').slice(0, 180),
      ok,
      message,
      ...extra
    });
  }

  socket.on('shop:purchase', (payload = {}) => {
    if (!socket.data.identified || socket.data.role !== 'player') {
      return result(payload, false, 'Only signed-in players can purchase items.');
    }

    const item = shopItem(payload.itemId);
    if (!item) return result(payload, false, 'That item is not available for purchase.');

    const characterName = String(payload.characterName || '').trim();
    const character = state.characters[characterName];
    if (!character || !ownsCharacter(socket, character)) {
      return result(payload, false, 'Choose one of your own characters for this purchase.');
    }

    normalizeCharacter(character);
    const remainingStock = item.initialStock === null
      ? null
      : Math.max(0, Number(state.shopStock[item.id]) || 0);
    if (remainingStock !== null && remainingStock < 1) {
      return result(payload, false, `${item.name} is sold out.`, { stock: remainingStock });
    }

    const availableCopper = walletCopper(character.fields);
    if (availableCopper < item.priceCopper) {
      return result(payload, false, `${character.name} does not have enough coin for ${item.name}.`);
    }

    const inventoryPlan = planInventoryPurchase(character.inventory, item);
    if (inventoryPlan.error) return result(payload, false, inventoryPlan.error);

    deductCoins(character.fields, item.priceCopper);
    addToBackpack(character.inventory, item, inventoryPlan);
    if (remainingStock !== null) state.shopStock[item.id] = remainingStock - 1;

    persistState();
    emitCharacterUpdate(character);
    if (remainingStock !== null) io.emit('shop:stock:update', cloneJson(state.shopStock));
    result(payload, true, `${item.name} was added to ${character.name}’s backpack.`, {
      characterName: character.name,
      stock: remainingStock === null ? null : remainingStock - 1
    });
  });
}

module.exports = {
  COINS,
  coinCount,
  deductCoins,
  planInventoryPurchase,
  registerShopHandlers,
  walletCopper
};
