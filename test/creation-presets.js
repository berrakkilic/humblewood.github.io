const assert = require('assert');
const presets = require('../public/js/creation-presets');

assert(presets.ATTACK_PRESETS.length >= 35, 'common weapon and natural attack presets should be available');
assert(presets.STANDARD_SPELL_PRESETS.length >= 60, 'core spell presets should cover every spell level');
assert(presets.NPC_PRESETS.some(preset => preset.id === 'hw-birdfolk-dockmaster'));
assert(presets.NPC_PRESETS.some(preset => preset.id === '5e-priest'));

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
