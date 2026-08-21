(function attachAlmanacData(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.HumblewoodAlmanacData = data;
})(typeof window !== 'undefined' ? window : null, function createAlmanacData() {
  return [
    {
      id: 'brackenmill',
      title: 'Brackenmill & the First Bloom',
      icon: '🌼',
      description: 'The campaign’s opening place, people, trade, and yearly celebration.',
      entries: [
        {
          title: 'The First Bloom Festival',
          kicker: 'Chapter 1 · Episode 1',
          tags: ['festival', 'brackenmill', 'first bloom', 'episode 1', 'gods', 'games'],
          summary: 'Once each year, folk from across Humblewood gather in Brackenmill to welcome the growing season and ask the gods for a fruitful year.',
          facts: [
            ['Where', 'Brackenmill'],
            ['When', 'Once each year'],
            ['Mood', 'Flowers, food, ribbons, games, and hopeful beginnings']
          ],
          sections: [
            {
              heading: 'What visitors bring',
              items: ['Baskets and flowers', 'Seeds and fresh produce', 'Breads and other baked goods', 'Ribbons, decorations, and offerings']
            },
            {
              heading: 'Why everyone gathers',
              text: 'The festival is both a joyful meeting of communities and a seasonal appeal for healthy crops. It is an easy place to meet travelers, farmers, traders, craftsfolk, and future adventuring companions.'
            },
            {
              heading: 'At the table',
              text: 'Festival games, shared food, friendly rivalries, unusual wares, and crowded shipping platforms make this a lively first session location.'
            }
          ]
        },
        {
          title: 'Brackenmill',
          kicker: 'Motto · Cultivating the Forest',
          tags: ['town', 'perch', 'farming', 'trade', 'guild', 'perch guard', 'alderheart', 'horticulture', 'insects'],
          summary: 'Humblewood’s largest and most productive farming perch: a network of neighboring tree-farms that gradually grew together around a busy commercial hub.',
          facts: [
            ['Settlement', 'Agricultural birdfolk perch'],
            ['Known for', 'Tree-farms, produce, luxury crops, and giant-insect goods'],
            ['Security', 'The local Perch Guard'],
            ['Main connection', 'A major supplier to Alderheart']
          ],
          sections: [
            {
              heading: 'Farming above and below',
              text: 'Fruiting vines and mosses grow along the trees’ branches. Some farms also extend to the forest floor, where horticultural plots can produce luxury goods that do not thrive in the canopy.'
            },
            {
              heading: 'A working trade hub',
              text: 'The merged farms surround shops, trade halls, and shipping platforms. Corrals hold giant insects raised for useful products ranging from silk to meat.'
            },
            {
              heading: 'Power and politics',
              text: 'A powerful agricultural trade guild oversees the movement of goods around the Wood. Its leadership mixes elected representatives with legacy members from prominent farm-owning families, whose inherited appointments often last for life.'
            }
          ]
        }
      ]
    },
    {
      id: 'folk',
      title: 'Folk of the Wood',
      icon: '🪶',
      description: 'The ten Humblewood player folk, with their defining traits and valid subraces.',
      entries: [
        {
          title: 'Corvum',
          kicker: 'Birdfolk · Hungry for knowledge',
          tags: ['race', 'species', 'birdfolk', 'crow', 'dusk corvum', 'kindled corvum', 'intelligence'],
          summary: 'Sharp-minded, observant crow-folk who trade in knowledge and often work as planners, appraisers, advisors, or subtle political operators.',
          facts: [['Ability scores', '+2 Intelligence'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Dusk Corvum or Kindled Corvum'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and climbing talons', 'One learned proficiency: Arcana, History, Nature, or Religion', 'Appraising Eye reveals an object’s magical use and approximate value once per rest'] },
            { heading: 'Dusk Corvum', text: '+1 Dexterity. Skilled at hiding in dim light or darkness and proficient in Insight.' },
            { heading: 'Kindled Corvum', text: '+1 Charisma. Persuasive or deceptive, broadly trained, and gifted with unusually accurate recall.' }
          ]
        },
        {
          title: 'Gallus',
          kicker: 'Birdfolk · One with the Wood',
          tags: ['race', 'species', 'birdfolk', 'chicken', 'pheasant', 'bright gallus', 'huden gallus', 'wisdom'],
          summary: 'Community-minded wildfowl who value honest work, gardening, hospitality, nature, and strong bonds with their neighbors.',
          facts: [['Ability scores', '+2 Wisdom'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Bright Gallus or Huden Gallus'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and Wing Flap', 'Simple-weapon training and one artisan’s tool', 'Deep knowledge of their own culture and community'] },
            { heading: 'Bright Gallus', text: '+1 Charisma. Proficient in Insight and able to inspire an ally with a d4 for their next check, attack, or save.' },
            { heading: 'Huden Gallus', text: '+1 Dexterity. Proficient in Nature and able to exchange simple ideas with living plants through Seedspeech.' }
          ]
        },
        {
          title: 'Luma',
          kicker: 'Birdfolk · Peculiar in nature',
          tags: ['race', 'species', 'birdfolk', 'dove', 'pigeon', 'sable luma', 'sera luma', 'charisma', 'magic'],
          summary: 'Small, iridescent dove- and pigeon-folk whose unusual perspective can look like distraction, luck, magical talent, or inspired brilliance.',
          facts: [['Ability scores', '+2 Charisma'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'Sable Luma or Sera Luma'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and Wing Flap', 'One sorcerer cantrip', 'Fated: reroll one attack, check, or save per long rest'] },
            { heading: 'Sable Luma', text: '+1 Constitution. Difficult to read, skilled at deceiving non-lumas, and resistant to poison.' },
            { heading: 'Sera Luma', text: '+1 Wisdom. Proficient in Performance and able to cast charm person through song once per long rest.' }
          ]
        },
        {
          title: 'Raptor',
          kicker: 'Birdfolk · Swift hunters',
          tags: ['race', 'species', 'birdfolk', 'hawk', 'eagle', 'maran raptor', 'mistral raptor', 'dexterity', 'archer'],
          summary: 'Keen-eyed hunters and naturalists who prize personal bonds, patience, self-reliance, and accuracy over ceremony.',
          facts: [['Ability scores', '+2 Dexterity'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'Maran Raptor or Mistral Raptor'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide, talons, and Perception proficiency', 'Longbow, shortbow, and spear training', 'Woodland Hunter reduces the benefit enemies gain from cover'] },
            { heading: 'Maran Raptor', text: '+1 Intelligence. A 25-foot swim speed and advantage on the first roll made as part of a readied action.' },
            { heading: 'Mistral Raptor', text: '+1 Wisdom. Proficient in Acrobatics; attackers have disadvantage while the raptor is falling, gliding, or jumping.' }
          ]
        },
        {
          title: 'Strig',
          kicker: 'Birdfolk · Imposing yet kind',
          tags: ['race', 'species', 'birdfolk', 'owl', 'stout strig', 'swift strig', 'strength', 'darkvision'],
          summary: 'Powerful owl-folk known for endurance, fair play, freedom, hunting prowess, and a willingness to protect those with less strength.',
          facts: [['Ability scores', '+2 Strength'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Stout Strig or Swift Strig'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and climbing talons', '60-foot darkvision', 'Advantage when hiding in forest terrain'] },
            { heading: 'Stout Strig', text: '+1 Constitution. Proficient in Intimidation and able to grapple as a bonus action after a successful talon attack.' },
            { heading: 'Swift Strig', text: '+1 Dexterity. A 35-foot walking speed and proficiency in Survival.' }
          ]
        },
        {
          title: 'Cervan',
          kicker: 'Humblefolk · Enlightened leaders',
          tags: ['race', 'species', 'humblefolk', 'deer', 'elk', 'grove cervan', 'pronghorn cervan', 'constitution'],
          summary: 'Practical, resilient deer-folk from close-knit woodland communities. Rare cervans experience prophetic flashes known as the Sight.',
          facts: [['Ability scores', '+2 Constitution'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Grove Cervan or Pronghorn Cervan'], ['Languages', 'Birdfolk; spoken Cervan']],
          sections: [
            { heading: 'Core traits', items: ['One practical proficiency: Athletics, Medicine, Nature, or Survival', 'Surge of Vigor restores 1d12 + Constitution modifier after a devastating hit, once per long rest'] },
            { heading: 'Grove Cervan', text: '+1 Dexterity. A 35-foot speed, powerful standing leaps, and disadvantage on opportunity attacks made against them.' },
            { heading: 'Pronghorn Cervan', text: '+1 Strength. Doubled carrying power, antler attacks, and a charging strike that can push an enemy.' }
          ]
        },
        {
          title: 'Hedge',
          kicker: 'Humblefolk · Pointed mediators',
          tags: ['race', 'species', 'humblefolk', 'hedgehog', 'charisma', 'wisdom', 'quills', 'burrow'],
          summary: 'Compassionate hedgehog-folk with a strong connection to the Great Rhythm, a gift for mediation, and formidable protective quills.',
          facts: [['Ability scores', '+2 Charisma, +1 Wisdom'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Hedge']],
          sections: [
            { heading: 'Core traits', items: ['15-foot burrowing speed through soil', 'Quills provide 14 + Dexterity modifier AC instead of armor', 'Curl Up raises base AC to 19 and can damage missed melee attackers', 'Druidcraft, animal messenger, and simple communication with bugs'] }
          ]
        },
        {
          title: 'Jerbeen',
          kicker: 'Humblefolk · Tiny yet brave',
          tags: ['race', 'species', 'humblefolk', 'mouse', 'dexterity', 'charisma', 'team tactics', 'help'],
          summary: 'Tiny mouse-folk whose courage, charm, long leaps, and cooperative instincts become strongest when friends stand nearby.',
          facts: [['Ability scores', '+2 Dexterity, +1 Charisma'], ['Size · Speed', 'Small · 30 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Jerbeen']],
          sections: [
            { heading: 'Core traits', items: ['30-foot long jump and 15-foot high jump from a standstill', 'Can move through spaces occupied by larger creatures', 'Take Heart grants defensive advantages near a capable ally', 'Team Tactics allows the Help action as a bonus action'] }
          ]
        },
        {
          title: 'Mapach',
          kicker: 'Humblefolk · Cunning crafters',
          tags: ['race', 'species', 'humblefolk', 'raccoon', 'wisdom', 'constitution', 'scroungecraft', 'tinker'],
          summary: 'Resourceful raccoon-folk who climb, sneak, improvise, and turn whatever happens to be nearby into surprisingly useful equipment.',
          facts: [['Ability scores', '+2 Wisdom, +1 Constitution'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Mapach']],
          sections: [
            { heading: 'Core traits', items: ['60-foot darkvision and a 20-foot climb speed', 'Poison resilience and stealth in dim light or darkness', 'Tinker’s tools proficiency', 'In 10 minutes, Scroungecraft makes a temporary common tool or piece of adventuring gear worth no more than 30 gp; it normally lasts 1 hour'] }
          ]
        },
        {
          title: 'Vulpin',
          kicker: 'Humblefolk · Sophisticated yet savage',
          tags: ['race', 'species', 'humblefolk', 'fox', 'intelligence', 'charisma', 'bite', 'magic'],
          summary: 'Ambitious fox-folk who combine intelligence, artistry, survival instinct, force of personality, and an innate talent for beguiling magic.',
          facts: [['Ability scores', '+2 Intelligence, +1 Charisma'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Vulpin']],
          sections: [
            { heading: 'Core traits', items: ['60-foot darkvision', 'A 1d6 bite using Strength or Dexterity', 'Adds Intelligence modifier to Dexterity saving throws', 'Bewitching Guile grants charm person, then Ambush Prey and fear at later levels'] }
          ]
        }
      ]
    },
    {
      id: 'callings',
      title: 'Paths & Callings',
      icon: '🗡️',
      description: 'Class choices in Humblewood, including the setting’s special bard, cleric, and fighter options.',
      entries: [
        {
          title: 'Choosing a Class',
          kicker: 'Character building · Step 2',
          tags: ['class', 'all classes', 'character creation', 'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'],
          summary: 'Every standard 5e class is available. Build for the personality and story you want to play rather than feeling pressured to optimize for the campaign.',
          sections: [
            { heading: 'Humblewood additions', text: 'Bards may choose the College of the Road, clerics may follow the Community or Night domains, and fighters may become Scofflaws.' }
          ]
        },
        {
          title: 'College of the Road',
          kicker: 'Bard college · Choose at level 3',
          tags: ['class', 'subclass', 'bard', 'college of the road', 'traveller tricks', 'level 3'],
          summary: 'A practical bardic education earned through travel, observation, chance meetings, and lived experience rather than formal schooling.',
          facts: [['Class', 'Bard'], ['Subclass begins', '3rd level'], ['Style', 'Flexible knowledge and borrowed tricks']],
          sections: [
            { heading: 'Road Scholar', text: 'Gain flexible proficiencies chosen from gaming sets, martial weapons, herbalism, thieves’ tools, skills, or languages.' },
            { heading: 'Bardic knowledge', text: 'Bardic Inspiration can help an ally approach Arcana, History, Nature, or Religion from a new angle.' },
            { heading: 'Traveller’s Tricks', text: 'Learn adaptable techniques inspired by other adventuring paths, such as defensive movement, fighting styles, extra healing, unarmed strikes, invocations, evocation magic, hunter’s mark, reckless attacks, or temporary hit points.' }
          ]
        },
        {
          title: 'Community Domain',
          kicker: 'Cleric domain · Unity and support',
          tags: ['class', 'subclass', 'cleric', 'community domain', 'healing', 'support', 'channel divinity'],
          summary: 'Community clerics strengthen a group through hospitality, shared rest, healing food, watchfulness, and small boons that help allies succeed together.',
          facts: [['Class', 'Cleric'], ['Role', 'Support, recovery, and teamwork']],
          sections: [
            { heading: 'Key features', items: ['Blessing of the Hearth improves recovery during short rests at 1st level', 'Channel Divinity creates healing food at 2nd level', 'Community Watch grants a d6 boon to nearby allies’ checks, saves, or attacks at 6th level', 'Later levels improve Divine Strike and Community Watch'] },
            { heading: 'Domain magic', text: 'The domain spell list includes several Humblewood spells. Search “Cleric” in the spell section to find compatible entries.' }
          ]
        },
        {
          title: 'Night Domain',
          kicker: 'Cleric domain · Twilight and shadow',
          tags: ['class', 'subclass', 'cleric', 'night domain', 'darkvision', 'shadow', 'blind', 'sleep'],
          summary: 'Night clerics see through darkness and bend magical shadow to shield allies, blind threats, and turn darkness itself into a tactical advantage.',
          facts: [['Class', 'Cleric'], ['Role', 'Control, protection, and supernatural sight']],
          sections: [
            { heading: 'Key features', items: ['Darkvision improves in reach and power, eventually becoming truesight', 'Ward of Shadows and related features impose disadvantage or blind enemies', 'At 8th level, the cleric can choose the order in which Sleep affects creatures'] },
            { heading: 'Domain magic', text: 'The domain uses several Humblewood spells connected to twilight, divination, and darkness.' }
          ]
        },
        {
          title: 'Scofflaw',
          kicker: 'Fighter archetype · Fight dirty, survive',
          tags: ['class', 'subclass', 'fighter', 'scofflaw', 'improvised weapon', 'dirty fighting', 'deception'],
          summary: 'A rule-breaking fighter who wins through nerve, trickery, improvised weapons, misdirection, and a reputation dangerous enough to frighten foes.',
          facts: [['Class', 'Fighter'], ['Role', 'Martial control, trickery, and opportunism']],
          sections: [
            { heading: 'Key features', items: ['Choose social or stealth-oriented training, or learn Thieves’ Cant', 'Use Strength or Dexterity for Charisma checks during combat', 'Treat improvised weapons as finesse weapons and improve their damage later', 'Misdirect enemies, strike by surprise, and eventually weaponize a fearsome reputation'] }
          ]
        }
      ]
    },
    {
      id: 'backgrounds',
      title: 'Roots & Backgrounds',
      icon: '🧺',
      description: 'Ideas for who your character was before adventuring and how the Wood might see them.',
      entries: [
        {
          title: 'Entertainers & Charlatans',
          kicker: 'Charm, performance, and clever stories',
          tags: ['background', 'entertainer', 'charlatan', 'hedge', 'jerbeen', 'vulpin', 'alderheart'],
          summary: 'Hedges are celebrated diplomats and entertainers, while the natural charm of jerbeens and vulpins can suit either show business or well-practiced trickery.',
          sections: [{ heading: 'Where they fit', text: 'Alderheart offers stages and marks at every level: the affluent canopy, the busy trunk, and the root-slums.' }]
        },
        {
          title: 'Criminals & Urchins',
          kicker: 'Survival on the margins',
          tags: ['background', 'criminal', 'urchin', 'bandit coalition', 'jerbeen', 'mapach', 'vulpin', 'corvum', 'assassin', 'alderheart', 'saltar'],
          summary: 'Pickpockets haunt large perches, but only the most capable draw the Bandit Coalition’s notice. Jerbeens excel at unnoticed movement, mapachs may be pushed toward crime by prejudice, and vulpins often rise through ambition and force of personality.',
          sections: [
            { heading: 'Specialists and places', text: 'Corvums’ intellect and cunning can suit contract work in politically complex perches. Crime is especially visible in Alderheart’s roots and Saltar’s Port, while Coalition camps lie farther from settled society.' }
          ]
        },
        {
          title: 'Knights, Gladiators & Soldiers',
          kicker: 'Service, strength, and protection',
          tags: ['background', 'knight', 'gladiator', 'soldier', 'perch guard', 'militia', 'strig', 'alderheart'],
          summary: 'The Perch Guard recruits across the Wood, handles local dangers and city crime, and supports humblefolk villages under the Humblefolk Treaty.',
          sections: [
            { heading: 'Where they serve', text: 'Large perches maintain guard forces, while smaller settlements rely on local militias open to trusted citizens.' },
            { heading: 'Knighthood', text: 'Only especially talented guards train as knights. Alderheart’s knights learn to protect others and create chances for allies to regroup or retreat; many are powerful strigs.' }
          ]
        },
        {
          title: 'Sailors & Pirates',
          kicker: 'A life beyond the canopy',
          tags: ['background', 'sailor', 'pirate', 'saltar port', 'talongrip coast', 'raptor', 'mapach', 'jerbeen'],
          summary: 'For some folk, the open sea offers a freedom that dense forest life cannot. The work is demanding, dangerous, and potentially lucrative.',
          sections: [{ heading: 'Where they gather', text: 'Saltar’s Port supports a vibrant sea trade. The Talongrip Coast is home to many fisher-folk, especially sea raptors, mapachs, and jerbeens.' }]
        },
        {
          title: 'Outlanders',
          kicker: 'Trackers, guides, and wild paths',
          tags: ['background', 'outlander', 'ranger', 'strig', 'guide', 'bounty hunter', 'crest mountains', 'talongrip coast'],
          summary: 'Raptor legends make the ranger an iconic figure: an archer, hunter, explorer, and highly valued wilderness guide.',
          sections: [{ heading: 'Other paths', text: 'Strigs often enjoy the challenge of tracking and may turn those skills toward bounty hunting. Outlanders can be found around the Crest Mountains or in isolated homes along the Talongrip Coast.' }]
        },
        {
          title: 'Nobles',
          kicker: 'Influence above and behind the scenes',
          tags: ['background', 'noble', 'vulpin', 'corvum', 'alderheart', 'politics', 'advisor'],
          summary: 'Although birdfolk founded Alderheart, influential humblefolk families also belong to its nobility. Vulpins can flourish amid high-society intrigue, with a few families claiming ancient royal blood.',
          sections: [{ heading: 'Corvum influence', text: 'Corvums are valued as planners, advisors, and minor officials. Social stigma may block the most visible offices, but it rarely prevents them from shaping decisions behind the scenes.' }]
        },
        {
          title: 'Bandit Defector',
          kicker: 'Humblewood background',
          tags: ['background', 'bandit defector', 'bandit coalition', 'deception', 'survival', 'bandit routes'],
          summary: 'You left the Bandit Coalition after a life of ambushing travelers, but old companions, old enemies, and old habits may not be ready to let you go.',
          facts: [['Skills', 'Deception and Survival'], ['Tools', 'Disguise kit and one gaming set or musical instrument'], ['Feature', 'Bandit Routes']],
          sections: [{ heading: 'Bandit Routes', text: 'Outside combat, your knowledge of hidden roads and escape paths lets you guide companions through forested travel with unusual speed.' }]
        },
        {
          title: 'Grounded',
          kicker: 'Humblewood background · Birdfolk',
          tags: ['background', 'grounded', 'birdfolk', 'athletics', 'insight', 'forest floor'],
          summary: 'You are a birdfolk who feels safer with solid earth beneath your feet. Other birdfolk may find that unusual, but the perspective helps you connect with humblefolk communities.',
          facts: [['Skills', 'Athletics and Insight'], ['Feature', 'Find Another Path']],
          sections: [{ heading: 'Find Another Path', text: 'You understand the undergrowth, can recall the general shape of forest-floor terrain, find routes around vertical obstacles when a route exists, and locate natural shelter while traveling.' }]
        },
        {
          title: 'Wind-Touched',
          kicker: 'Humblewood background · Birdfolk',
          tags: ['background', 'wind-touched', 'birdfolk', 'acrobatics', 'performance', 'auran', 'wind'],
          summary: 'Special markings, a strange survival, or local belief have marked you as someone blessed by the wind and perhaps destined to soar above every obstacle.',
          facts: [['Skills', 'Acrobatics and Performance'], ['Language', 'Speaks and understands Auran'], ['Feature', 'Supernatural Presence']],
          sections: [{ heading: 'Supernatural Presence', text: 'When you convincingly display power or skill associated with wind and air, believers may be inspired, supportive, reverent, or even worshipful.' }]
        },
        {
          title: 'Belonging in the Wood',
          kicker: 'Character prompt',
          tags: ['background', 'roleplay', 'birdfolk', 'humblefolk', 'outsider', 'character building'],
          summary: 'Your folk and inherited traits can help you belong in one community while marking you as an outsider in another.',
          sections: [{ heading: 'Questions to ask', items: ['Where do you feel most at home?', 'Which assumptions do others make when they see you?', 'How do you view birdfolk and humblefolk whose lives differ from yours?', 'Which stereotype do you embrace, reject, or complicate?'] }]
        }
      ]
    },
    {
      id: 'feats',
      title: 'Knacks & Feats',
      icon: '🍀',
      description: 'Seven Humblewood feats for gliders, woodland survivors, clever thieves, and folk with unusual gifts.',
      entries: [
        {
          title: 'Aerial Expert',
          kicker: 'Feat · Requires the Glide trait',
          tags: ['feat', 'aerial expert', 'glide', 'jump', 'dash', 'flight', 'dexterity', 'strength'],
          summary: 'Years of practice have made you exceptionally agile in the air, able to leap farther and control a glide with far greater freedom.',
          facts: [['Prerequisite', 'Glide trait'], ['Best for', 'Mobile birdfolk and aerial explorers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Long and high jumps no longer require a 10-foot run-up; use Strength or Dexterity and double the normal distance',
              'Take the Dash action while gliding to travel up to one additional movement speed',
              'Change direction freely while gliding and gain up to 10 feet of altitude once before landing'
            ]
          }]
        },
        {
          title: 'Bandit Cunning',
          kicker: 'Feat · Read danger and opponents',
          tags: ['feat', 'bandit cunning', 'intelligence', 'saving throw', 'investigation', 'challenge rating', 'resistance', 'immunity'],
          summary: 'Bandit experience has sharpened your survival instincts and taught you how to study a dangerous opponent while the fight unfolds.',
          sections: [{
            heading: 'Benefits',
            items: [
              'When making a saving throw, use your reaction to add your Intelligence modifier; refresh this ability after a long rest',
              'In combat, study a creature you have seen fight with an Intelligence (Investigation) check against DC 10 + its challenge rating',
              'On success, learn one resistance or immunity, condition immunity, damaging or defensive special ability, attack or reaction option, or special sense'
            ]
          }]
        },
        {
          title: 'Heavy Glider',
          kicker: 'Feat · Requires the Glide trait',
          tags: ['feat', 'heavy glider', 'glide', 'heavy armor', 'heavy weapon', 'strength', 'push', 'prone'],
          summary: 'Strength and training let you glide under loads that would ground other birdfolk—and turn your landing into a weapon.',
          facts: [['Prerequisite', 'Glide trait'], ['Best for', 'Armored or heavy-weapon birdfolk']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Glide while holding a heavy weapon and wearing heavy armor, provided you are not encumbered',
              'Land in the space of a hostile Large or smaller creature and make an opposed Strength check',
              'On success, push it 10 feet and knock it prone; on failure, land in the nearest unoccupied space'
            ]
          }]
        },
        {
          title: 'Opportunistic Thief',
          kicker: 'Feat · Perfectly timed thievery',
          tags: ['feat', 'opportunistic thief', 'dexterity', 'sleight of hand', 'steal', 'pickpocket', 'melee'],
          summary: 'You exploit a missed swing or momentary distraction to lift an item before its owner realizes an opportunity existed.',
          facts: [['Ability increase', '+1 Dexterity'], ['Best for', 'Rogues, pickpockets, and quick-handed characters']],
          sections: [{
            heading: 'Benefits',
            items: [
              'When a creature misses you with a melee attack, make a Dexterity (Sleight of Hand) check against DC 10 + its Dexterity modifier',
              'On success, steal one item that the target is not holding or wearing',
              'After a successful out-of-combat theft, immediately conceal the object flawlessly or replace it with another object you possess'
            ]
          }]
        },
        {
          title: 'Perfect Landing',
          kicker: 'Feat · Fall with grace',
          tags: ['feat', 'perfect landing', 'dexterity', 'fall damage', 'prone', 'height'],
          summary: 'Life at great heights has taught you how to absorb a fall, keep your footing, and walk away from drops that would injure others.',
          facts: [['Ability increase', '+1 Dexterity'], ['Best for', 'Climbers, gliders, and canopy adventurers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Fall damage uses d4s instead of d6s',
              'Taking fall damage does not knock you prone',
              'Ignore damage from the first 30 feet of a fall'
            ]
          }]
        },
        {
          title: 'Speech of the Ancient Beasts',
          kicker: 'Feat · Kinship with great creatures',
          tags: ['feat', 'speech of the ancient beasts', 'charisma', 'beast', 'giant eagle', 'giant elk', 'giant owl', 'language'],
          summary: 'Great beasts recognize something familiar in you, allowing you to speak with legendary creatures and approach them as kin.',
          facts: [['Ability increase', '+1 Charisma'], ['Best for', 'Nature-focused characters and animal diplomats']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Large or larger beasts begin with a friendly disposition unless you have attacked them',
              'Gain advantage on Charisma checks made against Large or larger beasts',
              'Speak and understand Giant Eagle, Giant Elk, and Giant Owl',
              'Any Large or larger beast can understand you, although less intelligent beasts may grasp only simple ideas'
            ]
          }]
        },
        {
          title: 'Woodwise',
          kicker: 'Feat · At home in the wild',
          tags: ['feat', 'woodwise', 'survival', 'nature', 'difficult terrain', 'lost', 'forest'],
          summary: 'A lifetime among tangled woodland paths has made natural terrain feel readable, familiar, and easy to cross.',
          facts: [['Skill', 'Nature or Survival proficiency'], ['Best for', 'Guides, rangers, and woodland travelers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Gain proficiency in either Nature or Survival',
              'Ignore difficult terrain',
              'You cannot become lost in natural surroundings except through magical means'
            ]
          }]
        }
      ]
    },
    {
      id: 'spells',
      title: 'Humblewood Spells',
      icon: '✨',
      description: 'The setting’s ten special spells, organized for quick rules lookup at the table.',
      entries: [
        {
          title: 'Ambush Prey',
          kicker: '2nd-level illusion',
          tags: ['spell', 'ranger', 'vulpin', 'illusion', 'invisible', 'stealth', 'damage'],
          summary: 'Become invisible while holding your position and empower the first attack made against a target unaware of you.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 hour'], ['Components', 'S, M (a broken twig)'], ['Classes', 'Ranger']],
          sections: [
            { heading: 'Effect', text: 'You are invisible and have advantage on Dexterity (Stealth) checks to remain hidden. Moving 5 feet or more from the casting position ends the invisibility.' },
            { heading: 'Attack & damage', text: 'Your first attack against a target unaware of your presence deals an extra 1d6 damage and ends the spell. Each slot level above 2nd adds another 1d6.' }
          ]
        },
        {
          title: 'Elevated Sight',
          kicker: '1st-level divination',
          tags: ['spell', 'cleric', 'druid', 'ranger', 'warlock', 'wizard', 'divination', 'sensor', 'vision'],
          summary: 'Project your sight through an invisible aerial sensor for a mobile, 360-degree view from above.',
          facts: [['Casting', '1 action'], ['Range', 'Self; sensor up to 120 ft. above'], ['Duration', 'Concentration, up to 1 minute'], ['Components', 'V, S'], ['Classes', 'Cleric, Druid, Ranger, Warlock, Wizard']],
          sections: [{ heading: 'Effect', text: 'The sensor travels with you and its height can be adjusted as a bonus action. You are blind while looking through it, but may switch between its view and your own during your turn.' }]
        },
        {
          title: 'Feathered Reach',
          kicker: '3rd-level transmutation',
          tags: ['spell', 'druid', 'ranger', 'transmutation', 'wings', 'glide', 'jump', 'flight'],
          summary: 'Transform your arms into wings that support bursts of flight, powerful jumps, safe falls, and gliding movement.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 minute'], ['Components', 'S, M (a small feather)'], ['Classes', 'Druid, Ranger']],
          sections: [{ heading: 'Effect', items: ['Fly up to twice your movement as a bonus action, but land after the move', 'Rise up to half your movement once during your turn', 'Use a reaction while falling to glide up to your movement and avoid fall damage', 'Gain advantage on Athletics checks to jump and triple normal jump distance'] }, { heading: 'Limits', text: 'Your hands must be free of shields and heavy weapons, and you cannot be encumbered.' }]
        },
        {
          title: 'Globe of Twilight',
          kicker: '3rd-level conjuration',
          tags: ['spell', 'druid', 'ranger', 'warlock', 'conjuration', 'twilight', 'stealth', 'blind'],
          summary: 'Wrap the area around you in a star-speckled twilight that conceals chosen creatures and dazzles everyone else.',
          facts: [['Casting', '1 action'], ['Range', 'Self · 15-ft. radius and height'], ['Duration', 'Concentration, up to 10 minutes'], ['Components', 'V, S, M (pitch and glittering sand)'], ['Classes', 'Druid, Ranger, Warlock']],
          sections: [{ heading: 'Effect', text: 'The sphere is lightly obscured and suppresses most light. Chosen creatures gain advantage on Stealth and may hide at any time. Other creatures have disadvantage on perception within the globe and must make a Wisdom save when entering or starting there or be blinded until the end of their turn.' }]
        },
        {
          title: 'Gust Barrier',
          kicker: 'Evocation cantrip',
          tags: ['spell', 'cantrip', 'bard', 'druid', 'sorcerer', 'wizard', 'evocation', 'ranged', 'push', 'prone'],
          summary: 'Surround yourself with defensive wind that spoils ranged attacks and throws careless melee attackers backward.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 round'], ['Components', 'S'], ['Classes', 'Bard, Druid, Sorcerer, Wizard']],
          sections: [{ heading: 'Effect', text: 'Ranged attacks against you have disadvantage until the end of your next turn.' }, { heading: 'Attack response', text: 'A melee attacker that hits you must make a Constitution save. On a failure it is pushed up to 10 feet away and knocked prone.' }]
        },
        {
          title: 'Invoke the Amaranthine',
          kicker: '3rd-level divination',
          tags: ['spell', 'cleric', 'paladin', 'divination', 'amaranthine', 'd20', 'reaction', 'roll replacement'],
          summary: 'Ask an Amaranthine for two glimpses of fate, then spend those recorded d20 results to replace later rolls.',
          facts: [['Casting', '10 minutes'], ['Range', 'Self; later targets within 60 ft.'], ['Duration', '24 hours'], ['Components', 'V, S, M (an Amaranthine holy symbol)'], ['Classes', 'Cleric, Paladin']],
          sections: [{ heading: 'Effect', text: 'Roll and record two d20s, assigning each to attack rolls, skill checks, or saving throws. As a reaction, replace a matching roll made by a visible ally or enemy within 60 feet before its outcome is determined. Normal modifiers still apply.' }]
        },
        {
          title: 'Shape Plants',
          kicker: '4th-level transmutation',
          tags: ['spell', 'bard', 'cleric', 'druid', 'transmutation', 'plant', 'thorns', 'piercing', 'damage'],
          summary: 'Sculpt living plants, alter their growth, or turn thorny vegetation into dangerous terrain.',
          facts: [['Casting', '1 action'], ['Range', 'Touch'], ['Duration', 'Instantaneous; shape normally lasts 1 hour'], ['Components', 'V, S'], ['Classes', 'Bard, Cleric, Druid']],
          sections: [{ heading: 'Effect', text: 'Reshape visible plants inside a 5-foot cube and change their flowers, vines, leaves, thorns, branches, or fruit. A communicative plant may agree to retain the shape permanently.' }, { heading: 'Damage & higher levels', text: 'Bramble or thorn growth can become difficult terrain that deals 2d4 piercing damage per 5 feet traveled. Each slot level above 4th increases the affected cube by 5 feet.' }]
        },
        {
          title: 'Spiny Shield',
          kicker: '1st-level abjuration',
          tags: ['spell', 'druid', 'ranger', 'sorcerer', 'wizard', 'abjuration', 'reaction', 'shield', 'damage', 'ac'],
          summary: 'Conjure a barrier of force-spikes that softens a melee blow, wounds the attacker, and offers cover from ranged attacks.',
          facts: [['Casting', '1 reaction'], ['Range', 'Self'], ['Duration', '1 round'], ['Components', 'V, S, M (a small quill)'], ['Classes', 'Druid, Ranger, Sorcerer, Wizard']],
          sections: [{ heading: 'Effect & damage', text: 'When a melee attack hits you, reduce its damage by 2d4 and deal that much piercing damage to the attacker. Against ranged attacks the shield instead grants +2 AC as half cover. Each slot level above 1st adds 1d4.' }]
        },
        {
          title: 'Stellar Bodies',
          kicker: '4th-level evocation',
          tags: ['spell', 'cleric', 'druid', 'sorcerer', 'wizard', 'evocation', 'radiant', 'stars', 'blind', 'damage'],
          summary: 'Create two orbiting stars that punish nearby attackers or launch toward distant foes in blinding bursts.',
          facts: [['Casting', '1 action'], ['Range', 'Self; launched stars reach 120 ft.'], ['Duration', '1 minute'], ['Components', 'V, S'], ['Classes', 'Cleric, Druid, Sorcerer, Wizard']],
          sections: [{ heading: 'Defense', text: 'A creature within 5 feet that hits you with a melee attack must make a Wisdom save or take 1d8 radiant damage for each orbiting star.' }, { heading: 'Attack & damage', text: 'Once per round, use an action to expend a star and make a ranged spell attack within 120 feet. A hit deals 4d8 radiant damage; the target then makes a Constitution save or is blinded until your next turn.' }, { heading: 'Higher levels', text: 'Create one additional star for every two slot levels above 4th.' }]
        },
        {
          title: 'Veil of Dusk',
          kicker: '1st-level abjuration',
          tags: ['spell', 'druid', 'warlock', 'abjuration', 'stealth', 'armor class', 'shadow'],
          summary: 'Cloak a creature in quiet shadow, improving both its defense and ability to move unseen.',
          facts: [['Casting', '1 bonus action'], ['Range', '60 ft.'], ['Duration', 'Concentration, up to 10 minutes'], ['Components', 'V, S, M (a pinch of soot)'], ['Classes', 'Druid, Warlock']],
          sections: [{ heading: 'Effect', text: 'The target gains +1 AC and has advantage on Stealth checks for the duration.' }]
        }
      ]
    }
  ];
});
