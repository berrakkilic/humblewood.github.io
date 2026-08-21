const assert = require('assert');
const rules = require('../public/js/character-rules');

function validFields(overrides = {}) {
  return {
    species: 'Corvum (birdfolk)',
    subrace: 'Dusk Corvum',
    class: 'Rogue',
    subclass: 'Thief',
    level: '5',
    str: '10', dex: '16', con: '12', int: '13', wis: '11', cha: '9',
    ...overrides
  };
}

assert.equal(rules.canonicalSpecies('corvum'), 'Corvum (birdfolk)');
assert.deepEqual(rules.subracesFor('Cervan'), ['Grove Cervan', 'Pronghorn Cervan']);
assert.deepEqual(rules.subracesFor('Hedge (humblefolk)'), []);
assert.ok(rules.subclassesFor('Bard').includes('College of the Road (Bard)'));
assert.equal(rules.validatePlayerCharacter({ fields: validFields() }), '');
assert.match(rules.validatePlayerCharacter({ fields: validFields({ subrace: 'Sera Luma' }) }), /not a subrace/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ subclass: 'Champion' }) }), /not a subclass/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ level: '21' }) }), /1 to 20/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ dex: '21' }) }), /DEX.*1 to 20/i);

const character = {
  fields: validFields({ species: 'corvum', class: 'rogue' }),
  abilities: { str: 99 },
  level: 99
};
rules.applyPlayerCharacterConstraints(character);
assert.equal(character.species, 'Corvum (birdfolk)');
assert.equal(character.charClass, 'Rogue');
assert.equal(character.level, 5);
assert.equal(character.abilities.str, 10);
assert.equal(character.fields.subrace, 'Dusk Corvum');

console.log('Character rule checks passed: dependent Humblewood/D&D options and player-only level/ability limits.');
