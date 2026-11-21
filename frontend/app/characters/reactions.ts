/** Core 5e and Humblewood reaction presets plus the character-sheet editor. */

const REACTION_PRESET_GROUPS = [
  'Core rules',
  'Class & subclass features',
  'Feats',
  'Spells',
  'Humblewood features'
];

const REACTION_PRESETS: any[] = [
  {
    id: 'core-opportunity-attack', group: 'Core rules', name: 'Opportunity Attack',
    requirement: 'Any creature', resource: 'One reaction', source: 'Core rules',
    trigger: 'A hostile creature you can see moves out of your reach using its movement, action, or reaction.',
    effect: 'Make one melee attack against it just before it leaves your reach.',
    alwaysSuggested: true
  },
  {
    id: 'core-ready-action', group: 'Core rules', name: 'Readied Action',
    requirement: 'Ready action taken on your turn', resource: 'One reaction; readied spells also require concentration', source: 'Core rules',
    trigger: 'The perceivable circumstance you named when you took the Ready action occurs.',
    effect: 'Take the readied action after the trigger finishes, or ignore the trigger and keep waiting if possible.',
    alwaysSuggested: true
  },
  {
    id: 'barbarian-retaliation', group: 'Class & subclass features', name: 'Retaliation',
    requirement: 'Path of the Berserker Barbarian 14', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A creature within 5 feet of you damages you.',
    effect: 'Make one melee weapon attack against that creature.',
    suggestedTags: ['path of the berserker', 'retaliation']
  },
  {
    id: 'bard-cutting-words', group: 'Class & subclass features', name: 'Cutting Words',
    requirement: 'College of Lore Bard 3', resource: 'One reaction and one Bardic Inspiration die', source: "Player's Handbook",
    trigger: 'A creature you can see within 60 feet makes an attack roll, ability check, or damage roll.',
    effect: 'Roll your Bardic Inspiration die and subtract it from the roll, using this before the outcome or damage is resolved. The creature must be able to hear you.',
    suggestedTags: ['college of lore', 'cutting words']
  },
  {
    id: 'bard-combat-inspiration', group: 'Class & subclass features', name: 'Combat Inspiration (AC)',
    requirement: 'A Bardic Inspiration die from a College of Valor Bard', resource: 'One reaction and the inspiration die', source: "Player's Handbook",
    trigger: 'An attack roll is made against you.',
    effect: 'After seeing the roll but before the result is announced, roll the inspiration die and add it to your AC against that attack.',
    suggestedTags: ['college of valor', 'combat inspiration']
  },
  {
    id: 'cleric-warding-flare', group: 'Class & subclass features', name: 'Warding Flare',
    requirement: 'Light Domain Cleric 1', resource: 'One reaction; uses equal to Wisdom modifier per long rest', source: "Player's Handbook",
    trigger: 'A creature you can see within 30 feet attacks you.',
    effect: 'Impose disadvantage on the attack roll. Creatures that cannot be blinded are unaffected.',
    suggestedTags: ['light domain', 'warding flare']
  },
  {
    id: 'cleric-dampen-elements', group: 'Class & subclass features', name: 'Dampen Elements',
    requirement: 'Nature Domain Cleric 6', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'You or a creature within 30 feet takes acid, cold, fire, lightning, or thunder damage.',
    effect: 'Grant the creature resistance to that instance of damage.',
    suggestedTags: ['nature domain', 'dampen elements']
  },
  {
    id: 'cleric-wrath-of-the-storm', group: 'Class & subclass features', name: 'Wrath of the Storm',
    requirement: 'Tempest Domain Cleric 1', resource: 'One reaction; uses equal to Wisdom modifier per long rest', source: "Player's Handbook",
    trigger: 'A creature you can see within 5 feet hits you with an attack.',
    effect: 'Force a Dexterity save. Deal 2d8 lightning or thunder damage on a failure, or half on a success.',
    suggestedTags: ['tempest domain', 'wrath of the storm']
  },
  {
    id: 'cleric-war-gods-blessing', group: 'Class & subclass features', name: "War God's Blessing",
    requirement: 'War Domain Cleric 6', resource: 'One reaction and Channel Divinity', source: "Player's Handbook",
    trigger: 'A creature within 30 feet makes an attack roll.',
    effect: 'After seeing the roll, but before the result is resolved, grant that creature a +10 bonus to the roll.',
    suggestedTags: ['war domain', "war god's blessing"]
  },
  {
    id: 'fighting-style-protection', group: 'Class & subclass features', name: 'Protection Fighting Style',
    requirement: 'Protection style and a shield', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A creature you can see attacks a target other than you within 5 feet of you.',
    effect: 'Impose disadvantage on the attack roll.',
    suggestedTags: ['protection fighting style']
  },
  {
    id: 'fighter-parry', group: 'Class & subclass features', name: 'Parry',
    requirement: 'Battle Master maneuver', resource: 'One reaction and one superiority die', source: "Player's Handbook",
    trigger: 'A creature damages you with a melee attack.',
    effect: 'Reduce the damage by your superiority die roll plus your Dexterity modifier.',
    suggestedTags: ['battle master', 'parry']
  },
  {
    id: 'fighter-riposte', group: 'Class & subclass features', name: 'Riposte',
    requirement: 'Battle Master maneuver', resource: 'One reaction and one superiority die', source: "Player's Handbook",
    trigger: 'A creature misses you with a melee attack.',
    effect: 'Make a melee weapon attack against it; on a hit, add the superiority die to the damage.',
    suggestedTags: ['battle master', 'riposte']
  },
  {
    id: 'monk-deflect-missiles', group: 'Class & subclass features', name: 'Deflect Missiles',
    requirement: 'Monk 3', resource: 'One reaction; 1 ki to throw a caught missile', source: "Player's Handbook",
    trigger: 'A ranged weapon attack hits you.',
    effect: 'Reduce its damage by 1d10 + Dexterity modifier + monk level. If reduced to 0, you may catch and throw the missile as part of the reaction by spending 1 ki.',
    suggestedTags: ['monk', 'deflect missiles']
  },
  {
    id: 'monk-slow-fall', group: 'Class & subclass features', name: 'Slow Fall',
    requirement: 'Monk 4', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'You fall.',
    effect: 'Reduce the falling damage by five times your monk level.',
    suggestedTags: ['monk', 'slow fall']
  },
  {
    id: 'ranger-giant-killer', group: 'Class & subclass features', name: 'Giant Killer',
    requirement: 'Hunter Ranger 3', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A Large or larger creature within 5 feet hits or misses you with an attack, and you can see it.',
    effect: 'Attack that creature immediately after its attack.',
    suggestedTags: ['hunter', 'giant killer']
  },
  {
    id: 'ranger-stand-against-the-tide', group: 'Class & subclass features', name: 'Stand Against the Tide',
    requirement: 'Hunter Ranger 15', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A hostile creature misses you with a melee attack.',
    effect: 'Force it to repeat that attack against another creature of your choice in its range, other than itself.',
    suggestedTags: ['hunter', 'stand against the tide']
  },
  {
    id: 'rogue-uncanny-dodge', group: 'Class & subclass features', name: 'Uncanny Dodge',
    requirement: 'Rogue 5 or Hunter Ranger 15', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'An attacker you can see hits you with an attack.',
    effect: "Halve that attack's damage against you.",
    suggestedTags: ['rogue', 'uncanny dodge']
  },
  {
    id: 'rogue-spell-thief', group: 'Class & subclass features', name: 'Spell Thief',
    requirement: 'Arcane Trickster Rogue 17', resource: 'One reaction; once per long rest', source: "Player's Handbook",
    trigger: 'A creature casts a spell that targets you or includes you in its area.',
    effect: 'Force a spellcasting-ability save against your spell save DC. On a failure, negate the spell against you and temporarily steal an eligible spell.',
    suggestedTags: ['arcane trickster', 'spell thief']
  },
  {
    id: 'sorcerer-bend-luck', group: 'Class & subclass features', name: 'Bend Luck',
    requirement: 'Wild Magic Sorcerer 6', resource: 'One reaction and 2 sorcery points', source: "Player's Handbook",
    trigger: 'Another creature you can see makes an attack roll, ability check, or saving throw.',
    effect: 'Roll 1d4 and apply it as a bonus or penalty to that roll before the outcome is resolved.',
    suggestedTags: ['wild magic', 'bend luck']
  },
  {
    id: 'warlock-misty-escape', group: 'Class & subclass features', name: 'Misty Escape',
    requirement: 'Archfey Warlock 6', resource: 'One reaction; once per short or long rest', source: "Player's Handbook",
    trigger: 'You take damage.',
    effect: 'Turn invisible and teleport up to 60 feet to an unoccupied space you can see. The invisibility has the feature’s normal early-ending conditions.',
    suggestedTags: ['archfey', 'misty escape']
  },
  {
    id: 'warlock-beguiling-defenses', group: 'Class & subclass features', name: 'Beguiling Defenses',
    requirement: 'Archfey Warlock 10', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'Another creature attempts to charm you.',
    effect: 'Turn the charm back on it; it makes a Wisdom save or is charmed by you for up to 1 minute.',
    suggestedTags: ['archfey', 'beguiling defenses']
  },
  {
    id: 'warlock-entropic-ward', group: 'Class & subclass features', name: 'Entropic Ward',
    requirement: 'Great Old One Warlock 6', resource: 'One reaction; once per short or long rest', source: "Player's Handbook",
    trigger: 'A creature makes an attack roll against you.',
    effect: 'Impose disadvantage. If it misses, your next attack against it has advantage if made before the end of your next turn.',
    suggestedTags: ['great old one', 'entropic ward']
  },
  {
    id: 'wizard-projected-ward', group: 'Class & subclass features', name: 'Projected Ward',
    requirement: 'Abjuration Wizard 6 with an active Arcane Ward', resource: 'One reaction and Arcane Ward hit points', source: "Player's Handbook",
    trigger: 'A creature you can see within 30 feet takes damage.',
    effect: 'Have your Arcane Ward absorb the damage, with any excess passing to the creature.',
    suggestedTags: ['school of abjuration', 'abjuration', 'projected ward']
  },
  {
    id: 'wizard-instinctive-charm', group: 'Class & subclass features', name: 'Instinctive Charm',
    requirement: 'Enchantment Wizard 6', resource: 'One reaction; a successful save prevents repeat use on that attacker until a long rest', source: "Player's Handbook",
    trigger: 'A creature you can see within 30 feet attacks you while another creature is in range of that attack.',
    effect: 'Force a Wisdom save. On a failure, the attacker must target the closest eligible creature instead.',
    suggestedTags: ['school of enchantment', 'enchantment', 'instinctive charm']
  },
  {
    id: 'wizard-illusory-self', group: 'Class & subclass features', name: 'Illusory Self',
    requirement: 'Illusion Wizard 10', resource: 'One reaction; once per short or long rest', source: "Player's Handbook",
    trigger: 'A creature makes an attack roll against you.',
    effect: 'Interpose an illusory duplicate; the attack automatically misses you.',
    suggestedTags: ['school of illusion', 'illusion', 'illusory self']
  },
  {
    id: 'feat-defensive-duelist', group: 'Feats', name: 'Defensive Duelist',
    requirement: 'Defensive Duelist feat and a proficient finesse weapon', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'Another creature hits you with a melee attack.',
    effect: 'Add your proficiency bonus to your AC against that attack, potentially turning it into a miss.',
    suggestedTags: ['defensive duelist']
  },
  {
    id: 'feat-mage-slayer', group: 'Feats', name: 'Mage Slayer',
    requirement: 'Mage Slayer feat', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A creature within 5 feet of you casts a spell.',
    effect: 'Make a melee weapon attack against that creature.',
    suggestedTags: ['mage slayer']
  },
  {
    id: 'feat-polearm-master', group: 'Feats', name: 'Polearm Master Opportunity Attack',
    requirement: 'Polearm Master feat and an eligible polearm', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A creature enters your reach while you wield an eligible polearm.',
    effect: 'Make an opportunity attack against it.',
    suggestedTags: ['polearm master']
  },
  {
    id: 'feat-sentinel', group: 'Feats', name: 'Sentinel Retaliation',
    requirement: 'Sentinel feat', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'A creature within 5 feet attacks a target other than you that does not also have Sentinel.',
    effect: 'Make a melee weapon attack against the attacker.',
    suggestedTags: ['sentinel']
  },
  {
    id: 'feat-shield-master', group: 'Feats', name: 'Shield Master Evasion',
    requirement: 'Shield Master feat and a shield', resource: 'One reaction', source: "Player's Handbook",
    trigger: 'You succeed on a Dexterity save against an effect that would deal half damage.',
    effect: 'Take no damage from that effect.',
    suggestedTags: ['shield master']
  },
  {
    id: 'feat-war-caster', group: 'Feats', name: 'War Caster Opportunity Spell',
    requirement: 'War Caster feat', resource: 'One reaction and any spell cost', source: "Player's Handbook",
    trigger: 'A hostile creature provokes an opportunity attack from you.',
    effect: 'Instead of the opportunity attack, cast a 1-action spell that targets only that creature.',
    suggestedTags: ['war caster']
  },
  {
    id: 'spell-counterspell', group: 'Spells', name: 'Counterspell',
    requirement: 'Counterspell known or prepared', resource: 'One reaction and a spell slot', source: "Player's Handbook",
    trigger: 'You see a creature within 60 feet casting a spell.',
    effect: 'Interrupt the casting. Lower-level spells fail automatically; higher-level spells require the spell’s ability check.',
    suggestedTags: ['counterspell']
  },
  {
    id: 'spell-feather-fall', group: 'Spells', name: 'Feather Fall',
    requirement: 'Feather Fall known or prepared', resource: 'One reaction and a spell slot', source: "Player's Handbook",
    trigger: 'You or a creature within 60 feet falls.',
    effect: 'Choose up to five falling creatures in range; their descent slows and they avoid falling damage if the spell lasts until landing.',
    suggestedTags: ['feather fall']
  },
  {
    id: 'spell-hellish-rebuke', group: 'Spells', name: 'Hellish Rebuke',
    requirement: 'Hellish Rebuke known or available', resource: 'One reaction and a spell slot or feature use', source: "Player's Handbook",
    trigger: 'A creature you can see within 60 feet damages you.',
    effect: 'Force a Dexterity save and deal fire damage, with half damage on a success.',
    suggestedTags: ['hellish rebuke']
  },
  {
    id: 'spell-shield', group: 'Spells', name: 'Shield',
    requirement: 'Shield known or prepared', resource: 'One reaction and a spell slot', source: "Player's Handbook",
    trigger: 'An attack hits you or you are targeted by Magic Missile.',
    effect: 'Gain +5 AC until the start of your next turn, including against the triggering attack, and take no Magic Missile damage.',
    suggestedTags: ['shield']
  },
  {
    id: 'humblewood-glide', group: 'Humblewood features', name: 'Glide',
    requirement: 'Birdfolk Glide trait', resource: 'One reaction', source: 'Humblewood Campaign Setting',
    trigger: 'You are falling and can spread your feathered arms.',
    effect: 'Slow your descent, avoid falling damage on landing, and—after a fall of at least 10 feet—move horizontally up to your speed. Equipment restrictions apply.',
    suggestedTags: ['birdfolk', 'corvum', 'gallus', 'luma', 'raptor', 'strig', 'glide']
  },
  {
    id: 'humblewood-bind-the-wound', group: 'Humblewood features', name: 'Bind the Wound',
    requirement: 'College of the Road Bard 3; Traveler’s Trick', resource: 'One reaction and one Bardic Inspiration die', source: 'Humblewood Campaign Setting',
    trigger: 'You or an ally within 5 feet receives healing, and you have a hand free.',
    effect: 'Add healing equal to your Bardic Inspiration die plus Wisdom modifier. Higher-level improvements can remove conditions or disease.',
    suggestedTags: ['college of the road', 'bind the wound']
  },
  {
    id: 'humblewood-ward-of-shadows', group: 'Humblewood features', name: 'Ward of Shadows',
    requirement: 'Night Domain Cleric 1', resource: 'One reaction; uses equal to Wisdom modifier per long rest', source: 'Humblewood Campaign Setting',
    trigger: 'A creature you can see within 30 feet attacks you.',
    effect: 'Impose disadvantage on the attack roll. Creatures that cannot be blinded are unaffected.',
    suggestedTags: ['night domain', 'ward of shadows']
  },
  {
    id: 'humblewood-bandit-cunning', group: 'Humblewood features', name: 'Bandit Cunning',
    requirement: 'Bandit Cunning feat', resource: 'One reaction; once per long rest', source: 'Humblewood Campaign Setting',
    trigger: 'You are asked to make a saving throw.',
    effect: 'Add your Intelligence modifier as an additional bonus to the saving throw.',
    suggestedTags: ['bandit cunning']
  },
  {
    id: 'humblewood-feathered-reach', group: 'Spells', name: 'Feathered Reach Glide',
    requirement: 'Feathered Reach active', resource: 'One reaction', source: 'Humblewood Campaign Setting',
    trigger: 'You fall while Feathered Reach is active.',
    effect: 'Glide on the wind, flying up to your movement speed in any direction and choosing where you land.',
    suggestedTags: ['feathered reach']
  },
  {
    id: 'humblewood-invoke-amaranthine', group: 'Spells', name: 'Invoke the Amaranthine',
    requirement: 'Invoke the Amaranthine active with a matching recorded die', resource: 'One reaction and one recorded die', source: 'Humblewood Campaign Setting',
    trigger: 'A visible creature within 60 feet makes the matching attack roll, skill check, or saving throw, before its outcome is resolved.',
    effect: 'Replace its d20 result with the matching recorded number; normal modifiers still apply.',
    suggestedTags: ['invoke the amaranthine']
  },
  {
    id: 'humblewood-spiny-shield', group: 'Spells', name: 'Spiny Shield',
    requirement: 'Spiny Shield known or prepared', resource: 'One reaction and a spell slot', source: 'Humblewood Campaign Setting',
    trigger: 'You are hit by an attack.',
    effect: 'Create the barrier for 1 round. It reduces melee damage and reflects the same piercing damage; against ranged attacks it instead grants +2 AC.',
    suggestedTags: ['spiny shield']
  }
];

const BONUS_ACTION_PRESET_GROUPS = [
  'Class features',
  'Bonus action spells',
  'Weapons',
  'Feats'
];

const BONUS_ACTION_PRESETS: any[] = [
  { id: 'ba-monk-flurry', group: 'Class features', name: 'Flurry of Blows', requirement: 'Monk', resource: 'Spend 1 ki', source: "2024 core rules", effect: 'Immediately make two Unarmed Strikes after taking the Attack action.' },
  { id: 'ba-monk-patient', group: 'Class features', name: 'Patient Defense', requirement: 'Monk', resource: 'Spend 1 ki', source: "2024 core rules", effect: 'Take the Disengage action and gain advantage on Dexterity saving throws until the start of your next turn.' },
  { id: 'ba-monk-wind', group: 'Class features', name: 'Step of the Wind', requirement: 'Monk', resource: 'Spend 1 ki', source: "2024 core rules", effect: 'Take the Disengage or Dash action and double your jump distance for the turn.' },
  { id: 'ba-rogue-cunning', group: 'Class features', name: 'Cunning Action', requirement: 'Rogue', resource: 'One bonus action', source: "2024 core rules", effect: 'Dash, Disengage, or Hide.' },
  { id: 'ba-rogue-steady', group: 'Class features', name: 'Steady Aim', requirement: 'Rogue', resource: 'One bonus action', source: "2024 core rules", effect: 'Give yourself advantage on your next attack roll before the end of the turn; your Speed becomes 0 until the end of the current turn.' },
  { id: 'ba-barbarian-rage', group: 'Class features', name: 'Rage', requirement: 'Barbarian', resource: 'One bonus action; limited uses', source: "2024 core rules", effect: 'Enter Rage. Strength checks and saves have advantage, melee Strength damage is increased, and resistance applies to bludgeoning, piercing, and slashing damage.' },
  { id: 'ba-barbarian-maintain', group: 'Class features', name: 'Maintain Rage', requirement: 'Barbarian', resource: 'Bonus action when required', source: "2024 core rules", effect: 'Extend Rage through an additional turn by attacking or damaging a hostile creature or by using a bonus action to maintain it.' },
  { id: 'ba-bard-inspiration', group: 'Class features', name: 'Bardic Inspiration', requirement: 'Bard', resource: 'One bonus action; Bardic Inspiration dice', source: "2024 core rules", effect: 'Give a visible or audible creature within 60 feet one Bardic Inspiration die.' },
  { id: 'ba-druid-wild', group: 'Class features', name: 'Wild Shape', requirement: 'Druid', resource: 'One bonus action', source: "2024 core rules", effect: 'Transform into a known beast form or use Wild Shape to assume an appropriate Wild Shape effect.' },
  { id: 'ba-ranger-natures-veil', group: 'Class features', name: "Nature's Veil", requirement: 'Ranger', resource: 'Bonus action; limited uses', source: "2024 core rules", effect: 'Turn Invisible as a bonus action until the end of your next turn.' },
  { id: 'ba-ranger-beast', group: 'Class features', name: 'Command Beast Companion', requirement: 'Beast Master Ranger', resource: 'One bonus action', source: "2024 core rules", effect: 'Order or direct your beast companion to take its action or attack.' },
  { id: 'ba-sorcerer-inate', group: 'Class features', name: 'Innate Sorcery', requirement: 'Sorcerer', resource: 'One bonus action; limited uses', source: "2024 core rules", effect: 'Activate Innate Sorcery for 1 minute, gaining sorcerous potency against creatures and advantage on Sorcery checks.' },
  { id: 'ba-sorcerer-quickened', group: 'Class features', name: 'Quickened Spell', requirement: 'Sorcerer', resource: 'Metamagic; 2 sorcery points', source: "2024 core rules", effect: 'Cast a spell with a casting time of an action as a bonus action; only one leveled spell may be cast on the turn.' },
  { id: 'ba-fighter-second-wind', group: 'Class features', name: 'Second Wind', requirement: 'Fighter', resource: 'One bonus action; limited uses', source: "2024 core rules", effect: 'Regain Hit Points using 1d10 plus your Fighter level, or use a tactical benefit granted by a subclass.' },
  { id: 'ba-paladin-sense', group: 'Class features', name: 'Divine Sense', requirement: 'Paladin', resource: 'Bonus action; limited uses', source: "2024 core rules", effect: 'Sense the location of Celestials, Fiends, and Undead within 60 feet that are not behind total cover.' },
  { id: 'ba-cleric-spiritual', group: 'Bonus action spells', name: 'Spiritual Weapon', requirement: 'Cleric spell known or prepared', resource: 'One bonus action; concentration', source: "2024 / 2014 core rules", effect: 'Create a floating weapon and attack with it using a bonus action on subsequent turns.' },
  { id: 'ba-cleric-healing', group: 'Bonus action spells', name: 'Bonus action healing spell', requirement: 'Cleric or another prepared spellcaster', resource: 'Bonus action; spell slot', source: "2024 / 2014 core rules", effect: 'Cast a spell marked for a bonus action, such as Healing Word, instead of taking another bonus action.' },
  { id: 'ba-druid-spell', group: 'Bonus action spells', name: 'Bonus action spell', requirement: 'Druid', resource: 'Bonus action; spell slot', source: "2024 / 2014 core rules", effect: 'Cast a spell with a bonus action casting time. If you cast a leveled spell, follow the spellcasting action limitations for that turn.' },
  { id: 'ba-ranger-spell', group: 'Bonus action spells', name: 'Bonus action damage or utility spell', requirement: 'Ranger', resource: 'Bonus action; spell slot', source: "2024 / 2014 core rules", effect: 'Cast a bonus action spell for damage, healing, utility, or battlefield control.' },
  { id: 'ba-wizard-spell', group: 'Bonus action spells', name: 'Bonus action spell', requirement: 'Wizard', resource: 'Bonus action; spell slot', source: "2024 / 2014 core rules", effect: 'Cast a Wizard spell with a bonus action casting time and follow the normal limits on leveled spells cast on the turn.' },
  { id: 'ba-warlock-spell', group: 'Bonus action spells', name: 'Bonus action spell', requirement: 'Warlock', resource: 'Bonus action; spell slot or pact magic', source: "2024 / 2014 core rules", effect: 'Cast a Warlock spell with a bonus action casting time.' },
  { id: 'ba-warlock-pact', group: 'Class features', name: 'Pact of the Blade', requirement: 'Pact of the Blade Warlock', resource: 'Bonus action to summon or shift pact weapon', source: "2014 core rules", effect: 'Conjure or dismiss your pact weapon, or summon a magical weapon into it.' },
  { id: 'ba-warlock-chain', group: 'Class features', name: 'Investment of the Chain Master', requirement: 'Investment of the Chain Master invocation', resource: 'Bonus action for the familiar', source: "2014 core rules", effect: 'Command or enhance your familiar, including giving it a bonus action attack in appropriate forms.' },
  { id: 'ba-light-weapon', group: 'Weapons', name: 'Two-Weapon Fighting', requirement: 'Two Light weapons', resource: 'One bonus action', source: "2024 / 2014 core rules", effect: 'Make one extra attack with the other Light weapon after taking the Attack action. The 2014 rules do not add your ability modifier unless a feature grants it.' },
  { id: 'ba-nick', group: 'Weapons', name: 'Nick Weapon Mastery', requirement: 'Nick mastery and Light weapons', resource: 'No bonus action cost', source: "2024 core rules", effect: 'When you make the extra attack from Light property weapons, treat the extra attack as part of the Attack action instead of using a bonus action.' },
  { id: 'ba-polearm', group: 'Weapons', name: 'Polearm Master Bonus Attack', requirement: 'Polearm Master feat', resource: 'One bonus action', source: "2014 / 2024 core rules", effect: 'After taking the Attack action with the haft/hilt of a qualifying glaive, halberd, pike, quarterstaff, or spear, make a bonus action attack for 1d4 damage.' },
  { id: 'ba-chef', group: 'Feats', name: 'Chef', requirement: 'Chef feat', resource: 'Bonus action; Chef cooking times', source: "2014 / 2024 core rules", effect: 'Feed a creature special snacks to grant Temporary Hit Points.' },
  { id: 'ba-durable', group: 'Feats', name: 'Durable', requirement: 'Durable feat', resource: 'One bonus action; Hit Dice', source: "2014 core rules", effect: 'Use Hit Dice to heal yourself as a bonus action.' },
  { id: 'ba-keen-observant', group: 'Feats', name: 'Keen Mind / Observant', requirement: 'Keen Mind or Observant feat', resource: 'One bonus action', source: "2014 core rules", effect: 'Turn the Study or Search action into a bonus action.' },
  { id: 'ba-telekinetic', group: 'Feats', name: 'Telekinetic', requirement: 'Telekinetic feat', resource: 'One bonus action', source: "2014 / 2024 core rules", effect: 'Cast Mage Hand or use the feat to shove a creature away with a bonus action where the rules permit.' }
];

function normalizeReaction(reaction, index = 0) {
  if (!reaction || typeof reaction !== 'object') return null;
  const name = String(reaction.name || '').trim();
  if (!name) return null;
  return {
    id: String(reaction.id || `reaction-normalized-${index}`),
    name,
    trigger: String(reaction.trigger || '').trim(),
    effect: String(reaction.effect || '').trim(),
    resource: String(reaction.resource || '').trim(),
    requirement: String(reaction.requirement || '').trim(),
    source: String(reaction.source || '').trim()
  };
}

function normalizeReactionList(raw) {
  let values = raw;
  if (typeof values === 'string') {
    try { values = JSON.parse(values); } catch { values = []; }
  }
  return (Array.isArray(values) ? values : []).map(normalizeReaction).filter(Boolean);
}

function reactionPresetSearchText() {
  const ids = ['sf-class', 'sf-subclass', 'sf-species', 'sf-subrace', 'sf-features', 'sf-feats', 'sf-racial-traits'];
  const sheetText = ids.map(id => String(getElementByIdAs<HTMLInputElement>(id)?.value || '')).join(' ');
  const spellText = editingSpells.map(spell => spell.name).join(' ');
  return `${sheetText} ${spellText}`.toLowerCase();
}

function appendReactionPresetOption(parent, preset) {
  const option = document.createElement('option');
  option.value = preset.id;
  option.textContent = `${preset.name} — ${preset.requirement}`;
  parent.appendChild(option);
}

function renderReactionPresetOptions() {
  const select = getElementById('reaction-preset-select');
  select.innerHTML = '<option value="">Choose a reaction...</option>';
  const searchText = reactionPresetSearchText();
  const suggested = REACTION_PRESETS.filter(preset => (
    preset.alwaysSuggested || (preset.suggestedTags || []).some(tag => searchText.includes(tag))
  ));
  if (suggested.length) {
    const group = document.createElement('optgroup');
    group.label = 'Suggested for this sheet';
    suggested.forEach(preset => appendReactionPresetOption(group, preset));
    select.appendChild(group);
  }
  REACTION_PRESET_GROUPS.forEach(groupName => {
    const presets = REACTION_PRESETS.filter(preset => preset.group === groupName);
    if (!presets.length) return;
    const group = document.createElement('optgroup');
    group.label = groupName;
    presets.forEach(preset => appendReactionPresetOption(group, preset));
    select.appendChild(group);
  });
  applyPresetSearch('reaction-preset-select', 'reaction-preset-search');
}

function renderBonusActionPresetOptions() {
  const search = getElementById('bonus-action-preset-search') as HTMLInputElement;
  const list = getElementById('bonus-action-preset-list');
  const select = getElementById('bonus-action-preset-select') as HTMLSelectElement;
  const query = search.value.trim().toLowerCase();
  const sheetText = `${String(getElementById('sf-class')?.value || '')} ${String(getElementById('sf-subclass')?.value || '')} ${String(getElementById('sf-feats')?.value || '')}`.toLowerCase();
  list.innerHTML = '';

  const orderedGroups = ['Suggested for this sheet', ...BONUS_ACTION_PRESET_GROUPS];
  let matches = 0;
  orderedGroups.forEach(groupName => {
    const presets = groupName === 'Suggested for this sheet'
      ? BONUS_ACTION_PRESETS.filter(preset => sheetText.includes(preset.requirement.toLowerCase().split(' ')[0]))
      : BONUS_ACTION_PRESETS.filter(preset => preset.group === groupName);
    const filtered = presets.filter(preset => {
      const text = `${preset.name} ${preset.requirement} ${preset.resource} ${preset.effect} ${preset.source} ${preset.group}`.toLowerCase();
      return !query || text.includes(query);
    });
    if (!filtered.length) return;
    matches += filtered.length;
    const heading = document.createElement('div');
    heading.className = 'bonus-action-preset-group';
    heading.textContent = groupName;
    list.appendChild(heading);
    filtered.forEach(preset => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bonus-action-preset-option';
      button.setAttribute('role', 'option');
      button.dataset.presetId = preset.id;
      const detail = [preset.requirement, preset.resource].filter(Boolean).join(' · ');
      button.innerHTML = `<strong>${escapeHtml(preset.name)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}`;
      button.onmousedown = event => event.preventDefault();
      button.onclick = () => {
        select.value = preset.id;
        search.value = preset.name;
        list.classList.add('hidden');
        search.setAttribute('aria-expanded', 'false');
      };
      list.appendChild(button);
    });
  });
  if (!matches) {
    list.innerHTML = '<div class="bonus-action-preset-group">No matching presets</div>';
  }
}

function initializeBonusActionPresetControls() {
  const search = getElementById('bonus-action-preset-search') as HTMLInputElement;
  const combobox = getElementById('bonus-action-combobox');
  const list = getElementById('bonus-action-preset-list');
  renderBonusActionPresetOptions();
  const openList = () => {
    renderBonusActionPresetOptions();
    list.classList.remove('hidden');
    search.setAttribute('aria-expanded', 'true');
  };
  search.onfocus = openList;
  search.onclick = openList;
  search.oninput = openList;
  combobox.onkeydown = event => {
    if (event.key === 'Escape') {
      list.classList.add('hidden');
      search.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('mousedown', event => {
    if (!combobox.contains(event.target as Node)) {
      list.classList.add('hidden');
      search.setAttribute('aria-expanded', 'false');
    }
  });
  getElementById('bonus-action-preset-add').onclick = () => {
    const select = getElementById('bonus-action-preset-select') as HTMLSelectElement;
    const preset = BONUS_ACTION_PRESETS.find(entry => entry.id === select.value);
    if (!preset) return showToast('Choose a bonus action preset first.');
    const textarea = getElementById('sf-bonus-actions') as HTMLTextAreaElement;
    const line = `${preset.name}${preset.resource ? ` — ${preset.resource}` : ''}: ${preset.effect}`;
    const current = textarea.value.trim();
    if (current.split(/\n+/).some(entry => entry.toLowerCase().startsWith(`${preset.name.toLowerCase()} —`))) {
      return showToast(`${preset.name} is already on the sheet.`);
    }
    textarea.value = current ? `${current}\n${line}` : line;
    select.value = '';
    search.value = '';
    renderBonusActionPresetOptions();
    list.classList.add('hidden');
    search.setAttribute('aria-expanded', 'false');
  };
}

function initializeReactionPresetControls() {
  applyPresetSearch('reaction-preset-select', 'reaction-preset-search');
  getElementById('reaction-add-btn').onclick = () => openReactionForm(null);
  getElementById('reaction-form-cancel').onclick = closeReactionForm;
  getElementById('reaction-preset-load').onclick = () => {
    const preset = REACTION_PRESETS.find(entry => entry.id === getElementById('reaction-preset-select').value);
    if (!preset) return showToast('Choose a reaction preset first.');
    populateReactionForm(preset);
  };
  getElementById('reaction-form-save').onclick = () => {
    const name = getElementById('reaction-form-name').value.trim();
    if (!name) return showToast('Give the reaction a name first.');
    const value = normalizeReaction({
      id: editingReactionId || `reaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      trigger: getElementById('reaction-form-trigger').value,
      effect: getElementById('reaction-form-effect').value,
      resource: getElementById('reaction-form-resource').value,
      requirement: getElementById('reaction-form-requirement').value,
      source: getElementById('reaction-form-source').value
    });
    if (editingReactionId) {
      const index = editingReactions.findIndex(entry => entry.id === editingReactionId);
      if (index !== -1) editingReactions[index] = value;
    } else {
      editingReactions.push(value);
    }
    closeReactionForm();
    renderReactionEditor();
  };
}

function populateReactionForm(value: any = {}) {
  getElementById('reaction-form-name').value = value.name || '';
  getElementById('reaction-form-trigger').value = value.trigger || '';
  getElementById('reaction-form-effect').value = value.effect || '';
  getElementById('reaction-form-resource').value = value.resource || '';
  getElementById('reaction-form-requirement').value = value.requirement || '';
  getElementById('reaction-form-source').value = value.source || '';
}

function openReactionForm(value) {
  editingReactionId = value?.id || null;
  renderReactionPresetOptions();
  getElementById('reaction-preset-select').value = '';
  getElementById('reaction-add-form').classList.remove('hidden');
  populateReactionForm(value || {});
  getElementById('reaction-form-name').focus();
}

function closeReactionForm() {
  editingReactionId = null;
  getElementById('reaction-add-form').classList.add('hidden');
}

function renderReactionEditor() {
  const list = getElementById('reaction-list');
  list.innerHTML = '';
  if (!editingReactions.length) {
    list.innerHTML = '<p class="sidebar-help">No reactions configured yet. Add one or start from a preset.</p>';
    return;
  }
  editingReactions.forEach(value => {
    const card = document.createElement('article');
    card.className = 'reaction-list-item';
    const metadata = [value.requirement, value.resource, value.source].filter(Boolean);
    card.innerHTML = `
      <div class="reaction-list-title">
        <strong>${escapeHtml(value.name)}</strong>
        <span class="reaction-list-actions">
          <button type="button" class="edit" title="Edit reaction" aria-label="Edit ${escapeHtml(value.name)}">✎</button>
          <button type="button" class="del" title="Remove reaction" aria-label="Remove ${escapeHtml(value.name)}">×</button>
        </span>
      </div>
      ${metadata.length ? `<div class="reaction-list-meta">${metadata.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>` : ''}
      ${value.trigger ? `<p><b>Trigger</b>${escapeHtml(value.trigger)}</p>` : ''}
      ${value.effect ? `<p><b>Response</b>${escapeHtml(value.effect)}</p>` : ''}
    `;
    const edit = card.querySelector<HTMLButtonElement>('.edit');
    const remove = card.querySelector<HTMLButtonElement>('.del');
    edit.disabled = !editingCanEdit;
    remove.disabled = !editingCanEdit;
    edit.onclick = () => openReactionForm(value);
    remove.onclick = () => {
      editingReactions = editingReactions.filter(entry => entry.id !== value.id);
      renderReactionEditor();
    };
    list.appendChild(card);
  });
}
