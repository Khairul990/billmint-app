# BillQyro AI Change Protocol

## OVERVIEW
This protocol MUST be followed by any AI or developer before modifying the BillQyro application. BillQyro is a modular, offline-first application with deep interdependencies across its UI, local database, offline sync engine, and cloud layer. 

## PRE-MODIFICATION CHECKLIST
Before editing any source code, you must:

1. **Read the Architecture Atlas:** Open `docs/architecture/atlas/index.html` to visualize the system.
2. **Locate the Target Node:** Find the component, route, or service you intend to modify in the Atlas.
3. **Identify the District:** Note which Domain (e.g., Billing, Customer, Portal) the node belongs to.
4. **Identify Upstream Dependencies:** What data/contexts does this node rely on?
5. **Identify Downstream Dependents:** What UI elements or sync queues rely on the output of this node?
6. **Identify Data Stores:** Does this node interact with `localDb.js` (IndexedDB) or `dbEngine.js`?
7. **Identify Routes:** Which pages surface this feature?
8. **Identify Themes & Templates:** Are there CSS variables or PDF templates tied to this component?
9. **Identify Risk Level:** Is this a CRITICAL system (e.g., `offlineEngine.js`, `App.jsx`, `invoiceEngine.js`)?
10. **Review Source Evidence:** Double-check the imports in the actual file.

## CRITICAL ARCHITECTURE RULES

### 1. Data Layer Safety
BillQyro uses an offline-first architecture. **Never write directly to Firestore from a UI component.** 
All data modifications must flow through:
`UI` → `Domain Engine` → `dbEngine` → `localDb (IndexedDB)` → `syncQueue` → `offlineEngine` → `Firestore`

### 2. Feature Registry
Features are controlled dynamically via `featureRegistry.js` and `businessPresets.js`. Disabling a module must hide the UI and routing, but it **MUST NOT delete the underlying user data**.

### 3. Modifying Critical Systems
Modifications to `dbEngine.js`, `localDb.js`, `syncWorker.js`, or `invoiceEngine.js` are considered **CRITICAL RISK**. You must generate a "Before/After" architecture snapshot and verify offline/online data integrity before committing changes.

## POST-MODIFICATION PROTOCOL
After your edits are complete:
1. Re-run the Atlas scanner: `node scripts/generate-architecture-atlas.cjs`
2. Open the Atlas and verify that no unintended orphan nodes or circular dependencies were created.
3. Compare the new architecture graph against the original to ensure structural integrity.
