const assert = require('assert');
const almanac = require('../public/js/almanac');
const data = require('../public/js/almanac-data');

const totalEntries = data.reduce((sum, category) => sum + category.entries.length, 0);
assert.equal(totalEntries, 48);

const map = data.find(category => category.id === 'map');
assert.equal(map.entries[0].image.src, '/images/humblewood-expanded-nohex-v0.3.png');
assert.equal(map.entries[0].openByDefault, true);
const mapMarkup = almanac.renderEntry(map.entries[0], false);
assert.match(mapMarkup, /almanac-entry-wide/);
assert.match(mapMarkup, /humblewood-expanded-nohex-v0\.3\.png/);
assert.match(mapMarkup, /<details[^>]* open>/);

const faith = data.find(category => category.id === 'faith');
assert.equal(faith.entries.length, 3);
const ardea = almanac.filterCategories(data, 'Ardea Dawnmother');
assert(ardea.some(category => category.id === 'faith'));

const feats = data.find(category => category.id === 'feats');
assert.equal(feats.entries.length, 7);

const vulpin = almanac.filterCategories(data, 'vulpin');
assert(vulpin.some(category => category.entries.some(entry => entry.title === 'Vulpin')));

const clericSpells = almanac.filterCategories(data, 'cleric spell');
const clericSpellNames = clericSpells.flatMap(category => category.entries.map(entry => entry.title));
assert(clericSpellNames.includes('Elevated Sight'));
assert(clericSpellNames.includes('Invoke the Amaranthine'));

const brackenmillTrade = almanac.filterCategories(data, 'brackenmill trade');
assert.deepEqual(brackenmillTrade.map(category => category.id), ['brackenmill']);
assert.equal(almanac.normalizeSearch('Veil of Dúsk!'), 'veil of dusk');
assert.doesNotMatch(JSON.stringify(data), /\b(?:you|your)\b|my personal/i);

console.log('Almanac checks passed: map, public faith lore, folk, callings, backgrounds, feats, spells, search, and neutral voice.');
