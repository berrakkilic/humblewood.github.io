(function attachPhbSpellPresets(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HumblewoodPhbSpellPresets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createPhbSpellPresets() {
  const spell = (name, level, school, range, castingTime, duration, components, attack, damage, effect) => ({
    name, level, school, range, castingTime, duration, components, attack, damage, effect,
    source: "Player's Handbook (2014)"
  });

  // Additional PHB spells not already covered by the compact core list in
  // creation-presets.js. These concise entries keep the preset chooser useful
  // without turning the character sheet into a rules reference.
  const PHB_SPELL_PRESETS = [
    spell('Booming Blade', 0, 'Evocation', 'Self (5-foot reach)', '1 action', '1 round', 'S, M', 'Melee weapon attack', 'Weapon damage + thunder', 'Make a melee weapon attack; if the target willingly moves before your next turn, it takes extra thunder damage.'),
    spell('Dancing Lights', 0, 'Evocation', '120 feet', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'None', '', 'Create up to four small lights that can move within range.'),
    spell('Friends', 0, 'Enchantment', 'Self', '1 action', 'Concentration, up to 1 minute', 'S, M', 'None', '', 'Gain advantage on Charisma checks directed at one creature that is not hostile to you; it knows afterward.'),
    spell('Message', 0, 'Transmutation', '120 feet', '1 action', '1 round', 'V, S, M', 'None', '', 'Whisper a short message to a creature and receive a reply.'),
    spell('Ray of Sickness', 1, 'Necromancy', '60 feet', '1 action', 'Instantaneous', 'V, S', 'Ranged spell attack; CON save', '2d8 poison', 'On a hit, deal poison damage and poison the target on a failed Constitution save.'),
    spell('Sanctuary', 1, 'Abjuration', '30 feet', '1 bonus action', '1 minute', 'V, S, M', 'WIS save', '', 'Ward one creature; an attacker must switch targets or succeed on a Wisdom save.'),
    spell('Goodberry', 1, 'Transmutation', 'Touch', '1 action', 'Instantaneous', 'V, S, M (a sprig of mistletoe)', 'None', '1 hit point per berry', 'Create ten berries. A creature can use an action to eat one and regain 1 hit point; berries provide enough nourishment for a day.'),
    spell('Heroism', 1, 'Enchantment', 'Touch', '1 action', 'Concentration, up to 1 minute', 'V, S', 'None', 'Temporary hit points', 'A willing creature becomes immune to fear and gains temporary hit points each turn.'),
    spell('Jump', 1, 'Transmutation', 'Touch', '1 action', '1 minute', 'V, S, M', 'None', '', 'Triple the target’s jump distance.'),
    spell('Longstrider', 1, 'Transmutation', 'Touch', '1 action', '1 hour', 'V, S, M', 'None', '', 'Increase one creature’s speed by 10 feet.'),
    spell('Protection from Evil and Good', 1, 'Abjuration', 'Touch', '1 action', 'Concentration, up to 10 minutes', 'V, S, M', 'None', '', 'Protect a creature from aberrations, celestials, elementals, fey, fiends, and undead.'),
    spell('Purify Food and Drink', 1, 'Transmutation', '10 feet', '1 action', 'Instantaneous', 'V, S', 'None', '', 'Purify and render free of poison and disease nonmagical food and drink.'),
    spell('Speak with Animals', 1, 'Divination (ritual)', 'Self', '1 action', '10 minutes', 'V, S', 'None', '', 'Gain the ability to comprehend and verbally communicate with beasts.'),
    spell('Aid', 2, 'Abjuration', '30 feet', '1 action', '8 hours', 'V, S, M', 'None', 'Increase current and maximum hit points', 'Bolster up to three creatures, increasing their current and maximum hit points by 5.'),
    spell('Calm Emotions', 2, 'Enchantment', '60 feet (20-foot radius)', '1 action', 'Concentration, up to 1 minute', 'V, S', 'CHA save', '', 'Suppress fear or charm effects, or make hostile creatures indifferent for a time.'),
    spell('Darkvision', 2, 'Transmutation', 'Touch', '1 action', '8 hours', 'V, S, M', 'None', '', 'Give a willing creature darkvision out to 60 feet.'),
    spell('Enhance Ability', 2, 'Transmutation', 'Touch', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Grant advantage on checks using one ability, plus a benefit chosen for that ability.'),
    spell('Gust of Wind', 2, 'Evocation', 'Self (60-foot line)', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'STR save', '', 'Create a strong wind that pushes creatures and extinguishes flames.'),
    spell('Pass without Trace', 2, 'Abjuration', 'Self (30-foot radius)', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Give chosen creatures +10 to Stealth and prevent tracking except by magical means.'),
    spell('Prayer of Healing', 2, 'Evocation', '30 feet', '10 minutes', 'Instantaneous', 'V', 'None', '2d8 + spellcasting modifier healing', 'Up to six creatures regain hit points.'),
    spell('Silence', 2, 'Illusion (ritual)', '120 feet (20-foot radius)', '1 action', 'Concentration, up to 10 minutes', 'V, S', 'None', '', 'Create a sphere where sound cannot pass and verbal spell components cannot be used.'),
    spell('Warding Bond', 2, 'Abjuration', 'Touch', '1 action', '1 hour', 'V, S, M (platinum ring)', 'None', '+1 AC and saves', 'Grant a willing creature +1 AC, +1 saving throws, and resistance to all damage while you share its damage.'),
    spell('Call Lightning', 3, 'Conjuration', '120 feet (60-foot radius)', '1 action', 'Concentration, up to 10 minutes', 'V, S', 'DEX save', '3d10 lightning', 'Call a lightning bolt each turn; damage increases in a storm and with higher slots.'),
    spell('Clairvoyance', 3, 'Divination', '1 mile', '10 minutes', 'Concentration, up to 10 minutes', 'V, S, M', 'None', '', 'Create an invisible sensor at a familiar or obvious location and see or hear through it.'),
    spell('Fear', 3, 'Illusion', 'Self (30-foot cone)', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'WIS save', '', 'Project a frightening image; failed creatures drop what they hold and flee.'),
    spell('Fly', 3, 'Transmutation', 'Touch', '1 action', 'Concentration, up to 10 minutes', 'V, S, M', 'None', '', 'The willing target gains a 60-foot flying speed.'),
    spell('Plant Growth', 3, 'Transmutation', '150 feet', '1 action or 8 hours', 'Instantaneous', 'V, S', 'None', '', 'Overgrow an area to create difficult terrain, or enrich a half-mile area for a year.'),
    spell('Remove Curse', 3, 'Abjuration', 'Touch', '1 action', 'Instantaneous', 'V, S', 'None', '', 'End one curse on a creature or object; cursed equipment can then be removed.'),
    spell('Speak with Plants', 3, 'Transmutation', 'Self (30-foot radius)', '1 action', '10 minutes', 'V, S', 'None', '', 'Communicate with plants and animate them to hinder or help within limited bounds.'),
    spell('Water Breathing', 3, 'Transmutation (ritual)', '30 feet', '1 action', '24 hours', 'V, S, M', 'None', '', 'Give up to ten willing creatures the ability to breathe underwater.'),
    spell('Arcane Eye', 4, 'Divination', '30 feet', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Create an invisible magical eye that can scout remotely.'),
    spell('Confusion', 4, 'Enchantment', '90 feet (10-foot radius)', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'WIS save', '', 'Confuse creatures so their movement and actions become unpredictable.'),
    spell('Freedom of Movement', 4, 'Abjuration', 'Touch', '1 action', '1 hour', 'V, S, M', 'None', '', 'The target ignores difficult terrain and magical restraint, and can spend movement underwater normally.'),
    spell('Hallucinatory Terrain', 4, 'Illusion', '300 feet (150-foot cube)', '10 minutes', '24 hours', 'V, S, M', 'Investigation check', '', 'Make natural terrain in an area look, sound, and smell like another kind of terrain.'),
    spell('Locate Creature', 4, 'Divination', 'Self', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Sense the direction to a familiar creature within 1,000 feet.'),
    spell('Passwall', 5, 'Transmutation', '30 feet', '1 action', '1 hour', 'V, S, M', 'None', '', 'Create a passage through a wooden, plaster, or stone surface.'),
    spell('Scrying', 5, 'Divination', 'Self', '10 minutes', 'Concentration, up to 10 minutes', 'V, S, M', 'WIS save', '', 'See and hear a creature on the same plane through a magical sensor.'),
    spell('Commune with Nature', 5, 'Divination (ritual)', 'Self', '1 minute', 'Instantaneous', 'V, S', 'None', '', 'Learn facts about the surrounding land and its natural features.'),
    spell('Conjure Woodland Beings', 4, 'Conjuration', '60 feet', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Summon fey creatures that obey your spoken commands.'),
    spell('Conjure Animals', 3, 'Conjuration', '60 feet', '1 action', 'Concentration, up to 1 hour', 'V, S', 'None', '', 'Summon fey spirits that take the form of beasts and follow your commands.'),
    spell('Druidcraft', 0, 'Transmutation', '30 feet', '1 action', 'Instantaneous', 'V, S', 'None', '', 'Create a minor natural effect such as weather signs, a blossom, or a harmless sensory effect.'),
    spell('Plant Growth', 3, 'Transmutation', '150 feet', '1 action or 8 hours', 'Instantaneous', 'V, S', 'None', '', 'Overgrow an area to create difficult terrain, or enrich a half-mile area for a year.'),
    spell('Regenerate', 7, 'Transmutation', 'Touch', '1 minute', '1 hour', 'V, S, M', 'None', '4d8 + 15 healing', 'Restore hit points and regrow severed body parts over the duration.'),
    spell('Antipathy/Sympathy', 8, 'Enchantment', '60 feet', '1 hour', '10 days', 'V, S, M', 'WIS save', '', 'Attract or repel a creature type from an object or area.'),
    spell('Animal Shapes', 8, 'Transmutation', '30 feet', '1 action', 'Concentration, up to 24 hours', 'V, S', 'None', '', 'Transform willing creatures into beasts while retaining their minds.'),
    spell('Earthquake', 8, 'Evocation', '500 feet (100-foot radius)', '1 action', 'Concentration, up to 1 minute', 'V, S, M', 'DEX save', 'Bludgeoning', 'Create a powerful tremor that opens fissures and collapses structures.'),
    spell('Shapechange', 9, 'Transmutation', 'Self', '1 action', 'Concentration, up to 1 hour', 'V, S, M', 'None', '', 'Assume the form of another creature while retaining your mental ability scores and class features.')
  ];

  // Plant Growth is listed once even though it is thematically useful in the Wood.
  const unique = new Map();
  PHB_SPELL_PRESETS.forEach(entry => unique.set(entry.name.toLowerCase(), entry));
  return { PHB_SPELL_PRESETS: [...unique.values()] };
});
