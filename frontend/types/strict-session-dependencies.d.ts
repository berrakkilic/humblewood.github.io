// Function boundaries supplied by features that are outside the strict subset.
declare function renderDmPrivateRollMode(): void;
declare function refreshCharacterRoller(preferredName?: string): void;
declare function renderMap(): void;
declare function renderDoodleCorner(): void;
declare function renderRollLog(): void;
declare function renderCombatManager(): void;
declare function drawDoodlePath(path: SocketDoodlePath): void;
declare function clearDoodleCanvas(): void;
declare function redrawAllDoodles(): void;
declare function updateMapPermissionControls(): void;
declare function renderFog(): void;
declare function renderMapTokens(): void;
declare function closeCombatManager(): void;
declare function renderSharedPointer(payload: SocketPoint & { id: string; name?: string; color?: string }): void;
declare function removeSharedPointer(id: string): void;
declare function renderSharedPing(payload: SocketPoint & { id: string; name?: string; color?: string }): void;
