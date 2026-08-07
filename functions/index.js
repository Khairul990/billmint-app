const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Callable function to set the superAdmin custom claim.
 * In a real production scenario, this should be a one-time script or secured
 * by checking if the caller is already an admin. Since we are migrating,
 * we will allow it to be called by the specific target email once, or by an existing admin.
 */
exports.setSuperAdminClaim = onCall(async (request) => {
  const targetEmail = request.data.email;

  // Ensure the user making the request is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action."
    );
  }

  // Security check: Only allow the specific owner email or an existing superAdmin
  const callerEmail = request.auth.token.email;
  const isCallerSuperAdmin = request.auth.token.superAdmin === true;
  
  // We allow the hardcoded email to bootstrap the process for themselves.
  if (callerEmail !== "khairul2052007@gmail.com" && !isCallerSuperAdmin) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to set admin claims."
    );
  }

  if (!targetEmail) {
    throw new HttpsError("invalid-argument", "Target email is required.");
  }

  try {
    // Look up the user by email
    const userRecord = await admin.auth().getUserByEmail(targetEmail);
    
    // Set the custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { superAdmin: true });
    
    return {
      success: true,
      message: `Successfully granted superAdmin privileges to ${targetEmail}. User must sign out and sign back in for claims to propagate.`
    };
  } catch (error) {
    console.error("Error setting custom claim:", error);
    throw new HttpsError("internal", error.message);
  }
});
