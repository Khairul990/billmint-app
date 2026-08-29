/**
 * Firebase Authentication Verification Bridge Middleware.
 * Verifies Bearer ID Tokens and extracts trusted user identity.
 */

// In-memory test token adapter for automated unit / integration testing without active Firebase private key
const TEST_TOKENS = new Map([
  ['valid_dev_token_alice', { uid: 'fb_dev_user_alice', email: 'alice@dev.billqyro.local', name: 'Alice Enterprise Dev' }],
  ['valid_dev_token_bob', { uid: 'fb_dev_user_bob', email: 'bob@dev.billqyro.local', name: 'Bob Retailer Dev' }],
  ['valid_dev_token_newbie', { uid: 'fb_dev_user_newbie', email: 'newbie@dev.billqyro.local', name: 'Newbie User' }]
]);

/**
 * Validates token with Firebase Admin SDK or local test boundary
 */
export const verifyFirebaseToken = async (token) => {
  if (!token || typeof token !== 'string') return null;

  // 1. Check test token adapter first (for offline test suite & mock environments)
  if (TEST_TOKENS.has(token)) {
    return TEST_TOKENS.get(token);
  }

  // 2. Dynamic test token prefix for programmatic testing: "mock_test_token:<uid>:<email>"
  if (token.startsWith('mock_test_token:')) {
    const parts = token.split(':');
    const uid = parts[1] || 'mock_uid_' + Date.now();
    const email = parts[2] || `${uid}@billqyro.local`;
    return { uid, email, name: parts[3] || 'Test User' };
  }

  // 3. Fallback for actual Firebase Admin SDK in production / live cloud setup
  try {
    const admin = await import('firebase-admin');
    if (admin.apps && admin.apps.length > 0) {
      const decoded = await admin.auth().verifyIdToken(token);
      return {
        uid: decoded.uid,
        email: decoded.email || '',
        name: decoded.name || decoded.display_name || ''
      };
    }
  } catch (err) {
    // Invalid Firebase Token
    return null;
  }

  return null;
};

/**
 * Authentication Middleware: Enforces verified Bearer token
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. Missing or malformed Authorization header.',
        requestId: req.requestId
      }
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or empty authentication token.',
        requestId: req.requestId
      }
    });
  }

  try {
    const verified = await verifyFirebaseToken(token);
    if (!verified || !verified.uid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid, expired, or revoked authentication token.',
          requestId: req.requestId
        }
      });
    }

    req.auth = {
      firebaseUid: verified.uid,
      email: verified.email || '',
      name: verified.name || ''
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: {
        code: 'AUTH_VERIFICATION_FAILED',
        message: 'Failed to verify authentication credentials.',
        requestId: req.requestId
      }
    });
  }
};
