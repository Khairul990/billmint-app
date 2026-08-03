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

/**
 * Ensures a string is valid, well-formed Unicode before it leaves the app.
 * Preserves valid emoji surrogate pairs, drops lone surrogate halves and
 * replacement/noncharacter code points (U+FFFD/U+FFFE/U+FFFF) so the
 * recipient never receives a corrupted character in the final message.
 */
const ensureValidUnicode = (str = '') => {
  const s = String(str);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xD800 && c <= 0xDBFF) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {
        out += s[i] + s[i + 1];
        i += 1;
      }
    } else if (c >= 0xDC00 && c <= 0xDFFF) {
      // Lone low surrogate – skip.
    } else if (c === 0xFFFD || c === 0xFFFE || c === 0xFFFF) {
      // Replacement character / invalid noncharacters – skip.
    } else {
      out += s[i];
    }
  }
  return out;
};

export async function shareViaWhatsApp(preparedComm) {
  const { recipient, message: rawMessage, attachments } = preparedComm || {};
  const message = ensureValidUnicode(rawMessage || '');
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
    } else {
      // Try sharing PDF only (skip images) if that is supported.
      const pdfOnly = files.filter(f => f.type.includes('pdf'));
      if (pdfOnly.length > 0) {
        try {
          if (navigator.canShare({ files: pdfOnly })) {
            await navigator.share({
              title: 'Invoice Reminder',
              text: message || '',
              files: pdfOnly
            });
            return { status: 'whatsapp_opened', method: 'webshare', filesShared: true, link: null, filesCount: pdfOnly.length, note: 'pdf_only' };
          }
        } catch (e) {
          console.warn('[WhatsAppShareAdapter] PDF‑only Web Share failed', e);
        }
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
  // auto-attached via deep link, so we auto-download any ready PDFs first
  // so the user can manually attach them inside WhatsApp.
  let pdfDownloaded = false;
  const readyAttachments = (attachments || []).filter(a => a && a.ready && a.blob);
  for (const att of readyAttachments) {
    if (att.type === 'pdf' || (att.mimeType && att.mimeType.includes('pdf'))) {
      try {
        const url = att.blobUrl || URL.createObjectURL(att.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.name || 'Invoice.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Only revoke if we created a new URL (not the one from attachmentEngine)
        if (!att.blobUrl) URL.revokeObjectURL(url);
        pdfDownloaded = true;
      } catch (e) {
        console.warn('[WhatsAppShareAdapter] PDF auto-download failed', e);
      }
    }
  }

  // Small delay so the download starts before the new tab opens
  if (pdfDownloaded) {
    await new Promise(r => setTimeout(r, 500));
  }

  const win = window.open(waLink, '_blank');
  if (win) win.focus();
  return {
    status: 'whatsapp_opened',
    method: 'deep_link',
    filesShared: false,
    pdfDownloaded,
    filesCount: 0,
    link: waLink,
    deviceIsMobile: isMobileDevice()
  };
}

export const whatsappShareAdapter = {
  shareViaWhatsApp
};

export default whatsappShareAdapter;
