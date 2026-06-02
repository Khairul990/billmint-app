const fs = require('fs');

let code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');

// 1. Update imports
const importTarget = `import { syncFromFirestore } from '../services/dbEngine';`;
const importReplacement = `import { syncFromFirestore, getInvoices, getCustomers, getExpenses, getSettings } from '../services/dbEngine';`;
code = code.replace(importTarget, importReplacement);

// 2. Remove props and add local state
const propsTarget = `const Dashboard = ({
  invoices = [],
  customers = [],
  products = [],
  expenses = [],
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDownloadPDF,
  setCurrentTab,
  businessSettings,
  installPromptEvent = null,
  isAppInstalled = false,
  onInstallApp,
  subscription = {},
  onQuickBillOpen
}) => {
  const [searchQuery, setSearchQuery] = useState('');`;

const propsReplacement = `const Dashboard = ({
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onDownloadPDF,
  setCurrentTab,
  installPromptEvent = null,
  isAppInstalled = false,
  onInstallApp,
  subscription = {},
  onQuickBillOpen
}) => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [businessSettings, setBusinessSettings] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Directly fetch from Local IndexedDB (dbEngine)
  useEffect(() => {
    const fetchData = async () => {
      const inv = await getInvoices();
      const cust = await getCustomers();
      const exp = await getExpenses();
      const settings = await getSettings();
      
      setInvoices(inv || []);
      setCustomers(cust || []);
      setExpenses(exp || []);
      setBusinessSettings(settings || {});
    };
    
    fetchData();
    
    // Listen for custom sync events to refresh
    const handleSync = () => fetchData();
    window.addEventListener('billqyro_sync', handleSync);
    return () => window.removeEventListener('billqyro_sync', handleSync);
  }, []);
`;

code = code.replace(propsTarget, propsReplacement);

fs.writeFileSync('src/pages/Dashboard.jsx', code);
console.log('Dashboard updated to fetch locally');
