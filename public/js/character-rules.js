(function attachCharacterRules(root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.HumblewoodCharacterRules = rules;
})(typeof window !== 'undefined' ? window : null, function createCharacterRules() {
  const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const GLIDE_FEATS = ['Aerial Expert', 'Heavy Glider'];

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

  function spellcastingValues(abilityScore, level) {
    const score = Number(abilityScore) || 10;
    const modifier = Math.floor((score - 10) / 2);
    const boundedLevel = Math.max(1, Math.min(20, Number(level) || 1));
    const proficiency = 2 + Math.floor((boundedLevel - 1) / 4);
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
    CLASS_SUBCLASSES,
    GLIDE_FEATS,
    SPECIES_SUBRACES,
    applyPlayerCharacterConstraints,
    canonicalClass,
    canonicalSpecies,
    spellcastingValues,
    subclassesFor,
    subracesFor,
    validatePlayerCharacter
  };
});
