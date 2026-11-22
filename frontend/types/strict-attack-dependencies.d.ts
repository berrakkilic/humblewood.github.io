declare function allSpellPresets(): unknown[];
declare function setCharacterRuleSelections(fields: Record<string, string | boolean>): void;
declare function renderInventoryEditor(): void;
declare function closeReactionForm(): void;
declare function renderReactionEditor(): void;
declare function normalizeSpellList(raw: unknown): unknown[];
declare function renderSpellListEditor(): void;
declare function refreshCharacterCalculations(recalculateHitPoints: boolean, recalculateArmorClass: boolean): void;
declare function refreshArmorClass(): void;
