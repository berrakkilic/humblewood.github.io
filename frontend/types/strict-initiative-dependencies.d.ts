declare function getRequiredButton(id: string): HTMLButtonElement;
declare function getRequiredInput(id: string): HTMLInputElement;
declare function getRequiredElement<T extends Element>(selector: string): T;
declare function showToast(message: string): void;
declare function openCombatManager(name: string): void;
declare function openNpcCombatManager(id: string): void;
declare function rollCharacterInitiative(character: unknown, mode?: string | null): void;
declare function rollNpcInitiative(token: unknown, mode?: string): void;
