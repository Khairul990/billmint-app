// src/services/communication/whatsappShareAdapter.js

/**
 * WhatsApp Share Adapter – handles real‑world sharing constraints.
 * Uses the Web Share API when available to share files + text.
 * Falls back to a wa.me deep link (text only) when file sharing is not supported.
 */

export async function shareViaWhatsApp(preparedComm) {
  const { recipient, message, attachments } = preparedComm;
  const phone = recipient.replace(/\D/g, ''); // clean digits
  if (!phone) {
    throw new Error('Recipient phone number is missing or invalid');
  }

  // Build WA deep link (text only) – always available.
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  // Check for Web Share API support.
  if (navigator.canShare && navigator.share) {
    const files = attachments?.map(a => a.blob) ?? [];
    // canShare may reject if file types unsupported.
    if (files.length && navigator.canShare({ files })) {
      try {
        await navigator.share({
          title: 'Invoice Reminder',
          text: message,
          files
        });
        // Success – we cannot know if user actually sent, but mark opened.
        return { status: 'whatsapp_opened', method: 'webshare', link: null };
      } catch (e) {
        console.warn('[WhatsAppShareAdapter] Web Share cancelled or failed', e);
        // Continue to fallback.
      }
    }
  }

  // Fallback – open WhatsApp with pre‑filled text.
  const win = window.open(waLink, '_blank');
  if (win) win.focus();
  return { status: 'whatsapp_opened', method: 'deep_link', link: waLink };
}

export const whatsappShareAdapter = {
  shareViaWhatsApp
};

export default whatsappShareAdapter;
