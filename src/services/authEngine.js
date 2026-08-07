import { auth, db } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuthSession as dbGetAuthSession, getRealUserId as dbGetRealUserId, logout as dbLogout} from './dbEngine';

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
        email: user.email,
        contactEmail: user.email,
        ownerName: name || '',
        businessName: '',
        phone: '',
        whatsapp: '',
        address: '',
        logoUrl: '',
        profileSetupCompleted: false,
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
      return settingsSnap.exists() && settingsSnap.data().profileSetupCompleted === true;
    } catch {
      return false;
    }
  },

  logout() {
    return dbLogout();
  }
};
