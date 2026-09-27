/**
 * ONE-TIME ADMIN SETUP SCRIPT
 *
 * Usage:
 *   node scripts/setAdminClaim.mjs <ADMIN_EMAIL>
 *
 * NOTE:
 * - Must be run ONCE after deployment to grant the { role: "superadmin" } custom auth claim.
 * - NEVER commit real credentials inline!
 * - Ensure serviceAccountKey.json is placed in the project root (or set FIREBASE_SERVICE_ACCOUNT_PATH).
 * - serviceAccountKey.json is listed in .gitignore.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

let admin;
try {
  const mod = await import('firebase-admin');
  admin = mod.default || mod;
} catch {
  try {
    const mod = await import('../functions/node_modules/firebase-admin/lib/index.js');
    admin = mod.default || mod;
  } catch (err) {
    console.error('Error: firebase-admin module not found.', err.message);
    console.error('Please install firebase-admin via "npm install firebase-admin" or run inside functions folder.');
    process.exit(1);
  }
}

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || resolve('./serviceAccountKey.json');

if (!existsSync(serviceAccountPath)) {
  console.error(`Error: Service account file not found at ${serviceAccountPath}`);
  console.error('Please download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts, and place it in the project root (or set FIREBASE_SERVICE_ACCOUNT_PATH).');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps?.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const targetEmail = process.argv[2] || process.env.ADMIN_EMAIL;

if (!targetEmail) {
  console.error('Error: Please provide an admin email address as an argument.');
  console.error('Example: node scripts/setAdminClaim.mjs admin@example.com');
  process.exit(1);
}

async function setAdminClaim() {
  try {
    console.log(`Searching for user with email: ${targetEmail}...`);
    const user = await admin.auth().getUserByEmail(targetEmail);
    console.log(`Found user: UID = ${user.uid}`);

    await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });
    console.log(`SUCCESS: Custom claim { role: "superadmin" } granted to ${targetEmail} (UID: ${user.uid})`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting custom user claim:', error);
    process.exit(1);
  }
}

setAdminClaim();
