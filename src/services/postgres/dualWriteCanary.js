import { dualWriteConfig } from './dualWriteConfig.js';
import { DualWriteParity } from './dualWriteParity.js';
import { DualWriteTelemetry } from './dualWriteTelemetry.js';

/**
 * Dual-Write Canary Controller
 * Performs controlled, non-destructive staging parity checks strictly on whitelisted canary workspaces.
 */
export class DualWriteCanary {
  /**
   * Executes an asynchronous parity check on a canary workspace mutation.
   */
  static async verifyParity({
    workspaceId,
    entityType,
    clientTxId,
    firebaseData,
    postgresData,
    durationMs = 0
  }) {
    // 1. Guardrail check: workspace must be explicitly whitelisted in canary mode
    if (!dualWriteConfig.isCanaryAllowed(workspaceId)) {
      DualWriteTelemetry.record({
        entity: entityType,
        operation: 'CANARY_VERIFY',
        clientTxId,
        status: 'SKIPPED',
        durationMs,
        details: { reason: 'WORKSPACE_NOT_IN_CANARY_WHITELIST' }
      });
      return { canaryAllowed: false, status: 'SKIPPED' };
    }

    // 2. Execute entity parity comparison
    let parityResult = { matched: true, differences: [] };
    switch (entityType) {
      case 'customers':
      case 'customer':
        parityResult = DualWriteParity.checkCustomerParity(firebaseData, postgresData);
        break;
      case 'products':
      case 'product':
        parityResult = DualWriteParity.checkProductParity(firebaseData, postgresData);
        break;
      case 'invoices':
      case 'invoice':
        parityResult = DualWriteParity.checkInvoiceParity(firebaseData, postgresData);
        break;
      case 'payments':
      case 'payment':
        parityResult = DualWriteParity.checkPaymentParity(firebaseData, postgresData);
        break;
      case 'expenses':
      case 'expense':
        parityResult = DualWriteParity.checkExpenseParity(firebaseData, postgresData);
        break;
      case 'bankLedger':
      case 'bank_ledger':
        parityResult = DualWriteParity.checkBankLedgerParity(firebaseData, postgresData);
        break;
      default:
        dualWriteConfig.log('warn', `Unknown entityType for canary parity verification: ${entityType}`);
        return { canaryAllowed: true, matched: true, parity: parityResult };
    }

    // 3. Record Telemetry (Zero Secret Leakage)
    if (parityResult.matched) {
      DualWriteTelemetry.record({
        entity: entityType,
        operation: 'PARITY_MATCH',
        clientTxId,
        status: 'SYNCED',
        durationMs
      });
    } else {
      DualWriteTelemetry.record({
        entity: entityType,
        operation: 'PARITY_MISMATCH',
        clientTxId,
        status: 'MISMATCH',
        durationMs,
        errorCategory: 'CANONICAL_FIELD_MISMATCH',
        details: {
          differenceCount: parityResult.differences.length,
          fields: parityResult.differences.map(d => d.field)
        }
      });
    }

    return {
      canaryAllowed: true,
      matched: parityResult.matched,
      parity: parityResult
    };
  }
}
