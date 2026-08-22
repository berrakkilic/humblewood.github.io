const assert = require('assert');
const combatState = require('../public/js/combat-state');

const character = { combat: { conditions: [] } };
assert.deepEqual(combatState.toggleCondition(character, 'Blinded'), ['Blinded']);
assert.deepEqual(character.combat.conditions, ['Blinded']);

assert.deepEqual(combatState.toggleCondition(character, 'Prone'), ['Blinded', 'Prone']);
assert.deepEqual(character.combat.conditions, ['Blinded', 'Prone']);

assert.deepEqual(combatState.toggleCondition(character, 'Blinded'), ['Prone']);
assert.deepEqual(character.combat.conditions, ['Prone']);

const token = { conditionBadges: { concentration: true } };
combatState.setConditionBadges(token, ['Prone', 'Prone', 'Stunned']);
assert.deepEqual(token.conditionBadges.conditions, ['Prone', 'Stunned']);
assert.equal(token.conditionBadges.concentration, true);

console.log('Combat state checks passed: condition toggles update immediately, accumulate, remove, and mirror to token badges.');
