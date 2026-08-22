(function attachCharacterRules(root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.HumblewoodCharacterRules = rules;
})(typeof window !== 'undefined' ? window : null, function createCharacterRules() {
  const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const GLIDE_FEATS = ['Aerial Expert', 'Heavy Glider'];
  const STANDARD_ASI_LEVELS = [4, 8, 12, 16, 19];

  const CLASS_PROGRESSIONS = {
    Artificer: {
      hitDie: 8, saves: ['con', 'int'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 5, 9, 15], spellcasting: 'artificer', spellAbility: 'int',
      features: {
        1: ['Magical Tinkering', 'Spellcasting'], 2: ['Infuse Item'], 3: ['Artificer Specialist', 'The Right Tool for the Job'],
        5: ['Artificer Specialist feature'], 6: ['Tool Expertise'], 7: ['Flash of Genius'], 9: ['Artificer Specialist feature'],
        10: ['Magic Item Adept'], 11: ['Spell-Storing Item'], 14: ['Magic Item Savant'], 15: ['Artificer Specialist feature'],
        18: ['Magic Item Master'], 20: ['Soul of Artifice']
      }
    },
    Barbarian: {
      hitDie: 12, saves: ['str', 'con'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 6, 10, 14],
      features: {
        1: ['Rage', 'Unarmored Defense'], 2: ['Reckless Attack', 'Danger Sense'], 3: ['Primal Path'],
        5: ['Extra Attack', 'Fast Movement'], 7: ['Feral Instinct'], 9: ['Brutal Critical (1 die)'],
        11: ['Relentless Rage'], 13: ['Brutal Critical (2 dice)'], 15: ['Persistent Rage'],
        17: ['Brutal Critical (3 dice)'], 18: ['Indomitable Might'], 20: ['Primal Champion']
      }
    },
    Bard: {
      hitDie: 8, saves: ['dex', 'cha'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 6, 14], spellcasting: 'full', spellAbility: 'cha',
      features: {
        1: ['Spellcasting', 'Bardic Inspiration (d6)'], 2: ['Jack of All Trades', 'Song of Rest (d6)'],
        3: ['Bard College', 'Expertise'], 5: ['Bardic Inspiration (d8)', 'Font of Inspiration'],
        6: ['Countercharm'], 9: ['Song of Rest (d8)'], 10: ['Bardic Inspiration (d10)', 'Expertise', 'Magical Secrets'],
        13: ['Song of Rest (d10)'], 14: ['Magical Secrets'], 15: ['Bardic Inspiration (d12)'],
        17: ['Song of Rest (d12)'], 18: ['Magical Secrets'], 20: ['Superior Inspiration']
      }
    },
    Cleric: {
      hitDie: 8, saves: ['wis', 'cha'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [1, 2, 6, 8, 17], spellcasting: 'full', spellAbility: 'wis',
      features: {
        1: ['Spellcasting', 'Divine Domain'], 2: ['Channel Divinity', 'Divine Domain feature'],
        5: ['Destroy Undead (CR 1/2)'], 8: ['Destroy Undead (CR 1)'], 10: ['Divine Intervention'],
        11: ['Destroy Undead (CR 2)'], 14: ['Destroy Undead (CR 3)'], 17: ['Destroy Undead (CR 4)'],
        18: ['Channel Divinity (3/rest)'], 20: ['Divine Intervention improvement']
      }
    },
    Druid: {
      hitDie: 8, saves: ['int', 'wis'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [2, 6, 10, 14], spellcasting: 'full', spellAbility: 'wis',
      features: {
        1: ['Druidic', 'Spellcasting'], 2: ['Wild Shape', 'Druid Circle'], 4: ['Wild Shape improvement'],
        8: ['Wild Shape improvement'], 18: ['Timeless Body', 'Beast Spells'], 20: ['Archdruid']
      }
    },
    Fighter: {
      hitDie: 10, saves: ['str', 'con'], asiLevels: [4, 6, 8, 12, 14, 16, 19], subclassLevels: [3, 7, 10, 15, 18],
      features: {
        1: ['Fighting Style', 'Second Wind'], 2: ['Action Surge (one use)'], 3: ['Martial Archetype'],
        5: ['Extra Attack (two attacks)'], 9: ['Indomitable (one use)'], 11: ['Extra Attack (three attacks)'],
        13: ['Indomitable (two uses)'], 17: ['Action Surge (two uses)', 'Indomitable (three uses)'],
        20: ['Extra Attack (four attacks)']
      }
    },
    Monk: {
      hitDie: 8, saves: ['str', 'dex'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 6, 11, 17],
      features: {
        1: ['Unarmored Defense', 'Martial Arts (d4)'], 2: ['Ki', 'Unarmored Movement (+10 ft)'],
        3: ['Monastic Tradition', 'Deflect Missiles'], 4: ['Slow Fall'],
        5: ['Extra Attack', 'Stunning Strike', 'Martial Arts (d6)'], 6: ['Ki-Empowered Strikes', 'Unarmored Movement (+15 ft)'],
        7: ['Evasion', 'Stillness of Mind'], 9: ['Unarmored Movement improvement'], 10: ['Purity of Body', 'Unarmored Movement (+20 ft)'],
        11: ['Martial Arts (d8)'], 13: ['Tongue of the Sun and Moon'], 14: ['Diamond Soul', 'Unarmored Movement (+25 ft)'],
        15: ['Timeless Body'], 17: ['Martial Arts (d10)'], 18: ['Empty Body', 'Unarmored Movement (+30 ft)'], 20: ['Perfect Self']
      }
    },
    Paladin: {
      hitDie: 10, saves: ['wis', 'cha'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 7, 15, 20], spellcasting: 'half', spellAbility: 'cha',
      features: {
        1: ['Divine Sense', 'Lay on Hands'], 2: ['Fighting Style', 'Spellcasting', 'Divine Smite'],
        3: ['Divine Health', 'Sacred Oath'], 5: ['Extra Attack'], 6: ['Aura of Protection'],
        10: ['Aura of Courage'], 11: ['Improved Divine Smite'], 14: ['Cleansing Touch'], 18: ['Aura improvements']
      }
    },
    Ranger: {
      hitDie: 10, saves: ['str', 'dex'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [3, 7, 11, 15], spellcasting: 'half', spellAbility: 'wis',
      features: {
        1: ['Favored Enemy', 'Natural Explorer'], 2: ['Fighting Style', 'Spellcasting'],
        3: ['Ranger Archetype', 'Primeval Awareness'], 5: ['Extra Attack'],
        6: ['Favored Enemy improvement', 'Natural Explorer improvement'], 8: ['Land\'s Stride'],
        10: ['Natural Explorer improvement', 'Hide in Plain Sight'], 14: ['Favored Enemy improvement', 'Vanish'],
        18: ['Feral Senses'], 20: ['Foe Slayer']
      }
    },
    Rogue: {
      hitDie: 8, saves: ['dex', 'int'], asiLevels: [4, 8, 10, 12, 16, 19], subclassLevels: [3, 9, 13, 17],
      features: {
        1: ['Expertise', 'Sneak Attack (1d6)', 'Thieves\' Cant'], 2: ['Cunning Action'], 3: ['Roguish Archetype', 'Sneak Attack (2d6)'],
        5: ['Uncanny Dodge', 'Sneak Attack (3d6)'], 6: ['Expertise'], 7: ['Evasion', 'Sneak Attack (4d6)'],
        9: ['Sneak Attack (5d6)'], 11: ['Reliable Talent', 'Sneak Attack (6d6)'], 13: ['Sneak Attack (7d6)'],
        14: ['Blindsense'], 15: ['Slippery Mind', 'Sneak Attack (8d6)'], 17: ['Sneak Attack (9d6)'],
        18: ['Elusive'], 19: ['Sneak Attack (10d6)'], 20: ['Stroke of Luck']
      }
    },
    Sorcerer: {
      hitDie: 6, saves: ['con', 'cha'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [1, 6, 14, 18], spellcasting: 'full', spellAbility: 'cha',
      features: {
        1: ['Spellcasting', 'Sorcerous Origin'], 2: ['Font of Magic'], 3: ['Metamagic'],
        10: ['Metamagic option'], 17: ['Metamagic option'], 20: ['Sorcerous Restoration']
      }
    },
    Warlock: {
      hitDie: 8, saves: ['wis', 'cha'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [1, 6, 10, 14], spellcasting: 'pact', spellAbility: 'cha',
      features: {
        1: ['Otherworldly Patron', 'Pact Magic'], 2: ['Eldritch Invocations'], 3: ['Pact Boon'],
        11: ['Mystic Arcanum (6th level)'], 13: ['Mystic Arcanum (7th level)'],
        15: ['Mystic Arcanum (8th level)'], 17: ['Mystic Arcanum (9th level)'], 20: ['Eldritch Master']
      }
    },
    Wizard: {
      hitDie: 6, saves: ['int', 'wis'], asiLevels: STANDARD_ASI_LEVELS, subclassLevels: [2, 6, 10, 14], spellcasting: 'full', spellAbility: 'int',
      features: {
        1: ['Spellcasting', 'Arcane Recovery'], 2: ['Arcane Tradition'],
        18: ['Spell Mastery'], 20: ['Signature Spells']
      }
    }
  };

  const HUMBLEWOOD_SUBCLASS_FEATURES = {
    'College of the Road (Bard)': {
      3: ['Bonus Proficiencies', 'Wanderer\'s Lore', 'Traveler\'s Tricks (2 options)'],
      6: ['Favorite Trick (1st)', 'Improved Tricks', 'Traveler\'s Tricks (3 options)'],
      14: ['Favorite Trick (2nd)', 'Improved Tricks', 'Traveler\'s Tricks (4 options)']
    },
    'Community Domain (Cleric)': {
      1: ['Domain Spells: Bless, Goodberry', 'Blessing of the Hearth'], 2: ['Channel Divinity: Magnificent Feast'],
      3: ['Domain Spells: Aid, Heroism'], 5: ['Domain Spells: Beacon of Hope, Spirit Guardians'],
      6: ['Channel Divinity: Community Watch'], 7: ['Domain Spells: Banishment, Faithful Hound'],
      8: ['Divine Strike (1d8)'], 9: ['Domain Spells: Mass Cure Wounds, Telepathic Bond'],
      14: ['Divine Strike (2d8)'], 17: ['Paragon of the People']
    },
    'Night Domain (Cleric)': {
      1: ['Domain Spells: Sleep, Veil of Dusk', 'Eye of Twilight', 'Ward of Shadows'], 2: ['Channel Divinity: Invocation of Night'],
      3: ['Domain Spells: Darkness, Moonbeam'], 5: ['Domain Spells: Nondetection, Globe of Twilight'],
      6: ['Improved Ward', 'Eye of Twilight improvement'], 7: ['Domain Spells: Divination, Stellar Bodies'],
      8: ['Veil of Dreams', 'Eye of Twilight improvement'], 9: ['Domain Spells: Dream, Seeming'],
      17: ['Creature of the Night', 'Eye of Twilight improvement']
    },
    'Scofflaw (Fighter)': {
      3: ['Bonus Proficiency', 'Intimidating Banter', 'Brutal Brawler'], 7: ['Misdirection'],
      10: ['Blindside', 'Brutal Brawler improvement'], 15: ['Infamy', 'Blindside improvement'],
      18: ['Two For Flinching', 'Brutal Brawler improvement', 'Blindside improvement']
    }
  };

  const HUMBLEWOOD_SPECIES_FEATURES = {
    'Vulpin (humblefolk)': {
      3: ['Bewitching Guile: cast Ambush Prey once per long rest'],
      5: ['Bewitching Guile: cast Fear once per long rest']
    }
  };

  const FULL_CASTER_SLOTS = [
    [], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1],
    [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1],
    [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1]
  ];
  const HALF_CASTER_SLOTS = [
    [], [], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
    [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2],
    [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2]
  ];
  const ARTIFICER_SLOTS = HALF_CASTER_SLOTS.map((slots, level) => level === 1 ? [2] : slots);
  const THIRD_CASTER_SLOTS = [
    [], [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3],
    [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1]
  ];

  const SPECIES_SUBRACES = {
    'Luma (birdfolk)': ['Sable Luma', 'Sera Luma'],
    'Corvum (birdfolk)': ['Dusk Corvum', 'Kindled Corvum'],
    'Raptor (birdfolk)': ['Maran Raptor', 'Mistral Raptor'],
    'Gallus (birdfolk)': ['Bright Gallus', 'Huden Gallus'],
    'Strig (birdfolk)': ['Stout Strig', 'Swift Strig'],
    'Vulpin (humblefolk)': [],
    'Mapach (humblefolk)': [],
    'Jerbeen (humblefolk)': [],
    'Hedge (humblefolk)': [],
    'Cervan (humblefolk)': ['Grove Cervan', 'Pronghorn Cervan']
  };

  // Official D&D 5e (2014/legacy) subclasses, including setting-book and DMG
  // options, plus the Humblewood subclasses used by this campaign. Revised
  // 2024/5.5e subclasses are a separate ruleset and are intentionally excluded.
  const CLASS_SUBCLASSES = {
    Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
    Barbarian: [
      'Path of the Ancestral Guardian', 'Path of the Battlerager', 'Path of the Beast',
      'Path of the Berserker', 'Path of the Giant', 'Path of the Storm Herald',
      'Path of the Totem Warrior', 'Path of Wild Magic', 'Path of the Zealot'
    ],
    Bard: [
      'College of Creation', 'College of Eloquence', 'College of Glamour', 'College of Lore',
      'College of Spirits', 'College of Swords', 'College of Valor', 'College of Whispers',
      'College of the Road (Bard)'
    ],
    Cleric: [
      'Arcana Domain', 'Death Domain', 'Forge Domain', 'Grave Domain', 'Knowledge Domain',
      'Life Domain', 'Light Domain', 'Nature Domain', 'Order Domain', 'Peace Domain',
      'Tempest Domain', 'Trickery Domain', 'Twilight Domain', 'War Domain',
      'Community Domain (Cleric)', 'Night Domain (Cleric)'
    ],
    Druid: [
      'Circle of Dreams', 'Circle of the Land', 'Circle of the Moon', 'Circle of the Shepherd',
      'Circle of Spores', 'Circle of Stars', 'Circle of Wildfire'
    ],
    Fighter: [
      'Arcane Archer', 'Banneret (Purple Dragon Knight)', 'Battle Master', 'Cavalier', 'Champion',
      'Echo Knight', 'Eldritch Knight', 'Psi Warrior', 'Rune Knight', 'Samurai',
      'Scofflaw (Fighter)'
    ],
    Monk: [
      'Way of the Ascendant Dragon', 'Way of the Astral Self', 'Way of the Drunken Master',
      'Way of the Four Elements', 'Way of the Kensei', 'Way of the Long Death',
      'Way of Mercy', 'Way of the Open Hand', 'Way of Shadow', 'Way of the Sun Soul'
    ],
    Paladin: [
      'Oath of the Ancients', 'Oath of Conquest', 'Oath of the Crown', 'Oath of Devotion',
      'Oath of Glory', 'Oath of Redemption', 'Oath of the Watchers', 'Oath of Vengeance',
      'Oathbreaker'
    ],
    Ranger: [
      'Beast Master', 'Drakewarden', 'Fey Wanderer', 'Gloom Stalker', 'Horizon Walker',
      'Hunter', 'Monster Slayer', 'Swarmkeeper'
    ],
    Rogue: [
      'Arcane Trickster', 'Assassin', 'Inquisitive', 'Mastermind', 'Phantom', 'Scout',
      'Soulknife', 'Swashbuckler', 'Thief'
    ],
    Sorcerer: [
      'Aberrant Mind', 'Clockwork Soul', 'Divine Soul', 'Draconic Bloodline',
      'Lunar Sorcery', 'Shadow Magic', 'Storm Sorcery', 'Wild Magic'
    ],
    Warlock: [
      'The Archfey', 'The Celestial', 'The Fathomless', 'The Fiend', 'The Genie',
      'The Great Old One', 'The Hexblade', 'The Undead', 'The Undying'
    ],
    Wizard: [
      'Bladesinging', 'Chronurgy Magic', 'Graviturgy Magic', 'Order of Scribes',
      'School of Abjuration', 'School of Conjuration', 'School of Divination',
      'School of Enchantment', 'School of Evocation', 'School of Illusion',
      'School of Necromancy', 'School of Transmutation', 'War Magic'
    ],
  };

  function normalized(value) {
    return String(value || '').trim().toLowerCase();
  }

  function canonicalFromList(value, options) {
    const needle = normalized(value);
    if (!needle) return '';
    return options.find(option => normalized(option) === needle) || '';
  }

  function canonicalSpecies(value) {
    const exact = canonicalFromList(value, Object.keys(SPECIES_SUBRACES));
    if (exact) return exact;
    const base = normalized(value).replace(/\s*\((?:birdfolk|humblefolk)\)$/, '');
    return Object.keys(SPECIES_SUBRACES).find(option => normalized(option).replace(/\s*\((?:birdfolk|humblefolk)\)$/, '') === base) || '';
  }

  function canonicalClass(value) {
    return canonicalFromList(value, Object.keys(CLASS_SUBCLASSES));
  }

  function subracesFor(species) {
    return [...(SPECIES_SUBRACES[canonicalSpecies(species)] || [])];
  }

  function subclassesFor(className) {
    return [...(CLASS_SUBCLASSES[canonicalClass(className)] || [])];
  }

  function boundedLevel(level) {
    return Math.max(1, Math.min(20, Number(level) || 1));
  }

  function abilityModifier(score) {
    return Math.floor(((Number(score) || 10) - 10) / 2);
  }

  function proficiencyBonus(level) {
    return 2 + Math.floor((boundedLevel(level) - 1) / 4);
  }

  function classProgressionFor(className) {
    return CLASS_PROGRESSIONS[canonicalClass(className)] || null;
  }

  function classSavingThrows(className) {
    return [...(classProgressionFor(className)?.saves || [])];
  }

  function hitDieFor(className) {
    return classProgressionFor(className)?.hitDie || 8;
  }

  function averageHitDieRoll(className) {
    return Math.floor(hitDieFor(className) / 2) + 1;
  }

  function hitPointGain(className, constitutionScore, dieResult) {
    const hitDie = hitDieFor(className);
    const rolled = Math.max(1, Math.min(hitDie, Number(dieResult) || 1));
    return Math.max(1, rolled + abilityModifier(constitutionScore));
  }

  function levelUpHitPointIncrease(className, oldConstitution, newConstitution, targetLevel, dieResults = []) {
    const gainedLevels = dieResults.reduce(
      (total, dieResult) => total + hitPointGain(className, oldConstitution, dieResult),
      0
    );
    const retroactiveConstitution = (
      abilityModifier(newConstitution) - abilityModifier(oldConstitution)
    ) * boundedLevel(targetLevel);
    return gainedLevels + retroactiveConstitution;
  }

  function asiLevelsBetween(className, fromLevel, toLevel) {
    const start = boundedLevel(fromLevel);
    const end = boundedLevel(toLevel);
    return [...(classProgressionFor(className)?.asiLevels || STANDARD_ASI_LEVELS)]
      .filter(level => level > start && level <= end);
  }

  function levelUpGains({ className, subclass, species, fromLevel, toLevel } = {}) {
    const canonicalClassName = canonicalClass(className);
    const canonicalSpeciesName = canonicalSpecies(species);
    const progression = classProgressionFor(canonicalClassName);
    const canonicalSubclass = canonicalFromList(subclass, subclassesFor(canonicalClassName));
    const humblewoodSubclass = HUMBLEWOOD_SUBCLASS_FEATURES[canonicalSubclass];
    const speciesProgression = HUMBLEWOOD_SPECIES_FEATURES[canonicalSpeciesName] || {};
    const start = boundedLevel(fromLevel);
    const end = boundedLevel(toLevel);
    const asiLevels = new Set(asiLevelsBetween(canonicalClassName, start, end));
    const gains = [];
    for (let level = start + 1; level <= end; level += 1) {
      const subclassLevel = progression?.subclassLevels?.includes(level);
      gains.push({
        level,
        asi: asiLevels.has(level),
        proficiencyIncrease: [5, 9, 13, 17].includes(level),
        cantripIncrease: [5, 11, 17].includes(level),
        classFeatures: [...(progression?.features?.[level] || [])],
        subclassFeatures: humblewoodSubclass?.[level]
          ? [...humblewoodSubclass[level]]
          : (subclassLevel && canonicalSubclass ? [`${canonicalSubclass} feature - check its source`] : []),
        speciesFeatures: [...(speciesProgression[level] || [])]
      });
    }
    return gains;
  }

  function spellcastingAbilityFor(className, subclass = '') {
    const canonicalClassName = canonicalClass(className);
    if (canonicalClassName === 'Fighter' && canonicalFromList(subclass, subclassesFor(canonicalClassName)) === 'Eldritch Knight') return 'int';
    if (canonicalClassName === 'Rogue' && canonicalFromList(subclass, subclassesFor(canonicalClassName)) === 'Arcane Trickster') return 'int';
    return classProgressionFor(canonicalClassName)?.spellAbility || '';
  }

  function warlockSlots(level) {
    const bounded = boundedLevel(level);
    const slotCount = bounded === 1 ? 1 : bounded < 11 ? 2 : bounded < 17 ? 3 : 4;
    const slotLevel = bounded < 3 ? 1 : bounded < 5 ? 2 : bounded < 7 ? 3 : bounded < 9 ? 4 : 5;
    const slots = Array(9).fill(0);
    slots[slotLevel - 1] = slotCount;
    return slots;
  }

  function spellSlotsFor(className, subclass, level) {
    const canonicalClassName = canonicalClass(className);
    const progression = classProgressionFor(canonicalClassName);
    const bounded = boundedLevel(level);
    let slots = [];
    if (progression?.spellcasting === 'full') slots = FULL_CASTER_SLOTS[bounded] || [];
    else if (progression?.spellcasting === 'half') slots = HALF_CASTER_SLOTS[bounded] || [];
    else if (progression?.spellcasting === 'artificer') slots = ARTIFICER_SLOTS[bounded] || [];
    else if (progression?.spellcasting === 'pact') return warlockSlots(bounded);
    else if (
      (canonicalClassName === 'Fighter' && canonicalFromList(subclass, subclassesFor(canonicalClassName)) === 'Eldritch Knight') ||
      (canonicalClassName === 'Rogue' && canonicalFromList(subclass, subclassesFor(canonicalClassName)) === 'Arcane Trickster')
    ) slots = THIRD_CASTER_SLOTS[bounded] || [];
    return Array.from({ length: 9 }, (_, index) => Number(slots[index]) || 0);
  }

  function preparedSpellCount(className, level, abilityScore) {
    const canonicalClassName = canonicalClass(className);
    const modifier = abilityModifier(abilityScore);
    const bounded = boundedLevel(level);
    if (['Cleric', 'Druid', 'Wizard'].includes(canonicalClassName)) return Math.max(1, bounded + modifier);
    if (['Artificer', 'Paladin'].includes(canonicalClassName)) return Math.max(1, Math.floor(bounded / 2) + modifier);
    return null;
  }

  function defaultArmorMethod(species, className) {
    if (canonicalSpecies(species) === 'Hedge (humblefolk)') return 'hedge';
    const canonicalClassName = canonicalClass(className);
    if (canonicalClassName === 'Barbarian') return 'barbarian';
    if (canonicalClassName === 'Monk') return 'monk';
    return 'unarmored';
  }

  function armorClass({ method, base = 10, bonus = 0, dex = 10, con = 10, wis = 10 } = {}) {
    const extra = Number(bonus) || 0;
    const armorBase = Number(base) || 10;
    const dexterity = abilityModifier(dex);
    let calculated;
    if (method === 'unarmored') calculated = 10 + dexterity;
    else if (method === 'light') calculated = armorBase + dexterity;
    else if (method === 'medium') calculated = armorBase + Math.min(2, dexterity);
    else if (method === 'heavy') calculated = armorBase;
    else if (method === 'barbarian') calculated = 10 + dexterity + abilityModifier(con);
    else if (method === 'monk') calculated = 10 + dexterity + abilityModifier(wis);
    else if (method === 'hedge') calculated = 14 + dexterity;
    else if (method === 'hedge-curled') calculated = 19;
    else return null;
    return calculated + extra;
  }

  function spellcastingValues(abilityScore, level) {
    const modifier = abilityModifier(abilityScore);
    const proficiency = proficiencyBonus(level);
    return {
      attackBonus: proficiency + modifier,
      saveDc: 8 + proficiency + modifier
    };
  }

  function fieldsFromCharacter(character = {}) {
    const fields = { ...(character.fields && typeof character.fields === 'object' ? character.fields : {}) };
    if (!Object.prototype.hasOwnProperty.call(fields, 'species')) fields.species = character.species ?? character.race ?? '';
    if (!Object.prototype.hasOwnProperty.call(fields, 'subrace')) fields.subrace = character.subrace ?? '';
    if (!Object.prototype.hasOwnProperty.call(fields, 'class')) fields.class = character.charClass ?? character.className ?? '';
    if (!Object.prototype.hasOwnProperty.call(fields, 'subclass')) fields.subclass = character.subclass ?? '';
    if (!Object.prototype.hasOwnProperty.call(fields, 'level')) fields.level = character.level ?? 1;
    ABILITY_KEYS.forEach(ability => {
      if (!Object.prototype.hasOwnProperty.call(fields, ability)) fields[ability] = character.abilities?.[ability] ?? 10;
    });
    return fields;
  }

  function validatePlayerCharacter(character = {}) {
    const fields = fieldsFromCharacter(character);
    const species = canonicalSpecies(fields.species);
    if (String(fields.species || '').trim() && !species) return 'Choose a supported Humblewood species.';

    const requestedSubrace = String(fields.subrace || '').trim();
    const allowedSubraces = subracesFor(species);
    if (species && allowedSubraces.length && !requestedSubrace) return `Choose a subrace for ${species}.`;
    if (requestedSubrace && !canonicalFromList(requestedSubrace, allowedSubraces)) return `${requestedSubrace} is not a subrace of ${species || 'the selected species'}.`;

    const className = canonicalClass(fields.class);
    if (String(fields.class || '').trim() && !className) return 'Choose a supported D&D class.';
    const requestedSubclass = String(fields.subclass || '').trim();
    if (requestedSubclass && !canonicalFromList(requestedSubclass, subclassesFor(className))) {
      return `${requestedSubclass} is not a subclass of ${className || 'the selected class'}.`;
    }

    const level = Number(fields.level);
    if (!Number.isInteger(level) || level < 1 || level > 20) return 'Player-character level must be a whole number from 1 to 20.';
    for (const ability of ABILITY_KEYS) {
      const score = Number(fields[ability]);
      if (!Number.isInteger(score) || score < 1 || score > 20) return `${ability.toUpperCase()} must be a whole number from 1 to 20.`;
    }
    const featText = String(fields.feats || '');
    const invalidGlideFeat = GLIDE_FEATS.find(feat => new RegExp(`(^|\\n)${feat}(\\n|$)`, 'i').test(featText));
    if (invalidGlideFeat && !/\(birdfolk\)$/i.test(species)) return `${invalidGlideFeat} requires a species with the Glide trait.`;
    return '';
  }

  function applyPlayerCharacterConstraints(character = {}) {
    const fields = fieldsFromCharacter(character);
    const species = canonicalSpecies(fields.species);
    const className = canonicalClass(fields.class);
    const subrace = canonicalFromList(fields.subrace, subracesFor(species));
    const subclass = canonicalFromList(fields.subclass, subclassesFor(className));
    const level = Math.max(1, Math.min(20, Number(fields.level) || 1));

    fields.species = species;
    fields.subrace = subrace;
    fields.class = className;
    fields.subclass = subclass;
    fields.level = String(level);
    ABILITY_KEYS.forEach(ability => {
      fields[ability] = String(Math.max(1, Math.min(20, Number(fields[ability]) || 10)));
    });

    character.fields = fields;
    character.species = species;
    character.race = species;
    character.subrace = subrace;
    character.charClass = className;
    character.subclass = subclass;
    character.level = level;
    character.abilities = {
      ...(character.abilities && typeof character.abilities === 'object' ? character.abilities : {}),
      ...Object.fromEntries(ABILITY_KEYS.map(ability => [ability, Number(fields[ability])]))
    };
    return character;
  }

  return {
    ABILITY_KEYS,
    CLASS_PROGRESSIONS,
    CLASS_SUBCLASSES,
    GLIDE_FEATS,
    HUMBLEWOOD_SPECIES_FEATURES,
    HUMBLEWOOD_SUBCLASS_FEATURES,
    SPECIES_SUBRACES,
    abilityModifier,
    armorClass,
    asiLevelsBetween,
    applyPlayerCharacterConstraints,
    averageHitDieRoll,
    canonicalClass,
    canonicalSpecies,
    classProgressionFor,
    classSavingThrows,
    defaultArmorMethod,
    hitDieFor,
    hitPointGain,
    levelUpHitPointIncrease,
    levelUpGains,
    preparedSpellCount,
    proficiencyBonus,
    spellSlotsFor,
    spellcastingAbilityFor,
    spellcastingValues,
    subclassesFor,
    subracesFor,
    validatePlayerCharacter
  };
});
