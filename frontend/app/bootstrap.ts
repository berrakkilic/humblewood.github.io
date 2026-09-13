/** Start the browser app after every feature and event handler is registered. */

initializeCharacterRuleControls();
initializeFeatPresetControls();
initializeAttackPresetControls();
initializeNpcPresetControls();

// Connecting last prevents a fast automatic session restore from racing the
// socket listeners declared in the feature files above.
socket.connect();
