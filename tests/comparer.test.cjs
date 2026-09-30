const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlan, parseAmount, calculateEstimate, restorePlan, DESTINATIONS } = require("../app.js");

const option = overrides => ({ flights: "10000", hotel: "2000", nights: "7", extras: "1000", ...overrides });

test("calculates family flights once and hotel cost for every night", () => {
  assert.deepEqual(calculateEstimate(option(), "30000"), { total: 2500000, balance: 500000 });
  assert.equal(calculateEstimate(option({ nights: "10" }), "30000").total, 3100000);
});

test("reports over budget, exact budget and an unset budget correctly", () => {
  assert.equal(calculateEstimate(option(), "24000").balance, -100000);
  assert.equal(calculateEstimate(option(), "25000").balance, 0);
  assert.equal(calculateEstimate(option(), "").balance, null);
});

test("uses cents so decimal prices are added correctly", () => {
  assert.deepEqual(calculateEstimate(option({ flights: "0.10", hotel: "0.20", nights: "3", extras: "0.30" }), "1.00"), { total: 100, balance: 0 });
});

test("accepts zero costs and optional blank extras without treating missing costs as free", () => {
  assert.deepEqual(calculateEstimate(option({ flights: "0", hotel: "0", extras: "" }), "0"), { total: 0, balance: 0 });
  for (const field of ["flights", "hotel", "nights"]) {
    assert.equal(calculateEstimate(option({ [field]: "" }), "30000").total, null);
  }
});

test("rejects negative, non-finite, excessive costs and invalid night counts", () => {
  for (const raw of ["-1", "abc", "Infinity", "1e309", "1000000001", "", " ", null, {}]) {
    assert.equal(parseAmount(raw), null);
  }
  for (const nights of ["0", "-1", "7.5", "366", "oops"]) {
    assert.equal(calculateEstimate(option({ nights }), "30000").total, null);
  }
  assert.equal(calculateEstimate(option({ extras: "-1" }), "30000").total, null);
});

test("starts with the five destinations and no invented costs or ratings", () => {
  const plan = createPlan();
  assert.equal(plan.budget, "");
  assert.deepEqual(plan.destinations.map(destination => destination.name), DESTINATIONS);
  assert.ok(plan.destinations.every(destination => destination.flights === "" && destination.hotel === "" && destination.relaxation === "" && destination.nights === "7"));
});

test("restores entered values and shortlist while retaining fixed destination names", () => {
  const plan = createPlan();
  plan.budget = "30000";
  Object.assign(plan.destinations[0], option(), { relaxation: "8", shortlisted: true });
  assert.deepEqual(restorePlan(JSON.parse(JSON.stringify(plan))), plan);
  const restored = restorePlan({ ...plan, destinations: [...plan.destinations, { name: "<script>" }] });
  assert.deepEqual(restored.destinations.map(destination => destination.name), DESTINATIONS);
});

test("recovers from incompatible or malformed saved plans", () => {
  for (const saved of [null, [], { version: 2 }, { version: 1, destinations: null }]) {
    assert.deepEqual(restorePlan(saved), createPlan());
  }
  const restored = restorePlan({ version: 1, budget: {}, destinations: [null, { name: "Sanya", flights: {}, hotel: "2000", relaxation: [], shortlisted: "true" }] });
  assert.equal(restored.budget, "");
  assert.equal(restored.destinations[0].flights, "");
  assert.equal(restored.destinations[0].hotel, "2000");
  assert.equal(restored.destinations[0].shortlisted, false);
});
