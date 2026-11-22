declare function visibleTokenLabel(token: RoomToken): string;
declare function tokenHoverText(token: RoomToken): string;
declare function emojiFor(kind: RoomToken['kind']): string;
declare function tokenPronouns(token: RoomToken): string;
declare function characterSkillModifier(character: RoomCharacter, skill: string): number;
declare function proficiencyBonus(level: number | string): number;
declare function switchView(viewName: string): void;
