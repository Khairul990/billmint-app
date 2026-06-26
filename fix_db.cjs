const fs = require('fs');

const path = 'src/services/dbEngine.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /export const updatePremiumRequestStatus = async \([\s\S]*?\} else if \(status === 'Rejected'\) \{/m;

const replacement = `export const updatePremiumRequestStatus = async (requestId, status, targetUserId, plan, rejectionReason = '') => {
  if (!firebaseReady) return false;
  try {
    const reqRef = doc(db, 'premiumRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      throw new Error('Premium request not found.');
    }
    const reqData = reqSnap.data();
    if (reqData.status !== 'Pending') {
      throw new Error(\`This request has already been \${reqData.status.toLowerCase()}.\`);
    }

    await setDoc(reqRef, {
      status,
      rejectionReason,
      approvedAt: status === 'Approved' ? Date.now() : null,
      updatedAt: Date.now()
    }, { merge: true });

    if (status === 'Approved') {
      const activatedAt = Date.now();
      let durationMs = 30 * 24 * 60 * 60 * 1000;
      if (plan === 'Lifetime') {
        durationMs = 100 * 365 * 24 * 60 * 60 * 1000; // 100 years approx for lifetime
      } else if (plan === 'Yearly') {
        durationMs = 365 * 24 * 60 * 60 * 1000;
      } else if (plan === 'Quarterly') {
        durationMs = 90 * 24 * 60 * 60 * 1000;
      }
      
      const expiresAt = plan === 'Lifetime' ? null : (activatedAt + durationMs);

      const sub = {
        status: 'premium',
        activatedAt,
        expiresAt,
        plan
      };

      await setDoc(doc(db, 'subscription', targetUserId), sub);
      await setDoc(doc(db, 'usersList', targetUserId), { planStatus: 'premium' }, { merge: true });
      await setDoc(doc(db, 'settings', targetUserId), { planStatus: 'premium' }, { merge: true });
    } else if (status === 'Rejected') {`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content);
  console.log("SUCCESS!");
} else {
  console.log("FAILED to match block!");
}
