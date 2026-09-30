import { auth, db, getDb, getAuthInstance } from './firebaseConfig.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut } from './fbAuthHelpers.js';
import { doc, setDoc, getDoc } from './fsHelpers.js';
import { getAuthSession as dbGetAuthSession, getRealUserId as dbGetRealUserId, logout as dbLogout } from './dbEngine.js';
import { deviceSessionEngine } from './deviceSessionEngine.js';

const resolveDb = () => getDb() || db || (typeof window !== 'undefined' ? window.__billqyro_db : null);
const resolveAuth = () => getAuthInstance() || auth || (typeof window !== 'undefined' ? window.__billqyro_auth : null);

const enforceDeviceApproval = async (session) => {
  if (!session?.isNewDevice || !session?.approvalRequired || session?.status !== 'pending') return session;
  const currentAuth = resolveAuth();
  if (currentAuth) await signOut(currentAuth);
  deviceSessionEngine.clearLocalSession();
  const error = new Error('NEW_DEVICE_APPROVAL_REQUIRED');
  error.code = 'new-device-approval-required';
  throw error;
};

export const authEngine = {
  async signIn(email, password) {
    const currentAuth = resolveAuth();
    const userCredential = await signInWithEmailAndPassword(currentAuth, email, password);
    const user = userCredential.user;
    const requireApproval = await deviceSessionEngine.getNewDeviceApproval().catch(() => false);
    const session = await deviceSessionEngine.registerCurrentSession({ requireApproval });
    await enforceDeviceApproval(session);
    return user;
  },

  async register(email, password, name) {
    const currentAuth = resolveAuth();
    const userCredential = await createUserWithEmailAndPassword(currentAuth, email, password);
    const user = userCredential.user;
    await this.initializeUserProfile(user, name);
    await deviceSessionEngine.registerCurrentSession({ requireApproval: false });
    return user;
  },

  async signInWithGoogle(name) {
    const provider = new GoogleAuthProvider();
    const currentAuth = resolveAuth();
    const currentDb = resolveDb();
    const result = await signInWithPopup(currentAuth, provider);
    const user = result.user;
    const userDocRef = doc(currentDb, 'usersList', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) await this.initializeUserProfile(user, name || user.displayName || '');
    const requireApproval = await deviceSessionEngine.getNewDeviceApproval().catch(() => false);
    const session = await deviceSessionEngine.registerCurrentSession({ requireApproval });
    await enforceDeviceApproval(session);
    return user;
  },

  async resetPassword(email) {
    const currentAuth = resolveAuth();
    await sendPasswordResetEmail(currentAuth, email);
  },

  async initializeUserProfile(user, name) {
    const currentDb = resolveDb();
    const userDocRef = doc(currentDb, 'usersList', user.uid);
    await setDoc(userDocRef, {
      userId: user.uid,
      email: user.email,
      createdAt: new Date().toISOString(),
      role: 'user'
    }, { merge: true });
    const settingsRef = doc(currentDb, 'settings', user.uid);
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        userId: user.uid,
        email: user.email,
        contactEmail: user.email,
        ownerName: name || user.displayName || '',
        businessName: '',
        phone: '',
        whatsapp: '',
        address: '',
        logoUrl: '',
        setupCompleted: false,
        profileSetupCompleted: false,
        businessSetupCompleted: false,
        paymentSetupCompleted: false,
        createdAt: new Date().toISOString()
      });
    }
  },

  getAuthSession() {
    return dbGetAuthSession();
  },

  getRealUserId() {
    return dbGetRealUserId();
  },

  async hasCompletedOnboarding() {
    const user = resolveAuth()?.currentUser;
    if (!user) return false;
    try {
      const currentDb = resolveDb();
      const settingsSnap = await getDoc(doc(currentDb, 'settings', user.uid));
      if (!settingsSnap.exists()) return false;
      const data = settingsSnap.data();
      if (data.setupCompleted === true) return true;
      if (data.businessName && (data.profileSetupCompleted === true || data.businessSetupCompleted === true || (data.businessWorkspaces && data.businessWorkspaces.length > 0))) return true;
      return false;
    } catch {
      return false;
    }
  },

  async logout() {
    deviceSessionEngine.clearLocalSession();
    return dbLogout();
  }
};
