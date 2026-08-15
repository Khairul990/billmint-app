# BillQyro System Atlas — Master Entry Point

## What is the System Atlas?
The BillQyro System Atlas is a complete, interactive, and deeply connected visual architecture map of the entire BillQyro platform. It functions like a Google Map for the software architecture, allowing developers and AI agents to visually understand the system before changing any code.

The Atlas is built entirely from verified repository source code. It is the absolute source of truth for the project's structure, dependencies, data flow, and risk boundaries.

## How to use the Atlas

### 1. Interactive Visual Map
**Path:** `docs/architecture/atlas/index.html`
- **Open locally:** Double-click the file to open it in any modern web browser. No server or build process is required.
- **Interactions:** Use mouse/trackpad to Pan and Zoom. Click on nodes to view detailed metadata (Domain, Engine, Risk Level, Storage).
- **Search:** Use the search bar to filter by node name, type, or description.
- **Theme:** Toggle dark/light mode for better visibility.

### 2. Markdown Architecture Documentation
The visual map is powered and supplemented by detailed markdown documentation. Always read the relevant document before modifying a specific domain:

| Document | Purpose |
|----------|---------|
| `MASTER_MAP.md` | Core system identity, top-level domains, and storage overview |
| `ARCHITECTURE_AUDIT.md` | Record of documentation mismatches and unverified stubs |
| `DOMAIN_MAP.md` | Detailed breakdown of each business domain (Invoice, Customer, etc.) |
| `FEATURE_MAP.md` | Inventory of all features and their owning engines |
| `MODULE_MAP.md` | How features are grouped into toggleable modules |
| `DATA_MODEL.md` | IndexedDB stores and Firestore collections |
| `DATA_FLOW.md` | How data moves from UI -> Engine -> IndexedDB -> Firestore |
| `OFFLINE_SYNC.md` | Explanation of the `cloudWins` sync strategy and `syncQueue` |
| `USER_FLOW.md` | Step-by-step user journeys (Onboarding, Customer Portal, Admin) |
| `SETTINGS_MAP.md` | How business settings are stored and consumed |
| `THEME_MAP.md` | The CSS variable system and ThemeContext |
| `SECURITY_MAP.md` | Authentication boundaries, admin bypass, and Firestore rules |
| `AI_CHANGE_PROTOCOL.md` | **CRITICAL:** Mandatory steps before changing code |

## How AI Agents and Developers Should Use This
Before executing any feature request, refactor, or bug fix:
1. Identify the Domain and Engine using the Interactive Map (`atlas/index.html`).
2. Read the `AI_CHANGE_PROTOCOL.md`.
3. Read the specific `.md` file for that domain.
4. Trace dependencies in the source code to confirm the map's accuracy.
5. Make the change, test locally, and update the Atlas data (`atlas/data/*.json`) and Markdown files if architecture changes.

## Verifying Source vs. Documentation
The Atlas is a snapshot of the repository. If you discover a mismatch between the documentation and the actual source code (e.g., a new Engine was added or a store was renamed), **Source Code Wins**. Document the discrepancy in `ARCHITECTURE_AUDIT.md` and update the relevant Atlas files.
