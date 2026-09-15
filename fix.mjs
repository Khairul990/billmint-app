import fs from 'fs';

// Fix Dashboard
let dashboard = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
dashboard = dashboard.replace(/setCurrentTab\('create-bill'\)/g, "setCurrentTab('create-invoice')");
fs.writeFileSync('src/pages/Dashboard.jsx', dashboard);

// Fix Customers
let customers = fs.readFileSync('src/pages/Customers.jsx', 'utf8');
customers = customers.replace(/onClick=\{\(\) => onCreateBill\(cust\)\}/g, "onClick={() => onCreateBill({ ...cust, totalDue: stats?.totalDue || 0 })}");
fs.writeFileSync('src/pages/Customers.jsx', customers);

// Fix App.jsx
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(
  /oldDue: parseFloat\(cust\?.previousDue \?\? cust\?.openingDue \?\? cust\?.openingBalance\) \|\| 0/g,
  "oldDue: parseFloat(cust?.totalDue ?? cust?.previousDue ?? cust?.openingDue ?? cust?.openingBalance) || 0"
);
fs.writeFileSync('src/App.jsx', app);

// Fix CreateInvoice.jsx
let createInvoice = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf8');
createInvoice = createInvoice.replace(
  /value=\{oldDue\}\s*onChange=\{\(e\) => setOldDue\(e\.target\.value\)\}/g,
  "value={oldDue} readOnly"
);
fs.writeFileSync('src/pages/CreateInvoice.jsx', createInvoice);

console.log("All UI fixes applied.");
