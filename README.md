# my-first-project

## December Escape — Trip Comparer

A small, dependency-free app for comparing December holiday options. It uses plain HTML, CSS and JavaScript and runs entirely in the browser.

### Run it

Clone or download this repository, then open `index.html` in a modern browser. No installation or build step is required.

For a consistent local address and browser saving, serve the folder with Python:

```bash
git clone https://github.com/matildaspy56-debug/my-first-project.git
cd my-first-project
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://localhost:8000>. Stop the server with Ctrl+C.

### Use it

1. Enter the total trip budget in CNY (RMB).
2. For each destination, enter return flights for everyone travelling and the nightly hotel total for all rooms.
3. Adjust that destination's trip length in hotel nights. The initial 7 nights is an editable planning default.
4. Optionally add meals, transfers, visas, activities and other expenses as one total for the whole trip.
5. Choose your own relaxation rating, from 1 (busy) to 10 (very restful), and tick destinations to shortlist them.

Sanya, Malaysia, Singapore, Australia and Portugal appear side by side. Estimates and budget balances update immediately. On a phone, swipe the table horizontally to see the other destinations.

```text
Estimated total = return flights + (hotel per night × nights) + other trip costs
Budget balance  = total budget − estimated total
```

Prices, budget and ratings start blank; the app supplies no travel quotes or destination recommendations. A zero cost is valid. Missing required costs and invalid inputs leave the estimate incomplete. If other costs are blank, the displayed estimate includes flights and hotels only, and the table says so.

### Save and compare different plans

1. Your previous saved comparison appears as **My first plan** in **Current plan**. Its costs, budget, trip lengths, ratings and shortlist are preserved.
2. Edit the table normally. Every edit automatically saves to the selected plan.
3. Click **Save as new**, enter a name such as **Low-cost plan**, **Hotel upgrade** or **Family of five**, and confirm the browser prompt. This creates and selects an independent copy of the current plan. Edit its costs to explore the alternative.
4. Choose a name in **Current plan** to switch. The budget, all table inputs, estimates and shortlist show that plan; other plans retain their edits.
5. Click **Rename**, enter the replacement name, and confirm. Names are trimmed, limited to 80 characters and must not be blank. Cancelling either name prompt changes nothing.
6. Click **Delete** and confirm to permanently remove the selected plan. The first remaining plan becomes selected. Delete is disabled when only one plan remains.
7. **Reset inputs** asks for confirmation and resets only the selected plan, keeping its name and all other plans.
8. Reopen or refresh the app at the same browser address to restore every saved plan and the last selected one.

Plans have no separate traveller-count field: for family-size comparisons, enter the flight total for that family and the nightly hotel total for its rooms. The side-by-side destination table and calculation rules are unchanged.

### Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, scenario controls, budget input and reset dialog |
| `styles.css` | Responsive styling and horizontally scrollable comparison table |
| `app.js` | Editable destination inputs, calculations, shortlist, scenarios and browser saving |
| `tests/scenarios.test.cjs` | Scenario creation, switching, restoration, migration and deletion checks |
| `tests/comparer.test.cjs` | Calculation and saved-plan checks using Node's built-in test runner |

### Check the calculations

With Node.js 18 or later installed:

```bash
node --test tests/*.test.cjs
```

Node is only needed to run these checks, not to use the app.

### Saving and scope

Your entries are stored in this browser's `localStorage`; they are not sent to GitHub or a server. Saving is tied to the browser and address used to open the app, so switching browsers, using a different port, clearing browser data or using private browsing can affect persistence. If browser saving is blocked, the comparison still works for the current visit and displays a notice.

The scenario collection uses `december-escape-scenarios-v1`. Each scenario retains the original version-1 plan format. The original `december-escape-plan-v1` key is retained as a snapshot of the selected plan for compatibility. Older single-plan data is loaded automatically; malformed scenario data falls back to that snapshot. If saving fails, changes remain available for the current visit and a notice appears.

Reset inputs asks before clearing the selected plan. This repository version runs locally. Hosting, accounts, live prices and currency conversion are outside this initial version.
