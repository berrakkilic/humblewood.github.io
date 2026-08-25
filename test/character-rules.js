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

assert.deepEqual(Object.keys(rules.SPECIES_TRAITS).sort(), Object.keys(rules.SPECIES_SUBRACES).sort());
Object.entries(rules.SPECIES_SUBRACES).forEach(([species, subraces]) => {
  const baseTraits = rules.automaticSpeciesTraitText(species);
  assert.match(baseTraits, new RegExp(species.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(baseTraits, /Ability scores:/);
  assert.match(baseTraits, /Core traits/);
  subraces.forEach(subrace => {
    assert.match(rules.automaticSpeciesTraitText(species, subrace), new RegExp(subrace));
  });
});
const duskTraits = rules.automaticSpeciesTraitText('Corvum', 'Dusk Corvum');
assert.match(duskTraits, /Dusk Corvum/);
assert.doesNotMatch(rules.automaticSpeciesTraitText('Corvum', 'Sera Luma'), /Sera Luma/);
const customTraits = 'Custom campaign trait: Friend of the Alderheart.';
const mergedTraits = rules.mergeAutomaticSpeciesTraits(customTraits, duskTraits);
assert.match(mergedTraits, /^Custom campaign trait:/);
assert.equal((mergedTraits.match(/\[Automatic Humblewood species traits\]/g) || []).length, 1);
const changedTraits = rules.mergeAutomaticSpeciesTraits(
  mergedTraits,
  rules.automaticSpeciesTraitText('Corvum', 'Kindled Corvum')
);
assert.match(changedTraits, /Kindled Corvum/);
assert.doesNotMatch(changedTraits, /Dusk Corvum/);
assert.match(changedTraits, /^Custom campaign trait:/);
assert.equal(rules.mergeAutomaticSpeciesTraits(changedTraits, ''), customTraits);
assert.equal(rules.mergeAutomaticSpeciesTraits(duskTraits, duskTraits), duskTraits, 'automatic trait merging is idempotent');

const fighterFeatures = rules.automaticClassFeatureText('Fighter', 'Champion', 5);
assert.match(fighterFeatures, /Fighter · Level 5/);
assert.match(fighterFeatures, /Hit Die: d10/);
assert.match(fighterFeatures, /Level 1: Fighting Style; Second Wind/);
assert.match(fighterFeatures, /Level 4: Ability Score Improvement or feat/);
assert.match(fighterFeatures, /Level 5: Extra Attack \(two attacks\)/);
assert.match(fighterFeatures, /Subclass: Champion/);
assert.match(fighterFeatures, /Level 3: Improved Critical/);
assert.doesNotMatch(fighterFeatures, /Remarkable Athlete/);

const roadFeatures = rules.automaticClassFeatureText('Bard', 'College of the Road (Bard)', 6);
assert.match(roadFeatures, /Traveler's Tricks \(2 options\)/);
assert.match(roadFeatures, /Favorite Trick \(1st\)/);
assert.doesNotMatch(roadFeatures, /Favorite Trick \(2nd\)/);

const thiefFeatures = rules.automaticClassFeatureText('Rogue', 'Thief', 9);
assert.match(thiefFeatures, /Fast Hands; Second-Story Work/);
assert.match(thiefFeatures, /Supreme Sneak/);
assert.doesNotMatch(thiefFeatures, /Use Magic Device/);

const expansionFeatures = rules.automaticClassFeatureText('Fighter', 'Echo Knight', 7);
assert.match(expansionFeatures, /Subclass: Echo Knight/);
assert.match(expansionFeatures, /Echo Knight feature \(consult its source/);
assert.doesNotMatch(rules.automaticClassFeatureText('Fighter', 'Thief', 20), /Subclass: Thief/);

const supportedSubclasses = Object.values(rules.CLASS_SUBCLASSES).flat();
Object.keys(rules.CORE_SUBCLASS_FEATURES).forEach(subclass => {
  assert(supportedSubclasses.includes(subclass), `${subclass} must remain a selectable subclass`);
});
Object.entries(rules.CLASS_SUBCLASSES).forEach(([className, subclasses]) => {
  subclasses.forEach(subclass => {
    assert.match(rules.automaticClassFeatureText(className, subclass, 20), new RegExp(subclass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  });
});

const customClassNotes = 'Custom choice: Defense fighting style.';
const mergedClassFeatures = rules.mergeAutomaticClassFeatures(customClassNotes, fighterFeatures);
assert.match(mergedClassFeatures, /^Custom choice:/);
assert.equal((mergedClassFeatures.match(/\[Automatic class and subclass features\]/g) || []).length, 1);
const changedClassFeatures = rules.mergeAutomaticClassFeatures(mergedClassFeatures, thiefFeatures);
assert.match(changedClassFeatures, /Subclass: Thief/);
assert.doesNotMatch(changedClassFeatures, /Subclass: Champion/);
assert.match(changedClassFeatures, /^Custom choice:/);
assert.equal(rules.mergeAutomaticClassFeatures(changedClassFeatures, ''), customClassNotes);
assert.equal(rules.mergeAutomaticClassFeatures(fighterFeatures, fighterFeatures), fighterFeatures, 'automatic class-feature merging is idempotent');

assert.deepEqual(rules.spellcastingValues(18, 5), { attackBonus: 7, saveDc: 15 });
assert.deepEqual(rules.spellcastingValues(12, 5), { attackBonus: 4, saveDc: 12 });
assert.deepEqual(rules.spellcastingValues(8, 17), { attackBonus: 5, saveDc: 13 });

assert.equal(rules.hitDieFor('Wizard'), 6);
assert.equal(rules.hitDieFor('Barbarian'), 12);
assert.deepEqual(
  Object.fromEntries(Object.keys(rules.CLASS_PROGRESSIONS).map(className => [className, rules.hitDieFor(className)])),
  { Artificer: 8, Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6 }
);
assert.equal(rules.averageHitDieRoll('Fighter'), 6);
assert.equal(rules.hitPointGain('Fighter', 14, 7), 9);
assert.equal(rules.hitPointGain('Wizard', 6, 1), 1, 'HP gained at a level has a minimum of 1');
assert.equal(rules.levelUpHitPointIncrease('Fighter', 14, 16, 4, [6]), 12, 'CON modifier increases apply retroactively to every level');
assert.equal(rules.levelUpHitPointIncrease('Wizard', 10, 10, 3, [4, 4]), 8);
assert.deepEqual(rules.classSavingThrows('Artificer'), ['con', 'int']);
assert.deepEqual(rules.classSavingThrows('Rogue'), ['dex', 'int']);
assert.deepEqual(rules.asiLevelsBetween('Fighter', 3, 15), [4, 6, 8, 12, 14]);
assert.deepEqual(rules.asiLevelsBetween('Rogue', 8, 12), [10, 12]);

assert.deepEqual(rules.spellSlotsFor('Wizard', '', 5), [4, 3, 2, 0, 0, 0, 0, 0, 0]);
assert.deepEqual(rules.spellSlotsFor('Paladin', '', 5), [4, 2, 0, 0, 0, 0, 0, 0, 0]);
assert.deepEqual(rules.spellSlotsFor('Artificer', '', 1), [2, 0, 0, 0, 0, 0, 0, 0, 0]);
assert.deepEqual(rules.spellSlotsFor('Fighter', 'Eldritch Knight', 7), [4, 2, 0, 0, 0, 0, 0, 0, 0]);
assert.deepEqual(rules.spellSlotsFor('Warlock', '', 11), [0, 0, 0, 0, 3, 0, 0, 0, 0]);
assert.equal(rules.preparedSpellCount('Cleric', 5, 16), 8);
assert.equal(rules.preparedSpellCount('Paladin', 5, 16), 5);
assert.equal(rules.preparedSpellCount('Bard', 5, 16), null);

assert.equal(rules.defaultArmorMethod('Hedge (humblefolk)', 'Wizard'), 'hedge');
assert.equal(rules.defaultArmorMethod('Corvum (birdfolk)', 'Monk'), 'monk');
assert.equal(rules.armorClass({ method: 'light', base: 12, dex: 16, bonus: 2 }), 17);
assert.equal(rules.armorClass({ method: 'medium', base: 15, dex: 18, bonus: 2 }), 19);
assert.equal(rules.armorClass({ method: 'heavy', base: 18, dex: 8, bonus: 2 }), 20);
assert.equal(rules.armorClass({ method: 'barbarian', dex: 14, con: 16, bonus: 2 }), 17);
assert.equal(rules.armorClass({ method: 'monk', dex: 16, wis: 14 }), 15);
assert.equal(rules.armorClass({ method: 'hedge', dex: 16, bonus: 2 }), 19);
assert.equal(rules.armorClass({ method: 'hedge-curled', dex: 20, bonus: 2 }), 21);
assert.equal(rules.armorClass({ method: 'manual', dex: 20 }), null);

const humblewoodGains = rules.levelUpGains({
  className: 'Cleric', subclass: 'Community Domain (Cleric)', species: 'Vulpin (humblefolk)', fromLevel: 1, toLevel: 6
});
assert(humblewoodGains.find(gain => gain.level === 2).subclassFeatures.includes('Channel Divinity: Magnificent Feast'));
assert(humblewoodGains.find(gain => gain.level === 3).speciesFeatures.some(feature => /Ambush Prey/.test(feature)));
assert(humblewoodGains.find(gain => gain.level === 4).asi);
assert(humblewoodGains.find(gain => gain.level === 5).proficiencyIncrease);
assert(humblewoodGains.find(gain => gain.level === 5).cantripIncrease);
assert(humblewoodGains.find(gain => gain.level === 6).subclassFeatures.includes('Channel Divinity: Community Watch'));

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
