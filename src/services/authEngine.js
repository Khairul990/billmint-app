import { auth, db } from './firebaseConfig.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuthSession as dbGetAuthSession, getRealUserId as dbGetRealUserId, logout as dbLogout} from './dbEngine.js';

export const authEngine = {
  async signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  async register(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await this.initializeUserProfile(user, name);
    return user;
  },

  async signInWithGoogle(name) {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const userDocRef = doc(db, 'usersList', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await this.initializeUserProfile(user, name || user.displayName || '');
    }
    return user;
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  },

  async initializeUserProfile(user, name) {
    const userDocRef = doc(db, 'usersList', user.uid);
    await setDoc(userDocRef, {
      userId: user.uid,
      email: user.email,
      createdAt: new Date().toISOString(),
      role: 'user'
    }, { merge: true });
    
    const settingsRef = doc(db, 'settings', user.uid);
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
    const user = auth.currentUser;
    if (!user) return false;
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', user.uid));
      if (!settingsSnap.exists()) return false;
      const data = settingsSnap.data();
      // Canonical check + legacy account migration check
      if (data.setupCompleted === true) return true;
      if (data.businessName && (data.profileSetupCompleted === true || data.businessSetupCompleted === true || (data.businessWorkspaces && data.businessWorkspaces.length > 0))) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout() {
    return dbLogout();
  }
};
