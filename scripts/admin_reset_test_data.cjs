/**
 * BillQyro - Admin Reset Tool (Development Use Only)
 * 
 * IMPORTANT: This script uses the Firebase Admin SDK to bypass client rules.
 * It is designed to safely delete test data from specific collections.
 * 
 * PREREQUISITES:
 * 1. Go to Firebase Console -> Project Settings -> Service Accounts.
 * 2. Generate a new private key and save it as `service-account.json` in the root of your project.
 * 3. Install the admin SDK: `npm install firebase-admin`
 * 4. Run the script: `node scripts/admin_reset_test_data.cjs`
 */

const admin = require('firebase-admin');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../service-account.json');
const MASTER_ADMIN = 'khairul2052007@gmail.com';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('==================================================');
  console.log('🔥 BILLQYRO SAFE TEST DATA RESET TOOL 🔥');
  console.log('==================================================\n');

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ ERROR: service-account.json not found in project root.');
    console.log('Please download it from Firebase Console -> Project Settings -> Service Accounts.');
    process.exit(1);
  }

  // Admin confirmation
  const adminEmail = await prompt('Enter your master admin email to proceed: ');
  if (adminEmail !== MASTER_ADMIN) {
    console.error('❌ ERROR: Unauthorized. Only master admin can run this script.');
    process.exit(1);
  }

  const targetEmail = await prompt('\nEnter the TEST USER email whose data you want to delete\n(e.g., billing@billqyro.com or test@demo.com): ');
  
  if (targetEmail === MASTER_ADMIN) {
    console.error('❌ ERROR: Cannot target the master admin account for deletion.');
    process.exit(1);
  }

  // Initialize Firebase Admin
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();

  // Find the user in usersList
  const usersRef = db.collection('usersList');
  const snapshot = await usersRef.where('email', '==', targetEmail).get();

  if (snapshot.empty) {
    console.log(`\n⚠️ No test user found with email: ${targetEmail}`);
    process.exit(0);
  }

  const targetUserId = snapshot.docs[0].id;

  console.log(`\nFound test user: ${targetEmail} (UID: ${targetUserId})`);
  console.log('The following collections/documents will be DELETED for this user:');
  console.log(`- /usersList/${targetUserId}`);
  console.log(`- /users/${targetUserId}`);
  console.log(`- /settings/${targetUserId}`);
  console.log(`- /subscription/${targetUserId}`);
  console.log(`- /customers/${targetUserId} (and all sub-items)`);
  console.log(`- /invoices/${targetUserId} (and all sub-items)`);
  console.log(`- /products/${targetUserId} (and all sub-items)`);
  console.log(`- /expenses/${targetUserId} (and all sub-items)`);
  console.log(`- Any /publicInvoices where userId == ${targetUserId}`);

  console.log('\n⚠️ WARNING: This action is IRREVERSIBLE and will permanently delete this data.');
  const confirm = await prompt('Type "DELETE" to confirm destruction of this test data: ');

  if (confirm !== 'DELETE') {
    console.log('\nAborted. No data was deleted.');
    process.exit(0);
  }

  console.log('\n🗑️ Deleting data...');

  try {
    const batch = db.batch();

    // 1. Delete top-level documents
    batch.delete(db.doc(`usersList/${targetUserId}`));
    batch.delete(db.doc(`users/${targetUserId}`));
    batch.delete(db.doc(`settings/${targetUserId}`));
    batch.delete(db.doc(`subscription/${targetUserId}`));

    // Helper to delete a subcollection
    const deleteSubcollection = async (collectionPath) => {
      const items = await db.collection(collectionPath).get();
      items.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Delete the parent document if it exists to clean up
      const parts = collectionPath.split('/');
      if (parts.length > 1) {
        batch.delete(db.doc(`${parts[0]}/${parts[1]}`));
      }
    };

    // 2. Delete subcollections
    await deleteSubcollection(`customers/${targetUserId}/items`);
    await deleteSubcollection(`invoices/${targetUserId}/items`);
    await deleteSubcollection(`products/${targetUserId}/items`);
    await deleteSubcollection(`expenses/${targetUserId}/items`);
    await deleteSubcollection(`orders/${targetUserId}/items`);

    // 3. Delete Public Invoices belonging to this user
    const publicInvoices = await db.collection('publicInvoices').where('userId', '==', targetUserId).get();
    publicInvoices.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit all deletions
    await batch.commit();

    console.log(`\n✅ Successfully deleted all Firestore data for test user: ${targetEmail}`);
    console.log('\n==================================================');
    console.log('MANUAL NEXT STEPS FOR FIREBASE AUTHENTICATION:');
    console.log('1. Go to Firebase Console -> Authentication -> Users');
    console.log(`2. Search for ${targetEmail}`);
    console.log('3. Click the 3 dots (...) next to the user and select "Delete account"');
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Error during deletion:', error);
  }

  process.exit(0);
}

main();
