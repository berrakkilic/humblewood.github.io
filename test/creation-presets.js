const assert = require('assert');
const fs = require('fs');
const path = require('path');
const presets = require('../public/js/creation-presets');

assert(presets.ATTACK_PRESETS.length >= 35, 'common weapon and natural attack presets should be available');
assert.equal(presets.STANDARD_SPELL_PRESETS.length, 361, 'the complete 2014 Player\'s Handbook spell catalog should be available');
assert.equal(new Set(presets.STANDARD_SPELL_PRESETS.map(spell => spell.name)).size, 361, 'Player\'s Handbook spell names should be unique');
for (let level = 0; level <= 9; level += 1) {
  assert(presets.STANDARD_SPELL_PRESETS.some(spell => spell.level === level), `spell level ${level} should be represented`);
}
presets.STANDARD_SPELL_PRESETS.forEach(spell => {
  ['name', 'school', 'range', 'castingTime', 'duration', 'components', 'attack', 'effect', 'source'].forEach(field => {
    assert(String(spell[field] || '').trim(), `${spell.name} should include ${field}`);
  });
  assert.equal(spell.source, "Player's Handbook (2014)");
});

const goodberry = presets.STANDARD_SPELL_PRESETS.find(spell => spell.name === 'Goodberry');
assert(goodberry, 'Goodberry should be available as a spell preset');
assert.equal(goodberry.level, 1);
assert.equal(goodberry.school, 'Transmutation');
assert.equal(goodberry.range, 'Touch');
assert.match(goodberry.effect, /ten magical berries/i);
const parsedGoodberry = presets.parseSpells('1st level (2 slots): goodberry');
assert.equal(parsedGoodberry.slots[1], 2);
assert.equal(parsedGoodberry.spells[0].name, 'Goodberry');
assert.equal(parsedGoodberry.spells[0].school, 'Transmutation');
assert.match(parsedGoodberry.spells[0].effect, /ten magical berries/i);

['Beacon of Hope', 'Beast Sense', 'Command', 'Witch Bolt', 'Wrathful Smite', 'Zone of Truth'].forEach(name => {
  assert(presets.STANDARD_SPELL_PRESETS.some(spell => spell.name === name), `missing Player's Handbook spell: ${name}`);
});

const appSource = fs.readFileSync(path.resolve(__dirname, '../public/app.js'), 'utf8');
[
  'Ambush Prey', 'Elevated Sight', 'Feathered Reach', 'Globe of Twilight', 'Gust Barrier',
  'Invoke the Amaranthine', 'Shape Plants', 'Spiny Shield', 'Stellar Bodies', 'Veil of Dusk'
].forEach(name => assert(appSource.includes(`name: '${name}'`), `missing Humblewood spell preset: ${name}`));
assert(presets.NPC_PRESETS.some(preset => preset.id === 'hw-birdfolk-dockmaster'));
assert(presets.NPC_PRESETS.some(preset => preset.id === '5e-priest'));

const humblewoodPresetIds = [
  'hw-birdfolk-farmer',
  'hw-birdfolk-guard',
  'hw-birdfolk-militia',
  'hw-birdfolk-dockmaster',
  'hw-birdfolk-sailor',
  'hw-birdfolk-skirmisher',
  'hw-cervan-bandit-general',
  'hw-cervan-priest',
  'hw-corvum-assassin',
  'hw-corvum-diviner',
  'hw-corvum-necromancer',
  'hw-gallus-druid',
  'hw-gallus-monk',
  'hw-gallus-necromancer',
  'hw-hedge-bard',
  'hw-hedge-witch',
  'hw-jerbeen-thief',
  'hw-jerbeen-swashbuckler',
  'hw-luma-cleric-ardea',
  'hw-luma-wizard',
  'hw-mapach-bandit',
  'hw-mapach-brute',
  'hw-mapach-tinkerer',
  'hw-oakheart',
  'hw-raptor-explorer',
  'hw-raptor-ranger',
  'hw-strig-knight',
  'hw-strig-tracker',
  'hw-havel-autumn-moon',
  'hw-tevor-spring-path',
  'hw-vulpin-captain',
  'hw-vulpin-noble',
  'hw-vulpin-priest-kren'
];
const humblewoodPresets = presets.NPC_PRESETS.filter(preset => preset.source === 'Humblewood');
assert.equal(humblewoodPresets.length, humblewoodPresetIds.length, 'the complete Appendix B preset set should be available');
assert.equal(new Set(humblewoodPresets.map(preset => preset.id)).size, humblewoodPresetIds.length, 'Humblewood preset ids should be unique');
humblewoodPresetIds.forEach(id => assert(humblewoodPresets.some(preset => preset.id === id), `missing Humblewood NPC preset: ${id}`));
humblewoodPresets.forEach(preset => {
  const parsed = presets.parseStatBlock(preset.statBlock, { name: preset.name });
  assert.equal(parsed.name, preset.name, `${preset.name} should retain its preset name`);
  assert(Number(parsed.fields.ac) > 0, `${preset.name} should import armor class`);
  assert(Number(parsed.fields.maxhp) > 0, `${preset.name} should import hit points`);
  assert(parsed.attacks.length > 0, `${preset.name} should import at least one attack`);
});

const militiaPreset = presets.NPC_PRESETS.find(preset => preset.id === 'hw-birdfolk-militia');
const militia = presets.parseStatBlock(militiaPreset.statBlock);
assert.equal(militia.fields.ac, '12');
assert.equal(militia.fields.maxhp, '11');
assert.equal(militia.attacks[0].name, 'Mace');

const hedgeWitchPreset = presets.NPC_PRESETS.find(preset => preset.id === 'hw-hedge-witch');
const hedgeWitch = presets.parseStatBlock(hedgeWitchPreset.statBlock);
assert.equal(hedgeWitch.fields['spell-ability'], 'CHA');
assert.equal(hedgeWitch.fields['spell-dc'], '13');
assert.equal(hedgeWitch.spellSlots[1], 2);
assert(hedgeWitch.spells.some(spell => spell.name === 'Eldritch Blast'));
assert.match(hedgeWitch.fields['attacks-notes'], /Fiendish Vigor/i);

const lumaClericPreset = presets.NPC_PRESETS.find(preset => preset.id === 'hw-luma-cleric-ardea');
const lumaCleric = presets.parseStatBlock(lumaClericPreset.statBlock);
assert.equal(lumaCleric.fields['spell-ability'], 'WIS');
assert.equal(lumaCleric.spellSlots[1], 4);
assert.equal(lumaCleric.spellSlots[2], 3);
assert.equal(lumaCleric.spellSlots[3], 2);
assert(lumaCleric.spells.some(spell => spell.name === 'Guiding Bolt' && spell.damage === '4d6 radiant'));
assert.match(lumaCleric.fields['attacks-notes'], /Ardea's Vigor/i);

const oakheartPreset = presets.NPC_PRESETS.find(preset => preset.id === 'hw-oakheart');
const oakheart = presets.parseStatBlock(oakheartPreset.statBlock);
assert.equal(oakheart.challenge, '8');
assert.equal(oakheart.fields.size, 'Huge');
assert.equal(oakheart.attacks.length, 2);
assert(oakheart.attacks.some(attack => attack.name === 'Rock' && attack.damage === '4d10+5 bludgeoning'));

const dockmasterPreset = presets.NPC_PRESETS.find(preset => preset.id === 'hw-birdfolk-dockmaster');
const dockmaster = presets.parseStatBlock(dockmasterPreset.statBlock, { name: dockmasterPreset.name });
assert.equal(dockmaster.name, 'Birdfolk Dockmaster');
assert.equal(dockmaster.fields.ac, '14');
assert.equal(dockmaster.fields.maxhp, '55');
assert.equal(dockmaster.fields.speed, '30 ft.');
assert.equal(dockmaster.fields.dex, '16');
assert.equal(dockmaster.fields['skill-perception'], '5');
assert.equal(dockmaster.fields['skill-perception-prof'], true);
assert.equal(dockmaster.attacks.length, 2);
assert.equal(dockmaster.attacks[0].name, 'Saber');
assert.equal(dockmaster.attacks[0].damage, '1d6+3 slashing');
assert.match(dockmaster.fields['racial-traits'], /Sneak Attack/i);
assert.match(dockmaster.fields['attacks-notes'], /Multiattack/i);

const priestPreset = presets.NPC_PRESETS.find(preset => preset.id === '5e-priest');
const priest = presets.parseStatBlock(priestPreset.statBlock);
assert.equal(priest.fields['spell-ability'], 'WIS');
assert.equal(priest.fields['spell-dc'], '13');
assert.equal(priest.fields['spell-attack'], '5');
assert.equal(priest.spellSlots[1], 4);
assert.equal(priest.spellSlots[2], 3);
assert.equal(priest.spellSlots[3], 2);
assert(priest.spells.some(spell => spell.name === 'Guiding Bolt' && spell.damage === '4d6 radiant'));
assert(priest.spells.some(spell => spell.name === 'Spirit Guardians' && spell.level === 3));

const imported = presets.parseStatBlock(`EMBER ADEPT
Medium humanoid, neutral
Armor Class 15 (studded leather)
Hit Points 44 (8d8 + 8)
Speed 30 ft.
STR DEX CON INT WIS CHA
9 (-1) 16 (+3) 12 (+1) 14 (+2) 11 (+0) 18 (+4)
Saving Throws Dex +5, Cha +6
Skills Acrobatics +5, Perception +2
Senses passive Perception 12
Languages Common, Ignan
Challenge 3 (700 XP)
Spellcasting. The adept's spellcasting ability is Charisma (spell save DC 14, +6 to hit with spell attacks).
Cantrips (at will): fire bolt, light
1st level (4 slots): burning hands, shield
2nd level (3 slots): scorching ray
Actions
Flame Knife. Melee Spell Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) fire damage.
Reactions
Flaring Guard. The adept adds 2 to its AC against one attack.`);
assert.equal(imported.name, 'Ember Adept');
assert.equal(imported.fields.cha, '18');
assert.equal(imported.fields['save-cha'], '6');
assert.equal(imported.fields['skill-acrobatics'], '5');
assert.equal(imported.attacks[0].bonus, '+6');
assert.equal(imported.attacks[0].damage, '1d8+4 fire');
assert(imported.spells.some(spell => spell.name === 'Fire Bolt' && spell.damage === '1d10 fire'));
assert.match(imported.fields['attacks-notes'], /Flaring Guard/);

const rapier = presets.attackPresetValues(
  presets.ATTACK_PRESETS.find(value => value.name === 'Rapier'),
  { str: 8, dex: 16 },
  2
);
assert.equal(rapier.bonus, '+5');
assert.equal(rapier.damage, '1d8+3 piercing');

console.log('Creation preset checks passed: attacks, spells, NPC templates, and pasted stat-block parsing.');
