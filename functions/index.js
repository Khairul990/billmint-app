const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const hashSecret = (value) => require("crypto").createHash("sha256").update(String(value)).digest("hex");

async function authorizeSession(request, sessionId, sessionSecret) {
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in.");
  if (!sessionId || !sessionSecret) throw new HttpsError("invalid-argument", "Session authorization is required.");
  const ref = db.doc(`users/${request.auth.uid}/sessions/${sessionId}`);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("permission-denied", "Session is not registered.");
  const data = snap.data();
  if (data.status !== "active") throw new HttpsError("permission-denied", "Current session is not trusted.");
  if (data.sessionSecretHash !== hashSecret(sessionSecret)) throw new HttpsError("permission-denied", "Invalid session authorization.");
  return { ref, data };
}

/**
 * Callable function to set the superAdmin custom claim.
 */
exports.setSuperAdminClaim = onCall(async (request) => {
  const targetEmail = request.data.email;
  if (!request.auth) throw new HttpsError("unauthenticated", "You must be logged in to perform this action.");
  const callerEmail = request.auth.token.email;
  const isCallerSuperAdmin = request.auth.token.superAdmin === true;
  if (callerEmail !== "khairul2052007@gmail.com" && !isCallerSuperAdmin) {
    throw new HttpsError("permission-denied", "You do not have permission to set admin claims.");
  }
  if (!targetEmail) throw new HttpsError("invalid-argument", "Target email is required.");
  try {
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(userRecord.uid, { superAdmin: true });
    return { success: true, message: `Successfully granted superAdmin privileges to ${targetEmail}.` };
  } catch (error) {
    console.error("Error setting custom claim:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Revoke one other device session. Authorization is bound to the caller's
 * session-specific secret, so an untrusted device cannot impersonate another session.
 */
exports.revokeDeviceSession = onCall(async (request) => {
  const { targetSessionId, callerSessionId, callerSessionSecret } = request.data || {};
  const { ref: callerRef } = await authorizeSession(request, callerSessionId, callerSessionSecret);
  if (!targetSessionId || targetSessionId === callerSessionId) {
    throw new HttpsError("invalid-argument", "A different target session is required.");
  }
  const targetRef = db.doc(`users/${request.auth.uid}/sessions/${targetSessionId}`);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "Target session not found.");
  await targetRef.set({ status: "revoked", revokedAt: admin.firestore.FieldValue.serverTimestamp(), revokedBySessionId: callerSessionId }, { merge: true });
  await db.collection(`auditLogs/${request.auth.uid}/items`).add({
    userId: request.auth.uid,
    action: "device_revoked",
    entityType: "session",
    entityId: targetSessionId,
    createdAt: new Date().toISOString(),
    metadata: { revokedBySessionId: callerSessionId }
  });
  return { success: true, callerSessionId, targetSessionId, callerStillActive: Boolean(callerRef) };
});

/**
 * Approve a pending device. A device cannot approve itself.
 */
exports.approveDeviceSession = onCall(async (request) => {
  const { targetSessionId, callerSessionId, callerSessionSecret } = request.data || {};
  await authorizeSession(request, callerSessionId, callerSessionSecret);
  if (!targetSessionId || targetSessionId === callerSessionId) {
    throw new HttpsError("permission-denied", "A device cannot approve itself.");
  }
  const targetRef = db.doc(`users/${request.auth.uid}/sessions/${targetSessionId}`);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "Target session not found.");
  await targetRef.set({ status: "active", approvalRequired: false, approvedAt: admin.firestore.FieldValue.serverTimestamp(), approvedBySessionId: callerSessionId }, { merge: true });
  await db.collection(`auditLogs/${request.auth.uid}/items`).add({
    userId: request.auth.uid,
    action: "device_approved",
    entityType: "session",
    entityId: targetSessionId,
    createdAt: new Date().toISOString(),
    metadata: { approvedBySessionId: callerSessionId }
  });
  return { success: true, targetSessionId };
});

/**
 * Revoke every other active/pending session while keeping the caller active.
 */
exports.logoutOtherDeviceSessions = onCall(async (request) => {
  const { callerSessionId, callerSessionSecret } = request.data || {};
  await authorizeSession(request, callerSessionId, callerSessionSecret);
  const snap = await db.collection(`users/${request.auth.uid}/sessions`).get();
  const batch = db.batch();
  let count = 0;
  snap.docs.forEach((sessionDoc) => {
    if (sessionDoc.id === callerSessionId) return;
    const data = sessionDoc.data();
    if (["revoked", "blocked"].includes(data.status)) return;
    batch.set(sessionDoc.ref, { status: "revoked", revokedAt: admin.firestore.FieldValue.serverTimestamp(), revokedBySessionId: callerSessionId }, { merge: true });
    count += 1;
  });
  if (count) await batch.commit();
  return { success: true, count };
});