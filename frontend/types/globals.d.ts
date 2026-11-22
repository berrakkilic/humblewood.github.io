interface Window {
  HumblewoodAlmanac: HumblewoodAlmanacApi;
  HumblewoodAlmanacData: AlmanacCategory[];
  HumblewoodCharacterRules: CharacterRulesApi;
  HumblewoodCombatState: CombatStateApi;
  HumblewoodCreationPresets: CreationPresetsApi;
  HumblewoodMapGeometry: MapGeometryApi;
  HumblewoodPhbSpellPresets: { PHB_SPELL_PRESETS: CharacterSpell[] };
  HumblewoodRouter: HumblewoodRouterApi;
  HumblewoodOverlays: HumblewoodOverlaysApi;
}

interface AlmanacEntry {
  title: string;
  kicker?: string;
  tags?: string[];
  summary?: string;
  facts?: [string, string][];
  sections?: { heading: string; text?: string; items?: string[] }[];
  image?: { src: string; alt?: string; caption?: string };
  wide?: boolean;
  openByDefault?: boolean;
}

interface AlmanacCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  entries: AlmanacEntry[];
}

interface HumblewoodAlmanacApi {
  mount(categories: AlmanacCategory[], documentRoot?: Document): { render: () => void } | null;
}

interface CharacterRulesApi {
  AUTO_CLASS_FEATURES_START: string;
  AUTO_SPECIES_TRAITS_START: string;
  CLASS_SUBCLASSES: Record<string, string[]>;
  abilityModifier(score: number | string): number;
  automaticClassFeatureText(className: string | null, subclass?: string, level?: number | string): string;
  automaticSpeciesTraitText(species: string, subrace?: string): string;
  armorClass(input: { method: string; base?: number | string; bonus?: number | string; dex?: number | string; con?: number | string; wis?: number | string }): number | null;
  applyPlayerCharacterConstraints<T extends { fields: Record<string, string | boolean> }>(character: T): T;
  averageHitDieRoll(className: string): number;
  canonicalClass(value: string): string | null;
  canonicalSpecies(value: string, options?: { includeNpcOnly?: boolean }): string | null;
  classSavingThrows(className: string | null): AbilityKey[];
  defaultArmorMethod(species: string, className: string): string;
  hitDieFor(className: string): number;
  maximumSpellLevelFor(className: string, subclass: string, level: number | string): number;
  levelUpGains(input: { className: string; subclass: string; species: string; fromLevel: number; toLevel: number }): {
    level: number;
    asi: boolean;
    proficiencyIncrease: boolean;
    classFeatures: string[];
    subclassFeatures: string[];
    speciesFeatures: string[];
    cantripIncrease: boolean;
  }[];
  levelUpHitPointIncrease(className: string, oldConstitution: number, newConstitution: number, level: number, rolls: number[]): number;
  mergeAutomaticClassFeatures(existingText: string, automaticText: string): string;
  mergeAutomaticSpeciesTraits(existingText: string, automaticText: string): string;
  preparedSpellCount(className: string, level: number | string, abilityScore: number | string): number | null;
  proficiencyBonus(level: number | string): number;
  spellSlotsFor(className: string, subclass: string, level: number | string): number[];
  spellcastingAbilityFor(className: string | null, subclass?: string): string | null;
  spellcastingValues(abilityScore: number | string, level: number | string): { saveDc: number; attackBonus: number };
  speciesOptions(options?: { includeNpcOnly?: boolean }): string[];
  subclassesFor(className: string | null): string[];
  subracesFor(species: string | null, options?: { includeNpcOnly?: boolean }): string[];
  validatePlayerCharacter(character: { fields: Record<string, string | boolean> }): string | null;
}

interface CombatStateApi {
  setConditionBadges(entity: RoomToken, conditions: string[]): string[];
  setConditions(entity: RoomNpc, conditions: string[]): string[];
  toggleCondition(entity: RoomCharacter | RoomNpc | RoomToken, condition: string): string[];
}

interface CreationPresetsApi {
  ATTACK_PRESETS: { name: string; properties?: string }[];
  NPC_PRESETS: { id: string; name: string; source: string; statBlock: string }[];
  STANDARD_SPELL_PRESETS: CharacterSpell[];
  attackPresetValues(preset: { name: string; properties?: string }, scores: Record<string, string>, proficiency: string): Partial<CharacterAttack>;
  findSpellPreset(name: string, presets: CharacterSpell[]): CharacterSpell | undefined;
  parseStatBlock(text: string, options?: { name?: string; spellPresets?: CharacterSpell[] }): {
    error?: string;
    name: string;
    fields?: Record<string, string | boolean>;
    attacks?: unknown[];
    spells?: unknown[];
    challenge?: string;
  };
}

interface MapGeometryApi {
  clampScale(value: number): number;
  fitStageInViewport(input: { stageWidth: number; stageHeight: number; viewportWidth: number; viewportHeight: number; padding?: number }): { scale: number; pan: SocketPoint };
  gridMeasurement(start: SocketPoint, end: SocketPoint, gridSize: number, gridOffsetX?: number, gridOffsetY?: number): {
    horizontalSquares: number;
    verticalSquares: number;
    squares: number;
    feet: number;
    start: SocketPoint;
    end: SocketPoint;
  };
  positionStagePoint(input: { stagePoint: SocketPoint; anchor: SocketPoint; nextScale: number }): { scale: number; pan: SocketPoint };
  snapCoordinateToCell(value: number, gridSize: number, gridOffset?: number): number;
  zoomAroundPoint(input: { pan: SocketPoint; scale: number; nextScale: number; anchor: SocketPoint }): { scale: number; pan: SocketPoint };
}

interface HumblewoodRoute {
  path: string;
  title: string;
}

interface HumblewoodRouterApi {
  createRouter(options: {
    routes: Record<string, HumblewoodRoute>;
    onRoute: (viewName: string, route: HumblewoodRoute) => void;
  }): {
    current: string;
    navigate: (viewName: string) => void;
    start: () => void;
  };
}

interface HumblewoodOverlaysApi {
  createDialogController(dialog: HTMLDialogElement, options?: {
    onDismiss?: (reason: string, returnValue: string) => void;
    onOpen?: () => void;
    restoreFocus?: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
  }): {
    element: HTMLDialogElement;
    open: () => void;
    close: (reason?: string) => void;
    isOpen: () => boolean;
  };
  createPopoverController(popover: HTMLElement, options?: {
    mode?: 'auto' | 'manual';
    closeOnOutsideClick?: boolean;
  }): {
    element: HTMLElement;
    show: () => void;
    hide: () => void;
    toggle: () => void;
    isOpen: () => boolean;
  };
}

// Compatibility boundary for open-ended legacy payload fields. Replace this
// with named fields as their server contracts are formalized.
type LegacyRecord = Record<string, any>;

interface FrontendElementMap {
  'join-screen': HTMLElement;
  'name-field': HTMLElement;
  'name-input': HTMLInputElement;
  'role-dm': HTMLButtonElement;
  'role-player': HTMLButtonElement;
  'dm-pin-field': HTMLElement;
  'dm-pin-input': HTMLInputElement;
  'player-auth-fields': HTMLElement;
  'auth-login': HTMLButtonElement;
  'auth-register': HTMLButtonElement;
  'username-input': HTMLInputElement;
  'password-input': HTMLInputElement;
  'confirm-password-field': HTMLElement;
  'confirm-password-input': HTMLInputElement;
  'join-btn': HTMLButtonElement;
  'app': HTMLElement;
  'presence-list': HTMLElement;
  'topbar-roll-btn': HTMLButtonElement;
  'player-safety-btn': HTMLButtonElement;
  'player-question-btn': HTMLButtonElement;
  'dm-notifications-btn': HTMLButtonElement;
  'dm-notification-count': HTMLElement;
  'my-role-pill': HTMLElement;
  'topbar-logout-btn': HTMLButtonElement;
  'dm-notifications-panel': HTMLElement;
  'dm-notifications-mark-all': HTMLButtonElement;
  'dm-notifications-close': HTMLButtonElement;
  'dm-notifications-list': HTMLElement;
  'dm-notifications-clear-all': HTMLButtonElement;
  'view-map': HTMLElement;
  'map-sidebar': HTMLAnchorElement;
  'player-character-summary': HTMLElement;
  'dm-sidebar-overview': HTMLElement;
  'toggle-dm-sidebar-btn': HTMLButtonElement;
  'scene-dirty-indicator': HTMLElement;
  'dm-online-count': HTMLElement;
  'dm-online-list': HTMLElement;
  'dm-sidebar-details': HTMLElement;
  'accordion-scene': HTMLDetailsElement;
  'map-upload': HTMLInputElement;
  'clear-doodles-btn': HTMLButtonElement;
  'scene-name-input': HTMLInputElement;
  'save-scene-btn': HTMLButtonElement;
  'saved-scene-select': HTMLSelectElement;
  'load-scene-btn': HTMLButtonElement;
  'delete-scene-btn': HTMLButtonElement;
  'player-doodling-toggle': HTMLInputElement;
  'token-labels-toggle': HTMLInputElement;
  'fog-enabled-toggle': HTMLInputElement;
  'undo-fog-btn': HTMLButtonElement;
  'reset-fog-btn': HTMLButtonElement;
  'accordion-create-token': HTMLDetailsElement;
  'token-name': HTMLInputElement;
  'token-kind': HTMLSelectElement;
  'token-pronouns': HTMLInputElement;
  'npc-create-fields': HTMLElement;
  'npc-hp': HTMLInputElement;
  'npc-ac': HTMLInputElement;
  'npc-initiative': HTMLInputElement;
  'npc-attacks': HTMLTextAreaElement;
  'npc-notes': HTMLTextAreaElement;
  'token-image': HTMLInputElement;
  'add-token-btn': HTMLButtonElement;
  'cancel-npc-edit-btn': HTMLButtonElement;
  'accordion-tokens': HTMLDetailsElement;
  'token-list': HTMLElement;
  'accordion-npc-roster': HTMLDetailsElement;
  'npc-roster-filter-tools': HTMLElement;
  'npc-roster-search': HTMLInputElement;
  'npc-roster-race-filters': HTMLElement;
  'npc-roster-class-filter': HTMLSelectElement;
  'npc-roster-clear-filters': HTMLButtonElement;
  'npc-roster': HTMLElement;
  'map-stage-wrap': HTMLElement;
  'tool-move': HTMLButtonElement;
  'tool-pan': HTMLButtonElement;
  'tool-grid-move': HTMLButtonElement;
  'tool-ruler': HTMLButtonElement;
  'tool-ping': HTMLButtonElement;
  'doodle-corner-toggle': HTMLButtonElement;
  'tool-doodle': HTMLButtonElement;
  'tool-eraser': HTMLButtonElement;
  'doodle-color': HTMLInputElement;
  'undo-doodle-btn': HTMLButtonElement;
  'tool-fog-reveal': HTMLButtonElement;
  'tool-fog-hide': HTMLButtonElement;
  'time-of-day-select': HTMLSelectElement;
  'grid-toggle': HTMLInputElement;
  'grid-size': HTMLInputElement;
  'grid-color': HTMLInputElement;
  'snap-toggle': HTMLInputElement;
  'fit-token-toggle': HTMLInputElement;
  'grid-offset-reset': HTMLButtonElement;
  'map-time-indicator': HTMLElement;
  'map-time-icon': HTMLElement;
  'zoom-out': HTMLButtonElement;
  'zoom-level': HTMLElement;
  'zoom-in': HTMLButtonElement;
  'zoom-reset': HTMLButtonElement;
  'zoom-fit': HTMLButtonElement;
  'toggle-initiative-btn': HTMLButtonElement;
  'initiative-count': HTMLElement;
  'map-stage': HTMLElement;
  'map-image': HTMLImageElement;
  'grid-overlay': HTMLElement;
  'doodle-canvas': HTMLCanvasElement;
  'fog-canvas': HTMLCanvasElement;
  'map-area-selection': HTMLElement;
  'empty-map': HTMLElement;
  'doodle-corner': HTMLElement;
  'doodle-corner-drag-handle': HTMLElement;
  'doodle-corner-draw-btn': HTMLButtonElement;
  'doodle-corner-eraser-btn': HTMLButtonElement;
  'doodle-corner-color': HTMLInputElement;
  'doodle-corner-undo-btn': HTMLButtonElement;
  'doodle-corner-clear-btn': HTMLButtonElement;
  'doodle-corner-canvas': HTMLCanvasElement;
  'map-initiative-panel': HTMLAnchorElement;
  'init-round': HTMLElement;
  'init-name': HTMLInputElement;
  'init-value': HTMLInputElement;
  'init-add-btn': HTMLButtonElement;
  'init-quick-add': HTMLElement;
  'initiative-list': HTMLElement;
  'init-next-btn': HTMLButtonElement;
  'init-reset-btn': HTMLButtonElement;
  'view-characters': HTMLElement;
  'new-sheet-btn': HTMLButtonElement;
  'new-npc-sheet-btn': HTMLButtonElement;
  'char-grid': HTMLElement;
  'npc-directory-filter-tools': HTMLElement;
  'npc-directory-search': HTMLInputElement;
  'npc-directory-race-filters': HTMLElement;
  'npc-directory-class-filter': HTMLSelectElement;
  'npc-directory-filter-summary': HTMLElement;
  'npc-directory-clear-filters': HTMLButtonElement;
  'npc-sheet-grid': HTMLElement;
  'account-admin': HTMLElement;
  'refresh-accounts-btn': HTMLButtonElement;
  'account-list': HTMLElement;
  'reset-account-username': HTMLInputElement;
  'reset-account-password': HTMLInputElement;
  'reset-account-password-btn': HTMLButtonElement;
  'sheet-editor': HTMLElement;
  'delete-sheet-btn': HTMLButtonElement;
  'close-sheet-btn': HTMLButtonElement;
  'sheet-section-nav': HTMLElement;
  'sheet-form': HTMLFormElement;
  'npc-sheet-tools': HTMLElement;
  'npc-preset-combobox': HTMLElement;
  'npc-preset-search': HTMLInputElement;
  'npc-preset-list': HTMLElement;
  'npc-sheet-preset': HTMLSelectElement;
  'npc-sheet-preset-load': HTMLButtonElement;
  'npc-statblock-import': HTMLTextAreaElement;
  'npc-statblock-import-btn': HTMLButtonElement;
  'npc-statblock-clear-btn': HTMLButtonElement;
  'portrait-preview': HTMLElement;
  'sf-portrait': HTMLInputElement;
  'sf-name': HTMLInputElement;
  'sf-pronouns': HTMLInputElement;
  'sf-species': HTMLSelectElement;
  'sf-subrace': HTMLSelectElement;
  'sf-class': HTMLSelectElement;
  'sf-subclass': HTMLSelectElement;
  'sf-level': HTMLInputElement;
  'level-up-btn': HTMLButtonElement;
  'sf-background': HTMLInputElement;
  'sf-path': HTMLSelectElement;
  'sf-xp': HTMLInputElement;
  'sf-home': HTMLInputElement;
  'sf-faith': HTMLSelectElement;
  'sf-player': HTMLInputElement;
  'sf-hp': HTMLInputElement;
  'sf-maxhp': HTMLInputElement;
  'sf-temphp': HTMLInputElement;
  'sf-ac': HTMLInputElement;
  'sf-initiative': HTMLInputElement;
  'sf-speed': HTMLInputElement;
  'sf-prof-bonus': HTMLInputElement;
  'sf-inspiration': HTMLInputElement;
  'sf-hitdice': HTMLInputElement;
  'sf-hitdice-left': HTMLInputElement;
  'sf-passive-perception': HTMLInputElement;
  'sf-size': HTMLSelectElement;
  'sf-ac-method': HTMLSelectElement;
  'sf-ac-base': HTMLInputElement;
  'sf-ac-bonus': HTMLInputElement;
  'sf-death-success-1': HTMLInputElement;
  'sf-death-success-2': HTMLInputElement;
  'sf-death-success-3': HTMLInputElement;
  'sf-death-fail-1': HTMLInputElement;
  'sf-death-fail-2': HTMLInputElement;
  'sf-death-fail-3': HTMLInputElement;
  'sf-str': HTMLInputElement;
  'mod-str': HTMLElement;
  'sf-dex': HTMLInputElement;
  'mod-dex': HTMLElement;
  'sf-con': HTMLInputElement;
  'mod-con': HTMLElement;
  'sf-int': HTMLInputElement;
  'mod-int': HTMLElement;
  'sf-wis': HTMLInputElement;
  'mod-wis': HTMLElement;
  'sf-cha': HTMLInputElement;
  'mod-cha': HTMLElement;
  'ability-saving-throws': HTMLElement;
  'sf-save-str-prof': HTMLInputElement;
  'sf-save-str': HTMLInputElement;
  'sf-save-dex-prof': HTMLInputElement;
  'sf-save-dex': HTMLInputElement;
  'sf-save-con-prof': HTMLInputElement;
  'sf-save-con': HTMLInputElement;
  'sf-save-int-prof': HTMLInputElement;
  'sf-save-int': HTMLInputElement;
  'sf-save-wis-prof': HTMLInputElement;
  'sf-save-wis': HTMLInputElement;
  'sf-save-cha-prof': HTMLInputElement;
  'sf-save-cha': HTMLInputElement;
  'sf-skill-acrobatics-prof': HTMLInputElement;
  'sf-skill-acrobatics': HTMLInputElement;
  'sf-skill-animal-prof': HTMLInputElement;
  'sf-skill-animal': HTMLInputElement;
  'sf-skill-arcana-prof': HTMLInputElement;
  'sf-skill-arcana': HTMLInputElement;
  'sf-skill-athletics-prof': HTMLInputElement;
  'sf-skill-athletics': HTMLInputElement;
  'sf-skill-deception-prof': HTMLInputElement;
  'sf-skill-deception': HTMLInputElement;
  'sf-skill-history-prof': HTMLInputElement;
  'sf-skill-history': HTMLInputElement;
  'sf-skill-insight-prof': HTMLInputElement;
  'sf-skill-insight': HTMLInputElement;
  'sf-skill-intimidation-prof': HTMLInputElement;
  'sf-skill-intimidation': HTMLInputElement;
  'sf-skill-investigation-prof': HTMLInputElement;
  'sf-skill-investigation': HTMLInputElement;
  'sf-skill-medicine-prof': HTMLInputElement;
  'sf-skill-medicine': HTMLInputElement;
  'sf-skill-nature-prof': HTMLInputElement;
  'sf-skill-nature': HTMLInputElement;
  'sf-skill-perception-prof': HTMLInputElement;
  'sf-skill-perception': HTMLInputElement;
  'sf-skill-performance-prof': HTMLInputElement;
  'sf-skill-performance': HTMLInputElement;
  'sf-skill-persuasion-prof': HTMLInputElement;
  'sf-skill-persuasion': HTMLInputElement;
  'sf-skill-religion-prof': HTMLInputElement;
  'sf-skill-religion': HTMLInputElement;
  'sf-skill-sleight-prof': HTMLInputElement;
  'sf-skill-sleight': HTMLInputElement;
  'sf-skill-stealth-prof': HTMLInputElement;
  'sf-skill-stealth': HTMLInputElement;
  'sf-skill-survival-prof': HTMLInputElement;
  'sf-skill-survival': HTMLInputElement;
  'attack-add-btn': HTMLButtonElement;
  'attack-add-form': HTMLElement;
  'attack-preset-combobox': HTMLElement;
  'attack-preset-search': HTMLInputElement;
  'attack-preset-list': HTMLElement;
  'attack-preset-select': HTMLSelectElement;
  'attack-preset-load': HTMLButtonElement;
  'attack-form-name': HTMLInputElement;
  'attack-form-bonus': HTMLInputElement;
  'attack-form-damage': HTMLInputElement;
  'attack-form-details': HTMLTextAreaElement;
  'attack-form-save': HTMLButtonElement;
  'attack-form-cancel': HTMLButtonElement;
  'attack-list': HTMLElement;
  'sf-attacks-notes': HTMLTextAreaElement;
  'bonus-action-combobox': HTMLElement;
  'bonus-action-preset-search': HTMLInputElement;
  'bonus-action-preset-list': HTMLElement;
  'bonus-action-preset-select': HTMLSelectElement;
  'bonus-action-preset-add': HTMLButtonElement;
  'sf-bonus-actions': HTMLTextAreaElement;
  'reaction-add-btn': HTMLButtonElement;
  'reaction-add-form': HTMLElement;
  'reaction-preset-combobox': HTMLElement;
  'reaction-preset-search': HTMLInputElement;
  'reaction-preset-list': HTMLElement;
  'reaction-preset-select': HTMLSelectElement;
  'reaction-preset-load': HTMLButtonElement;
  'reaction-form-name': HTMLInputElement;
  'reaction-form-requirement': HTMLInputElement;
  'reaction-form-resource': HTMLInputElement;
  'reaction-form-source': HTMLInputElement;
  'reaction-form-trigger': HTMLTextAreaElement;
  'reaction-form-effect': HTMLTextAreaElement;
  'reaction-form-save': HTMLButtonElement;
  'reaction-form-cancel': HTMLButtonElement;
  'reaction-list': HTMLElement;
  'sf-languages': HTMLTextAreaElement;
  'sf-armor-prof': HTMLTextAreaElement;
  'sf-weapon-prof': HTMLTextAreaElement;
  'sf-other-prof': HTMLTextAreaElement;
  'sf-cp': HTMLInputElement;
  'sf-sp': HTMLInputElement;
  'sf-ep': HTMLInputElement;
  'sf-gp': HTMLInputElement;
  'sf-pp': HTMLInputElement;
  'inventory-list': HTMLElement;
  'inv-item-name': HTMLInputElement;
  'inv-item-qty': HTMLInputElement;
  'inv-item-location': HTMLSelectElement;
  'inv-item-container': HTMLSelectElement;
  'inv-item-is-container': HTMLInputElement;
  'inv-add-btn': HTMLButtonElement;
  'inv-item-description': HTMLTextAreaElement;
  'inv-item-usage-max': HTMLInputElement;
  'inv-item-usage-reset': HTMLSelectElement;
  'sf-treasure': HTMLTextAreaElement;
  'sf-racial-traits': HTMLTextAreaElement;
  'sf-features': HTMLTextAreaElement;
  'feat-preset-combobox': HTMLElement;
  'feat-preset-search': HTMLInputElement;
  'feat-preset-list': HTMLElement;
  'feat-preset-select': HTMLSelectElement;
  'feat-preset-add': HTMLButtonElement;
  'feature-usage-editor': HTMLElement;
  'feature-use-name': HTMLInputElement;
  'feature-use-max': HTMLInputElement;
  'feature-use-reset': HTMLSelectElement;
  'feature-use-add': HTMLButtonElement;
  'sf-feats': HTMLTextAreaElement;
  'sf-spell-class': HTMLInputElement;
  'sf-spell-ability': HTMLSelectElement;
  'sf-spell-dc': HTMLInputElement;
  'sf-spell-attack': HTMLInputElement;
  'sf-spells-prepared': HTMLInputElement;
  'sf-spell-slots-1': HTMLInputElement;
  'sf-spell-used-1': HTMLInputElement;
  'sf-spell-slots-2': HTMLInputElement;
  'sf-spell-used-2': HTMLInputElement;
  'sf-spell-slots-3': HTMLInputElement;
  'sf-spell-used-3': HTMLInputElement;
  'sf-spell-slots-4': HTMLInputElement;
  'sf-spell-used-4': HTMLInputElement;
  'sf-spell-slots-5': HTMLInputElement;
  'sf-spell-used-5': HTMLInputElement;
  'sf-spell-slots-6': HTMLInputElement;
  'sf-spell-used-6': HTMLInputElement;
  'sf-spell-slots-7': HTMLInputElement;
  'sf-spell-used-7': HTMLInputElement;
  'sf-spell-slots-8': HTMLInputElement;
  'sf-spell-used-8': HTMLInputElement;
  'sf-spell-slots-9': HTMLInputElement;
  'sf-spell-used-9': HTMLInputElement;
  'sf-spell-list': HTMLInputElement;
  'spell-add-btn': HTMLButtonElement;
  'spell-add-form': HTMLElement;
  'spell-preset-combobox': HTMLElement;
  'spell-preset-search': HTMLInputElement;
  'spell-preset-list': HTMLElement;
  'spell-preset-select': HTMLSelectElement;
  'spell-preset-load': HTMLButtonElement;
  'spell-bulk-list': HTMLTextAreaElement;
  'spell-bulk-add': HTMLButtonElement;
  'spell-form-name': HTMLInputElement;
  'spell-form-level': HTMLSelectElement;
  'spell-form-school': HTMLInputElement;
  'spell-form-range': HTMLInputElement;
  'spell-form-casting-time': HTMLInputElement;
  'spell-form-duration': HTMLInputElement;
  'spell-form-attack': HTMLInputElement;
  'spell-form-damage': HTMLInputElement;
  'spell-form-components': HTMLInputElement;
  'spell-form-effect': HTMLTextAreaElement;
  'spell-form-always-prepared': HTMLInputElement;
  'spell-form-save': HTMLButtonElement;
  'spell-form-cancel': HTMLButtonElement;
  'spell-list': HTMLElement;
  'sf-spell-notes': HTMLTextAreaElement;
  'sf-trait': HTMLTextAreaElement;
  'sf-ideal': HTMLTextAreaElement;
  'sf-bond': HTMLTextAreaElement;
  'sf-flaw': HTMLTextAreaElement;
  'sf-age': HTMLInputElement;
  'sf-height': HTMLInputElement;
  'sf-weight': HTMLInputElement;
  'sf-eyes': HTMLInputElement;
  'sf-coloring': HTMLInputElement;
  'sf-appearance': HTMLInputElement;
  'sf-allies': HTMLTextAreaElement;
  'sf-notes': HTMLTextAreaElement;
  'save-sheet-btn': HTMLButtonElement;
  'view-almanac': HTMLElement;
  'almanac-search': HTMLInputElement;
  'almanac-search-clear': HTMLButtonElement;
  'almanac-results': HTMLElement;
  'almanac-open-all': HTMLButtonElement;
  'almanac-close-all': HTMLButtonElement;
  'almanac-categories': HTMLElement;
  'almanac-empty': HTMLElement;
  'view-jukebox': HTMLElement;
  'jukebox-art': HTMLElement;
  'now-playing': HTMLElement;
  'now-playing-sub': HTMLElement;
  'jb-prev': HTMLButtonElement;
  'jb-playpause': HTMLButtonElement;
  'jb-next': HTMLButtonElement;
  'jukebox-volume-icon': HTMLElement;
  'jukebox-volume-value': HTMLOutputElement;
  'jukebox-volume': HTMLInputElement;
  'audio-el': HTMLAudioElement;
  'playlist': HTMLElement;
  'track-preset-combobox': HTMLElement;
  'track-preset-search': HTMLInputElement;
  'track-preset-list': HTMLElement;
  'track-preset-select': HTMLSelectElement;
  'track-title': HTMLInputElement;
  'track-url': HTMLInputElement;
  'track-file': HTMLInputElement;
  'add-track-btn': HTMLButtonElement;
  'stored-track-list': HTMLElement;
  'view-library': HTMLElement;
  'library-file-input': HTMLInputElement;
  'library-upload-btn': HTMLButtonElement;
  'library-add-session0-btn': HTMLButtonElement;
  'library-new-folder-btn': HTMLButtonElement;
  'library-folder-count': HTMLElement;
  'library-folder-list': HTMLElement;
  'library-broadcast-duration': HTMLSelectElement;
  'library-file-list': HTMLElement;
  'view-dice': HTMLElement;
  'dm-private-roll-toggle': HTMLButtonElement;
  'dm-private-roll-banner': HTMLElement;
  'dice-character': HTMLSelectElement;
  'dice-roll-mode-label': HTMLElement;
  'dice-roll-mode-hint': HTMLElement;
  'character-roll-options': HTMLElement;
  'dice-count': HTMLInputElement;
  'dice-sides': HTMLInputElement;
  'dice-mod': HTMLInputElement;
  'roll-custom-btn': HTMLButtonElement;
  'roll-log': HTMLElement;
  'toast': HTMLElement;
  'player-question-overlay': HTMLElement;
  'player-question-close': HTMLButtonElement;
  'player-question-form': HTMLFormElement;
  'player-question-input': HTMLTextAreaElement;
  'player-question-anonymous': HTMLInputElement;
  'player-question-cancel': HTMLButtonElement;
  'player-question-submit': HTMLButtonElement;
  'shared-handout-overlay': HTMLDialogElement;
  'shared-handout-timer': HTMLElement;
  'shared-handout-stop-btn': HTMLButtonElement;
  'shared-handout-content': HTMLElement;
  'shared-handout-reopen-btn': HTMLButtonElement;
  'level-up-overlay': HTMLElement;
  'level-up-close-btn': HTMLButtonElement;
  'level-up-hp-rows': HTMLElement;
  'level-up-current-hp': HTMLInputElement;
  'level-up-asi-card': HTMLElement;
  'level-up-asi-rows': HTMLElement;
  'level-up-summary': HTMLElement;
  'level-up-cancel-btn': HTMLButtonElement;
  'level-up-apply-btn': HTMLButtonElement;
  'combat-overlay': HTMLElement;
  'combat-portrait': HTMLElement;
  'combat-close-btn': HTMLButtonElement;
  'combat-rage-section': HTMLElement;
  'combat-rage-state': HTMLElement;
  'combat-rage-toggle': HTMLButtonElement;
  'combat-feature-uses-section': HTMLElement;
  'combat-feature-uses': HTMLElement;
  'combat-movement': HTMLElement;
  'combat-amount': HTMLInputElement;
  'combat-damage-type': HTMLSelectElement;
  'combat-damage-btn': HTMLButtonElement;
  'combat-heal-btn': HTMLButtonElement;
  'combat-temp-btn': HTMLButtonElement;
  'combat-roll-mode': HTMLSelectElement;
  'combat-initiative-roll': HTMLButtonElement;
  'combat-strength-check': HTMLButtonElement;
  'combat-strength-save': HTMLButtonElement;
  'combat-spell-attack-roll': HTMLButtonElement;
  'combat-spell-dc': HTMLElement;
  'combat-attacks': HTMLElement;
  'combat-spells': HTMLElement;
  'combat-bonus-actions-section': HTMLElement;
  'combat-reactions-section': HTMLElement;
  'combat-reaction-state': HTMLElement;
  'combat-reaction-refresh-btn': HTMLButtonElement;
  'combat-reactions': HTMLElement;
  'combat-concentration': HTMLInputElement;
  'combat-conditions': HTMLElement;
  'combat-death-section': HTMLElement;
  'combat-concentration-roll': HTMLButtonElement;
  'combat-spell-slots-section': HTMLElement;
  'combat-restore-slots-btn': HTMLButtonElement;
  'combat-spell-slots': HTMLElement;
  'combat-long-rest-btn': HTMLButtonElement;
  'spell-preparation-overlay': HTMLElement;
  'spell-preparation-close-btn': HTMLButtonElement;
  'spell-preparation-search': HTMLInputElement;
  'spell-preparation-list': HTMLElement;
  'spell-preparation-complete-btn': HTMLButtonElement;
}

type FrontendElementForId<K extends string> =
  K extends keyof FrontendElementMap ? FrontendElementMap[K] :
  K extends `sf-save-${string}-prof` | `sf-skill-${string}-prof` ? HTMLInputElement :
  K extends `sf-${string}` ? HTMLInputElement :
  K extends `mod-${string}` ? HTMLElement :
  HTMLElement;


interface RoomScene extends LegacyRecord {
  mapUrl: string | null;
  mapName: string;
  gridSize?: number;
  gridOffsetX?: number;
  gridOffsetY?: number;
  gridColor?: string;
  gridVisible?: boolean;
  snapToGrid?: boolean;
  fitTokensToGrid?: boolean;
  timeOfDay?: 'morning' | 'afternoon' | 'night';
  fogEnabled?: boolean;
  fogShapes: SocketFogShape[];
  doodlePaths: SocketDoodlePath[];
  doodleCornerPaths: SocketDoodlePath[];
  playerDoodlingEnabled?: boolean;
  showTokenLabelsToPlayers?: boolean;
}

interface RoomToken extends LegacyRecord {
  id: string;
  label: string;
  kind: 'pc' | 'npc' | 'item';
  x: number;
  y: number;
  visibleToPlayers: boolean;
  canControl?: boolean;
  pronouns?: string;
  characterName?: string;
  npcId?: string;
  imageUrl?: string;
  initiativeModifier?: number;
  attacks?: RollableAttack[];
  notes?: string;
  spells?: CharacterSpell[];
  reactions?: CharacterReaction[];
  spellcasting?: { attackBonus?: number | string; saveDc?: number | string };
  hp?: number;
  maxHp?: number;
  size?: number;
  sizeScale?: number;
  combat?: TokenCombatState;
  conditionBadges?: TokenCombatState;
}

interface RoomCharacter extends LegacyRecord {
  name: string;
  ownerUsername?: string | null;
  canManage?: boolean;
  pronouns?: string;
  combat?: TokenCombatState;
  level?: number;
  charClass?: string;
  initiativeModifier?: number;
  abilities?: Partial<Record<AbilityKey, number>>;
  saves?: Partial<Record<AbilityKey, { modifier?: number; proficient?: boolean }>>;
  skills?: Partial<Record<SkillName, { modifier?: number; proficient?: boolean }>>;
  attacks?: RollableAttack[];
  reactions?: CharacterReaction[];
  spells?: CharacterSpell[];
  spellcasting?: { attackBonus?: number | string };
  fields?: Record<string, string | number | boolean>;
}

interface RollableAttack {
  name: string;
  bonus: string;
  damage: string;
  details?: string;
}

interface ActiveCombatTarget {
  type: 'character' | 'npc';
  id: string;
}

interface TokenCombatState extends LegacyRecord {
  conditions?: string[];
  concentration?: boolean;
  exhaustion?: number;
  dead?: boolean;
  stable?: boolean;
  deathSaves?: { successes?: number; failures?: number };
  spellSlots?: Record<string, { total: number; used: number }>;
  rage?: { active?: boolean; maxUses?: number; used?: number };
  featureUses?: FeatureUse[];
  reactionAvailable?: boolean;
}

interface CharacterSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  range: string;
  castingTime: string;
  duration: string;
  components: string;
  attack: string;
  damage: string;
  effect: string;
  source: string;
  prepared?: boolean;
  alwaysPrepared?: boolean;
}

interface RoomNpc extends LegacyRecord {
  id: string;
  name: string;
  initiativeModifier?: number;
  attacks?: RollableAttack[];
  spells?: CharacterSpell[];
  reactions?: CharacterReaction[];
  sheet?: Partial<RoomCharacter> & LegacyRecord;
  combat?: TokenCombatState;
}

interface JukeboxTrack extends LegacyRecord {
  id: string;
  title: string;
  url: string;
  source?: string;
}

interface SocketInitiativeEntry {
  id: string;
  name: string;
  value: number;
  tokenId: string | null;
}

interface SocketInitiativeState {
  entries: SocketInitiativeEntry[];
  round: number;
  currentIndex: number;
}

interface SocketSavedScene {
  name: string;
  mapName: string;
  tokenCount: number;
  savedAt: number;
}

interface SocketLibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
}

interface SocketLibraryFile extends SocketLibraryFilePayload {
  id: string;
  name: string;
  kind: string;
  url: string;
  folderId: string | null;
}

interface SocketLibraryBroadcast {
  fileId: string;
  name: string;
  kind: string;
  url: string;
  expiresAt: number;
  startedAt?: number;
}

interface SocketLibraryState {
  folders: SocketLibraryFolder[];
  files: SocketLibraryFile[];
  broadcast: SocketLibraryBroadcast | null;
}

interface SocketNotification {
  id: string;
  type: 'question' | 'safety';
  createdAt: number;
  read: boolean;
  anonymous: boolean;
  senderName: string | null;
  question: string;
}

interface SocketRollEntry {
  id: string;
  name: string;
  characterName: string | null;
  npcId: string | null;
  label: string;
  expression: string;
  count: number;
  sides: number;
  rolls: number[];
  rollSets: number[][];
  rollSetTotals: number[];
  keptRolls: number[] | null;
  keptSetIndex: number | null;
  kept: number | null;
  mode: 'normal' | 'advantage' | 'disadvantage';
  modifier: number;
  total: number;
  targetDc?: number;
  success?: boolean;
  private?: boolean;
  ts: number;
}

interface SocketShopPurchaseResult {
  requestId: string;
  itemId: string;
  ok: boolean;
  message: string;
  characterName?: string;
  stock?: number | null;
}

interface RoomState extends LegacyRecord {
  scene: RoomScene;
  tokens: RoomToken[];
  characters: Record<string, RoomCharacter>;
  npcs: Record<string, RoomNpc>;
  savedScenes: SocketSavedScene[];
  jukebox: LegacyRecord & { playlist: JukeboxTrack[]; currentIndex: number };
  library: SocketLibraryState;
  notifications: SocketNotification[];
  rollLog: SocketRollEntry[];
  initiative: SocketInitiativeState;
}

interface OnlineUser extends LegacyRecord {
  id: string;
  name: string;
  role: 'dm' | 'player';
  connections: number;
}

interface SocketPoint {
  x: number;
  y: number;
}

interface SocketDoodlePath {
  id?: string;
  points: SocketPoint[];
  color?: string;
  width?: number;
}

interface SocketFogShape {
  mode: 'reveal' | 'hide';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SocketTokenUpdate {
  id: string;
  hp?: number;
  maxHp?: number;
  visibleToPlayers?: boolean;
  sizeScale?: number;
  [key: string]: unknown;
}

interface SocketSceneGridUpdate {
  gridSize?: number;
  gridVisible?: boolean;
  gridColor?: string;
  snapToGrid?: boolean;
  fitTokensToGrid?: boolean;
  gridOffsetX?: number;
  gridOffsetY?: number;
}

interface SocketLibraryFilePayload {
  id?: string;
  fileId?: string;
  name?: string;
  folderId?: string | null;
  kind?: string;
  url?: string;
  size?: number;
  duration?: number;
  mimeType?: string;
}

interface SocketRollRequest {
  count: number;
  sides: number;
  modifier: number;
  label?: string;
  characterName?: string;
  name?: string;
  npcId?: string | null;
  initiativeName?: string | null;
  tokenId?: string | null;
  targetDc?: number | null;
  concentrationFor?: string | null;
  mode?: string;
  private?: boolean;
}

type FrontendSocketEvents = {
  'state:full': [RoomState];
  'scene:update': [RoomScene];
  'token:add': [RoomToken];
  'token:update': [RoomToken];
  'token:move': [{ id: string; x: number; y: number }];
  'token:remove': [{ id: string }];
  'library:update': [SocketLibraryState];
  'library:broadcast': [SocketLibraryBroadcast | null];
  'jukebox:update': [RoomState['jukebox']];
  'initiative:update': [SocketInitiativeState];
  'presence:list': [OnlineUser[]];
  'accounts:update': [{ username: string; displayName: string; createdAt: number }[]];
  'roll:made': [SocketRollEntry];
  'roll:private': [SocketRollEntry];
  'action:denied': [{ message?: string }];
  'connect': [];
  'disconnect': [];
  'session:resume': [];
  'accounts:list': [];
  'initiative:next': [];
  'initiative:reset': [];
  'notifications:markAllRead': [];
  'safety:request': [];
  'puzzle:request': [];
  'library:broadcast:clear': [];
  'scene:doodleCorner:undo': [];
  'scene:doodleCorner:clear': [];
  'identify:result': [{ ok: boolean; message?: string; role?: 'dm' | 'player'; name?: string; username?: string }];
  'session:result': [{ ok: boolean; message?: string }];
  'scene:dirty': [{ dirty: boolean }];
  'scene:fog:update': [{ enabled: boolean; shapes: SocketFogShape[] }];
  'scenes:update': [SocketSavedScene[]];
  'scene:active': [{ name?: string | null }];
  'scene:saved': [{ name: string }];
  'scene:loaded': [{ name: string }];
  'scene:deleted': [{ name: string }];
  'npcs:update': [Record<string, RoomNpc>];
  'character:update': [RoomCharacter];
  'character:remove': [{ name: string }];
  'character:denied': [{ name?: string }];
  'npc:saved': [{ id: string; name: string }];
  'npc:deleted': [{ id: string; name: string }];
  'token:exists': [RoomToken];
  'concentration:required': [{ name: string; damage: number; dc: number }];
  'shop:stock:update': [Record<string, number>];
  'shop:purchase:result': [SocketShopPurchaseResult];
  'presence': [{ role: 'dm' | 'player'; name: string; connected: boolean }];
  'pointer:move': [SocketPoint & { id: string; name?: string }];
  'pointer:hide': [{ id: string }];
  'pointer:ping': [SocketPoint & { id: string; name?: string }];
  'safety:submitted': [{ cooldown?: boolean; breakMinutes?: number }];
  'question:submitted': [];
  'notifications:update': [SocketNotification[]];
  'account:passwordReset': [{ username: string }];
  'puzzle:update': [{ fileId: string; state: Record<string, unknown> | null; updatedAt: number }];
  'scene:doodle:add': [SocketDoodlePath];
  'scene:doodle:clear': [];
  'scene:doodle:redrawAll': [SocketDoodlePath[]];
  'scene:doodleCorner:add': [SocketDoodlePath];
  'scene:doodleCorner:redrawAll': [SocketDoodlePath[]];
};

type FrontendSocketEmitEvents = {
  'identify': [{ role: 'dm' | 'player'; name?: string; username?: string; password?: string; pin?: string }];
  'session:resume': [];
  'accounts:list': [];
  'account:resetPassword': [{ username: string; password: string }];
  'scene:setMap': [{ mapUrl: string | null; mapName: string }];
  'scene:setGrid': [SocketSceneGridUpdate];
  'scene:setTimeOfDay': [{ timeOfDay: string }];
  'scene:save': [{ name: string }];
  'scene:load': [{ name: string }];
  'scene:delete': [{ name: string }];
  'scene:setPlayerDoodling': [{ enabled: boolean }];
  'scene:setTokenLabels': [{ visible: boolean }];
  'scene:setFog': [{ enabled: boolean }];
  'scene:fog:add': [{ mode: string; x: number; y: number; width: number; height: number }];
  'scene:fog:undo': [];
  'scene:fog:reset': [];
  'scene:doodle:add': [SocketDoodlePath];
  'scene:doodle:erase': [SocketPoint];
  'scene:doodle:undo': [];
  'scene:doodle:clear': [];
  'scene:doodleCorner:add': [SocketDoodlePath];
  'scene:doodleCorner:redrawAll': [SocketDoodlePath[]];
  'scene:doodleCorner:erase': [SocketPoint];
  'scene:doodleCorner:undo': [];
  'scene:doodleCorner:clear': [];
  'token:add': [Partial<RoomToken> & { characterName?: string; npcId?: string }];
  'token:update': [SocketTokenUpdate];
  'token:move': [{ id: string; x: number; y: number }];
  'token:remove': [{ id: string }];
  'token:duplicate': [{ id: string }];
  'token:combat:update': [{ id: string; action: string; [key: string]: unknown }];
  'npc:place': [{ id: string }];
  'npc:delete': [{ id: string }];
  'character:save': [Record<string, unknown>];
  'character:remove': [{ name: string }];
  'character:claim': [{ name: string }];
  'character:ownership:release': [{ name: string }];
  'character:combat:update': [{ name: string; action: string; [key: string]: unknown }];
  'npc:create': [Record<string, unknown>];
  'npc:update': [Record<string, unknown>];
  'initiative:add': [{ name: string; value: number; tokenId: string | null }];
  'initiative:edit': [{ id: string; value: number }];
  'initiative:remove': [{ id: string }];
  'initiative:reorder': [{ orderedIds: string[] }];
  'initiative:next': [];
  'initiative:reset': [];
  'jukebox:setPlaylist': [JukeboxTrack[]];
  'jukebox:play': [{ index: number }];
  'jukebox:pause': [];
  'jukebox:resume': [];
  'library:folder:create': [{ name: string; parentId: string | null }];
  'library:folder:rename': [{ id: string; name: string }];
  'library:folder:delete': [{ id: string }];
  'library:file:add': [SocketLibraryFilePayload];
  'library:file:rename': [{ id: string; name: string }];
  'library:file:move': [{ id: string; folderId: string | null }];
  'library:file:delete': [{ id: string }];
  'library:broadcast': [{ fileId: string; duration: number }];
  'library:broadcast:clear': [];
  'notifications:markRead': [{ id: string }];
  'notifications:markAllRead': [];
  'notifications:clear': [{ id: string }];
  'notifications:clearAll': [];
  'safety:request': [];
  'question:submit': [{ question: string; anonymous: boolean }];
  'puzzle:request': [];
  'puzzle:update': [{ fileId: string; state: Record<string, unknown> }];
  'shop:purchase': [{ requestId: string; itemId: string; characterName: string }];
  'pointer:move': [SocketPoint];
  'pointer:ping': [SocketPoint];
  'pointer:hide': [];
  'roll:make': [SocketRollRequest];
};

interface SocketLike {
  on<K extends keyof FrontendSocketEvents>(event: K, handler: (...args: FrontendSocketEvents[K]) => void): this;
  off<K extends keyof FrontendSocketEvents>(event: K, handler?: (...args: FrontendSocketEvents[K]) => void): this;
  emit<K extends keyof FrontendSocketEmitEvents>(event: K, ...args: FrontendSocketEmitEvents[K]): this;
  connect(): this;
  disconnect(): this;
}

declare function io(options?: Record<string, unknown>): SocketLike;

// Event delegation in the legacy UI intentionally starts at EventTarget. The
// handlers guard their selectors at runtime before using the returned element.
interface EventTarget {
  closest(selectors: string): Element | null;
}

interface ParentNode {
  querySelector<E extends Element = HTMLElement>(selectors: string): E | null;
  querySelectorAll<E extends Element = HTMLElement>(selectors: string): NodeListOf<E>;
}
