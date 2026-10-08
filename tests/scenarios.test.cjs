const test = require('node:test');
const assert = require('node:assert/strict');
const { createPlan, createScenarios, activeScenario, addScenario, switchScenario, renameScenario, deleteScenario, loadScenarios, saveScenarios, restoreScenarios, STORAGE_KEY, SCENARIOS_KEY } = require('../app.js');
const memory = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
test('creates an independent copy and switches without losing edits', () => {
  const state = createScenarios();
  const original = state.activeId;
  activeScenario(state).plan.budget = '60000';
  activeScenario(state).plan.destinations[0].shortlisted = true;
  assert.equal(addScenario(state, ' Hotel upgrade '), true);
  const upgrade = state.activeId;
  assert.equal(activeScenario(state).name, 'Hotel upgrade');
  assert.equal(activeScenario(state).plan.budget, '60000');
  activeScenario(state).plan.destinations[0].hotel = '2500';
  switchScenario(state, original);
  assert.equal(activeScenario(state).plan.destinations[0].hotel, '');
  assert.equal(activeScenario(state).plan.destinations[0].shortlisted, true);
  switchScenario(state, upgrade);
  assert.equal(activeScenario(state).plan.destinations[0].hotel, '2500');
  assert.equal(switchScenario(state, 'missing'), false);
  assert.equal(state.activeId, upgrade);
});
test('restores all scenarios and the selected plan after a browser reload', () => {
  const storage = memory();
  const state = createScenarios();
  activeScenario(state).plan.budget = '50000';
  addScenario(state, 'Family comparison');
  activeScenario(state).plan.budget = '70000';
  saveScenarios(storage, state);
  assert.deepEqual(loadScenarios(storage), state);
  assert.deepEqual(JSON.parse(storage.getItem(STORAGE_KEY)), activeScenario(state).plan);
});
test('migrates the original single plan without changing its data format', () => {
  const storage = memory();
  const legacy = createPlan();
  legacy.budget = '45000';
  legacy.destinations[1].flights = '13000';
  storage.setItem(STORAGE_KEY, JSON.stringify(legacy));
  const state = loadScenarios(storage);
  assert.equal(state.scenarios.length, 1);
  assert.deepEqual(activeScenario(state).plan, legacy);
  saveScenarios(storage, state);
  assert.deepEqual(loadScenarios(storage), state);
});
test('renames and deletes only the active scenario, retaining at least one', () => {
  const state = createScenarios();
  assert.equal(addScenario(state, ' '), false);
  addScenario(state, '<Hotel upgrade>');
  assert.equal(renameScenario(state, ' '), false);
  assert.equal(renameScenario(state, 'Upgrade'), true);
  assert.equal(activeScenario(state).name, 'Upgrade');
  assert.equal(deleteScenario(state), true);
  assert.equal(activeScenario(state).name, 'My first plan');
  assert.equal(deleteScenario(state), false);
});
test('recovers malformed collections and stale selected IDs', () => {
  const storage = memory();
  const legacy = createPlan();
  legacy.budget = '30000';
  storage.setItem(STORAGE_KEY, JSON.stringify(legacy));
  storage.setItem(SCENARIOS_KEY, '{broken');
  assert.deepEqual(activeScenario(loadScenarios(storage)).plan, legacy);
  const state = createScenarios();
  state.activeId = 'missing';
  state.scenarios.push(null, { ...state.scenarios[0] });
  const restored = restoreScenarios(state);
  assert.equal(restored.scenarios.length, 1);
  assert.equal(restored.activeId, 'scenario-1');
});
test('surfaces unavailable browser storage instead of claiming persistence', () => {
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('quota'); } };
  assert.throws(() => loadScenarios(storage), /blocked/);
  assert.throws(() => saveScenarios(storage, createScenarios()), /quota/);
});
