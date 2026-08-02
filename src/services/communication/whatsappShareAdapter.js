// src/services/communication/whatsappShareAdapter.js

/**
 * WhatsApp Share Adapter – handles real‑world sharing constraints.
 * Primary path: Web Share API with the prepared files (PDF + business image),
 * which on mobile opens WhatsApp with the invoice PDF actually attached.
 * Fallback: wa.me deep link (text only) when file sharing is unsupported.
 *
 * Honesty contract: `filesShared` is only ever `true` when the files were
 * genuinely handed to the OS share sheet. The deep-link fallback always
 * reports `filesShared: false` so callers never claim the PDF was attached.
 */

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigator.userAgent || '');
};

export async function shareViaWhatsApp(preparedComm) {
  const { recipient, message, attachments } = preparedComm || {};
  const phone = (recipient || '').replace(/\D/g, '');
  if (!phone) {
    throw new Error('Recipient phone number is missing or invalid');
  }

  // Text-only deep link – always available as the final fallback.
  const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message || '')}`;

  // Gather real, shareable files (skip failed/unready attachments).
  const files = (attachments || [])
    .filter(a => a && a.ready && a.blob)
    .map(a => new File([a.blob], a.name || 'document.pdf', { type: a.mimeType || a.blob.type || 'application/pdf' }));

  const shareApiSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const filesShareSupported = shareApiSupported && typeof navigator.canShare === 'function';

  // Primary path: Web Share API with files. On Android/iOS this hands the
  // PDF + image + message to WhatsApp together.
  if (shareApiSupported && files.length > 0 && filesShareSupported) {
    let canShareFiles = false;
    try {
      canShareFiles = navigator.canShare({ files });
    } catch (e) {
      canShareFiles = false;
    }
    if (canShareFiles) {
      try {
        await navigator.share({
          title: 'Invoice Reminder',
          text: message || '',
          files
        });
        return { status: 'whatsapp_opened', method: 'webshare', filesShared: true, link: null, filesCount: files.length };
      } catch (e) {
        if (e && e.name === 'AbortError') {
          return { status: 'cancelled', method: 'webshare', filesShared: false, link: null, filesCount: 0 };
        }
        console.warn('[WhatsAppShareAdapter] Web Share failed', e);
        // Fall through to the deep link below.
      }
    }
  }

  // No shareable files but share sheet available – share text only.
  if (shareApiSupported && files.length === 0) {
    try {
      if (navigator.canShare && !navigator.canShare({ text: message || '' })) {
        throw new Error('Text sharing unsupported');
      }
      await navigator.share({
        title: 'Invoice Reminder',
        text: message || ''
      });
      return { status: 'whatsapp_opened', method: 'webshare', filesShared: false, link: null, filesCount: 0 };
    } catch (e) {
      if (e && e.name === 'AbortError') {
        return { status: 'cancelled', method: 'webshare', filesShared: false, link: null, filesCount: 0 };
      }
      console.warn('[WhatsAppShareAdapter] Web Share text failed', e);
    }
  }

  // Fallback – open WhatsApp with the pre-filled message. Files cannot be
  // auto-attached here, so we report filesShared: false (never claim otherwise).
  const win = window.open(waLink, '_blank');
  if (win) win.focus();
  return {
    status: 'whatsapp_opened',
    method: 'deep_link',
    filesShared: false,
    filesCount: 0,
    link: waLink,
    deviceIsMobile: isMobileDevice()
  };
}

export const whatsappShareAdapter = {
  shareViaWhatsApp
};

export default whatsappShareAdapter;
