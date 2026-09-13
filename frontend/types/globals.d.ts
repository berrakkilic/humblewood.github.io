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

declare function io(options?: Record<string, unknown>): any;

type LegacyRecord = Record<string, any>;

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
