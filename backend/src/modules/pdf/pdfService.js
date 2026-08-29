import { PdfRepository } from './pdfRepository.js';
import { PdfRenderer } from './pdfRenderer.js';
import { getPdfStorage } from './pdfStorage.js';
import {
  calculateCanonicalInvoiceContentHash,
  calculateBufferByteHash,
  generateDeterministicStorageKey
} from '../../utils/canonicalHash.js';
import { query } from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

export class PdfService {
  /**
   * Authorizes that the user is a member of the workspace owning the invoice.
   */
  static async verifyWorkspaceAccessForInvoice(auth, invoiceId) {
    const res = await query(
      `SELECT 
         i.id,
         i.workspace_id,
         u.id AS user_id,
         wm.role AS member_role
       FROM invoices i
       JOIN workspaces w ON w.id = i.workspace_id
       JOIN workspace_members wm ON wm.workspace_id = i.workspace_id
       JOIN users u ON u.id = wm.user_id
       WHERE i.id = $1 AND (u.firebase_uid = $2 OR u.email = $3) AND i.is_deleted = FALSE AND w.is_suspended = FALSE
       LIMIT 1`,
      [invoiceId, auth.firebaseUid, auth.email]
    );

    if (res.rows.length === 0) {
      const err = new Error('Invoice not found or you do not have permission to access it.');
      err.statusCode = 404;
      err.code = 'INVOICE_NOT_FOUND';
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Main PDF handler: returns cached PDF (Cache HIT) or deterministically renders & stores (Cache MISS).
   */
  static async getOrGenerateInvoicePdf(auth, invoiceId) {
    // 1. Authorize Workspace Access
    const authContext = await this.verifyWorkspaceAccessForInvoice(auth, invoiceId);
    const workspaceId = authContext.workspace_id;

    // 2. Retrieve Full Canonical Invoice Snapshot
    const invoiceData = await PdfRepository.findInvoiceForPdf(workspaceId, invoiceId);
    if (!invoiceData) {
      const err = new Error('Invoice data could not be retrieved.');
      err.statusCode = 404;
      err.code = 'INVOICE_NOT_FOUND';
      throw err;
    }

    // 3. Compute Deterministic Canonical Content Hash
    const contentHash = calculateCanonicalInvoiceContentHash(invoiceData);
    const storageKey = generateDeterministicStorageKey(workspaceId, invoiceId, contentHash);
    const storage = getPdfStorage();

    // 4. Check Registry for Existing READY PDF (Cache HIT)
    const existingRegistry = await PdfRepository.findPdfRegistryRecord(workspaceId, invoiceId, contentHash);
    if (existingRegistry && existingRegistry.status === 'READY') {
      try {
        const objectExists = await storage.exists(existingRegistry.storage_key || storageKey);
        if (objectExists) {
          const pdfBuffer = await storage.getObject(existingRegistry.storage_key || storageKey);
          // Verify byte signature
          PdfRenderer.validatePdfBuffer(pdfBuffer);
          return {
            buffer: pdfBuffer,
            contentHash,
            byteHash: existingRegistry.byte_hash || calculateBufferByteHash(pdfBuffer),
            version: existingRegistry.version || 1,
            cacheStatus: 'HIT'
          };
        }
      } catch (err) {
        console.warn(`[PDF CACHE RECOVERY] Registry claims READY but storage object is missing or corrupted: ${err.message}. Regenerating...`);
      }
    }

    // 5. CACHE MISS / Stale Recovery -> Atomic Transactional Generation & Upload
    const result = await withTransaction(async (client) => {
      // Step A: Acquire / Lock generation registry record
      const lockRecord = await PdfRepository.acquireGenerationLock(client, {
        workspaceId,
        invoiceId,
        contentHash,
        storageKey
      });

      // Step B: Render deterministic PDF bytes
      let pdfBuffer;
      try {
        pdfBuffer = await PdfRenderer.renderInvoicePdf(invoiceData);
      } catch (renderErr) {
        await PdfRepository.markPdfFailed(client, {
          id: lockRecord.id,
          errorMessage: `Rendering failed: ${renderErr.message}`
        });
        throw renderErr;
      }

      // Step C: Compute byte hash for byte-level integrity
      const byteHash = calculateBufferByteHash(pdfBuffer);

      // Step D: Upload to S3/MinIO Storage
      try {
        await storage.putObject({
          key: storageKey,
          body: pdfBuffer,
          contentType: 'application/pdf',
          cacheControl: 'public, max-age=31536000, immutable'
        });

        // Step E: Verify storage integrity (HEAD)
        const head = await storage.headObject(storageKey);
        if (head.contentLength !== pdfBuffer.length) {
          throw new Error(`Storage size mismatch. Expected ${pdfBuffer.length} bytes, got ${head.contentLength}.`);
        }
      } catch (uploadErr) {
        await PdfRepository.markPdfFailed(client, {
          id: lockRecord.id,
          errorMessage: `Storage upload failed: ${uploadErr.message}`
        });
        throw uploadErr;
      }

      // Step F: Mark Registry as READY
      const readyRecord = await PdfRepository.markPdfReady(client, {
        id: lockRecord.id,
        byteHash,
        fileSizeBytes: pdfBuffer.length,
        engineUsed: 'backend-pdf-v1'
      });

      return {
        buffer: pdfBuffer,
        contentHash,
        byteHash,
        version: readyRecord.version,
        cacheStatus: 'MISS'
      };
    });

    return result;
  }
}
