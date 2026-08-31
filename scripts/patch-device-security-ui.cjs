const fs = require('node:fs');
const path = 'src/pages/SettingsStudioV2.jsx';
const source = fs.readFileSync(path, 'utf8');

const importNeedle = "import { firebaseReady } from '../services/firebaseConfig';";
const importLine = "import DeviceSecurityPanel from '../components/security/DeviceSecurityPanel';";
let output = source;
if (!output.includes(importLine)) {
  if (!output.includes(importNeedle)) throw new Error('Settings firebase import marker not found');
  output = output.replace(importNeedle, `${importNeedle}\n${importLine}`);
}

const securityStart = output.indexOf("case 'security':");
const usersStart = output.indexOf("\n      case 'users':", securityStart);
if (securityStart < 0 || usersStart < 0) throw new Error('Security switch markers not found');
const securityBlock = output.slice(securityStart, usersStart);
if (!securityBlock.includes('Security, API Keys & Credentials')) throw new Error('Security section marker not found');
if (!securityBlock.includes('<DeviceSecurityPanel />')) {
  const closing = securityBlock.lastIndexOf('</div>');
  if (closing < 0) throw new Error('Security section closing marker not found');
  const panel = `\n\n            <div className=\"bg-theme-card rounded-2xl p-5 border border-theme-border-soft shadow-xs\">\n              <DeviceSecurityPanel />\n            </div>\n`;
  const absolute = securityStart + closing;
  output = output.slice(0, absolute) + panel + output.slice(absolute);
}

fs.writeFileSync(path, output);
console.log('Device security panel wired into the existing Security & Access section.');
