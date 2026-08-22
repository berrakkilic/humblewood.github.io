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
assert.ok(rules.subclassesFor('Barbarian').includes('Path of the Giant'));
assert.ok(rules.subclassesFor('Cleric').includes('Twilight Domain'));
assert.ok(rules.subclassesFor('Druid').includes('Circle of Wildfire'));
assert.ok(rules.subclassesFor('Fighter').includes('Echo Knight'));
assert.ok(rules.subclassesFor('Monk').includes('Way of Mercy'));
assert.ok(rules.subclassesFor('Paladin').includes('Oath of the Watchers'));
assert.ok(rules.subclassesFor('Ranger').includes('Drakewarden'));
assert.ok(rules.subclassesFor('Rogue').includes('Soulknife'));
assert.ok(rules.subclassesFor('Sorcerer').includes('Lunar Sorcery'));
assert.ok(rules.subclassesFor('Warlock').includes('The Undead'));
assert.ok(rules.subclassesFor('Wizard').includes('Chronurgy Magic'));
assert.equal(Object.keys(rules.CLASS_SUBCLASSES).length, 13);
assert.equal(Object.values(rules.CLASS_SUBCLASSES).flat().length, 122);
Object.entries(rules.CLASS_SUBCLASSES).forEach(([className, subclasses]) => {
  assert.equal(new Set(subclasses).size, subclasses.length, `${className} contains duplicate subclasses`);
});
assert.equal(rules.validatePlayerCharacter({ fields: validFields() }), '');
assert.match(rules.validatePlayerCharacter({ fields: validFields({ subrace: 'Sera Luma' }) }), /not a subrace/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ subclass: 'Champion' }) }), /not a subclass/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ level: '21' }) }), /1 to 20/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ dex: '21' }) }), /DEX.*1 to 20/i);
assert.match(rules.validatePlayerCharacter({ fields: validFields({ species: 'Hedge (humblefolk)', subrace: '', feats: 'Heavy Glider' }) }), /requires.*Glide/i);
assert.equal(rules.validatePlayerCharacter({ fields: validFields({ feats: 'Aerial Expert\nPrerequisite: Glide trait' }) }), '');
assert.deepEqual(rules.GLIDE_FEATS, ['Aerial Expert', 'Heavy Glider']);

assert.deepEqual(rules.spellcastingValues(18, 5), { attackBonus: 7, saveDc: 15 });
assert.deepEqual(rules.spellcastingValues(12, 5), { attackBonus: 4, saveDc: 12 });
assert.deepEqual(rules.spellcastingValues(8, 17), { attackBonus: 5, saveDc: 13 });

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

console.log('Character rule checks passed: all 5e/Humblewood subclasses, dependent options, and player-only limits.');
