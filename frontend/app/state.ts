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
let state: RoomState | null = null;
let onlineUsers: OnlineUser[] = [];
let dmPrivateRollsEnabled = false;
let privateRollLog: SocketRollEntry[] = [];
type RollMode = 'normal' | 'advantage' | 'disadvantage';
let pendingDiceRollMode: RollMode = 'normal';
type MapTool = 'move' | 'pan' | 'grid-move' | 'ruler' | 'ping' | 'doodle' | 'eraser' | 'fog-reveal' | 'fog-hide';
type MapTimeOfDay = 'morning' | 'afternoon' | 'night';
interface MapGesturePosition {
  clientX: number;
  clientY: number;
  x: number;
  y: number;
}
interface GridMoveGesture {
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  currentX?: number;
  currentY?: number;
}
type MapTouchGesture =
  | { type: 'pinch'; distance: number; scale: number; stagePoint: SocketPoint }
  | { type: 'ruler'; start: SocketPoint; startClientX: number; startClientY: number; moved: boolean; completingTap: boolean }
  | { type: 'pan'; clientX: number; clientY: number; pan: { x: number; y: number } };
interface MapAreaDrag {
  start: SocketPoint;
  current: SocketPoint;
  mode: 'reveal' | 'hide';
}
let selectedTool: MapTool = 'move';
let draggingToken: string | null = null;
let draggingTokenTouchId: number | null = null;
let dragOffset = { x: 0, y: 0 };
let mapScale = 1;
let mapPan = { x: 0, y: 0 };
let panStart: MapGesturePosition | null = null;
let gridMoveStart: GridMoveGesture | null = null;
let touchGesture: MapTouchGesture | null = null;
let spacePanPressed = false;
let lastFittedMapUrl: string | null = null;
let editingOriginalName: string | null = null;
type InventoryLocation = 'carried' | 'backpack';
type UsageReset = 'long-rest' | 'short-rest' | 'manual';

interface InventoryUsage {
  max: number;
  remaining: number;
  reset: UsageReset;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  location: InventoryLocation;
  isContainer: boolean;
  containerId: string | null;
  usage: InventoryUsage;
}

interface FeatureUse {
  id: string;
  name: string;
  max: number;
  remaining: number;
  reset: UsageReset;
}

let editingInventory: InventoryItem[] = [];
let editingFeatureUses: FeatureUse[] = [];
let inventoryExpandedContainers = new Set<string>();
let inventoryDraggingId = '';
let inventoryEditingId = '';
interface CharacterAttack {
  id: string;
  name: string;
  bonus: string;
  damage: string;
  details: string;
  source: string;
}

let editingAttacks: CharacterAttack[] = [];
let editingAttackId: string | null = null;
interface CharacterReaction {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  resource: string;
  requirement: string;
  source: string;
}

let editingReactions: CharacterReaction[] = [];
let editingReactionId: string | null = null;
let editingSpells: CharacterSpell[] = [];
let editingSpellId: string | null = null;
let editingPortraitUrl: string | null = null;
let pendingPortraitFile: File | null = null;
let editingCanEdit = true;
let initiativeManuallyEdited = false;
let editingBaseLevel = 1;
interface PendingLevelUp {
  fromLevel: number;
  toLevel: number;
  className: string;
  subclass: string;
  species: string;
  oldConstitution: number;
  oldMaximumHp: number;
  oldCurrentHp: number;
  oldHitDiceLeft: number;
}

let pendingLevelUp: PendingLevelUp | null = null;
let suppressLevelUpPrompt = false;
let acMethodManuallySelected = false;
let toastTimer: number | null = null;
let activeCombatTarget: ActiveCombatTarget | null = null;
let pendingSpellPreparation: PendingSpellPreparation | null = null;
let editingNpcId: string | null = null;
let editingNpcSheetId: string | null = null;
let rulerStartPoint: SocketPoint | null = null;
let rulerAnchorPoint: SocketPoint | null = null;
let mapAreaDrag: MapAreaDrag | null = null;
let lastPointerSentAt = 0;
let draggedInitiativeId: string | null = null;
let libraryCurrentFolderId = 'all';
let sharedHandoutRenderKey = '';
let dismissedSharedHandoutKey = '';
let sharedHandoutTimer: number | null = null;
let sharedHandoutContentRequest = 0;
let shopPurchaseCharacterName = '';
let npcSearchQuery = '';
let npcRaceFilter = 'all';
let npcClassFilter = 'all';
let dmNotificationsOpen = false;
let safetyButtonTimer: ReturnType<typeof setTimeout> | null = null;
let questionSubmitting = false;
const pendingConcentrationChecks = new Map<string, { damage: number; dc: number }>();
const pointerFadeTimers = new Map<string, ReturnType<typeof setTimeout>>();

type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const ABILITY_LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const SKILL_ABILITIES = {
  acrobatics: 'dex', animal: 'wis', arcana: 'int', athletics: 'str', deception: 'cha', history: 'int',
  insight: 'wis', intimidation: 'cha', investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleight: 'dex', stealth: 'dex', survival: 'wis'
} as const;
type SkillName = keyof typeof SKILL_ABILITIES;
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
