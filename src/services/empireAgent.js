import { db, firebaseReady } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const EMPIRE_AGENT_ENABLED = true;

const IDENTITY = {
  websiteId: "billqyro",
  websiteName: "BillQyro",
  websiteType: "Billing SaaS",
  source: "billqyro_agent"
};

const sanitizeMetadata = (rawMetadata) => {
  if (!rawMetadata || typeof rawMetadata !== 'object') return {};
  const safe = {};
  for (const key of Object.keys(rawMetadata)) {
    if (['string', 'number', 'boolean'].includes(typeof rawMetadata[key])) {
      safe[key] = rawMetadata[key];
    }
  }
  return safe;
};

export const sendEmpireEvent = async ({ eventType, message, severity = 'Low', page = 'unknown', metadata = {} }) => {
  if (!EMPIRE_AGENT_ENABLED || !firebaseReady || !db) return;
  try {
    const payload = {
      ...IDENTITY,
      eventType,
      message,
      severity,
      page,
      metadata: sanitizeMetadata(metadata),
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'control_website_events'), payload);
  } catch (error) {
    // Silently fail so BillQyro isn't interrupted
  }
};

export const sendEmpireError = async ({ errorType, message, severity = 'High', page = 'unknown', metadata = {} }) => {
  if (!EMPIRE_AGENT_ENABLED || !firebaseReady || !db) return;
  try {
    const payload = {
      ...IDENTITY,
      errorType,
      message,
      severity,
      page,
      metadata: sanitizeMetadata(metadata),
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'control_website_errors'), payload);
  } catch (error) {
    // Silently fail
  }
};

export const sendEmpireHealth = async ({ status = 'Healthy', healthScore = 100, note = '' }) => {
  if (!EMPIRE_AGENT_ENABLED || !firebaseReady || !db) return;
  try {
    const payload = {
      ...IDENTITY,
      status,
      healthScore,
      note,
      lastPingAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'control_website_health'), payload);
  } catch (error) {
    // Silently fail
  }
};
