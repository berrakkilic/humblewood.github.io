const assert = require('assert');
const almanac = require('../public/js/almanac');
const data = require('../public/js/almanac-data');

const totalEntries = data.reduce((sum, category) => sum + category.entries.length, 0);
assert.equal(totalEntries, 37);

const vulpin = almanac.filterCategories(data, 'vulpin');
assert(vulpin.some(category => category.entries.some(entry => entry.title === 'Vulpin')));

const clericSpells = almanac.filterCategories(data, 'cleric spell');
const clericSpellNames = clericSpells.flatMap(category => category.entries.map(entry => entry.title));
assert(clericSpellNames.includes('Elevated Sight'));
assert(clericSpellNames.includes('Invoke the Amaranthine'));

const brackenmillTrade = almanac.filterCategories(data, 'brackenmill trade');
assert.deepEqual(brackenmillTrade.map(category => category.id), ['brackenmill']);
assert.equal(almanac.normalizeSearch('Veil of Dúsk!'), 'veil of dusk');

console.log('Almanac checks passed: searchable campaign lore, folk, callings, backgrounds, and spells.');
