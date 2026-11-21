interface Window {
  HumblewoodAlmanac: any;
  HumblewoodAlmanacData: any[];
  HumblewoodCharacterRules: any;
  HumblewoodCombatState: any;
  HumblewoodCreationPresets: any;
  HumblewoodMapGeometry: any;
  HumblewoodPhbSpellPresets: any;
  HumblewoodRouter: any;
}

type LegacyRecord = Record<string, any>;

interface RoomScene extends LegacyRecord {
  mapUrl: string | null;
  mapName: string;
  fogShapes: LegacyRecord[];
  doodlePaths: LegacyRecord[];
  doodleCornerPaths: LegacyRecord[];
}

interface RoomToken extends LegacyRecord {
  id: string;
  label: string;
  kind: 'pc' | 'npc' | 'item';
  x: number;
  y: number;
  visibleToPlayers: boolean;
  canControl?: boolean;
}

interface RoomCharacter extends LegacyRecord {
  name: string;
  ownerUsername?: string | null;
  canManage?: boolean;
}

interface RoomNpc extends LegacyRecord {
  id: string;
  name: string;
}

interface JukeboxTrack extends LegacyRecord {
  id: string;
  title: string;
  url: string;
  source?: string;
}

interface RoomState extends LegacyRecord {
  scene: RoomScene;
  tokens: RoomToken[];
  characters: Record<string, RoomCharacter>;
  npcs: Record<string, RoomNpc>;
  savedScenes: LegacyRecord[] | Record<string, LegacyRecord>;
  jukebox: LegacyRecord & { playlist: JukeboxTrack[]; currentIndex: number };
  library: LegacyRecord;
  notifications: LegacyRecord[];
  rollLog: LegacyRecord[];
  initiative: LegacyRecord;
}

interface OnlineUser extends LegacyRecord {
  id: string;
  name: string;
  role: 'dm' | 'player';
  connections: number;
}

type FrontendSocketEvents = {
  'state:full': [RoomState];
  'scene:update': [RoomScene];
  'token:add': [RoomToken];
  'token:update': [RoomToken];
  'token:move': [{ id: string; x: number; y: number }];
  'token:remove': [{ id: string }];
  'library:update': [LegacyRecord];
  'library:broadcast': [LegacyRecord | null];
  'jukebox:update': [RoomState['jukebox']];
  'initiative:update': [LegacyRecord];
  'presence:list': [OnlineUser[]];
  'accounts:update': [LegacyRecord[]];
  'roll:made': [LegacyRecord];
  'roll:private': [LegacyRecord];
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
};

interface SocketLike {
  on<K extends keyof FrontendSocketEvents>(event: K, handler: (...args: FrontendSocketEvents[K]) => void): this;
  on(event: string, handler: (...args: any[]) => void): this;
  off<K extends keyof FrontendSocketEvents>(event: K, handler?: (...args: FrontendSocketEvents[K]) => void): this;
  off(event: string, handler?: (...args: any[]) => void): this;
  emit<K extends keyof FrontendSocketEvents>(event: K, ...args: FrontendSocketEvents[K]): this;
  emit(event: string, ...args: any[]): this;
  connect(): this;
  disconnect(): this;
}

declare function io(options?: Record<string, unknown>): SocketLike;

// Server snapshots are still runtime-validated JavaScript objects. These
// overloads keep values/entries useful during the migration; domain models can
// replace them feature by feature without weakening newly typed code.
interface ObjectConstructor {
  values(value: LegacyRecord): any[];
  entries(value: LegacyRecord): [string, any][];
}

// Event delegation in the legacy UI intentionally starts at EventTarget. The
// handlers guard their selectors at runtime before using the returned element.
interface EventTarget {
  closest(selectors: string): any;
}

// The existing UI predates TypeScript and uses precise, stable element IDs.
// Returning `any` here keeps this first migration focused on application data
// and feature boundaries. Individual controls can gain stricter element types
// incrementally without a risky all-at-once rewrite.
interface Document {
  getElementById(elementId: string): any;
  querySelector<E extends Element = Element>(selectors: string): any;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<any>;
}

interface ParentNode {
  querySelector<E extends Element = Element>(selectors: string): any;
  querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<any>;
}
