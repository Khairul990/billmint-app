// src/components/communication/WhatsAppSharePreview.jsx

import React, { useState } from 'react';
import { Button } from '../ui/Button'; // Assuming a generic Button component exists
import { shareViaWhatsApp } from '../../services/communication/whatsappShareAdapter';
import { communicationEngine } from '../../services/communication/communicationEngine';
import { toast } from 'react-hot-toast';

/**
 * Props:
 *   workspaceId, userId, customerId, invoiceId, paymentId (optional)
 *   onClose – callback when preview is dismissed
 */
export default function WhatsAppSharePreview({
  workspaceId,
  userId,
  customerId,
  invoiceId,
  paymentId,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [prepared, setPrepared] = useState(null);
  const [error, setError] = useState(null);

  const prepare = async () => {
    setLoading(true);
    setError(null);
    try {
      const comm = await communicationEngine.prepareCommunication({
        workspaceId,
        userId,
        invoiceId
      });
      
      const adaptedComm = {
        ...comm,
        recipient: comm.recipientPhone || comm.customer?.phone,
        metadata: {
          customerId: comm.customer?.name || comm.customer?.id || customerId,
          invoiceId: comm.invoice?.invoiceNumber || invoiceId
        }
      };
      
      setMessage(adaptedComm.message);
      setPrepared(adaptedComm);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = async () => {
    if (!prepared || loading) return;
    setLoading(true);
    try {
      const finalPrepared = { ...prepared, message };
      const result = await shareViaWhatsApp(finalPrepared);
      console.log('[WhatsAppSharePreview] share result', result);
      
      if (!result.filesShared && prepared.attachments && prepared.attachments.length > 0) {
        toast('WhatsApp opened, but this device/browser cannot attach files automatically. Please attach the downloaded PDF manually.', {
          icon: 'ℹ️',
          duration: 6000
        });
        // Do NOT auto close so they can use the Download PDF button
      } else {
        onClose(); // Auto close the preview when sharing completes fully
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    const pdfAttachment = prepared?.attachments?.find(a => a.type === 'pdf');
    if (pdfAttachment && pdfAttachment.blobUrl) {
      const a = document.createElement('a');
      a.href = pdfAttachment.blobUrl;
      a.download = pdfAttachment.name || 'Invoice.pdf';
      a.click();
    }
  };

  // Initial preparation when component mounts.
  React.useEffect(() => {
    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-lg w-full p-6 overflow-auto max-h-screen">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">WhatsApp Reminder Preview</h2>
        {error && <p className="text-red-600 mb-2">Error: {error}</p>}
        {loading && <p className="mb-2">Loading…</p>}
        {prepared && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm text-gray-700 dark:text-gray-300">
              <div><strong>Customer:</strong> {prepared.metadata.customerId}</div>
              <div><strong>WhatsApp:</strong> {prepared.recipient}</div>
              <div><strong>Invoice:</strong> {prepared.metadata.invoiceId}</div>
              <div><strong>Total:</strong> {prepared.message.match(/Total:.*$/m)?.[0] || ''}</div>
              <div><strong>Paid:</strong> {prepared.message.match(/Paid:.*$/m)?.[0] || ''}</div>
              <div><strong>Due:</strong> {prepared.message.match(/Due:.*$/m)?.[0] || ''}</div>
              {prepared.attachments?.some(a => a.type === 'pdf') && (
                <div className="col-span-2 text-green-600">PDF: Enabled</div>
              )}
              {prepared.attachments?.some(a => a.type === 'image') && (
                <div className="col-span-2 text-green-600">Business Image: Enabled</div>
              )}
            </div>
            <div className="border rounded p-3 mb-4 bg-gray-50 dark:bg-gray-700">
              <pre className="whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{message}</pre>
            </div>
            <div className="flex justify-end space-x-2">
              <Button onClick={onClose} disabled={loading}>Cancel</Button>
              {prepared.attachments?.some(a => a.type === 'pdf') && (
                <Button onClick={handleDownloadPdf} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">Download PDF</Button>
              )}
              <Button onClick={() => setMessage(prev => prompt('Edit Message', prev) || prev)} disabled={loading}>Edit Message</Button>
              <Button onClick={openWhatsApp} disabled={loading} className="bg-green-600 text-white hover:bg-green-700">Open WhatsApp</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
