const fs = require('node:fs');
const path = 'src/pages/SettingsStudioV2.jsx';
const source = fs.readFileSync(path, 'utf8');

const importNeedle = "import { firebaseReady } from '../services/firebaseConfig';";
const importReplacement = `${importNeedle}\nimport DeviceSecurityPanel from '../components/security/DeviceSecurityPanel';`;

let output = source;
if (!output.includes("DeviceSecurityPanel from '../components/security/DeviceSecurityPanel'")) {
  if (!output.includes(importNeedle)) throw new Error('Settings firebase import marker not found');
  output = output.replace(importNeedle, importReplacement);
}

const caseMarker = "\n      case 'users':";
if (!output.includes(caseMarker)) throw new Error("Settings 'users' case marker not found");
if (!output.includes('<DeviceSecurityPanel />')) {
  output = output.replace(caseMarker, `\n      case 'device-security-panel':\n        return (\n          <div className=\"space-y-6 animate-fadeIn\">\n            <DeviceSecurityPanel />\n          </div>\n        );\n${caseMarker}`);
}

// Make the security section include the panel without changing its existing controls.
const securityHeading = "<h2 className=\"text-lg font-black text-theme-primary tracking-tight\">Security, API Keys & Credentials</h2>";
if (!output.includes(securityHeading)) throw new Error('Security heading marker not found');
if (!output.includes('<DeviceSecurityPanel />')) throw new Error('DeviceSecurityPanel insertion failed');

fs.writeFileSync(path, output);
console.log('Device security UI patch prepared.');
