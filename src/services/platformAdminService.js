import { db, firebaseReady } from './firebaseConfig';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';

// --- SUPPORT TICKETS ---
export const submitSupportTicket = async (userId, userEmail, userPhone, issueType, message, screenshotBase64 = '') => {
  const ticketId = 'ticket-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const payload = {
    id: ticketId,
    userId,
    userEmail,
    userPhone,
    issueType,
    message,
    screenshotBase64,
    status: 'Open', // 'Open' or 'Closed'
    adminNote: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_support_tickets') || '[]');
    cached.push(payload);
    localStorage.setItem('billqyro_platform_support_tickets', JSON.stringify(cached));
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'supportTickets', ticketId), payload);
      return payload;
    } catch (e) {
      console.error('Error saving support ticket to Firestore', e);
    }
  }

  return payload;
};

export const getAdminAllSupportTickets = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'supportTickets'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Error fetching support tickets from Firestore', e);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('billqyro_platform_support_tickets') || '[]');
  } catch (e) {
    return [];
  }
};

export const getUserSupportTickets = async (userId) => {
  const all = await getAdminAllSupportTickets();
  return all.filter(t => t.userId === userId);
};

export const updateSupportTicketStatus = async (ticketId, status, adminNote = '') => {
  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_support_tickets') || '[]');
    const idx = cached.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      cached[idx].status = status;
      cached[idx].adminNote = adminNote;
      cached[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('billqyro_platform_support_tickets', JSON.stringify(cached));
    }
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'supportTickets', ticketId), {
        status,
        adminNote,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error('Error updating support ticket status', e);
      return false;
    }
  }

  return true;
};


// --- FEATURE REQUESTS ---
export const submitFeatureRequest = async (userId, userEmail, title, description, businessType, priority = 'Medium') => {
  const requestId = 'feature-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const payload = {
    id: requestId,
    userId,
    userEmail,
    title,
    description,
    businessType,
    priority,
    status: 'New', // 'New' | 'Planned' | 'Rejected' | 'Done'
    adminNote: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_feature_requests') || '[]');
    cached.push(payload);
    localStorage.setItem('billqyro_platform_feature_requests', JSON.stringify(cached));
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'featureRequests', requestId), payload);
      return payload;
    } catch (e) {
      console.error('Error saving feature request to Firestore', e);
    }
  }

  return payload;
};

export const getAdminAllFeatureRequests = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'featureRequests'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Error fetching feature requests', e);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('billqyro_platform_feature_requests') || '[]');
  } catch (e) {
    return [];
  }
};

export const getUserFeatureRequests = async (userId) => {
  const all = await getAdminAllFeatureRequests();
  return all.filter(r => r.userId === userId);
};

export const updateFeatureRequestStatus = async (requestId, status, adminNote = '') => {
  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_feature_requests') || '[]');
    const idx = cached.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      cached[idx].status = status;
      cached[idx].adminNote = adminNote;
      cached[idx].updatedAt = new Date().toISOString();
      localStorage.setItem('billqyro_platform_feature_requests', JSON.stringify(cached));
    }
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'featureRequests', requestId), {
        status,
        adminNote,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error('Error updating feature request', e);
      return false;
    }
  }

  return true;
};


// --- ANNOUNCEMENTS ---
export const createAnnouncement = async (title, message, type = 'info', active = true, startDate = '', endDate = '') => {
  const announcementId = 'announcement-' + Date.now();
  const payload = {
    id: announcementId,
    title,
    message,
    type, // 'info' | 'warning' | 'maintenance' | 'update'
    active,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '',
    createdAt: new Date().toISOString()
  };

  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_announcements') || '[]');
    cached.push(payload);
    localStorage.setItem('billqyro_platform_announcements', JSON.stringify(cached));
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'adminAnnouncements', announcementId), payload);
      return payload;
    } catch (e) {
      console.error('Error saving announcement', e);
    }
  }

  return payload;
};

export const getAdminAllAnnouncements = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'adminAnnouncements'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Error fetching announcements', e);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('billqyro_platform_announcements') || '[]');
  } catch (e) {
    return [];
  }
};

export const getActiveAnnouncement = async () => {
  const all = await getAdminAllAnnouncements();
  const activeList = all.filter(a => {
    if (!a.active) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    if (a.startDate && nowStr < a.startDate) return false;
    if (a.endDate && nowStr > a.endDate) return false;
    return true;
  });
  return activeList[0] || null;
};

export const toggleAnnouncementActive = async (announcementId, active) => {
  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_announcements') || '[]');
    const idx = cached.findIndex(a => a.id === announcementId);
    if (idx !== -1) {
      cached[idx].active = active;
      localStorage.setItem('billqyro_platform_announcements', JSON.stringify(cached));
    }
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'adminAnnouncements', announcementId), { active }, { merge: true });
      return true;
    } catch (e) {
      console.error('Error toggling announcement active', e);
      return false;
    }
  }

  return true;
};


// --- CHANGELOGS ---
export const createChangelog = async (version, date, title, notes, type = 'new') => {
  const changelogId = 'changelog-' + Date.now();
  const payload = {
    id: changelogId,
    version,
    date: date || new Date().toISOString().split('T')[0],
    title,
    notes,
    type, // 'new' | 'fix' | 'improvement'
    createdAt: new Date().toISOString()
  };

  try {
    const cached = JSON.parse(localStorage.getItem('billqyro_platform_changelogs') || '[]');
    cached.push(payload);
    localStorage.setItem('billqyro_platform_changelogs', JSON.stringify(cached));
  } catch (e) { console.warn('Ignored error in platformAdminService.js:', e); }

  if (firebaseReady) {
    try {
      await setDoc(doc(db, 'appChangelogs', changelogId), payload);
      return payload;
    } catch (e) {
      console.error('Error creating changelog', e);
    }
  }

  return payload;
};

export const getAdminAllChangelogs = async () => {
  if (firebaseReady) {
    try {
      const snap = await getDocs(collection(db, 'appChangelogs'));
      const list = [];
      snap.forEach(doc => list.push(doc.data()));
      return list.sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
    } catch (e) {
      console.error('Error fetching changelogs', e);
    }
  }

  try {
    return JSON.parse(localStorage.getItem('billqyro_platform_changelogs') || '[]');
  } catch (e) {
    return [];
  }
};
