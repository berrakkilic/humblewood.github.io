/** Start the browser app after every feature and event handler is registered. */

initializeCharacterRuleControls();
initializeFeatureUsageControls();
initializeFeatPresetControls();
initializeAttackPresetControls();
initializeReactionPresetControls();
initializeBonusActionPresetControls();
initializeNpcPresetControls();
initializeSmoothDetails();

// Connecting last prevents a fast automatic session restore from racing the
// socket listeners declared in the feature files above.
socket.connect();
