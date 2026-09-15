/** Shared browser dependencies, application state, and constants. */

const socket = io({ autoConnect: false });
const {
  clampScale,
  fitStageInViewport,
  gridMeasurement,
  positionStagePoint,
  snapCoordinateToCell,
  zoomAroundPoint
} = window.HumblewoodMapGeometry;
const combatState = window.HumblewoodCombatState;
const characterRules = window.HumblewoodCharacterRules;
const creationPresets = window.HumblewoodCreationPresets;
const HUMBLEWOOD_FEAT_PRESETS = (window.HumblewoodAlmanacData || [])
  .find(category => category.id === 'feats')?.entries || [];

let myRole = 'dm';
let myName = '';
let myUsername = '';
let authMode = 'login';
let joined = false;
let awaitingSessionResume = false;
let state: any = null;
let onlineUsers: any[] = [];
let dmPrivateRollsEnabled = false;
let privateRollLog: any[] = [];
let pendingDiceRollMode = 'normal';
let selectedTool = 'move';
let draggingToken: any = null;
let draggingTokenTouchId = null;
let dragOffset = { x: 0, y: 0 };
let pendingTrayToken: any = null; // token about to be dropped from tray
let mapScale = 1;
let mapPan = { x: 0, y: 0 };
let panStart = null;
let gridMoveStart = null;
let touchGesture = null;
let spacePanPressed = false;
let lastFittedMapUrl = null;
let editingOriginalName = null;
let editingInventory: any[] = [];
let inventoryExpandedContainers = new Set();
let inventoryDraggingId = '';
let editingAttacks: any[] = [];
let editingAttackId = null;
let editingReactions: any[] = [];
let editingReactionId = null;
let editingSpells: any[] = [];
let editingSpellId = null;
let editingPortraitUrl = null;
let pendingPortraitFile = null;
let editingCanEdit = true;
let initiativeManuallyEdited = false;
let editingBaseLevel = 1;
let pendingLevelUp: any = null;
let suppressLevelUpPrompt = false;
let acMethodManuallySelected = false;
let toastTimer = null;
let activeCombatTarget: any = null;
let pendingSpellPreparation: any = null;
let editingNpcId = null;
let editingNpcSheetId = null;
let rulerStartPoint = null;
let rulerAnchorPoint = null;
let mapAreaDrag = null;
let lastPointerSentAt = 0;
let draggedInitiativeId = null;
let libraryCurrentFolderId = 'all';
let sharedHandoutRenderKey = '';
let dismissedSharedHandoutKey = '';
let sharedHandoutTimer = null;
let sharedHandoutContentRequest = 0;
let shopPurchaseCharacterName = '';
let npcSearchQuery = '';
let npcRaceFilter = 'all';
let npcClassFilter = 'all';
let dmNotificationsOpen = false;
let safetyButtonTimer = null;
let questionSubmitting = false;
const pendingConcentrationChecks = new Map<string, any>();
const pointerFadeTimers = new Map<string, any>();

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const SKILL_ABILITIES = {
  acrobatics: 'dex', animal: 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleight: 'dex', stealth: 'dex', survival: 'wis'
};
const SKILL_LABELS = {
  acrobatics: 'Acrobatics', animal: 'Animal Handling', arcana: 'Arcana', athletics: 'Athletics', deception: 'Deception',
  history: 'History', insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation', medicine: 'Medicine',
  nature: 'Nature', perception: 'Perception', performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleight: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival'
};
const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
  'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
  'Stunned', 'Unconscious'
];
