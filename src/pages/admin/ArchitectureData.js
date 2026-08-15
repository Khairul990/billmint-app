export const initialNodes = [
  // --- UI LAYER ---
  { id: 'ui-dashboard', type: 'uiNode', position: { x: 100, y: 100 }, data: { label: 'Dashboard', file: 'Dashboard.jsx', type: 'UI Component' } },
  { id: 'ui-invoices', type: 'uiNode', position: { x: 350, y: 100 }, data: { label: 'Invoices List', file: 'Invoices.jsx', type: 'UI Component' } },
  { id: 'ui-create-invoice', type: 'uiNode', position: { x: 600, y: 100 }, data: { label: 'Create Invoice', file: 'CreateInvoice.jsx', type: 'UI Component' } },
  { id: 'ui-customers', type: 'uiNode', position: { x: 850, y: 100 }, data: { label: 'Customers', file: 'Customers.jsx', type: 'UI Component' } },
  { id: 'ui-settings', type: 'uiNode', position: { x: 1100, y: 100 }, data: { label: 'Settings Studio', file: 'SettingsStudioV2.jsx', type: 'UI Component' } },

  // --- HTML REFERENCE LAYER ---
  { id: 'html-ref', type: 'referenceNode', position: { x: -200, y: 100 }, data: { label: 'HTML Design Map', file: 'billqyro-redesign.html', type: 'Reference Design' } },

  // --- DOMAIN ENGINES ---
  { id: 'engine-invoice', type: 'engineNode', position: { x: 450, y: 250 }, data: { label: 'Invoice Engine', file: 'invoiceEngine.js', type: 'Domain Engine' } },
  { id: 'engine-customer', type: 'engineNode', position: { x: 850, y: 250 }, data: { label: 'Customer Engine', file: 'customerEngine.js', type: 'Domain Engine' } },
  { id: 'engine-settings', type: 'engineNode', position: { x: 1100, y: 250 }, data: { label: 'Settings Engine', file: 'settingsEngine.js', type: 'Domain Engine' } },

  // --- DB ENGINE ---
  { id: 'engine-db', type: 'engineNode', position: { x: 600, y: 400 }, data: { label: 'Database Hub', file: 'dbEngine.js', type: 'Platform Engine' } },

  // --- LOCAL DATA ---
  { id: 'data-local', type: 'dataNode', position: { x: 450, y: 550 }, data: { label: 'IndexedDB', file: 'localDb.js', type: 'Local Storage' } },
  { id: 'data-queue', type: 'dataNode', position: { x: 750, y: 550 }, data: { label: 'Sync Queue', file: 'syncQueue (Store)', type: 'Local Storage' } },

  // --- OFFLINE SYNC ---
  { id: 'engine-offline', type: 'engineNode', position: { x: 750, y: 700 }, data: { label: 'Offline Engine', file: 'offlineEngine.js', type: 'Sync System' } },

  // --- CLOUD ---
  { id: 'data-firestore', type: 'cloudNode', position: { x: 600, y: 850 }, data: { label: 'Firestore', file: 'Firebase', type: 'Cloud Database' } },
];

export const initialEdges = [
  // UI -> Engines
  { id: 'e-ui-inv-engine', source: 'ui-create-invoice', target: 'engine-invoice', animated: true, label: 'Save Invoice' },
  { id: 'e-ui-cust-engine', source: 'ui-customers', target: 'engine-customer', animated: true },
  { id: 'e-ui-set-engine', source: 'ui-settings', target: 'engine-settings', animated: true },

  // HTML -> UI (Inspiration)
  { id: 'e-html-ref', source: 'html-ref', target: 'ui-dashboard', style: { strokeDasharray: '5,5' }, label: 'UX Inspiration' },

  // Engines -> dbEngine
  { id: 'e-inv-db', source: 'engine-invoice', target: 'engine-db' },
  { id: 'e-cust-db', source: 'engine-customer', target: 'engine-db' },
  { id: 'e-set-db', source: 'engine-settings', target: 'engine-db' },

  // dbEngine -> Local DB & Queue
  { id: 'e-db-local', source: 'engine-db', target: 'data-local', label: 'Write' },
  { id: 'e-db-queue', source: 'engine-db', target: 'data-queue', label: 'Enqueue' },

  // Queue -> Offline Engine
  { id: 'e-queue-offline', source: 'data-queue', target: 'engine-offline' },

  // Offline Engine -> Firestore
  { id: 'e-offline-fire', source: 'engine-offline', target: 'data-firestore', animated: true, label: 'Sync to Cloud' },
];
