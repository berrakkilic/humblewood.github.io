(function attachCreationPresets(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HumblewoodCreationPresets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCreationPresets() {
  const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const ABILITY_NAMES = {
    strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha',
    str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha'
  };
  const SKILL_KEYS = {
    acrobatics: 'acrobatics', 'animal handling': 'animal', arcana: 'arcana', athletics: 'athletics',
    deception: 'deception', history: 'history', insight: 'insight', intimidation: 'intimidation',
    investigation: 'investigation', medicine: 'medicine', nature: 'nature', perception: 'perception',
    performance: 'performance', persuasion: 'persuasion', religion: 'religion', 'sleight of hand': 'sleight',
    stealth: 'stealth', survival: 'survival'
  };

  const attack = (name, die, damageType, ability = 'str', properties = '') => ({
    name, die, damageType, ability, properties, source: 'Core 5e'
  });

  const ATTACK_PRESETS = [
    attack('Unarmed Strike', '1', 'bludgeoning'),
    attack('Bite', '1d6', 'piercing'),
    attack('Claw', '1d6', 'slashing'),
    attack('Talons', '1d4', 'piercing', 'finesse'),
    attack('Club', '1d4', 'bludgeoning'),
    attack('Dagger', '1d4', 'piercing', 'finesse', 'Finesse, light, thrown (20/60 ft.)'),
    attack('Greatclub', '1d8', 'bludgeoning'),
    attack('Handaxe', '1d6', 'slashing', 'str', 'Light, thrown (20/60 ft.)'),
    attack('Javelin', '1d6', 'piercing', 'str', 'Thrown (30/120 ft.)'),
    attack('Light Hammer', '1d4', 'bludgeoning', 'str', 'Light, thrown (20/60 ft.)'),
    attack('Mace', '1d6', 'bludgeoning'),
    attack('Quarterstaff', '1d6', 'bludgeoning', 'str', 'Versatile (1d8)'),
    attack('Sickle', '1d4', 'slashing', 'str', 'Light'),
    attack('Spear', '1d6', 'piercing', 'str', 'Thrown (20/60 ft.), versatile (1d8)'),
    attack('Light Crossbow', '1d8', 'piercing', 'dex', 'Ammunition (80/320 ft.), loading, two-handed'),
    attack('Dart', '1d4', 'piercing', 'dex', 'Finesse, thrown (20/60 ft.)'),
    attack('Shortbow', '1d6', 'piercing', 'dex', 'Ammunition (80/320 ft.), two-handed'),
    attack('Sling', '1d4', 'bludgeoning', 'dex', 'Ammunition (30/120 ft.)'),
    attack('Battleaxe', '1d8', 'slashing', 'str', 'Versatile (1d10)'),
    attack('Flail', '1d8', 'bludgeoning'),
    attack('Glaive', '1d10', 'slashing', 'str', 'Heavy, reach, two-handed'),
    attack('Greataxe', '1d12', 'slashing', 'str', 'Heavy, two-handed'),
    attack('Greatsword', '2d6', 'slashing', 'str', 'Heavy, two-handed'),
    attack('Halberd', '1d10', 'slashing', 'str', 'Heavy, reach, two-handed'),
    attack('Lance', '1d12', 'piercing', 'str', 'Reach, special'),
    attack('Longsword', '1d8', 'slashing', 'str', 'Versatile (1d10)'),
    attack('Maul', '2d6', 'bludgeoning', 'str', 'Heavy, two-handed'),
    attack('Morningstar', '1d8', 'piercing'),
    attack('Pike', '1d10', 'piercing', 'str', 'Heavy, reach, two-handed'),
    attack('Rapier', '1d8', 'piercing', 'finesse', 'Finesse'),
    attack('Scimitar', '1d6', 'slashing', 'finesse', 'Finesse, light'),
    attack('Shortsword', '1d6', 'piercing', 'finesse', 'Finesse, light'),
    attack('Trident', '1d6', 'piercing', 'str', 'Thrown (20/60 ft.), versatile (1d8)'),
    attack('War Pick', '1d8', 'piercing'),
    attack('Warhammer', '1d8', 'bludgeoning', 'str', 'Versatile (1d10)'),
    attack('Whip', '1d4', 'slashing', 'finesse', 'Finesse, reach'),
    attack('Blowgun', '1', 'piercing', 'dex', 'Ammunition (25/100 ft.), loading'),
    attack('Hand Crossbow', '1d6', 'piercing', 'dex', 'Ammunition (30/120 ft.), light, loading'),
    attack('Heavy Crossbow', '1d10', 'piercing', 'dex', 'Ammunition (100/400 ft.), heavy, loading, two-handed'),
    attack('Longbow', '1d8', 'piercing', 'dex', 'Ammunition (150/600 ft.), heavy, two-handed'),
    attack('Net', '', '', 'dex', 'Thrown (5/15 ft.), special')
  ];

  const spell = (name, level, school, range, castingTime, duration, components, attackOrSave, damage, effect) => ({
    name, level, school, range, castingTime, duration, components, attack: attackOrSave, damage, effect, source: 'Core 5e'
  });

  // Concise table-ready summaries, intentionally focused on the fields needed during play.
  const STANDARD_SPELL_PRESETS = [
    spell('Acid Splash', 0, 'Conjuration', '60 feet', '1 action', 'Instantaneous', 'V, S', 'DEX save', '1d6 acid', 'One creature, or two adjacent creatures, must save or take acid damage. Damage scales with character level.'),
    spell('Chill Touch', 0, 'Necromancy', '120 feet', '1 action', '1 round', 'V, S', 'Ranged spell attack', '1d8 necrotic', 'On a hit, the target cannot regain hit points until your next turn; undead also have disadvantage against you for that time.'),
    spell('Eldritch Blast', 0, 'Evocation', '120 feet', '1 action', 'Instantaneous', 'V, S', 'Ranged spell attack', '1d10 force', 'Fire one beam, with additional beams at higher character levels. Each beam has its own attack roll.'),
    spell('Fire Bolt', 0, 'Evocation', '120 feet', '1 action', 'Instantaneous', 'V, S', 'Ranged spell attack', '1d10 fire', 'A hit deals fire damage and can ignite an unattended flammable object. Damage scales with character level.'),
    spell('Light', 0, 'Evocation', 'Touch', '1 action', '1 hour', 'V, M', 'None', '', 'An object sheds bright light in a 20-foot radius and dim light for another 20 feet.'),
    spell('Mage Hand', 0, 'Conjuration', '30 feet', '1 action', '1 minute', 'V, S', 'None', '', 'Create a spectral hand that can manipulate an object, open an unlocked container, or carry up to 10 pounds.'),
    spell('Minor Illusion', 0, 'Illusion', '30 feet', '1 action', '1 minute', 'S, M', 'Investigation check against spell DC', '', 'Create a sound or a static image that fits within a 5-foot cube.'),
    spell('Poison Spray', 0, 'Conjuration', '10 feet', '1 action', 'Instantaneous', 'V, S', 'CON save', '1d12 poison', 'The target must save or take poison damage. Damage scales with character level.'),
    spell('Produce Flame', 0, 'Conjuration', 'Self / 30 feet', '1 action', '10 minutes', 'V, S', 'Ranged spell attack', '1d8 fire', 'Hold a harmless flame for light or throw it at a creature. Damage scales with character level.'),
    spell('Ray of Frost', 0, 'Evocation', '60 feet', '1 action', 'Instantaneous', 'V, S', 'Ranged spell attack', '1d8 cold', 'A hit deals cold damage and reduces the target’s speed by 10 feet until your next turn.'),
    spell('Sacred Flame', 0, 'Evocation', '60 feet', '1 action', 'Instantaneous', 'V, S', 'DEX save', '1d8 radiant', 'The target gains no benefit from cover for this save. Damage scales with character level.'),
    spell('Shocking Grasp', 0, 'Evocation', 'Touch', '1 action', 'Instantaneous', 'V, S', 'Melee spell attack', '1d8 lightning', 'You have advantage against a target wearing metal armor. On a hit it cannot take reactions until its next turn.'),
    spell('Spare the Dying', 0, 'Necromancy', 'Touch', '1 action', 'Instantaneous', 'V, S', 'None', '', 'A living creature at 0 hit points becomes stable.'),
    spell('Thaumaturgy', 0, 'Transmutation', '30 feet', '1 action', 'Up to 1 minute', 'V', 'None', '', 'Create one minor supernatural effect such as a booming voice, flickering flames, a harmless tremor, or an unlocked door moving.'),
    spell('Vicious Mockery', 0, 'Enchantment', '60 feet', '1 action', 'Instantaneous', 'V', 'WIS save', '1d4 psychic', 'On a failed save, the target takes damage and has disadvantage on its next attack before the end of its next turn.'),
    spell('Bless', 1, 'Enchantment', '30 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'None', '', 'Up to three creatures add 1d4 to attack rolls and saving throws. One extra target per higher slot level.'),
    spell('Burning Hands', 1, 'Evocation', 'Self (15-foot cone)', '1 action', 'Instantaneous', 'V, S', 'DEX save', '3d6 fire', 'Creatures in the cone take full damage on a failed save or half on a success. Damage rises by 1d6 per higher slot level.'),
    spell('Charm Person', 1, 'Enchantment', '30 feet', '1 action', '1 hour', 'V, S', 'WIS save', '', 'A humanoid that fails is charmed by you; it has advantage on the save if you are fighting it. It knows afterward that it was charmed.'),
    spell('Cure Wounds', 1, 'Evocation', 'Touch', '1 action', 'Instantaneous', 'V, S', 'None', '1d8 + spellcasting modifier healing', 'Restore hit points to a living creature. Healing rises by 1d8 per higher slot level.'),
    spell('Detect Magic', 1, 'Divination (ritual)', 'Self', '1 action', 'Concentration, up to 10 minutes', 'V, S', 'None', '', 'Sense magic within 30 feet and use an action to see an aura and learn its school.'),
    spell('Disguise Self', 1, 'Illusion', 'Self', '1 action', '1 hour', 'V, S', 'Investigation check against spell DC', '', 'Change the appearance of yourself, your clothing, armor, weapons, and belongings. The change is visual only.'),
    spell('Entangle', 1, 'Conjuration', '90 feet (20-foot square)', '1 action', 'Concentration, up to 1 minute', 'V, S', 'STR save', '', 'The area becomes difficult terrain. A failed save restrains a creature until it escapes with a Strength check.'),
    spell('Guiding Bolt', 1, 'Evocation', '120 feet', '1 action', '1 round', 'V, S', 'Ranged spell attack', '4d6 radiant', 'On a hit, the next attack against the target before your next turn has advantage. Damage rises by 1d6 per higher slot level.'),
    spell('Healing Word', 1, 'Evocation', '60 feet', '1 bonus action', 'Instantaneous', 'V', 'None', '1d4 + spellcasting modifier healing', 'Restore hit points to a creature you can see. Healing rises by 1d4 per higher slot level.'),
    spell('Mage Armor', 1, 'Abjuration', 'Touch', '1 action', '8 hours', 'V, S, M', 'None', '', 'An unarmored willing creature’s base AC becomes 13 + its Dexterity modifier.'),
    spell('Magic Missile', 1, 'Evocation', '120 feet', '1 action', 'Instantaneous', 'V, S', 'Automatic hit', '3 darts; 1d4+1 force each', 'Create three darts that hit creatures you can see. Add one dart per higher slot level.'),
    spell('Shield', 1, 'Abjuration', 'Self', '1 reaction when hit or targeted by magic missile', '1 round', 'V, S', 'None', '', 'Gain +5 AC until your next turn, including against the triggering attack, and take no damage from magic missile.'),
    spell('Sleep', 1, 'Enchantment', '90 feet (20-foot radius)', '1 action', '1 minute', 'V, S, M', 'Hit point pool', '5d8 hit points', 'Creatures with the lowest current hit points fall unconscious until damaged or awakened. Add 2d8 per higher slot level.'),
    spell('Thunderwave', 1, 'Evocation', 'Self (15-foot cube)', '1 action', 'Instantaneous', 'V, S', 'CON save', '2d8 thunder', 'A failed save takes full damage and is pushed 10 feet; a success takes half and is not pushed. Damage rises with higher slots.'),
    spell('Barkskin', 2, 'Transmutation', 'Touch', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'The willing target’s AC cannot be less than 16 regardless of its armor.'),
    spell('Blur', 2, 'Illusion', 'Self', '1 action', 'Concentration, up to 1 minute', 'V', 'None', '', 'Attack rolls against you have disadvantage unless the attacker does not rely on sight or can see through illusions.'),
    spell('Hold Person', 2, 'Enchantment', '60 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'WIS save', '', 'A humanoid is paralyzed on a failed save and repeats the save at the end of each turn.'),
    spell('Invisibility', 2, 'Illusion', 'Touch', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'The target is invisible until it attacks or casts a spell. Affect one extra creature per higher slot level.'),
    spell('Lesser Restoration', 2, 'Abjuration', 'Touch', '1 action', 'Instantaneous', 'V, S', 'None', '', 'End one disease or one blinded, deafened, paralyzed, or poisoned condition.'),
    spell('Mirror Image', 2, 'Illusion', 'Self', '1 action', '1 minute', 'V, S', 'd20 redirects attacks', '', 'Create three duplicates. Attacks can destroy duplicates instead of hitting you; each duplicate has AC 10 + your Dexterity modifier.'),
    spell('Misty Step', 2, 'Conjuration', 'Self', '1 bonus action', 'Instantaneous', 'V', 'None', '', 'Teleport up to 30 feet to an unoccupied space you can see.'),
    spell('Scorching Ray', 2, 'Evocation', '120 feet', '1 action', 'Instantaneous', 'V, S', 'Ranged spell attack', '3 rays; 2d6 fire each', 'Make a separate attack for each ray. Create one extra ray per higher slot level.'),
    spell('Spiritual Weapon', 2, 'Evocation', '60 feet', '1 bonus action', '1 minute', 'V, S', 'Melee spell attack', '1d8 + spellcasting modifier force', 'Create a floating weapon and attack with it on the cast and as a bonus action on later turns.'),
    spell('Counterspell', 3, 'Abjuration', '60 feet', '1 reaction when a creature casts a spell', 'Instantaneous', 'S', 'Spellcasting ability check for higher-level spell', '', 'Interrupt a spell. A 3rd-level or lower spell fails automatically; higher spells require a check unless countered with an equal or higher slot.'),
    spell('Dispel Magic', 3, 'Abjuration', '120 feet', '1 action', 'Instantaneous', 'V, S', 'Spellcasting ability check for higher-level effect', '', 'End spells on a creature, object, or magical effect. Spells of 3rd level or lower end automatically.'),
    spell('Fireball', 3, 'Evocation', '150 feet (20-foot radius)', '1 action', 'Instantaneous', 'V, S, M', 'DEX save', '8d6 fire', 'Creatures take full damage on a failed save or half on a success. Damage rises by 1d6 per higher slot level.'),
    spell('Fly', 3, 'Transmutation', 'Touch', '1 action', 'Concentration, up to 10 minutes', 'V, S, M', 'None', '', 'The willing target gains a 60-foot flying speed. Affect one extra target per higher slot level.'),
    spell('Haste', 3, 'Transmutation', '30 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'None', '', 'Double speed, +2 AC, advantage on Dexterity saves, and one limited extra action each turn; the target loses a turn when the spell ends.'),
    spell('Hypnotic Pattern', 3, 'Illusion', '120 feet (30-foot cube)', '1 action', 'Concentration, up to 1 minute', 'S, M', 'WIS save', '', 'A failed save charms and incapacitates a creature with speed 0 until it takes damage or another creature uses an action to shake it awake.'),
    spell('Lightning Bolt', 3, 'Evocation', 'Self (100-foot line)', '1 action', 'Instantaneous', 'V, S, M', 'DEX save', '8d6 lightning', 'Creatures take full damage on a failed save or half on a success. Damage rises by 1d6 per higher slot level.'),
    spell('Revivify', 3, 'Necromancy', 'Touch', '1 action', 'Instantaneous', 'V, S, M (diamonds worth 300 gp)', 'None', '', 'Return a creature that died within the last minute to life with 1 hit point; missing body parts are not restored.'),
    spell('Spirit Guardians', 3, 'Conjuration', 'Self (15-foot radius)', '1 action', 'Concentration, up to 10 minutes', 'V, S, M', 'WIS save', '3d8 radiant or necrotic', 'Chosen creatures are unaffected. Others have halved speed in the area and take damage when entering or starting there; save for half.'),
    spell('Banishment', 4, 'Abjuration', '60 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'CHA save', '', 'A failed save sends the target to a harmless demiplane, or toward its home plane if extraplanar.'),
    spell('Blight', 4, 'Necromancy', '30 feet', '1 action', 'Instantaneous', 'V, S', 'CON save', '8d8 necrotic', 'A creature takes full damage on a failed save or half on a success. Plants are especially vulnerable.'),
    spell('Dimension Door', 4, 'Conjuration', '500 feet', '1 action', 'Instantaneous', 'V', 'None', '', 'Teleport yourself and one willing creature to a place within range that you can describe or visualize.'),
    spell('Greater Invisibility', 4, 'Illusion', 'Touch', '1 action', 'Concentration, up to 1 minute', 'V, S', 'None', '', 'The target remains invisible even when it attacks or casts spells.'),
    spell('Polymorph', 4, 'Transmutation', '60 feet', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'WIS save if unwilling', '', 'Transform a creature into a beast whose challenge rating does not exceed the target’s CR or level.'),
    spell('Cone of Cold', 5, 'Evocation', 'Self (60-foot cone)', '1 action', 'Instantaneous', 'V, S, M', 'CON save', '8d8 cold', 'Creatures take full damage on a failed save or half on a success. Damage rises by 1d8 per higher slot level.'),
    spell('Greater Restoration', 5, 'Abjuration', 'Touch', '1 action', 'Instantaneous', 'V, S, M (diamond dust worth 100 gp)', 'None', '', 'Reduce exhaustion by one or end one charm, petrification, curse, ability-score reduction, or hit-point-maximum reduction.'),
    spell('Hold Monster', 5, 'Enchantment', '90 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'WIS save', '', 'A creature is paralyzed on a failed save and repeats the save at the end of each turn.'),
    spell('Mass Cure Wounds', 5, 'Evocation', '60 feet (30-foot radius)', '1 action', 'Instantaneous', 'V, S', 'None', '3d8 + spellcasting modifier healing', 'Up to six living creatures in the area regain hit points.'),
    spell('Wall of Force', 5, 'Evocation', '120 feet', '1 action', 'Concentration, up to 10 minutes', 'V, S, M', 'None', '', 'Create an invisible wall or dome immune to damage; nothing physical can pass through it and disintegrate destroys it.'),
    spell('Chain Lightning', 6, 'Evocation', '150 feet', '1 action', 'Instantaneous', 'V, S, M', 'DEX save', '10d8 lightning', 'Strike one target, then up to three more within 30 feet of it. A save halves the damage.'),
    spell('Disintegrate', 6, 'Transmutation', '60 feet', '1 action', 'Instantaneous', 'V, S, M', 'DEX save', '10d6+40 force', 'A failed save takes massive force damage; a creature reduced to 0 hit points is disintegrated.'),
    spell('Heal', 6, 'Evocation', '60 feet', '1 action', 'Instantaneous', 'V, S', 'None', '70 healing', 'Restore 70 hit points and end blindness, deafness, and disease. Healing rises by 10 per higher slot level.'),
    spell('Fire Storm', 7, 'Evocation', '150 feet', '1 action', 'Instantaneous', 'V, S', 'DEX save', '7d10 fire', 'Fill up to ten connected 10-foot cubes. A failed save takes full damage; a success takes half.'),
    spell('Plane Shift', 7, 'Conjuration', 'Touch', '1 action', 'Instantaneous', 'V, S, M', 'Melee spell attack then CHA save if unwilling', '', 'Transport up to eight willing creatures to another plane, or attempt to banish one unwilling creature.'),
    spell('Resurrection', 7, 'Necromancy', 'Touch', '1 hour', 'Instantaneous', 'V, S, M (diamond worth 1,000 gp)', 'None', '', 'Return a creature dead no longer than a century to life, restoring missing body parts but imposing recovery penalties.'),
    spell('Dominate Monster', 8, 'Enchantment', '60 feet', '1 action', 'Concentration, up to 1 hour', 'V, S', 'WIS save', '', 'Charm a creature and issue commands or take precise control. It repeats the save when it takes damage.'),
    spell('Power Word Stun', 8, 'Enchantment', '60 feet', '1 action', 'Instantaneous', 'V', '100 HP threshold; CON saves afterward', '', 'A creature with 100 hit points or fewer is stunned and repeats a Constitution save at the end of each turn.'),
    spell('Sunburst', 8, 'Evocation', '150 feet (60-foot radius)', '1 action', 'Instantaneous', 'V, S, M', 'CON save', '12d6 radiant', 'A failed save takes full damage and blinds for 1 minute; a success halves damage and avoids blindness.'),
    spell('Meteor Swarm', 9, 'Evocation', '1 mile (four 40-foot radii)', '1 action', 'Instantaneous', 'V, S', 'DEX save', '20d6 fire + 20d6 bludgeoning', 'Four meteors strike separate points. A save halves the combined damage.'),
    spell('Power Word Kill', 9, 'Enchantment', '60 feet', '1 action', 'Instantaneous', 'V', '100 HP threshold', '', 'A creature with 100 hit points or fewer dies; otherwise the spell has no effect.'),
    spell('True Resurrection', 9, 'Necromancy', 'Touch', '1 hour', 'Instantaneous', 'V, S, M (holy water and diamonds worth 25,000 gp)', 'None', '', 'Return a creature dead no longer than 200 years to life with a new body if necessary.'),
    spell('Wish', 9, 'Conjuration', 'Self', '1 action', 'Instantaneous', 'V', 'None', '', 'Duplicate a spell of 8th level or lower without requirements, or attempt a greater effect at the risk described by the spell.')
  ];

  const NPC_PRESETS = [
    {
      id: 'hw-birdfolk-farmer', source: 'Humblewood', name: 'Birdfolk Farmer',
      statBlock: `Birdfolk Farmer\nMedium humanoid (any birdfolk), any alignment\nArmor Class 10\nHit Points 4 (1d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 10 (+0) 10 (+0) 10 (+0) 10 (+0) 10 (+0)\nSkills Nature +4\nSenses passive Perception 10\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 0 (10 XP)\nGlide. The farmer can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nActions\nPitchfork. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) piercing damage.`
    },
    {
      id: 'hw-birdfolk-guard', source: 'Humblewood', name: 'Birdfolk Guard',
      statBlock: `Birdfolk Guard\nMedium humanoid (any birdfolk), any lawful alignment\nArmor Class 16 (chain shirt and shield)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n13 (+1) 12 (+1) 12 (+1) 10 (+0) 10 (+0) 10 (+0)\nSkills Perception +2\nSenses passive Perception 12\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 1/8 (25 XP)\nGlide. The guard can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nActions\nSpear. Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage when used with two hands in melee.`
    },
    {
      id: 'hw-birdfolk-militia', source: 'Humblewood', name: 'Birdfolk Militia',
      statBlock: `Birdfolk Militia\nMedium humanoid (any birdfolk), any alignment\nArmor Class 12 (studded leather armor)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 10 (+0) 12 (+1) 10 (+0) 10 (+0) 10 (+0)\nSenses passive Perception 10\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 1/8 (25 XP)\nGlide. The militia can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nActions\nMace. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.`
    },
    {
      id: 'hw-birdfolk-dockmaster', source: 'Humblewood', name: 'Birdfolk Dockmaster',
      statBlock: `Birdfolk Dockmaster\nMedium humanoid (any birdfolk), any alignment\nArmor Class 14 (leather)\nHit Points 55 (10d8 + 10)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 16 (+3) 13 (+1) 8 (-1) 13 (+1) 15 (+2)\nSkills Athletics +2, Perception +5, Persuasion +4\nSenses passive Perception 15\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 2 (450 XP)\nGlide. The dockmaster can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nConfidence. The dockmaster adds its Charisma modifier to initiative rolls.\nSneak Attack. Once per turn, the dockmaster deals an extra 3 (1d6) damage when its weapon attack qualifies for Sneak Attack.\nActions\nMultiattack. The dockmaster makes two saber attacks and one dagger attack.\nSaber. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.\nDagger. Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage.`
    },
    {
      id: 'hw-birdfolk-sailor', source: 'Humblewood', name: 'Birdfolk Sailor',
      statBlock: `Birdfolk Sailor\nMedium humanoid (any birdfolk), any alignment\nArmor Class 12 (leather armor)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 13 (+1) 12 (+1) 10 (+0) 10 (+0) 10 (+0)\nSkills Athletics +3\nSenses passive Perception 10\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 1/8 (25 XP)\nGlide. The sailor can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nActions\nShortsword. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nLight Crossbow. Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 5 (1d8 + 2) piercing damage.`
    },
    {
      id: 'hw-birdfolk-skirmisher', source: 'Humblewood', name: 'Birdfolk Skirmisher',
      statBlock: `Birdfolk Skirmisher\nMedium humanoid (any birdfolk), any lawful alignment\nArmor Class 14 (chain shirt)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n14 (+2) 12 (+1) 12 (+1) 10 (+0) 10 (+0) 10 (+0)\nSkills Athletics +4\nSenses passive Perception 10\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 1/8 (25 XP)\nGlide. The skirmisher can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nDrop Attack. An attack made during a glide deals an extra 4 (1d8) damage.\nActions\nSpear. Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage when used with two hands in melee.`
    },
    {
      id: 'hw-cervan-bandit-general', source: 'Humblewood', name: 'Cervan Bandit General',
      statBlock: `Cervan Bandit General\nMedium humanoid (cervan), neutral evil\nArmor Class 15 (studded leather)\nHit Points 65 (10d8 + 20)\nSpeed 35 ft.\nSTR DEX CON INT WIS CHA\n14 (+2) 17 (+3) 14 (+2) 14 (+2) 11 (+0) 14 (+2)\nSaving Throws Dex +5, Cha +4\nSkills Deception +4, Persuasion +4\nSenses passive Perception 10\nLanguages Birdfolk, Cervan\nChallenge 2 (450 XP)\nSurge of Vigor (Recharges after a Long Rest). When one attack deals at least half the general's current hit points in damage, the general immediately regains 8 (1d12 + 2) hit points, even if the attack reduced it to 0 hit points.\nStanding Leap. The general's long jump is 30 feet and high jump is 15 feet, with or without a running start.\nActions\nMultiattack. The general makes three melee attacks: two scimitar attacks and one dagger attack. Alternatively, it makes two ranged dagger attacks.\nScimitar. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.\nDagger. Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage.\nReactions\nParry. The general adds 2 to its AC against one melee attack that would hit it, provided it can see the attacker and is wielding a melee weapon.`
    },
    {
      id: 'hw-cervan-priest', source: 'Humblewood', name: 'Cervan Priest',
      statBlock: `Cervan Priest\nMedium humanoid (cervan), any alignment\nArmor Class 10\nHit Points 19 (3d8 + 6)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 10 (+0) 14 (+2) 10 (+0) 14 (+2) 11 (+0)\nSkills Medicine +4, Religion +2\nSenses passive Perception 12\nLanguages Birdfolk, Cervan\nChallenge 1/4 (50 XP)\nSurge of Vigor (Recharges after a Long Rest). When one attack deals at least half the priest's current hit points in damage, the priest immediately regains 8 (1d12 + 2) hit points, even if the attack reduced it to 0 hit points.\nCharge. After moving at least 20 feet straight toward a creature, the priest's antler attack deals an extra 3 (1d6) piercing damage. A Large or smaller target must succeed on a DC 11 Strength save or be pushed 10 feet.\nSpellcasting. The priest is a 3rd-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks).\nCantrips (at will): guidance, light, spare the dying\n1st level (4 slots): bless, cure wounds, guiding bolt, shield of faith\n2nd level (2 slots): calm emotions, warding bond\nActions\nAntlers. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage.\nQuarterstaff. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage, or 5 (1d8 + 1) bludgeoning damage when used with two hands.`
    },
    {
      id: 'hw-corvum-assassin', source: 'Humblewood', name: 'Corvum Assassin',
      statBlock: `Corvum Assassin\nMedium humanoid (corvum), any non-lawful alignment\nArmor Class 15 (studded leather)\nHit Points 54 (12d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 16 (+3) 11 (+0) 14 (+2) 14 (+2) 10 (+0)\nSaving Throws Dex +6, Int +5\nSkills Insight +5, Nature +5, Perception +8, Stealth +9\nSenses passive Perception 18\nLanguages Birdfolk, Thieves' Cant, any one other language; understands Auran but cannot speak it\nChallenge 5 (1,800 XP)\nGlide. The assassin can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The assassin has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nAssassinate. During its first turn, the assassin has advantage on attacks against creatures that have not taken a turn. A hit against a surprised creature is a critical hit.\nSneak Attack. Once per turn, a qualifying weapon hit deals an extra 10 (3d6) damage.\nSkulker. The assassin has advantage on Dexterity (Stealth) checks made in dim light or darkness.\nActions\nMultiattack. The assassin makes one shortsword and one dagger attack, or two ranged dagger attacks.\nTalons. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) slashing damage.\nShortsword. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage, plus 10 (3d6) poison damage on a failed DC 13 Constitution save, or half as much on a success.\nDagger. Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage, plus 10 (3d6) poison damage on a failed DC 13 Constitution save, or half as much on a success.`
    },
    {
      id: 'hw-corvum-diviner', source: 'Humblewood', name: 'Corvum Diviner',
      statBlock: `Corvum Diviner\nMedium humanoid (corvum), lawful neutral\nArmor Class 12 (15 with mage armor)\nHit Points 40 (9d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n9 (-1) 14 (+2) 11 (+0) 17 (+3) 12 (+1) 11 (+0)\nSaving Throws Int +6, Wis +4\nSkills Arcana +6, History +6, Religion +6\nSenses passive Perception 11\nLanguages Auran, Birdfolk, Celestial, Cervan, Mapach\nChallenge 6 (2,300 XP)\nGlide. The diviner can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The diviner has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nSkulker. The diviner has advantage on Dexterity (Stealth) checks made in dim light or darkness.\nSpellcasting. The diviner is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 14, +6 to hit with spell attacks).\nCantrips (at will): fire bolt, light, mage hand, prestidigitation\n1st level (4 slots): detect magic, mage armor, magic missile, shield\n2nd level (2 slots): augury, misty step\n3rd level (3 slots): clairvoyance, counterspell, fly\n4th level (3 slots): greater invisibility, locate creature\n5th level (1 slot): scrying\nActions\nTalons. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.`
    },
    {
      id: 'hw-corvum-necromancer', source: 'Humblewood', name: 'Corvum Necromancer',
      statBlock: `Corvum Necromancer\nMedium humanoid (corvum), any evil alignment\nArmor Class 12 (15 with mage armor)\nHit Points 49 (9d8 + 9)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n9 (-1) 14 (+2) 12 (+1) 18 (+4) 10 (+0) 14 (+2)\nSaving Throws Int +7, Wis +3\nSkills Arcana +7, Deception +5, Medicine +3\nSenses passive Perception 10\nLanguages Birdfolk and any two other languages; understands Auran but cannot speak it\nChallenge 6 (2,300 XP)\nGlide. The necromancer can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The necromancer has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nConvincing. The necromancer has advantage on Charisma checks used to establish its knowledge of Arcana.\nLife Leech. Once per turn after killing a creature with a spell of 1st level or higher, the necromancer regains hit points equal to twice the spell's level, or three times its level for a necromancy spell.\nSpellcasting. The necromancer is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 15, +7 to hit with spell attacks).\nCantrips (at will): chill touch, light, mage hand, prestidigitation\n1st level (4 slots): disguise self, false life, mage armor, magic missile\n2nd level (3 slots): misty step, suggestion, ray of enfeeblement\n3rd level (3 slots): animate dead, counterspell, fear\n4th level (3 slots): greater invisibility, blight\n5th level (1 slot): dominate person\nActions\nStaff. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d6 - 1) bludgeoning damage, or 3 (1d8 - 1) bludgeoning damage when used with two hands.\nTalons. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.`
    },
    {
      id: 'hw-gallus-druid', source: 'Humblewood', name: 'Gallus Druid',
      statBlock: `Gallus Druid\nMedium humanoid (gallus), any neutral alignment\nArmor Class 11 (16 with barkskin)\nHit Points 65 (10d8 + 20)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 13 (+1) 14 (+2) 10 (+0) 18 (+4) 10 (+0)\nSkills Insight +6, Nature +2, Medicine +6, Perception +6\nSenses passive Perception 16\nLanguages Birdfolk, Druidic, Sylvan; understands Auran but cannot speak it\nChallenge 4 (1,100 XP)\nGlide. The druid can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nWing Flap. As a bonus action, the druid propels itself upward up to half its speed; this can be combined with a jump, but not a glide.\nSeedspeech. The druid can communicate simple ideas with living plants and interpret their responses.\nSpellcasting. The druid is a 6th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 14, +6 to hit with spell attacks).\nCantrips (at will): druidcraft, produce flame, shillelagh\n1st level (4 slots): animal friendship, cure wounds, entangle, fog cloud\n2nd level (3 slots): barkskin, gust of wind, moonbeam\n3rd level (3 slots): conjure animals, dispel magic, wind wall\nSpirit Totem (Recharges after a Short or Long Rest). As a bonus action, the druid summons a spectral bear, hawk, or unicorn spirit for 1 minute at a point within 60 feet. Its 30-foot aura grants the corresponding temporary hit points, attack support, or healing benefits.\nActions\nStaff. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) bludgeoning damage.`
    },
    {
      id: 'hw-gallus-monk', source: 'Humblewood', name: 'Gallus Monk',
      statBlock: `Gallus Monk\nMedium humanoid (gallus), any alignment\nArmor Class 17 (natural armor)\nHit Points 78 (12d8 + 24)\nSpeed 40 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 18 (+4) 14 (+2) 11 (+0) 16 (+3) 10 (+0)\nSaving Throws Dex +7\nSkills Acrobatics +7, Insight +6, Perception +6, Stealth +7\nSenses passive Perception 16\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 5 (1,800 XP)\nGlide. The monk can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nWing Flap. As a bonus action, the monk propels itself upward up to half its speed; this can be combined with a jump, but not a glide.\nWind's Grace. While moving, the monk can move along vertical surfaces and across liquids without falling.\nActions\nMultiattack. The monk makes four unarmed strike or dart attacks and can use Graceful Step once before or after an attack.\nUnarmed Attack. Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 7 (1d6 + 4) bludgeoning damage.\nDart. Ranged Weapon Attack: +7 to hit, range 20/60 ft., one target. Hit: 6 (1d4 + 4) piercing damage.\nGraceful Step. The monk moves 40 feet without provoking opportunity attacks.\nInspiring. An ally that can see and hear the monk adds 1d4 to its next ability check, attack roll, or saving throw.`
    },
    {
      id: 'hw-gallus-necromancer', source: 'Humblewood', name: 'Gallus Necromancer',
      statBlock: `Gallus Necromancer\nMedium humanoid (gallus), any non-lawful alignment\nArmor Class 12 (15 with mage armor)\nHit Points 49 (9d8 + 9)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n9 (-1) 14 (+2) 12 (+1) 18 (+4) 14 (+2) 10 (+0)\nSaving Throws Int +7, Wis +5\nSkills Arcana +7, Deception +3, Medicine +5\nSenses passive Perception 12\nLanguages Birdfolk, Hedge, Sylvan; understands Auran but cannot speak it\nChallenge 6 (2,300 XP)\nGlide. The necromancer can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nWing Flap. As a bonus action, the necromancer propels itself upward up to half its speed; this can be combined with a jump, but not a glide.\nSeedspeech. The necromancer can communicate simple ideas with living plants and interpret their responses.\nSpellcasting. The necromancer is a 9th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 15, +7 to hit with spell attacks).\nCantrips (at will): chill touch, light, mage hand, prestidigitation\n1st level (4 slots): sleep, false life, mage armor, magic missile\n2nd level (3 slots): misty step, web, ray of enfeeblement\n3rd level (3 slots): animate dead, counterspell, fear\n4th level (3 slots): black tentacles, blight\n5th level (1 slot): passwall\nActions\nStaff. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d6 - 1) bludgeoning damage, or 3 (1d8 - 1) bludgeoning damage when used with two hands.`
    },
    {
      id: 'hw-hedge-bard', source: 'Humblewood', name: 'Hedge Bard',
      statBlock: `Hedge Bard\nSmall humanoid (hedge), any alignment\nArmor Class 16 (natural armor)\nHit Points 36 (8d6 + 8)\nSpeed 25 ft., burrow 15 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 14 (+2) 12 (+1) 10 (+0) 13 (+1) 16 (+3)\nSaving Throws Dex +4, Cha +5\nSkills Acrobatics +4, Perception +5, Performance +7\nSenses passive Perception 15\nLanguages Birdfolk, Hedge; can speak with spiders, insects, worms, and other bugs\nChallenge 2 (450 XP)\nSpellcasting. The bard is a 4th-level spellcaster. Its spellcasting ability is Charisma (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): gust barrier, prestidigitation, vicious mockery\n1st level (4 slots): charm person, healing word, hideous laughter, thunderwave\n2nd level (3 slots): invisibility, shatter, suggestion\nTaunt (2/Day). As a bonus action, the bard targets a creature within 30 feet that can hear it. On a failed DC 13 Charisma save, the target has disadvantage on ability checks, attacks, and saves until the start of the bard's next turn.\nActions\nMultiattack. The bard makes one rapier and one dagger attack.\nRapier. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nDagger. Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d4 + 2) piercing damage.\nCurl Up. The bard curls into a spiny ball, cannot move, attack, or cast spells with somatic components, and has base AC 19. A missed melee attack against it deals 2d4 piercing damage to the attacker; a hit knocks the bard prone and ends the curl.`
    },
    {
      id: 'hw-hedge-witch', source: 'Humblewood', name: 'Hedge Witch',
      statBlock: `Hedge Witch\nSmall humanoid (hedge), any chaotic alignment\nArmor Class 14 (natural armor)\nHit Points 21 (6d6)\nSpeed 25 ft., burrow 15 ft.\nSTR DEX CON INT WIS CHA\n8 (-1) 10 (+0) 10 (+0) 14 (+2) 15 (+2) 16 (+3)\nSkills Arcana +4, Survival +4\nSenses passive Perception 12\nLanguages Abyssal, Birdfolk, Hedge; can speak with spiders, insects, worms, and other bugs\nChallenge 1 (200 XP)\nSpellcasting. The witch is a 2nd-level spellcaster. Its spellcasting ability is Charisma (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): eldritch blast, minor illusion\n1st level (2 slots): hellish rebuke, charm person, unseen servant\nDark One's Blessing. When the witch reduces a hostile creature to 0 hit points, it gains 5 temporary hit points.\nRepelling Blast. When the witch hits with eldritch blast, it can push the target up to 10 feet away in a straight line.\nActions\nStaff. Melee Weapon Attack: +1 to hit, reach 5 ft., one target. Hit: 2 (1d6 - 1) bludgeoning damage.\nFiendish Vigor. The witch casts false life at will as a 1st-level spell.\nCurl Up. The witch curls into a spiny ball, cannot move, attack, or cast spells with somatic components, and has base AC 19. A missed melee attack against it deals 2d4 piercing damage to the attacker; a hit knocks the witch prone and ends the curl.`
    },
    {
      id: 'hw-jerbeen-thief', source: 'Humblewood', name: 'Jerbeen Thief',
      statBlock: `Jerbeen Thief\nSmall humanoid (jerbeen), neutral evil\nArmor Class 13 (leather armor)\nHit Points 14 (4d6)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 14 (+2) 10 (+0) 8 (-1) 14 (+2) 14 (+2)\nSkills Acrobatics +4, Sleight of Hand +4\nSenses passive Perception 12\nLanguages Birdfolk, Jerbeen\nChallenge 1/2 (100 XP)\nStanding Leap. The thief can long jump 30 feet and high jump 15 feet with or without a running start.\nTeam Tactics. The thief can take the Help action as a bonus action.\nActions\nMultiattack. The thief makes two dagger attacks.\nDagger. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.\nReactions\nOpportunist. When a creature misses the thief with a melee attack, the thief may attempt to steal one item that is not held or worn.`
    },
    {
      id: 'hw-jerbeen-swashbuckler', source: 'Humblewood', name: 'Jerbeen Swashbuckler',
      statBlock: `Jerbeen Swashbuckler\nSmall humanoid (jerbeen), any non-lawful alignment\nArmor Class 17 (leather armor)\nHit Points 34 (8d6 + 6)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 18 (+4) 12 (+1) 14 (+2) 11 (+0) 15 (+2)\nSkills Acrobatics +8, Athletics +5, Persuasion +6\nSenses passive Perception 10\nLanguages Birdfolk, Jerbeen\nChallenge 3 (700 XP)\nStanding Leap. The swashbuckler's long jump is 30 feet and high jump is 15 feet, with or without a running start.\nTeam Tactics. The swashbuckler can take the Help action as a bonus action.\nSharp Witted Defense. While wearing light armor or no armor and wielding no shield, the swashbuckler adds its Charisma modifier to AC.\nActions\nMultiattack. The swashbuckler makes two rapier attacks and one dagger attack.\nDagger. Melee or Ranged Weapon Attack: +6 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 6 (1d4 + 4) piercing damage.\nRapier. Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 8 (1d8 + 4) piercing damage.\nReactions\nRiposte. The swashbuckler reduces the damage from one melee attack that would hit it by 4 (1d8) and deals the same amount of piercing damage to the attacker, provided it can see the attacker and is wielding a melee weapon.`
    },
    {
      id: 'hw-luma-cleric-ardea', source: 'Humblewood', name: 'Luma Cleric of Ardea',
      statBlock: `Luma Cleric of Ardea\nSmall humanoid (luma), any good alignment\nArmor Class 14 (chain shirt)\nHit Points 27 (6d6 + 6)\nSpeed 25 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 13 (+1) 12 (+1) 10 (+0) 16 (+3) 14 (+2)\nSkills Medicine +7, Persuasion +4, Religion +2\nSenses passive Perception 13\nLanguages Birdfolk and one other language; understands Auran but cannot speak it\nChallenge 2 (450 XP)\nGlide. The cleric can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nWing Flap. As a bonus action, the cleric propels itself upward up to half its speed; this can be combined with a jump, but not a glide.\nFated (Recharges after a Long Rest). The cleric can reroll one attack roll, skill check, or saving throw.\nSpellcasting. The cleric is a 5th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): light, sacred flame, thaumaturgy\n1st level (4 slots): bless, cure wounds, guiding bolt\n2nd level (3 slots): lesser restoration, spiritual weapon\n3rd level (2 slots): dispel magic, beacon of hope\nActions\nStaff. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage, or 4 (1d8) bludgeoning damage when used with two hands.\nArdea's Vigor (1/Day). The cleric and up to three allies within 30 feet gain 5 (2d4) temporary hit points, then gain 5 temporary hit points at the start of each turn for 1 minute.\nSongbird (Recharges after a Long Rest). The cleric casts charm person without somatic components using Charisma (spell save DC 12).`
    },
    {
      id: 'hw-luma-wizard', source: 'Humblewood', name: 'Luma Wizard',
      statBlock: `Luma Wizard\nSmall humanoid (luma), any alignment\nArmor Class 12 (15 with mage armor)\nHit Points 58 (13d6 + 13)\nSpeed 25 ft.\nSTR DEX CON INT WIS CHA\n8 (-1) 15 (+2) 12 (+1) 18 (+4) 12 (+1) 15 (+2)\nSaving Throws Int +7, Wis +4\nSkills Arcana +7, History +7\nDamage Resistances poison\nSenses passive Perception 11\nLanguages Auran, Birdfolk, and any three other languages\nChallenge 6 (2,300 XP)\nGlide. The wizard can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nWing Flap. As a bonus action, the wizard propels itself upward up to half its speed; this can be combined with a jump, but not a glide.\nFated (Recharges after a Long Rest). The wizard can reroll one attack roll, skill check, or saving throw.\nResilience. The wizard has advantage on saving throws against poison.\nSpellcasting. The wizard is a 10th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 15, +7 to hit with spell attacks).\nCantrips (at will): chill touch, fire bolt, minor illusion, prestidigitation, ray of frost\n1st level (4 slots): charm person, detect magic, mage armor, shield, sleep, thunderwave\n2nd level (3 slots): darkness, hold person, ray of enfeeblement\n3rd level (3 slots): counterspell, fireball\n4th level (3 slots): banishment, stellar bodies\n5th level (2 slots): conjure elemental, mislead\nActions\nStaff. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d6 - 1) bludgeoning damage.\nReactions\nCharming (3/Day). When a creature attacks the wizard, it must succeed on a DC 14 Wisdom save or target the next closest creature in range. This fails if no other creature is in range.`
    },
    {
      id: 'hw-mapach-bandit', source: 'Humblewood', name: 'Mapach Bandit',
      statBlock: `Mapach Bandit\nMedium humanoid (mapach), neutral evil\nArmor Class 12 (leather armor)\nHit Points 9 (2d8)\nSpeed 30 ft., climb 20 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 13 (+1) 10 (+0) 8 (-1) 12 (+1) 12 (+1)\nDamage Resistances poison\nSenses darkvision 60 ft., passive Perception 11\nLanguages Birdfolk, Mapach\nChallenge 1/8 (25 XP)\nResilience. The bandit has advantage on saving throws against poison.\nSkulker. The bandit has advantage on Dexterity (Stealth) checks made in dim light or darkness.\nActions\nShortsword. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage.\nShortbow. Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 4 (1d6 + 1) piercing damage.`
    },
    {
      id: 'hw-mapach-brute', source: 'Humblewood', name: 'Mapach Brute',
      statBlock: `Mapach Brute\nMedium humanoid (mapach), chaotic evil\nArmor Class 15 (studded leather)\nHit Points 75 (10d8 + 30)\nSpeed 30 ft., climb 20 ft.\nSTR DEX CON INT WIS CHA\n14 (+2) 17 (+3) 16 (+3) 12 (+1) 14 (+2) 14 (+2)\nSaving Throws Dex +5, Cha +4\nSkills Deception +4, Persuasion +4\nDamage Resistances poison\nSenses darkvision 60 ft., passive Perception 12\nLanguages Birdfolk, Mapach\nChallenge 3 (700 XP)\nResilience. The brute has advantage on saving throws against poison.\nSkulker. The brute has advantage on Dexterity (Stealth) checks made in dim light or darkness.\nActions\nMultiattack. The brute makes two rapier attacks and one parrying dagger attack.\nRapier. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) piercing damage.\nParrying Dagger. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.\nReactions\nParry. The brute adds 2 to its AC against one melee attack that would hit it, provided it can see the attacker and is wielding a melee weapon.`
    },
    {
      id: 'hw-mapach-tinkerer', source: 'Humblewood', name: 'Mapach Tinkerer',
      statBlock: `Mapach Tinkerer\nMedium humanoid (mapach), any alignment\nArmor Class 12\nHit Points 13 (3d8)\nSpeed 30 ft., climb 20 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 14 (+2) 10 (+0) 13 (+1) 12 (+1) 10 (+0)\nDamage Resistances poison\nSenses darkvision 60 ft., passive Perception 11\nLanguages Birdfolk, Mapach\nChallenge 1/4 (50 XP)\nResilience. The tinkerer has advantage on saving throws against poison.\nSkulker. The tinkerer has advantage on Dexterity (Stealth) checks made in dim light or darkness.\nActions\nDagger. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.\nTinker's Toys (Each 1/Day). The tinkerer chooses or rolls 1d4: Cogwork Bird grants advantage on the next attack against a creature within 30 feet; Flash-Bangs can blind creatures within 10 feet on a failed DC 11 Constitution save; Nettle Gun makes a ranged attack and can damage nearby creatures on a failed DC 11 Dexterity save; Grease Balloon creates a 10-foot square of difficult terrain that can knock creatures prone on a failed DC 11 Dexterity save.\nNettle Gun. Ranged Weapon Attack: +4 to hit, range 10/20 ft., one target. Hit: 4 (1d4 + 2) piercing damage, and creatures within 5 feet of the target must succeed on a DC 11 Dexterity save or take 5 (1d10) piercing damage.`
    },
    {
      id: 'hw-oakheart', source: 'Humblewood', name: 'Oakheart',
      statBlock: `Oakheart\nHuge plant, chaotic good\nArmor Class 16 (natural armor)\nHit Points 69 (6d12 + 30)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n20 (+5) 8 (-1) 21 (+5) 12 (+1) 16 (+3) 12 (+1)\nDamage Resistances fire, bludgeoning, piercing\nSenses passive Perception 13\nLanguages Birdfolk, Druidic, Ignan, Sylvan\nChallenge 8 (3,900 XP)\nFalse Appearance. While motionless, Oakheart is indistinguishable from a great oak with charred, smoldering bark and flaming leaves.\nSiege Monster. Oakheart deals double damage to objects and structures.\nActions\nMultiattack. Oakheart makes two slam attacks.\nSlam. Melee Weapon Attack: +8 to hit, reach 5 ft., one target. Hit: 16 (3d6 + 5) fire damage.\nRock. Ranged Weapon Attack: +8 to hit, range 60/180 ft., one target. Hit: 28 (4d10 + 5) bludgeoning damage.\nAnimate Trees (1/Day). Oakheart animates one or two trees within 60 feet. They use Oakheart's statistics, except Intelligence and Charisma are 1, they cannot speak, and they have only Slam. They remain animated for 1 day or until destroyed, too far from Oakheart, or dismissed by Oakheart as a bonus action.`
    },
    {
      id: 'hw-raptor-explorer', source: 'Humblewood', name: 'Raptor Explorer',
      statBlock: `Raptor Explorer\nSmall humanoid (raptor), any neutral alignment\nArmor Class 13 (leather armor)\nHit Points 18 (4d6 + 4)\nSpeed 25 ft., swim 25 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 14 (+2) 12 (+1) 11 (+0) 15 (+2) 11 (+0)\nSkills History +2, Perception +6, Stealth +4, Survival +6\nSenses passive Perception 16\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 1/2 (100 XP)\nGlide. The explorer can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The explorer has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nPatient. When the explorer takes a readied action, it has advantage on its first attack roll, skill check, or ability check made as part of that action.\nKeen Hearing and Sight. The explorer has advantage on Wisdom (Perception) checks relying on hearing or sight.\nSure Footing. The explorer ignores nonmagical difficult terrain.\nActions\nMultiattack. The explorer makes two melee attacks or two hand crossbow attacks.\nTalons. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 4 (1d4 + 2) piercing damage.\nSaber. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.\nHand Crossbow. Ranged Weapon Attack: +4 to hit, range 30/120 ft., one target. Hit: 5 (1d6 + 2) piercing damage.`
    },
    {
      id: 'hw-raptor-ranger', source: 'Humblewood', name: 'Raptor Ranger',
      statBlock: `Raptor Ranger\nSmall humanoid (raptor), any neutral alignment\nArmor Class 15 (studded leather)\nHit Points 66 (12d6 + 24)\nSpeed 25 ft.\nSTR DEX CON INT WIS CHA\n12 (+1) 16 (+3) 14 (+2) 10 (+0) 16 (+3) 8 (-1)\nSkills Athletics +3, Stealth +7, Survival +5\nSenses passive Perception 13\nLanguages Birdfolk, Mapach; understands Auran but cannot speak it\nChallenge 4 (1,100 XP)\nGlide. The ranger can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The ranger has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nAerial Defense. Attacks against the ranger have disadvantage while it is falling, gliding, or jumping.\nArrow Sight (3/Day). After attacking with its red-feather bow, the ranger can use a bonus action to see for 1 minute from the arrow's landing point or from the perspective of the creature it struck.\nHunter (3/Day). As a bonus action, the ranger adds 1d10 damage to its next shortbow or longbow attack.\nSpellcasting. The ranger is a 3rd-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks).\n1st level (3 slots): cure wounds, fog cloud, hunter's mark, protection from evil and good\nActions\nMultiattack. The ranger makes two red-feather bow attacks.\nRed-Feather Bow. Ranged Weapon Attack: +6 to hit, range 80/320 ft., one target. Hit: 6 (1d6 + 4) piercing damage.\nDagger. Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d4 + 3) piercing damage.\nTalons. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.`
    },
    {
      id: 'hw-strig-knight', source: 'Humblewood', name: 'Strig Knight',
      statBlock: `Strig Knight\nMedium humanoid (strig), any lawful alignment\nArmor Class 18 (half plate and shield)\nHit Points 60 (8d8 + 24)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n16 (+3) 10 (+0) 16 (+3) 8 (-1) 13 (+1) 12 (+1)\nSaving Throws Con +5, Wis +4\nSenses darkvision 60 ft., passive Perception 12\nLanguages Birdfolk; understands Auran but cannot speak it\nChallenge 3 (700 XP)\nGlide. The knight can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The knight has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nManeuver (2/Day). When the knight hits, an ally within 5 feet of the target can use its reaction to move up to half its speed without provoking an opportunity attack from that target.\nActions\nMultiattack. The knight makes two shortsword attacks.\nShortsword. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.\nTalons. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage, and the knight can attempt to grapple the target as a bonus action.\nWing Crest Shield (1/Day). The knight casts gust of wind (save DC 15).`
    },
    {
      id: 'hw-strig-tracker', source: 'Humblewood', name: 'Strig Tracker',
      statBlock: `Strig Tracker\nMedium humanoid (strig), any neutral alignment\nArmor Class 14 (hide armor)\nHit Points 65 (10d8 + 20)\nSpeed 35 ft.\nSTR DEX CON INT WIS CHA\n16 (+3) 14 (+2) 14 (+2) 11 (+0) 15 (+2) 10 (+0)\nSkills Acrobatics +6, Perception +4, Survival +4\nSenses darkvision 60 ft., passive Perception 15\nLanguages Birdfolk and two other languages; understands Auran but cannot speak it\nChallenge 3 (700 XP)\nGlide. The tracker can use a reaction while falling at least 10 feet to glide up to its speed and take no falling damage.\nTalons. The tracker has advantage on Strength (Athletics) checks made to climb a surface its talons can grip.\nPatterned Feathers. The tracker has advantage on Dexterity (Stealth) checks made to hide in a forest.\nReya's Keen Eye. The tracker can make Wisdom (Perception) checks as a bonus action to find hidden creatures.\nSpellcasting. The tracker is a 3rd-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 12, +4 to hit with spell attacks).\n1st level (3 slots): elevated sight, hunter's mark, longstrider, speak with animals\nActions\nMultiattack. The tracker makes one longsword and one handaxe attack, or two ranged handaxe attacks.\nLongsword. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) slashing damage when used with two hands.\nHandaxe. Melee or Ranged Weapon Attack: +5 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 6 (1d6 + 3) slashing damage.\nTalons. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.`
    },
    {
      id: 'hw-havel-autumn-moon', source: 'Humblewood', name: 'Havel of the Autumn Moon',
      statBlock: `Havel of the Autumn Moon\nMedium humanoid (gallus), neutral good\nArmor Class 10 (16 with barkskin)\nHit Points 22 (4d8 + 4)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n6 (-2) 10 (+0) 12 (+1) 10 (+0) 16 (+3) 10 (+0)\nSaving Throws Int +7, Wis +5\nSkills Nature +4, Medicine +5, Perception +5\nSenses passive Perception 15\nLanguages Birdfolk, Druidic, Sylvan; understands Auran but cannot speak it\nChallenge 2 (450 XP)\nGlide. Havel can use a reaction while falling at least 10 feet to glide up to his speed and take no falling damage.\nWing Flap. As a bonus action, Havel propels himself upward up to half his speed; this can be combined with a jump, but not a glide.\nSeedspeech. Havel can communicate simple ideas with living plants and interpret their responses.\nSpellcasting. Havel is a 4th-level spellcaster. His spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): druidcraft, gust barrier, produce flame\n1st level (4 slots): cure wounds, elevated sight, entangle, thunderwave\n2nd level (3 slots): barkskin, gust of wind\nActions\nStaff. Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 (1d6 - 2) bludgeoning damage.`
    },
    {
      id: 'hw-tevor-spring-path', source: 'Humblewood', name: 'Tevor of the Spring Path',
      statBlock: `Tevor of the Spring Path\nSmall humanoid (luma), neutral good\nArmor Class 14 (chain shirt)\nHit Points 22 (5d6 + 5)\nSpeed 25 ft.\nSTR DEX CON INT WIS CHA\n14 (+2) 12 (+1) 12 (+1) 10 (+0) 14 (+2) 12 (+1)\nSkills Athletics +4\nDamage Resistances poison\nSenses passive Perception 12\nLanguages Birdfolk, Druidic; understands Auran but cannot speak it\nChallenge 1/4 (50 XP)\nGlide. Tevor can use a reaction while falling at least 10 feet to glide up to his speed and take no falling damage.\nWing Flap. As a bonus action, Tevor propels himself upward up to half his speed; this can be combined with a jump, but not a glide.\nFated (Recharges after a Long Rest). Tevor can reroll one attack roll, skill check, or saving throw.\nResilience. Tevor has advantage on saving throws against poison.\nDrop Attack. An attack Tevor makes during a glide deals an extra 4 (1d8) damage.\nActions\nSpear. Melee or Ranged Weapon Attack: +4 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 5 (1d6 + 2) piercing damage, or 6 (1d8 + 2) piercing damage when used with two hands.\nTender Healing (Recharges after a Long Rest). Tevor casts cure wounds at 1st level using Wisdom.`
    },
    {
      id: 'hw-vulpin-captain', source: 'Humblewood', name: 'Vulpin Captain',
      statBlock: `Vulpin Captain\nMedium humanoid (vulpin), neutral evil\nArmor Class 14 (studded leather armor)\nHit Points 27 (5d8 + 5)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n13 (+1) 15 (+2) 12 (+1) 14 (+2) 14 (+2) 12 (+1)\nSkills Acrobatics +4, Perception +4\nSenses darkvision 60 ft., passive Perception 14\nLanguages Birdfolk, Vulpin\nChallenge 1 (200 XP)\nEvasive. The captain adds its Intelligence modifier to Dexterity saving throws.\nActions\nMultiattack. The captain makes two attacks.\nBite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nShortsword. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nShortbow. Ranged Weapon Attack: +4 to hit, range 80/320 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nReactions\nParry. The captain adds 2 AC against one melee attack that would hit it.`
    },
    {
      id: 'hw-vulpin-noble', source: 'Humblewood', name: 'Vulpin Noble',
      statBlock: `Vulpin Noble\nMedium humanoid (vulpin), any alignment\nArmor Class 15 (breastplate)\nHit Points 9 (2d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 12 (+1) 11 (+0) 14 (+2) 12 (+1) 16 (+3)\nSkills Deception +5, History +4, Insight +3, Persuasion +5\nSenses darkvision 60 ft., passive Perception 11\nLanguages Birdfolk, Vulpin\nChallenge 1/8 (25 XP)\nEvasive. The noble adds its Intelligence modifier to Dexterity saving throws.\nActions\nBite. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage.\nRapier. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage.\nReactions\nDisparaging Remark. When a creature the noble can see attacks one of the noble's allies, the noble imposes disadvantage on the attack roll. The attacker must be able to hear and understand the noble.`
    },
    {
      id: 'hw-vulpin-priest-kren', source: 'Humblewood', name: 'Vulpin Priest of Kren',
      statBlock: `Vulpin Priest of Kren\nMedium humanoid (vulpin), neutral evil\nArmor Class 15 (chain shirt)\nHit Points 27 (5d8 + 5)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 14 (+2) 12 (+1) 15 (+2) 16 (+3) 13 (+1)\nSkills Medicine +7, Persuasion +3, Religion +5\nSenses darkvision 60 ft., passive Perception 13\nLanguages Birdfolk, Celestial, Vulpin\nChallenge 2 (450 XP)\nEvasive. The priest adds its Intelligence modifier to Dexterity saving throws.\nDivine Eminence. As a bonus action, the priest expends a spell slot to make its melee weapon hits deal an extra 10 (3d6) poison damage until the end of the turn, plus 1d6 for each slot level above 1st.\nSpellcasting. The priest is a 5th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): light, sacred flame, thaumaturgy\n1st level (4 slots): cure wounds, disguise self, guiding bolt\n2nd level (3 slots): lesser restoration, mirror image, spiritual weapon\n3rd level (2 slots): blink, spirit guardians\nActions\nBite. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nMace. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage.`
    },
    {
      id: '5e-commoner', source: 'Core 5e', name: 'Commoner',
      statBlock: `Commoner\nMedium humanoid (any race), any alignment\nArmor Class 10\nHit Points 4 (1d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 10 (+0) 10 (+0) 10 (+0) 10 (+0) 10 (+0)\nSenses passive Perception 10\nLanguages any one language\nChallenge 0 (10 XP)\nActions\nClub. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 2 (1d4) bludgeoning damage.`
    },
    {
      id: '5e-bandit', source: 'Core 5e', name: 'Bandit',
      statBlock: `Bandit\nMedium humanoid (any race), any non-lawful alignment\nArmor Class 12 (leather armor)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 12 (+1) 12 (+1) 10 (+0) 10 (+0) 10 (+0)\nSenses passive Perception 10\nLanguages any one language\nChallenge 1/8 (25 XP)\nActions\nScimitar. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) slashing damage.\nLight Crossbow. Ranged Weapon Attack: +3 to hit, range 80/320 ft., one target. Hit: 5 (1d8 + 1) piercing damage.`
    },
    {
      id: '5e-guard', source: 'Core 5e', name: 'Guard',
      statBlock: `Guard\nMedium humanoid (any race), any alignment\nArmor Class 16 (chain shirt, shield)\nHit Points 11 (2d8 + 2)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n13 (+1) 12 (+1) 12 (+1) 10 (+0) 11 (+0) 10 (+0)\nSkills Perception +2\nSenses passive Perception 12\nLanguages any one language\nChallenge 1/8 (25 XP)\nActions\nSpear. Melee or Ranged Weapon Attack: +3 to hit, reach 5 ft. or range 20/60 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) when used with two hands in melee.`
    },
    { 
      id: '5e-noble', source: 'Core 5e', name: 'Noble', 
      statBlock: `Noble\nMedium humanoid (any race), any alignment\nArmor Class 15 (breastplate)\nHit Points 9 (2d8)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 12 (+1) 11 (+0) 12 (+1) 14 (+2) 16 (+3)\nSkills Deception +5, Insight +4, Persuasion +5\nSenses passive Perception 12\nLanguages any two languages\nChallenge 1/8 (25 XP)\nActions\nRapier. Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d8 + 1) piercing damage.`
    },
    {
      id: '5e-scout', source: 'Core 5e', name: 'Scout',
      statBlock: `Scout\nMedium humanoid (any race), any alignment\nArmor Class 13 (leather armor)\nHit Points 16 (3d8 + 3)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n11 (+0) 14 (+2) 12 (+1) 11 (+0) 13 (+1) 11 (+0)\nSkills Nature +4, Perception +5, Stealth +6, Survival +5\nSenses passive Perception 15\nLanguages any one language\nChallenge 1/2 (100 XP)\nKeen Hearing and Sight. The scout has advantage on Wisdom (Perception) checks that rely on hearing or sight.\nActions\nMultiattack. The scout makes two melee attacks or two ranged attacks.\nShortsword. Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) piercing damage.\nLongbow. Ranged Weapon Attack: +4 to hit, range 150/600 ft., one target. Hit: 6 (1d8 + 2) piercing damage.`
    },
    {
      id: '5e-priest', source: 'Core 5e', name: 'Priest',
      statBlock: `Priest\nMedium humanoid (any race), any alignment\nArmor Class 13 (chain shirt)\nHit Points 27 (5d8 + 5)\nSpeed 25 ft.\nSTR DEX CON INT WIS CHA\n10 (+0) 10 (+0) 12 (+1) 13 (+1) 16 (+3) 13 (+1)\nSkills Medicine +7, Persuasion +3, Religion +4\nSenses passive Perception 13\nLanguages any two languages\nChallenge 2 (450 XP)\nDivine Eminence. As a bonus action, the priest can expend a spell slot to add radiant damage to its melee weapon attacks for the turn.\nSpellcasting. The priest is a 5th-level spellcaster. Its spellcasting ability is Wisdom (spell save DC 13, +5 to hit with spell attacks).\nCantrips (at will): light, sacred flame, thaumaturgy\n1st level (4 slots): cure wounds, guiding bolt\n2nd level (3 slots): lesser restoration, spiritual weapon\n3rd level (2 slots): dispel magic, spirit guardians\nActions\nMace. Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 3 (1d6) bludgeoning damage.`
    },
    {
      id: '5e-veteran', source: 'Core 5e', name: 'Veteran',
      statBlock: `Veteran\nMedium humanoid (any race), any alignment\nArmor Class 17 (splint)\nHit Points 58 (9d8 + 18)\nSpeed 30 ft.\nSTR DEX CON INT WIS CHA\n16 (+3) 13 (+1) 14 (+2) 10 (+0) 11 (+0) 10 (+0)\nSkills Athletics +5, Perception +2\nSenses passive Perception 12\nLanguages any one language\nChallenge 3 (700 XP)\nActions\nMultiattack. The veteran makes two longsword attacks and one shortsword attack, or two heavy crossbow attacks.\nLongsword. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 7 (1d8 + 3) slashing damage, or 8 (1d10 + 3) with two hands.\nShortsword. Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) piercing damage.\nHeavy Crossbow. Ranged Weapon Attack: +3 to hit, range 100/400 ft., one target. Hit: 6 (1d10 + 1) piercing damage.`
    }
  ];

  function cleanText(value) {
    return String(value || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u00ad]/g, '')
      .replace(/[‐‑‒–—]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function titleCase(value) {
    const text = String(value || '').trim();
    if (!text || text !== text.toUpperCase()) return text;
    return text.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (match, prefix, letter) => prefix + letter.toUpperCase());
  }

  function lineValue(text, label, followingLabels = []) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const stop = followingLabels.length
      ? `(?=\\n(?:${followingLabels.map(value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b|$)`
      : '(?=\\n|$)';
    const match = text.match(new RegExp(`(?:^|\\n)${escaped}\\s*:?\\s*([\\s\\S]*?)${stop}`, 'i'));
    return cleanText(match?.[1] || '').replace(/\n/g, ' ').trim();
  }

  function challengeProficiency(challenge) {
    const numeric = String(challenge || '').includes('/') ? 0 : Number(challenge) || 0;
    if (numeric >= 29) return 9;
    if (numeric >= 25) return 8;
    if (numeric >= 21) return 7;
    if (numeric >= 17) return 6;
    if (numeric >= 13) return 5;
    if (numeric >= 9) return 4;
    if (numeric >= 5) return 3;
    return 2;
  }

  function parseModifierList(value) {
    const parsed = [];
    String(value || '').split(/,|;/).forEach(part => {
      const match = part.trim().match(/^(.+?)\s*([+-]\s*\d+)$/);
      if (match) parsed.push({ name: match[1].trim().toLowerCase(), modifier: Number(match[2].replace(/\s/g, '')) });
    });
    return parsed;
  }

  function section(text, heading, nextHeadings) {
    const start = text.search(new RegExp(`(?:^|\\n)${heading}\\s*(?:\\n|$)`, 'i'));
    if (start < 0) return '';
    const bodyStart = text.indexOf('\n', start) + 1;
    let end = text.length;
    nextHeadings.forEach(next => {
      const relative = text.slice(bodyStart).search(new RegExp(`(?:^|\\n)${next}\\s*(?:\\n|$)`, 'i'));
      if (relative >= 0) end = Math.min(end, bodyStart + relative);
    });
    return cleanText(text.slice(bodyStart, end));
  }

  function parseAttacks(text) {
    const area = [
      section(text, 'Actions', ['Bonus Actions', 'Reactions', 'Legendary Actions']),
      section(text, 'Bonus Actions', ['Reactions', 'Legendary Actions']),
      section(text, 'Reactions', ['Legendary Actions']),
      section(text, 'Legendary Actions', [])
    ].filter(Boolean).join('\n');
    if (!area) return [];
    const starts = [];
    const pattern = /(?:^|\n)([A-Z][A-Za-z0-9'() /-]{1,90})\.\s*((?:Melee|Ranged|Melee or Ranged)\s+(?:Weapon|Spell)\s+Attack:)/g;
    let match;
    while ((match = pattern.exec(area))) starts.push({ index: match.index, contentStart: pattern.lastIndex, name: match[1].trim(), kind: match[2] });
    return starts.map((start, index) => {
      const block = cleanText(area.slice(start.contentStart, starts[index + 1]?.index ?? area.length));
      const bonus = block.match(/([+-]\s*\d+)\s*to hit/i)?.[1]?.replace(/\s/g, '') || '';
      const damageMatch = block.match(/Hit:\s*\d+\s*\(([^)]+)\)\s*([A-Za-z]+)\s+damage/i);
      const damage = damageMatch ? `${damageMatch[1].replace(/\s+/g, '')} ${damageMatch[2].toLowerCase()}` : '';
      const detail = cleanText(`${start.kind} ${block}`).slice(0, 1200);
      return { id: `attack-import-${index}`, name: start.name, bonus, damage, details: detail, source: 'Imported stat block' };
    });
  }

  function findSpellPreset(name, presets) {
    const normalized = String(name || '').trim().toLowerCase();
    return (presets || []).find(preset => String(preset.name || '').trim().toLowerCase() === normalized) || null;
  }

  function parseSpells(text, presets = STANDARD_SPELL_PRESETS) {
    const markers = [];
    const markerPattern = /(Cantrips?|[1-9](?:st|nd|rd|th)\s+level)\s*(?:\(([^)]*)\))?\s*:/gi;
    let match;
    while ((match = markerPattern.exec(text))) {
      const level = /^cantrip/i.test(match[1]) ? 0 : Number.parseInt(match[1], 10);
      markers.push({ index: match.index, contentStart: markerPattern.lastIndex, level, qualifier: match[2] || '' });
    }
    const spells = [];
    const slots = {};
    markers.forEach((marker, markerIndex) => {
      let end = markers[markerIndex + 1]?.index ?? text.length;
      const heading = text.slice(marker.contentStart, end).search(/\n(?:Actions|Bonus Actions|Reactions|Legendary Actions)\s*(?:\n|$)/i);
      if (heading >= 0) end = Math.min(end, marker.contentStart + heading);
      const names = cleanText(text.slice(marker.contentStart, end))
        .replace(/\n/g, ' ')
        .split(/,|;/)
        .map(name => name.replace(/[.*†‡]+$/g, '').replace(/\s+/g, ' ').trim())
        .filter(name => name && name.length <= 80 && !/^(and|or)$/i.test(name));
      const slotCount = marker.qualifier.match(/(\d+)\s*slots?/i);
      if (marker.level && slotCount) slots[marker.level] = Number(slotCount[1]);
      names.forEach(name => {
        const known = findSpellPreset(name, presets);
        spells.push({
          ...(known || {}),
          id: `spell-import-${marker.level}-${spells.length}`,
          name: known?.name || titleCase(name),
          level: marker.level,
          source: known?.source || 'Imported stat block'
        });
      });
    });
    return { spells, slots };
  }

  function parseStatBlock(raw, options = {}) {
    const text = cleanText(raw);
    if (!text) return { error: 'Paste a stat block first.' };
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const acLineIndex = lines.findIndex(line => /^Armor Class\b/i.test(line));
    const beforeAc = lines.slice(0, acLineIndex < 0 ? Math.min(lines.length, 4) : acLineIndex)
      .filter(line => !/^(Appendix|Chapter|NPC|Nonplayer Characters|Bestiary)$/i.test(line) && !/^a$/i.test(line));
    const typeLineIndex = beforeAc.findIndex(line => /\b(?:humanoid|beast|monstrosity|ooze|elemental|fiend|celestial|construct|dragon|fey|giant|plant|undead|aberration)\b/i.test(line));
    const fallbackName = beforeAc.find(line => line.length <= 100 && !/\bmedium|small|large|tiny|huge|gargantuan\b/i.test(line));
    const name = titleCase(options.name || (typeLineIndex > 0 ? beforeAc[typeLineIndex - 1] : fallbackName) || 'Imported NPC');
    const typeLine = typeLineIndex >= 0 ? beforeAc[typeLineIndex] : '';
    const ac = Number(text.match(/Armor Class\s*:?\s*(\d+)/i)?.[1]) || 10;
    const hpMatch = text.match(/Hit Points\s*:?\s*(\d+)\s*(?:\(([^)]+)\))?/i);
    const maxHp = Math.max(1, Number(hpMatch?.[1]) || 10);
    const speed = lineValue(text, 'Speed', ['STR', 'Saving Throws', 'Skills', 'Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']) || '30 ft.';
    const challenge = text.match(/Challenge\s*:?\s*([0-9]+(?:\s*\/\s*[0-9]+)?)/i)?.[1]?.replace(/\s/g, '') || '';
    const abilityHeader = text.search(/\bSTR\s+DEX\s+CON\s+INT\s+WIS\s+CHA\b/i);
    const abilityArea = abilityHeader >= 0 ? text.slice(abilityHeader, abilityHeader + 420) : text;
    const scores = [...abilityArea.matchAll(/(\d{1,2})\s*\(([+-]\s*\d+)\)/g)].slice(0, 6);
    const abilities = Object.fromEntries(ABILITIES.map((ability, index) => [ability, Number(scores[index]?.[1]) || 10]));
    const abilityModifiers = Object.fromEntries(ABILITIES.map((ability, index) => [ability, Number(scores[index]?.[2]?.replace(/\s/g, '')) || Math.floor((abilities[ability] - 10) / 2)]));
    const senses = lineValue(text, 'Senses', ['Languages', 'Challenge']);
    const languages = lineValue(text, 'Languages', ['Challenge']);
    const skillsText = lineValue(text, 'Skills', ['Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const savesText = lineValue(text, 'Saving Throws', ['Skills', 'Damage Vulnerabilities', 'Damage Resistances', 'Damage Immunities', 'Condition Immunities', 'Senses', 'Languages', 'Challenge']);
    const passive = Number(senses.match(/passive Perception\s*(\d+)/i)?.[1]) || 10 + abilityModifiers.wis;
    const firstSection = text.search(/\n(?:Actions|Bonus Actions|Reactions|Legendary Actions)\s*(?:\n|$)/i);
    const challengeEnd = text.search(/Challenge\s*:?[^\n]*(?:\n|$)/i);
    const challengeLineEnd = challengeEnd >= 0 ? text.indexOf('\n', challengeEnd) : -1;
    const traits = challengeLineEnd >= 0 ? cleanText(text.slice(challengeLineEnd + 1, firstSection >= 0 ? firstSection : text.length)) : '';
    const actionSections = [
      ['Actions', section(text, 'Actions', ['Bonus Actions', 'Reactions', 'Legendary Actions'])],
      ['Bonus Actions', section(text, 'Bonus Actions', ['Reactions', 'Legendary Actions'])],
      ['Reactions', section(text, 'Reactions', ['Legendary Actions'])],
      ['Legendary Actions', section(text, 'Legendary Actions', [])]
    ].filter(([, body]) => body).map(([heading, body]) => `${heading}\n${body}`).join('\n\n');
    const spellPresets = [...(options.spellPresets || []), ...STANDARD_SPELL_PRESETS];
    const parsedSpells = parseSpells(text, spellPresets);
    const spellcastingAbilityName = text.match(/spellcasting ability is\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)/i)?.[1]?.toLowerCase();
    const spellAbility = ABILITY_NAMES[spellcastingAbilityName] || '';
    const saveDc = Number(text.match(/spell save DC\s*(\d+)/i)?.[1]) || 0;
    const spellAttack = Number(text.match(/([+-]\s*\d+)\s*to hit with spell attacks/i)?.[1]?.replace(/\s/g, '')) || 0;
    const size = typeLine.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/i)?.[1] || '';
    const alignment = typeLine.includes(',') ? typeLine.slice(typeLine.lastIndexOf(',') + 1).trim() : '';
    const creatureType = typeLine.includes(',') ? typeLine.slice(0, typeLine.lastIndexOf(',')).trim() : typeLine;
    const fields = {
      name,
      species: '', subrace: '', class: '', subclass: '', level: '1',
      background: creatureType,
      path: alignment,
      hp: String(maxHp), maxhp: String(maxHp), temphp: '0', ac: String(ac),
      'ac-method': 'manual', 'ac-base': String(ac), 'ac-bonus': '0',
      initiative: String(abilityModifiers.dex), speed, size,
      'prof-bonus': String(challengeProficiency(challenge)),
      'hitdice': hpMatch?.[2]?.replace(/\s+/g, '') || '', 'hitdice-left': '0',
      'passive-perception': String(passive),
      languages,
      'racial-traits': traits,
      'attacks-notes': actionSections,
      notes: `Imported stat block${challenge ? ` · CR ${challenge}` : ''}`,
      'spell-class': spellAbility ? 'NPC spellcaster' : '',
      'spell-ability': spellAbility.toUpperCase(),
      'spell-dc': saveDc ? String(saveDc) : '',
      'spell-attack': spellAttack ? String(spellAttack) : '',
      'spell-list': JSON.stringify(parsedSpells.spells)
    };
    ABILITIES.forEach(ability => {
      fields[ability] = String(abilities[ability]);
      fields[`save-${ability}`] = String(abilityModifiers[ability]);
      fields[`save-${ability}-prof`] = false;
    });
    parseModifierList(savesText).forEach(entry => {
      const ability = ABILITY_NAMES[entry.name];
      if (!ability) return;
      fields[`save-${ability}`] = String(entry.modifier);
      fields[`save-${ability}-prof`] = true;
    });
    parseModifierList(skillsText).forEach(entry => {
      const skill = SKILL_KEYS[entry.name];
      if (!skill) return;
      fields[`skill-${skill}`] = String(entry.modifier);
      fields[`skill-${skill}-prof`] = true;
    });
    for (let level = 1; level <= 9; level += 1) {
      fields[`spell-slots-${level}`] = String(parsedSpells.slots[level] || 0);
      fields[`spell-used-${level}`] = '0';
    }
    return {
      name,
      fields,
      abilities,
      attacks: parseAttacks(text),
      spells: parsedSpells.spells,
      spellSlots: parsedSpells.slots,
      spellcasting: { ability: spellAbility.toUpperCase(), saveDc, attackBonus: spellAttack },
      challenge,
      traits,
      actions: actionSections,
      rawText: text
    };
  }

  function attackPresetValues(preset, scores = {}, proficiency = 2) {
    if (!preset) return null;
    const str = Math.floor(((Number(scores.str) || 10) - 10) / 2);
    const dex = Math.floor(((Number(scores.dex) || 10) - 10) / 2);
    const modifier = preset.ability === 'dex' ? dex : preset.ability === 'finesse' ? Math.max(str, dex) : str;
    const signed = value => value >= 0 ? `+${value}` : String(value);
    const damage = preset.die ? `${preset.die}${modifier ? signed(modifier) : ''} ${preset.damageType}`.trim() : '';
    return {
      id: `attack-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: preset.name,
      bonus: signed((Number(proficiency) || 0) + modifier),
      damage,
      details: preset.properties || '',
      source: preset.source || 'Core 5e'
    };
  }

  return {
    ATTACK_PRESETS,
    NPC_PRESETS,
    STANDARD_SPELL_PRESETS,
    attackPresetValues,
    cleanText,
    findSpellPreset,
    parseAttacks,
    parseSpells,
    parseStatBlock
  };
});
