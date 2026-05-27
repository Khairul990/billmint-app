const fs = require('fs');
let appJS = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Initial State
appJS = appJS.replace(
  /const \[invoices, setInvoices\] = useState\(\(\) => getInvoices\(\)\);/,
  `const [invoices, setInvoices] = useState([]);`
);
appJS = appJS.replace(
  /const \[customers, setCustomers\] = useState\(\(\) => getCustomers\(\)\);/,
  `const [customers, setCustomers] = useState([]);`
);
appJS = appJS.replace(
  /const \[products, setProducts\] = useState\(\(\) => getProducts\(\)\);/,
  `const [products, setProducts] = useState([]);`
);
appJS = appJS.replace(
  /const \[expenses, setExpenses\] = useState\(\(\) => getExpenses\(\)\);/,
  `const [expenses, setExpenses] = useState([]);`
);
// Settings and subscription are still synchronous in storage.js, but let's be safe.

// 2. Add an initialization useEffect to fetch async data on mount
const loadDataEffect = `
  // Async Data Loader for IndexedDB
  useEffect(() => {
    const loadLocalData = async () => {
      setInvoices(await getInvoices());
      setCustomers(await getCustomers());
      setProducts(await getProducts());
      setExpenses(await getExpenses());
    };
    loadLocalData();
  }, []);
`;
appJS = appJS.replace(/\/\/ Workspace Contexts/, loadDataEffect + '\n  // Workspace Contexts');

// 3. Fix handleSync to use async
appJS = appJS.replace(
  /const handleSync = \(\) => {\s*setInvoices\(getInvoices\(\)\);\s*setCustomers\(getCustomers\(\)\);\s*setProducts\(getProducts\(\)\);\s*setSettings\(getSettings\(\)\);\s*setExpenses\(getExpenses\(\)\);\s*setSubscription\(getSubscriptionStatus\(\)\);\s*};/g,
  `const handleSync = async () => {
      setInvoices(await getInvoices());
      setCustomers(await getCustomers());
      setProducts(await getProducts());
      setSettings(getSettings());
      setExpenses(await getExpenses());
      setSubscription(getSubscriptionStatus());
    };`
);

// 4. Fix handleLoginSuccess to use async
appJS = appJS.replace(
  /setInvoices\(getInvoices\(\)\);\s*setCustomers\(getCustomers\(\)\);\s*setProducts\(getProducts\(\)\);\s*const currentSettings = getSettings\(\) \|\| \{\};\s*setSettings\(currentSettings\);\s*setExpenses\(getExpenses\(\)\);/g,
  `getInvoices().then(setInvoices);
    getCustomers().then(setCustomers);
    getProducts().then(setProducts);
    const currentSettings = getSettings() || {};
    setSettings(currentSettings);
    getExpenses().then(setExpenses);`
);

fs.writeFileSync('src/App.jsx', appJS);
console.log('App.jsx refactored.');
