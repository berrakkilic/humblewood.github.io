(function attachCombatState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HumblewoodCombatState = api;
})(typeof window !== 'undefined' ? window : null, function createCombatState() {
  function normalizedConditions(conditions) {
    return [...new Set((Array.isArray(conditions) ? conditions : []).filter(Boolean))];
  }

  function setConditions(entity, conditions) {
    if (!entity || typeof entity !== 'object') return [];
    const next = normalizedConditions(conditions);
    const combat = entity.combat && typeof entity.combat === 'object' ? entity.combat : {};
    entity.combat = { ...combat, conditions: next };
    return [...next];
  }

  function setConditionBadges(entity, conditions) {
    if (!entity || typeof entity !== 'object') return [];
    const next = normalizedConditions(conditions);
    const badges = entity.conditionBadges && typeof entity.conditionBadges === 'object'
      ? entity.conditionBadges
      : {};
    entity.conditionBadges = { ...badges, conditions: next };
    return [...next];
  }

  function toggleCondition(entity, condition) {
    const name = String(condition || '').trim();
    if (!entity || !name) return [];
    const current = normalizedConditions(entity.combat?.conditions);
    const next = current.includes(name)
      ? current.filter(existing => existing !== name)
      : [...current, name];
    return setConditions(entity, next);
  }

  return { normalizedConditions, setConditionBadges, setConditions, toggleCondition };
});
