(function attachCharacterRules(root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  if (root) root.HumblewoodCharacterRules = rules;
})(typeof window !== 'undefined' ? window : null, function createCharacterRules() {
  const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

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

  const CLASS_SUBCLASSES = {
    Artificer: ['Alchemist', 'Armorer', 'Artillerist', 'Battle Smith'],
    Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior'],
    Bard: ['College of Lore', 'College of Valor', 'College of the Road (Bard)'],
    Cleric: [
      'Knowledge Domain', 'Life Domain', 'Light Domain', 'Nature Domain', 'Tempest Domain',
      'Trickery Domain', 'War Domain', 'Community Domain (Cleric)', 'Night Domain (Cleric)'
    ],
    Druid: ['Circle of the Land', 'Circle of the Moon'],
    Fighter: ['Battle Master', 'Champion', 'Eldritch Knight', 'Scofflaw (Fighter)'],
    Monk: ['Way of the Four Elements', 'Way of the Open Hand', 'Way of Shadow'],
    Paladin: ['Oath of the Ancients', 'Oath of Devotion', 'Oath of Vengeance'],
    Ranger: ['Beast Master', 'Hunter'],
    Rogue: ['Arcane Trickster', 'Assassin', 'Thief'],
    Sorcerer: ['Draconic Bloodline', 'Wild Magic'],
    Warlock: ['The Archfey', 'The Fiend', 'The Great Old One'],
    Wizard: [
      'School of Abjuration', 'School of Conjuration', 'School of Divination', 'School of Enchantment',
      'School of Evocation', 'School of Illusion', 'School of Necromancy', 'School of Transmutation'
    ]
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
    SPECIES_SUBRACES,
    applyPlayerCharacterConstraints,
    canonicalClass,
    canonicalSpecies,
    subclassesFor,
    subracesFor,
    validatePlayerCharacter
  };
});
