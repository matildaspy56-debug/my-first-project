(() => {
  "use strict";

  const STORAGE_KEY = "december-escape-plan-v1";
  const DESTINATIONS = ["Sanya", "Malaysia", "Singapore", "Australia", "Portugal"];
  const MAX_AMOUNT = 1000000000;
  const FIELDS = [
    { key: "flights", label: "Return flights", help: "Everyone · CNY", min: 0, max: MAX_AMOUNT, step: "0.01", placeholder: "Enter cost" },
    { key: "hotel", label: "Hotel per night", help: "All rooms · CNY", min: 0, max: MAX_AMOUNT, step: "0.01", placeholder: "Enter cost" },
    { key: "nights", label: "Trip length", help: "Number of hotel nights", min: 1, max: 365, step: "1", placeholder: "Nights" },
    { key: "extras", label: "Other trip costs", help: "Optional trip total · CNY", min: 0, max: MAX_AMOUNT, step: "0.01", placeholder: "Optional" },
    { key: "relaxation", label: "Relaxation fit", help: "Your rating · 1–10" }
  ];

  function createPlan() {
    return {
      version: 1,
      budget: "",
      destinations: DESTINATIONS.map(name => ({ name, flights: "", hotel: "", nights: "7", extras: "", relaxation: "", shortlisted: false }))
    };
  }

  function parseAmount(raw) {
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    if (String(raw).trim() === "") return null;
    const amount = Number(raw);
    return Number.isFinite(amount) && amount >= 0 && amount <= MAX_AMOUNT
      ? Math.round(amount * 100)
      : null;
  }

  function calculateEstimate(destination, budget) {
    const flights = parseAmount(destination.flights);
    const hotel = parseAmount(destination.hotel);
    const extras = destination.extras === "" ? 0 : parseAmount(destination.extras);
    const nights = Number(destination.nights);
    if (flights === null || hotel === null || extras === null || !Number.isInteger(nights) || nights < 1 || nights > 365) {
      return { total: null, balance: null };
    }
    const total = flights + hotel * nights + extras;
    const budgetAmount = parseAmount(budget);
    return { total, balance: budgetAmount === null ? null : budgetAmount - total };
  }

  function restorePlan(saved) {
    const plan = createPlan();
    if (!saved || saved.version !== 1 || !Array.isArray(saved.destinations)) return plan;
    const safeValue = value => (typeof value === "string" || typeof value === "number") && String(value).length <= 40 ? String(value) : "";
    plan.budget = safeValue(saved.budget);
    plan.destinations.forEach(destination => {
      const match = saved.destinations.find(item => item && item.name === destination.name);
      if (!match) return;
      FIELDS.forEach(field => {
        if (Object.hasOwn(match, field.key)) destination[field.key] = safeValue(match[field.key]);
      });
      destination.shortlisted = match.shortlisted === true;
    });
    return plan;
  }

  // The same small calculation module is available to Node's built-in test runner.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createPlan, parseAmount, calculateEstimate, restorePlan, DESTINATIONS };
    return;
  }

  const money = new Intl.NumberFormat("en", { style: "currency", currency: "CNY", minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const formatMoney = cents => money.format(cents / 100);
  const budgetInput = document.getElementById("budget");
  const storageStatus = document.getElementById("storage-status");
  let plan;
  try {
    plan = restorePlan(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    plan = createPlan();
    storageStatus.textContent = "Saved inputs could not be loaded. You can still use this comparison.";
  }

  const heading = document.getElementById("destinations-heading");
  const body = document.getElementById("destinations-body");
  heading.innerHTML = `<tr><th scope="col">Trip details</th>${DESTINATIONS.map((name, i) => `<th scope="col" id="destination-${i}">${name}</th>`).join("")}</tr>`;

  body.innerHTML = FIELDS.map(field => `<tr><th scope="row">${field.label}<small>${field.help}</small></th>${DESTINATIONS.map((name, i) => {
    const label = `<label class="sr-only" for="${field.key}-${i}">${name} ${field.label.toLowerCase()}${field.key === "nights" ? " in nights" : field.key === "relaxation" ? " from 1 to 10" : " in CNY"}</label>`;
    const control = field.key === "relaxation"
      ? `<select id="${field.key}-${i}" data-index="${i}" data-field="${field.key}"><option value="">Rate the trip</option>${Array.from({ length: 10 }, (_, n) => `<option value="${n + 1}">${n + 1} / 10</option>`).join("")}</select>`
      : `<input id="${field.key}-${i}" data-index="${i}" data-field="${field.key}" type="number" min="${field.min}" max="${field.max}" step="${field.step}" inputmode="${field.key === "nights" ? "numeric" : "decimal"}" placeholder="${field.placeholder}">`;
    return `<td>${label}${control}</td>`;
  }).join("")}</tr>`).join("")
    + `<tr class="total-row"><th scope="row">Estimated total<small>Flights + hotel + other costs</small></th>${DESTINATIONS.map((_, i) => `<td><output class="total" id="total-${i}" aria-label="${DESTINATIONS[i]} estimated total">—</output><small class="estimate-note" id="estimate-note-${i}">Add flight and hotel costs</small></td>`).join("")}</tr>`
    + `<tr><th scope="row">Budget balance</th>${DESTINATIONS.map((name, i) => `<td><output class="budget-result" id="balance-${i}" aria-label="${name} budget balance" data-status="waiting">Set a budget</output></td>`).join("")}</tr>`
    + `<tr><th scope="row">Your shortlist<small>Keep your favourites</small></th>${DESTINATIONS.map((name, i) => `<td><label class="shortlist-label"><input id="shortlist-${i}" data-index="${i}" type="checkbox" aria-label="Shortlist ${name}"><span>Shortlist</span></label></td>`).join("")}</tr>`;

  const controls = [...document.querySelectorAll("[data-field]")];

  function setControls() {
    budgetInput.value = plan.budget;
    controls.forEach(control => { control.value = plan.destinations[Number(control.dataset.index)][control.dataset.field]; });
    plan.destinations.forEach((destination, i) => { document.getElementById(`shortlist-${i}`).checked = destination.shortlisted; });
    // Browser number/select controls discard malformed values from saved data.
    plan.budget = budgetInput.value;
    controls.forEach(control => { plan.destinations[Number(control.dataset.index)][control.dataset.field] = control.value; });
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
      storageStatus.textContent = "";
    } catch {
      storageStatus.textContent = "Browser saving is unavailable. Your inputs will last only for this visit.";
    }
  }

  function updateResults() {
    [budgetInput, ...controls].forEach(control => {
      const invalid = !control.validity.valid;
      control.setAttribute("aria-invalid", String(invalid));
      control.title = invalid ? control.validationMessage : "";
    });
    let complete = 0;
    let within = 0;
    plan.destinations.forEach((destination, i) => {
      const costControls = controls.filter(control => Number(control.dataset.index) === i && control.dataset.field !== "relaxation");
      const valid = costControls.every(control => control.validity.valid);
      const estimate = valid ? calculateEstimate(destination, budgetInput.validity.valid ? plan.budget : "") : { total: null, balance: null };
      const total = document.getElementById(`total-${i}`);
      const note = document.getElementById(`estimate-note-${i}`);
      const balance = document.getElementById(`balance-${i}`);
      total.textContent = estimate.total === null ? "—" : formatMoney(estimate.total);
      note.textContent = !valid ? "Check the highlighted inputs" : estimate.total === null ? "Add flight cost, hotel cost and nights" : destination.extras === "" ? "Other costs not entered" : "Includes other trip costs";
      balance.dataset.status = "waiting";
      if (estimate.total === null) {
        balance.textContent = "Waiting for costs";
      } else if (estimate.balance === null) {
        balance.textContent = budgetInput.validity.valid ? "Set a budget" : "Check your budget";
      } else if (estimate.balance < 0) {
        balance.textContent = `${formatMoney(-estimate.balance)} over budget`;
        balance.dataset.status = "over";
      } else {
        balance.textContent = estimate.balance === 0 ? "Exactly on budget" : `${formatMoney(estimate.balance)} remaining`;
        balance.dataset.status = "within";
        within += 1;
      }
      if (estimate.total !== null) complete += 1;
      document.getElementById(`destination-${i}`).dataset.shortlisted = String(destination.shortlisted);
    });
    const budgetSet = budgetInput.validity.valid && parseAmount(plan.budget) !== null;
    document.getElementById("summary").textContent = complete === 0
      ? "Add flight and hotel costs to compare estimates."
      : `${complete} of ${DESTINATIONS.length} estimates ready${budgetSet ? ` · ${within} within budget` : " · Enter a budget to check affordability"}.`;
    const shortlist = plan.destinations.filter(destination => destination.shortlisted).map(destination => destination.name);
    document.getElementById("shortlist-summary").textContent = shortlist.length
      ? `Your shortlist: ${shortlist.join(" · ")}`
      : "Shortlist the destinations you want to keep.";
  }

  budgetInput.addEventListener("input", () => {
    plan.budget = budgetInput.value;
    updateResults();
    save();
  });
  body.addEventListener("input", event => {
    const control = event.target;
    if (!control.matches("input, select")) return;
    const destination = plan.destinations[Number(control.dataset.index)];
    if (control.type === "checkbox") destination.shortlisted = control.checked;
    else destination[control.dataset.field] = control.value;
    updateResults();
    save();
  });

  const resetDialog = document.getElementById("reset-dialog");
  document.getElementById("reset").addEventListener("click", () => { resetDialog.returnValue = "cancel"; resetDialog.showModal(); });
  resetDialog.addEventListener("close", () => {
    if (resetDialog.returnValue !== "reset") return;
    plan = createPlan();
    setControls();
    updateResults();
    save();
  });

  setControls();
  updateResults();
})();
