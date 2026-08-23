(function attachAlmanacData(root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  if (root) root.HumblewoodAlmanacData = data;
})(typeof window !== 'undefined' ? window : null, function createAlmanacData() {
  return [
    {
      id: 'map',
      title: 'Map of Humblewood',
      icon: '🗺️',
      description: 'The regions, settlements, roads, rivers and wild places of the Wood.',
      entries: [
        {
          title: 'The Humblewood',
          kicker: 'Where our story takes place',
          tags: ['map', 'humblewood', 'alderheart', 'brackenmill', 'heartwood', 'northumble', 'easthumble', 'westhumble', 'southumble', 'crest mountains', 'rainwood', 'vineboughs', 'talongrip coast', 'saltar port'],
          summary: 'Humblewood stretches from the Oldeweald and Kraggermons in the west to the Rainwood and Vineboughs in the east, with Alderheart standing near its heart.',
          facts: [
            ['Central perch', 'Alderheart'],
            ['Festival town', 'Brackenmill'],
            ['Southern port', 'Saltar’s Port']
          ],
          image: {
            src: '/images/humblewood-expanded-nohex-v0.3.png',
            alt: 'Illustrated map of Humblewood showing its regions, settlements, forests, rivers, mountains and coastlines.',
            caption: 'The Humblewood'
          },
          wide: true,
          openByDefault: true
        }
      ]
    },
    {
      id: 'brackenmill',
      title: 'Brackenmill & the First Bloom',
      icon: '🌼',
      description: 'The Wood’s great farming perch and its yearly celebration of the growing season.',
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
              heading: 'A lively gathering',
              text: 'Festival games, shared food, friendly rivalries, unusual wares and crowded shipping platforms fill Brackenmill with activity.'
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
      id: 'faith',
      title: 'Faith & the Great Rhythm',
      icon: '🌅',
      description: 'Beliefs, names and customs familiar even beyond temples and shrines.',
      entries: [
        {
          title: 'The Great Rhythm',
          kicker: 'Common knowledge · The pulse of the forest',
          tags: ['religion', 'faith', 'great rhythm', 'nature', 'seasons', 'life', 'death', 'balance'],
          summary: 'The Great Rhythm is understood as the everlasting pulse that moves life and nature: sunrise and nightfall, flowering and harvest, birth and death, winter and renewal.',
          sections: [
            { heading: 'Across the Wood', text: 'Birdfolk often describe its beginning as the beating of wings. Other folk speak of hooves, paws or a tiny heartbeat. The images differ, but the idea of life moving in an endless rhythm is recognized throughout Humblewood.' }
          ]
        },
        {
          title: 'The Amaranthine',
          kicker: 'Common knowledge · Guardians of the Rhythm',
          tags: ['religion', 'faith', 'amaranthine', 'gods', 'great rhythm', 'birdfolk', 'humblefolk', 'shrines'],
          summary: 'The Amaranthine are the gods of Everden and guardians of the Great Rhythm. Each is associated with a familiar part of life, nature or society.',
          sections: [
            { heading: 'Everyday presence', text: 'Their names appear in festivals, blessings, stories, household shrines and common expressions. Formal devotion varies widely, and birdfolk and humblefolk often tell different stories about them.' },
            { heading: 'Dawn and night', text: 'Ardea, the Dawnmother, and Tyton, the Nightfather, are among the most widely recognized. They are associated with dawn and night, life and death, and the continuing cycle of the Rhythm.' }
          ]
        },
        {
          title: 'Familiar Amaranthine',
          kicker: 'Common knowledge · Names heard across the Wood',
          tags: ['religion', 'faith', 'amaranthine', 'altus', 'ardea', 'cairith', 'clhuran', 'gaspard', 'gesme', 'hanera', 'hath', 'henwin', 'kren', 'reya', 'tyton'],
          summary: 'Most residents and well-traveled visitors recognize these names and their broad associations, whether or not they practice any faith.',
          sections: [
            {
              heading: 'Widely known across birdfolk communities',
              items: [
                'Ardea, the Dawnmother — sunlight, life and kindness',
                'Tyton, the Nightfather — night, death and necessary endings',
                'Altus, the Enduring — strength, endurance and storms; closely associated with strigs',
                'Clhuran, the Fickle — luck, fate and unpredictability; closely associated with lumas',
                'Gesme, the Brilliant — knowledge, craft and fire; closely associated with corvums',
                'Hanera, the Provider — crops, community and plenty; closely associated with gallus',
                'Reya, the Explorer — wind, travel and discovery; closely associated with raptors'
              ]
            },
            {
              heading: 'Widely known across humblefolk communities',
              items: [
                'Cairith, the Resolute — life, resilience and protection; closely associated with cervans',
                'Gaspard, the Champion — courage, heroism and community; closely associated with jerbeens',
                'Hath, the Whisperer — night, secrets and the stars; closely associated with mapachs',
                'Henwin, the Kind — shelter, nature and compassion; closely associated with hedges',
                'Kren, the Sly — guile, predation and trickery; closely associated with vulpins'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'folk',
      title: 'Folk of the Wood',
      icon: '🪶',
      description: 'The ten folk of Humblewood and the traits for which they are known.',
      entries: [
        {
          title: 'Corvum',
          kicker: 'Birdfolk · Hungry for knowledge',
          tags: ['race', 'species', 'birdfolk', 'crow', 'dusk corvum', 'kindled corvum', 'intelligence'],
          summary: 'Sharp-minded, observant crow-folk who trade in knowledge and often work as planners, appraisers, advisors or subtle political operators.',
          facts: [['Ability scores', '+2 Intelligence'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Dusk Corvum or Kindled Corvum'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and climbing talons', 'One learned proficiency: Arcana, History, Nature, or Religion', 'Appraising Eye reveals an object’s magical use and approximate value once per rest'] },
            { heading: 'Dusk Corvum', text: '+1 Dexterity. Skilled at hiding in dim light or darkness and proficient in Insight.' },
            { heading: 'Kindled Corvum', text: '+1 Charisma. Persuasive or deceptive, broadly trained and gifted with unusually accurate recall.' }
          ]
        },
        {
          title: 'Gallus',
          kicker: 'Birdfolk · One with the Wood',
          tags: ['race', 'species', 'birdfolk', 'chicken', 'pheasant', 'bright gallus', 'huden gallus', 'wisdom'],
          summary: 'Community-minded wildfowl who value honest work, gardening, hospitality, nature and strong bonds with their neighbors.',
          facts: [['Ability scores', '+2 Wisdom'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'Bright Gallus or Huden Gallus'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and Wing Flap', 'Simple-weapon training and one artisan’s tool', 'Deep knowledge of their own culture and community'] },
            { heading: 'Bright Gallus', text: '+1 Charisma. Proficient in Insight and able to inspire an ally with a d4 for their next check, attack or save.' },
            { heading: 'Huden Gallus', text: '+1 Dexterity. Proficient in Nature and able to exchange simple ideas with living plants through Seedspeech.' }
          ]
        },
        {
          title: 'Luma',
          kicker: 'Birdfolk · Peculiar in nature',
          tags: ['race', 'species', 'birdfolk', 'dove', 'pigeon', 'sable luma', 'sera luma', 'charisma', 'magic'],
          summary: 'Small, iridescent dove- and pigeon-folk whose unusual perspective can look like aloofness, luck, magical talent or inspired brilliance.',
          facts: [['Ability scores', '+2 Charisma'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'Sable Luma or Sera Luma'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide and Wing Flap', 'One sorcerer cantrip', 'Fated: reroll one attack, check or save per long rest'] },
            { heading: 'Sable Luma', text: '+1 Constitution. Difficult to read, skilled at deceiving non-lumas and resistant to poison.' },
            { heading: 'Sera Luma', text: '+1 Wisdom. Proficient in Performance and able to cast charm person through song once per long rest.' }
          ]
        },
        {
          title: 'Raptor',
          kicker: 'Birdfolk · Swift hunters',
          tags: ['race', 'species', 'birdfolk', 'hawk', 'eagle', 'maran raptor', 'mistral raptor', 'dexterity', 'archer'],
          summary: 'Keen-eyed hunters and naturalists who prize personal bonds, patience, self-reliance and accuracy over ceremony.',
          facts: [['Ability scores', '+2 Dexterity'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'Maran Raptor or Mistral Raptor'], ['Languages', 'Birdfolk; understands Auran']],
          sections: [
            { heading: 'Core traits', items: ['Glide, talons, and Perception proficiency', 'Longbow, shortbow, and spear training', 'Woodland Hunter reduces the benefit enemies gain from cover'] },
            { heading: 'Maran Raptor', text: '+1 Intelligence. A 25-foot swim speed and advantage on the first roll made as part of a readied action.' },
            { heading: 'Mistral Raptor', text: '+1 Wisdom. Proficient in Acrobatics; attackers have disadvantage while the raptor is falling, gliding or jumping.' }
          ]
        },
        {
          title: 'Strig',
          kicker: 'Birdfolk · Imposing yet kind',
          tags: ['race', 'species', 'birdfolk', 'owl', 'stout strig', 'swift strig', 'strength', 'darkvision'],
          summary: 'Powerful owl-folk known for endurance, fair play, freedom, hunting prowess and a willingness to protect those with less strength.',
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
          summary: 'Compassionate hedgehog-folk with a strong connection to the Great Rhythm, a gift for mediation and formidable protective quills.',
          facts: [['Ability scores', '+2 Charisma, +1 Wisdom'], ['Size · Speed', 'Small · 25 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Hedge']],
          sections: [
            { heading: 'Core traits', items: ['15-foot burrowing speed through soil', 'Quills provide 14 + Dexterity modifier AC instead of armor', 'Curl Up raises base AC to 19 and can damage missed melee attackers', 'Druidcraft, animal messenger and simple communication with bugs'] }
          ]
        },
        {
          title: 'Jerbeen',
          kicker: 'Humblefolk · Tiny yet brave',
          tags: ['race', 'species', 'humblefolk', 'mouse', 'dexterity', 'charisma', 'team tactics', 'help'],
          summary: 'Tiny mouse-folk whose courage, charm, long leaps and cooperative instincts become strongest when friends stand nearby.',
          facts: [['Ability scores', '+2 Dexterity, +1 Charisma'], ['Size · Speed', 'Small · 30 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Jerbeen']],
          sections: [
            { heading: 'Core traits', items: ['30-foot long jump and 15-foot high jump from a standstill', 'Can move through spaces occupied by larger creatures', 'Take Heart grants defensive advantages near a capable ally', 'Team Tactics allows the Help action as a bonus action'] }
          ]
        },
        {
          title: 'Mapach',
          kicker: 'Humblefolk · Cunning crafters',
          tags: ['race', 'species', 'humblefolk', 'raccoon', 'wisdom', 'constitution', 'scroungecraft', 'tinker'],
          summary: 'Resourceful raccoon-folk who climb, sneak, improvise and turn whatever happens to be nearby into surprisingly useful equipment.',
          facts: [['Ability scores', '+2 Wisdom, +1 Constitution'], ['Size · Speed', 'Medium · 30 ft.'], ['Subraces', 'None'], ['Languages', 'Birdfolk and Mapach']],
          sections: [
            { heading: 'Core traits', items: ['60-foot darkvision and a 20-foot climb speed', 'Poison resilience and stealth in dim light or darkness', 'Tinker’s tools proficiency', 'In 10 minutes, Scroungecraft makes a temporary common tool or piece of adventuring gear worth no more than 30 gp; it normally lasts 1 hour'] }
          ]
        },
        {
          title: 'Vulpin',
          kicker: 'Humblefolk · Sophisticated yet savage',
          tags: ['race', 'species', 'humblefolk', 'fox', 'intelligence', 'charisma', 'bite', 'magic'],
          summary: 'Ambitious fox-folk who combine intelligence, artistry, survival instinct, force of personality and an innate talent for beguiling magic.',
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
      description: 'Adventuring paths found throughout the Wood, including several local traditions.',
      entries: [
        {
          title: 'Adventuring Paths',
          kicker: 'Callings beyond ordinary life',
          tags: ['class', 'all classes', 'character creation', 'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'],
          summary: 'Every familiar adventuring class can be found in Humblewood. A calling may grow from personality, history and circumstance rather than perfect preparation.',
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
            { heading: 'Domain magic', text: 'The domain spell list includes several Humblewood spells tied to protection, fellowship and shared strength.' }
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
      description: 'Lives, reputations and communities that may precede a folk’s adventuring days.',
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
          summary: 'A former member of the Bandit Coalition carries old routes, old habits and unfinished ties to companions and enemies from a life of ambushing travelers.',
          facts: [['Skills', 'Deception and Survival'], ['Tools', 'Disguise kit and one gaming set or musical instrument'], ['Feature', 'Bandit Routes']],
          sections: [{ heading: 'Bandit Routes', text: 'Knowledge of hidden roads and escape paths allows a group to be guided through forested travel with unusual speed outside combat.' }]
        },
        {
          title: 'Grounded',
          kicker: 'Humblewood background · Birdfolk',
          tags: ['background', 'grounded', 'birdfolk', 'athletics', 'insight', 'forest floor'],
          summary: 'A Grounded birdfolk feels safer with solid earth beneath their feet. Other birdfolk may find this unusual, but the perspective often creates close ties with humblefolk communities.',
          facts: [['Skills', 'Athletics and Insight'], ['Feature', 'Find Another Path']],
          sections: [{ heading: 'Find Another Path', text: 'Familiarity with undergrowth aids the recall of forest-floor terrain, the discovery of routes around vertical obstacles and the search for natural shelter.' }]
        },
        {
          title: 'Wind-Touched',
          kicker: 'Humblewood background · Birdfolk',
          tags: ['background', 'wind-touched', 'birdfolk', 'acrobatics', 'performance', 'auran', 'wind'],
          summary: 'Special markings, a strange survival or local belief can mark a birdfolk as blessed by the wind and perhaps destined to soar above every obstacle.',
          facts: [['Skills', 'Acrobatics and Performance'], ['Language', 'Speaks and understands Auran'], ['Feature', 'Supernatural Presence']],
          sections: [{ heading: 'Supernatural Presence', text: 'A convincing display of power or skill associated with wind and air may leave believers inspired, supportive, reverent or even worshipful.' }]
        },
        {
          title: 'Place & Perception',
          kicker: 'Life in the Wood',
          tags: ['background', 'roleplay', 'birdfolk', 'humblefolk', 'outsider', 'character building'],
          summary: 'Folk and inherited traits can create belonging in one community while marking the same individual as an outsider in another.',
          sections: [{ heading: 'Common considerations', items: ['The place that feels most like home', 'The assumptions made by strangers', 'Attitudes toward birdfolk and humblefolk whose lives differ', 'Stereotypes that are embraced, rejected or complicated'] }]
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
          summary: 'Years of practice produce exceptional agility in the air, longer leaps and far greater control during a glide.',
          facts: [['Prerequisite', 'Glide trait'], ['Often learned by', 'Mobile birdfolk and aerial explorers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Long and high jumps no longer require a 10-foot run-up; Strength or Dexterity may be used and the normal distance is doubled',
              'The Dash action may be taken while gliding to travel up to one additional movement speed',
              'Direction may be changed freely while gliding, with up to 10 feet of altitude gained once before landing'
            ]
          }]
        },
        {
          title: 'Bandit Cunning',
          kicker: 'Feat · Read danger and opponents',
          tags: ['feat', 'bandit cunning', 'intelligence', 'saving throw', 'investigation', 'challenge rating', 'resistance', 'immunity'],
          summary: 'Bandit experience sharpens survival instincts and teaches careful study of dangerous opponents while a fight unfolds.',
          sections: [{
            heading: 'Benefits',
            items: [
              'A reaction may add the character’s Intelligence modifier to a saving throw; this ability refreshes after a long rest',
              'In combat, a creature seen fighting may be studied with an Intelligence (Investigation) check against DC 10 + its challenge rating',
              'On success, learn one resistance or immunity, condition immunity, damaging or defensive special ability, attack or reaction option, or special sense'
            ]
          }]
        },
        {
          title: 'Heavy Glider',
          kicker: 'Feat · Requires the Glide trait',
          tags: ['feat', 'heavy glider', 'glide', 'heavy armor', 'heavy weapon', 'strength', 'push', 'prone'],
          summary: 'Strength and training allow gliding under loads that would ground other birdfolk and can turn a landing into a weapon.',
          facts: [['Prerequisite', 'Glide trait'], ['Often learned by', 'Armored or heavy-weapon birdfolk']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Gliding remains possible while holding a heavy weapon and wearing heavy armor, provided the character is not encumbered',
              'Land in the space of a hostile Large or smaller creature and make an opposed Strength check',
              'On success, push it 10 feet and knock it prone; on failure, land in the nearest unoccupied space'
            ]
          }]
        },
        {
          title: 'Opportunistic Thief',
          kicker: 'Feat · Perfectly timed thievery',
          tags: ['feat', 'opportunistic thief', 'dexterity', 'sleight of hand', 'steal', 'pickpocket', 'melee'],
          summary: 'A missed swing or momentary distraction becomes a chance to lift an item before its owner realizes an opportunity existed.',
          facts: [['Ability increase', '+1 Dexterity'], ['Often learned by', 'Rogues, pickpockets and quick-handed characters']],
          sections: [{
            heading: 'Benefits',
            items: [
              'When a creature misses the character with a melee attack, a Dexterity (Sleight of Hand) check may be made against DC 10 + its Dexterity modifier',
              'On success, steal one item that the target is not holding or wearing',
              'After a successful out-of-combat theft, the object may immediately be concealed flawlessly or replaced with another possessed object'
            ]
          }]
        },
        {
          title: 'Perfect Landing',
          kicker: 'Feat · Fall with grace',
          tags: ['feat', 'perfect landing', 'dexterity', 'fall damage', 'prone', 'height'],
          summary: 'Life at great heights teaches how to absorb a fall, keep a steady footing and walk away from drops that would injure others.',
          facts: [['Ability increase', '+1 Dexterity'], ['Often learned by', 'Climbers, gliders and canopy adventurers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Fall damage uses d4s instead of d6s',
              'Taking fall damage does not knock the character prone',
              'Ignore damage from the first 30 feet of a fall'
            ]
          }]
        },
        {
          title: 'Speech of the Ancient Beasts',
          kicker: 'Feat · Kinship with great creatures',
          tags: ['feat', 'speech of the ancient beasts', 'charisma', 'beast', 'giant eagle', 'giant elk', 'giant owl', 'language'],
          summary: 'Great beasts recognize a familiar kinship in some folk, allowing conversation with legendary creatures and a gentler first meeting.',
          facts: [['Ability increase', '+1 Charisma'], ['Often learned by', 'Nature-focused characters and animal diplomats']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Large or larger beasts begin with a friendly disposition unless they have been attacked by the character',
              'Gain advantage on Charisma checks made against Large or larger beasts',
              'Speak and understand Giant Eagle, Giant Elk, and Giant Owl',
              'Any Large or larger beast can understand the character, although less intelligent beasts may grasp only simple ideas'
            ]
          }]
        },
        {
          title: 'Woodwise',
          kicker: 'Feat · At home in the wild',
          tags: ['feat', 'woodwise', 'survival', 'nature', 'difficult terrain', 'lost', 'forest'],
          summary: 'A lifetime among tangled woodland paths has made natural terrain feel readable, familiar, and easy to cross.',
          facts: [['Skill', 'Nature or Survival proficiency'], ['Often learned by', 'Guides, rangers and woodland travelers']],
          sections: [{
            heading: 'Benefits',
            items: [
              'Gain proficiency in either Nature or Survival',
              'Ignore difficult terrain',
              'The character cannot become lost in natural surroundings except through magical means'
            ]
          }]
        }
      ]
    },
    {
      id: 'spells',
      title: 'Humblewood Spells',
      icon: '✨',
      description: 'Ten spells shaped by the creatures, skies and deep roots of Humblewood.',
      entries: [
        {
          title: 'Ambush Prey',
          kicker: '2nd-level illusion',
          tags: ['spell', 'ranger', 'vulpin', 'illusion', 'invisible', 'stealth', 'damage'],
          summary: 'The caster becomes invisible while holding position, empowering the first attack against an unaware target.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 hour'], ['Components', 'S, M (a broken twig)'], ['Classes', 'Ranger']],
          sections: [
            { heading: 'Effect', text: 'The caster is invisible and has advantage on Dexterity (Stealth) checks to remain hidden. Moving 5 feet or more from the casting position ends the invisibility.' },
            { heading: 'Attack & damage', text: 'The caster’s first attack against a target unaware of their presence deals an extra 1d6 damage and ends the spell. Each slot level above 2nd adds another 1d6.' }
          ]
        },
        {
          title: 'Elevated Sight',
          kicker: '1st-level divination',
          tags: ['spell', 'cleric', 'druid', 'ranger', 'warlock', 'wizard', 'divination', 'sensor', 'vision'],
          summary: 'An invisible aerial sensor projects the caster’s sight into a mobile, 360-degree view from above.',
          facts: [['Casting', '1 action'], ['Range', 'Self; sensor up to 120 ft. above'], ['Duration', 'Concentration, up to 1 minute'], ['Components', 'V, S'], ['Classes', 'Cleric, Druid, Ranger, Warlock, Wizard']],
          sections: [{ heading: 'Effect', text: 'The sensor travels with the caster and its height can be adjusted as a bonus action. The caster is blind while looking through it but may switch between the sensor’s view and normal sight during a turn.' }]
        },
        {
          title: 'Feathered Reach',
          kicker: '3rd-level transmutation',
          tags: ['spell', 'druid', 'ranger', 'transmutation', 'wings', 'glide', 'jump', 'flight'],
          summary: 'The caster’s arms transform into wings that support bursts of flight, powerful jumps, safe falls and gliding movement.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 minute'], ['Components', 'S, M (a small feather)'], ['Classes', 'Druid, Ranger']],
          sections: [{ heading: 'Effect', items: ['Fly up to twice the caster’s movement as a bonus action, then land after the move', 'Rise up to half the caster’s movement once during a turn', 'Use a reaction while falling to glide up to the caster’s movement and avoid fall damage', 'Gain advantage on Athletics checks to jump and triple normal jump distance'] }, { heading: 'Limits', text: 'The caster’s hands must be free of shields and heavy weapons, and the caster cannot be encumbered.' }]
        },
        {
          title: 'Globe of Twilight',
          kicker: '3rd-level conjuration',
          tags: ['spell', 'druid', 'ranger', 'warlock', 'conjuration', 'twilight', 'stealth', 'blind'],
          summary: 'A star-speckled twilight surrounds the caster, concealing chosen creatures and dazzling everyone else.',
          facts: [['Casting', '1 action'], ['Range', 'Self · 15-ft. radius and height'], ['Duration', 'Concentration, up to 10 minutes'], ['Components', 'V, S, M (pitch and glittering sand)'], ['Classes', 'Druid, Ranger, Warlock']],
          sections: [{ heading: 'Effect', text: 'The sphere is lightly obscured and suppresses most light. Chosen creatures gain advantage on Stealth and may hide at any time. Other creatures have disadvantage on perception within the globe and must make a Wisdom save when entering or starting there or be blinded until the end of their turn.' }]
        },
        {
          title: 'Gust Barrier',
          kicker: 'Evocation cantrip',
          tags: ['spell', 'cantrip', 'bard', 'druid', 'sorcerer', 'wizard', 'evocation', 'ranged', 'push', 'prone'],
          summary: 'Defensive wind surrounds the caster, spoiling ranged attacks and throwing careless melee attackers backward.',
          facts: [['Casting', '1 action'], ['Range', 'Self'], ['Duration', '1 round'], ['Components', 'S'], ['Classes', 'Bard, Druid, Sorcerer, Wizard']],
          sections: [{ heading: 'Effect', text: 'Ranged attacks against the caster have disadvantage until the end of the caster’s next turn.' }, { heading: 'Attack response', text: 'A melee attacker that hits the caster must make a Constitution save. On a failure it is pushed up to 10 feet away and knocked prone.' }]
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
          sections: [{ heading: 'Effect & damage', text: 'When a melee attack hits the caster, its damage is reduced by 2d4 and the attacker takes that much piercing damage. Against ranged attacks the shield instead grants +2 AC as half cover. Each slot level above 1st adds 1d4.' }]
        },
        {
          title: 'Stellar Bodies',
          kicker: '4th-level evocation',
          tags: ['spell', 'cleric', 'druid', 'sorcerer', 'wizard', 'evocation', 'radiant', 'stars', 'blind', 'damage'],
          summary: 'Create two orbiting stars that punish nearby attackers or launch toward distant foes in blinding bursts.',
          facts: [['Casting', '1 action'], ['Range', 'Self; launched stars reach 120 ft.'], ['Duration', '1 minute'], ['Components', 'V, S'], ['Classes', 'Cleric, Druid, Sorcerer, Wizard']],
          sections: [{ heading: 'Defense', text: 'A creature within 5 feet that hits the caster with a melee attack must make a Wisdom save or take 1d8 radiant damage for each orbiting star.' }, { heading: 'Attack & damage', text: 'Once per round, the caster may use an action to expend a star and make a ranged spell attack within 120 feet. A hit deals 4d8 radiant damage; the target then makes a Constitution save or is blinded until the caster’s next turn.' }, { heading: 'Higher levels', text: 'One additional star is created for every two slot levels above 4th.' }]
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
