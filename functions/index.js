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
  const isCallerSuperAdmin = request.auth.token.role === "superadmin" || request.auth.token.superAdmin === true;
  if (!isCallerSuperAdmin) {
    throw new HttpsError("permission-denied", "You do not have permission to set admin claims.");
  }
  if (!targetEmail) throw new HttpsError("invalid-argument", "Target email is required.");
  try {
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: "superadmin" });
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

const { defineSecret } = require("firebase-functions/params");
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmail = defineSecret("SENDGRID_FROM_EMAIL");

/**
 * Callable Cloud Function to send transactional emails via SendGrid.
 * Reads SENDGRID_API_KEY from Firebase Functions secret storage.
 */
exports.sendTransactionalEmail = onCall({ enforceAppCheck: true, secrets: [sendgridApiKey, sendgridFromEmail] }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required to send transactional emails.");
  const { to, subject, templateId, templateData, text, html } = request.data || {};
  if (!to || (!subject && !templateId)) {
    throw new HttpsError("invalid-argument", "Missing required email parameters (to, subject/templateId).");
  }

  const apiKey = sendgridApiKey.value() || process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "SENDGRID_API_KEY secret is not configured in Cloud Functions.");
  }

  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(apiKey);

  const fromEmail = sendgridFromEmail.value() || process.env.SENDGRID_FROM_EMAIL || "no-reply@billqyro.app";

  const msg = {
    to,
    from: fromEmail,
    subject: subject || "BillQyro Transactional Notice",
    text: text || "Please check your invoice details.",
    html: html || undefined,
  };

  if (templateId) {
    msg.templateId = templateId;
    if (templateData) msg.dynamicTemplateData = templateData;
  }

  try {
    const [response] = await sgMail.send(msg);
    const messageId = response?.headers?.["x-message-id"] || `msg_${Date.now()}`;
    return { success: true, messageId };
  } catch (error) {
    console.error("SendGrid send error:", error?.response?.body || error);
    throw new HttpsError("internal", error.message || "Failed to dispatch email via SendGrid.");
  }
});

/**
 * Callable Cloud Function to submit manual bKash / Nagad payment verification.
 * Validates format, logs pending_review status in Firestore, and notifies Super Admin.
 */
exports.verifyManualPayment = onCall({ enforceAppCheck: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required to submit payment verification.");
  const { transactionId, method, amount, invoiceId } = request.data || {};

  if (!transactionId || !method || !amount || !invoiceId) {
    throw new HttpsError("invalid-argument", "Transaction ID, method (bkash/nagad), amount, and invoiceId are required.");
  }

  const cleanMethod = String(method).toLowerCase().trim();
  if (!["bkash", "nagad"].includes(cleanMethod)) {
    throw new HttpsError("invalid-argument", "Method must be either 'bkash' or 'nagad'.");
  }

  const cleanTxnId = String(transactionId).trim().toUpperCase();
  const txnRegex = /^[A-Za-z0-9]{8,14}$/;
  if (!txnRegex.test(cleanTxnId)) {
    throw new HttpsError("invalid-argument", "Invalid transaction ID format. Must be an 8-14 character alphanumeric code.");
  }

  try {
    const verificationRef = db.collection("paymentVerifications").doc();
    const verificationData = {
      id: verificationRef.id,
      userId: request.auth.uid,
      userEmail: request.auth.token.email || "",
      transactionId: cleanTxnId,
      method: cleanMethod,
      amount: Number(amount),
      invoiceId: String(invoiceId),
      status: "pending_review",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await verificationRef.set(verificationData);

    // Notify Super Admin via adminNotifications collection
    await db.collection("adminNotifications").add({
      type: "manual_payment_verification",
      title: `New ${cleanMethod.toUpperCase()} Payment Verification`,
      body: `User ${request.auth.token.email || request.auth.uid} submitted Txn #${cleanTxnId} for ${amount} (Invoice: ${invoiceId}).`,
      verificationId: verificationRef.id,
      invoiceId: String(invoiceId),
      amount: Number(amount),
      method: cleanMethod,
      transactionId: cleanTxnId,
      userId: request.auth.uid,
      status: "unread",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      verificationId: verificationRef.id,
      status: "pending_review",
      message: "Payment submitted for manual verification. Super Admin review pending."
    };
  } catch (error) {
    console.error("Error creating payment verification doc:", error);
    throw new HttpsError("internal", error.message || "Failed to submit manual payment verification.");
  }
});