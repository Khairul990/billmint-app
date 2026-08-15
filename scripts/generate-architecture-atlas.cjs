const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const destFile = path.join(__dirname, '../docs/architecture/atlas/data/architecture.json');

const nodes = [];
const edges = [];

// Layout categories (forces nodes into clusters in D3 grid)
const groups = {
  system: { id: 'sys', name: 'Core System', cols: 2 },
  domain: { id: 'dom', name: 'Business Domains', cols: 4 },
  engine: { id: 'eng', name: 'Engines & Services', cols: 6 },
  page: { id: 'pag', name: 'Pages & Routes', cols: 5 },
  component: { id: 'com', name: 'UI Components', cols: 8 },
  context: { id: 'ctx', name: 'Contexts & State', cols: 4 },
  hook: { id: 'hok', name: 'Hooks', cols: 4 },
  util: { id: 'utl', name: 'Utilities & Config', cols: 4 },
  storage: { id: 'sto', name: 'Data Stores', cols: 4 }
};

nodes.push({ id: 'billqyro', label: 'BillQyro', type: 'system', group: 'sys', icon: 'map', description: 'Core Application' });

function addNode(id, label, type, description, file, icon, groupKey) {
  if (!nodes.find(n => n.id === id)) {
    nodes.push({
      id, label, type, group: groups[groupKey] ? groups[groupKey].id : groups.system.id, icon, description, file
    });
  }
}

function addEdge(source, target, label) {
  if (source && target && !edges.find(e => e.source === source && e.target === target)) {
    edges.push({ source, target, label });
  }
}

function scanDir(dirName, type, icon, groupKey, prefix = '') {
  const dirPath = path.join(srcDir, dirName);
  if (fs.existsSync(dirPath)) {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        scanDir(path.join(dirName, item), type, icon, groupKey, prefix + item + '/');
      } else if (item.endsWith('.jsx') || item.endsWith('.js')) {
        const id = `${type}_` + item.replace(/\.jsx?$/, '').toLowerCase();
        const stat = fs.statSync(fullPath);
        addNode(id, item, type, `${prefix}${item} - Size: ${(stat.size/1024).toFixed(1)} KB`, `src/${dirName}/${prefix}${item}`, icon, groupKey);
        // Add a generic dependency to core for visual connectivity
        addEdge('billqyro', id, 'uses');
      }
    });
  }
}

// 1. Scan Services (Engines)
scanDir('services', 'engine', 'settings', 'engine');
// 2. Scan Pages
scanDir('pages', 'page', 'layout', 'page');
// 3. Scan Components
scanDir('components', 'component', 'box', 'component');
// 4. Scan Contexts
scanDir('contexts', 'context', 'database', 'context');
// 5. Scan Hooks
scanDir('hooks', 'hook', 'settings', 'hook');
// 6. Scan Utils
scanDir('utils', 'util', 'settings', 'util');
// 7. Scan Config
scanDir('config', 'config', 'settings', 'util');

const output = { 
  groups: Object.values(groups),
  nodes, 
  edges 
};

fs.writeFileSync(destFile, JSON.stringify(output, null, 2));
console.log(`Deep scan complete. Generated atlas with ${nodes.length} nodes and ${edges.length} edges.`);
