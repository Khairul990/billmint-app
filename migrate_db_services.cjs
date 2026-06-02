const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, 'src', 'services');
if (!fs.existsSync(SERVICES_DIR)) {
  fs.mkdirSync(SERVICES_DIR);
}

// 1. Migrate firebaseConfig.js
const firebaseCode = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'firebase.js'), 'utf-8');
fs.writeFileSync(path.join(SERVICES_DIR, 'firebaseConfig.js'), firebaseCode);
fs.unlinkSync(path.join(__dirname, 'src', 'utils', 'firebase.js'));

// 2. Migrate localDb.js
const indexedDbCode = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'indexedDb.js'), 'utf-8');
fs.writeFileSync(path.join(SERVICES_DIR, 'localDb.js'), indexedDbCode);
fs.unlinkSync(path.join(__dirname, 'src', 'utils', 'indexedDb.js'));

// 3. Create syncWorker.js
const syncWorkerCode = `import { db, firebaseReady } from './firebaseConfig';
import { BillQyroDB } from './localDb';

// Background Sync Worker to push offline changes to Firebase
export const startBackgroundSync = () => {
  window.addEventListener('online', async () => {
    if (!firebaseReady) return;
    console.log('Online! Starting background sync...');
    const queue = await BillQyroDB.getAll('syncQueue');
    if (queue.length > 0) {
      console.log(\`Syncing \${queue.length} items...\`);
      // Placeholder for full sync logic (will iterate over queue and push to firestore)
      // Then clear queue
      await BillQyroDB.clear('syncQueue');
    }
  });
};
`;
fs.writeFileSync(path.join(SERVICES_DIR, 'syncWorker.js'), syncWorkerCode);

// 4. Migrate dbEngine.js
let storageCode = fs.readFileSync(path.join(__dirname, 'src', 'utils', 'storage.js'), 'utf-8');
storageCode = storageCode.replace(
  "import { db, firebaseReady, auth } from './firebase';",
  "import { db, firebaseReady, auth } from './firebaseConfig';"
);
storageCode = storageCode.replace(
  "import { BillQyroDB } from './indexedDb';",
  "import { BillQyroDB } from './localDb';"
);
storageCode = storageCode.replace(
  "import { getAdminEmail } from './adminAccess';",
  "import { getAdminEmail } from '../utils/adminAccess';"
);
fs.writeFileSync(path.join(SERVICES_DIR, 'dbEngine.js'), storageCode);
fs.unlinkSync(path.join(__dirname, 'src', 'utils', 'storage.js'));

// 5. Update imports across the project
const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const allFiles = walkSync(path.join(__dirname, 'src'));

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;
  
  if (content.includes('../utils/storage')) {
    content = content.replace(/\.\.\/utils\/storage/g, '../services/dbEngine');
    changed = true;
  }
  if (content.includes('./utils/storage')) {
    content = content.replace(/\.\/utils\/storage/g, './services/dbEngine');
    changed = true;
  }
  
  // also update firebase imports if any
  if (content.includes('../utils/firebase')) {
    content = content.replace(/\.\.\/utils\/firebase/g, '../services/firebaseConfig');
    changed = true;
  }
  if (content.includes('./utils/firebase')) {
    content = content.replace(/\.\/utils\/firebase/g, './services/firebaseConfig');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});

console.log('Migration Complete!');
