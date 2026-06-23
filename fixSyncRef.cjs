const fs = require('fs');
const path = require('path');

const dbEnginePath = path.join(__dirname, 'src', 'services', 'dbEngine.js');
const syncEnginePath = path.join(__dirname, 'src', 'services', 'syncEngine.js');

let dbEngineCode = fs.readFileSync(dbEnginePath, 'utf8');
let syncEngineCode = fs.readFileSync(syncEnginePath, 'utf8');

// Remove the import from dbEngine.js
dbEngineCode = dbEngineCode.replace(/import\s+\{\s*getDeviceId,\s*pushDataUpdate\s*\}\s*from\s*['"]\.\/syncEngine['"];/g, '');

// Also remove the require from dbEngine.js line 1253: const { pushDataUpdate } = require('./syncEngine');
// Since pushDataUpdate will be in the same file now, we don't need require.
dbEngineCode = dbEngineCode.replace(/const\s+\{\s*pushDataUpdate\s*\}\s*=\s*require\(['"]\.\/syncEngine['"]\);/g, '');

// Clean up syncEngineCode to be appended to dbEngineCode
// Remove imports in syncEngineCode
syncEngineCode = syncEngineCode.replace(/import.*?from\s+['"].*?['"];/g, '');

// Append to dbEngineCode
dbEngineCode = dbEngineCode + '\n// --- MERGED FROM SYNCENGINE ---\n' + syncEngineCode;

fs.writeFileSync(dbEnginePath, dbEngineCode);

// Now, replace syncEngine.js entirely with a file that re-exports from dbEngine
const newSyncEngineCode = `
export {
  getDeviceId,
  cloudWins,
  enqueueSync,
  flushSyncQueue,
  pushDataUpdate,
  startRealTimeSync,
  stopRealTimeSync
} from './dbEngine';
`;

fs.writeFileSync(syncEnginePath, newSyncEngineCode);

console.log("Merged syncEngine into dbEngine and updated exports.");
