import { dualWriteConfig } from './dualWriteConfig.js';

// In-memory circular buffer for telemetry events (max 200 items)
const MAX_BUFFER_SIZE = 200;
const telemetryEvents = [];

/**
 * Lightweight operational telemetry for Dual-Write & Canary Parity monitoring.
 * Strictly avoids logging secrets, tokens, customer private PII, or raw database credentials.
 */
export class DualWriteTelemetry {
  /**
   * Records a telemetry event safely.
   */
  static record({
    entity,
    operation,
    clientTxId,
    status = 'SYNCED',
    durationMs = 0,
    retryCount = 0,
    errorCategory = null,
    details = null
  }) {
    // Sanitize any extra detail properties
    let sanitizedDetails = null;
    if (details && typeof details === 'object') {
      sanitizedDetails = { ...details };
      delete sanitizedDetails.token;
      delete sanitizedDetails.idToken;
      delete sanitizedDetails.password;
      delete sanitizedDetails.secret;
      delete sanitizedDetails.privateKey;
    }

    const event = {
      entity: entity || 'unknown',
      operation: operation || 'MUTATION',
      clientTxId: clientTxId || null,
      status: ['SYNCED', 'QUEUED', 'FAILED', 'SKIPPED', 'MISMATCH'].includes(status) ? status : 'UNKNOWN',
      durationMs: typeof durationMs === 'number' ? Math.round(durationMs) : 0,
      retryCount: typeof retryCount === 'number' ? retryCount : 0,
      errorCategory: errorCategory || null,
      details: sanitizedDetails,
      timestamp: new Date().toISOString()
    };

    telemetryEvents.push(event);
    if (telemetryEvents.length > MAX_BUFFER_SIZE) {
      telemetryEvents.shift();
    }

    dualWriteConfig.log('info', `Telemetry: [${event.status}] ${event.entity} - ${event.operation}`, {
      clientTxId: event.clientTxId,
      status: event.status,
      durationMs: event.durationMs
    });

    return event;
  }

  /**
   * Returns aggregated health status metrics for developer / admin diagnostics.
   */
  static getHealthSummary() {
    const summary = {
      synced: 0,
      queued: 0,
      failed: 0,
      mismatch: 0,
      skipped: 0,
      total: telemetryEvents.length
    };

    for (const ev of telemetryEvents) {
      switch (ev.status) {
        case 'SYNCED':
          summary.synced++;
          break;
        case 'QUEUED':
          summary.queued++;
          break;
        case 'FAILED':
          summary.failed++;
          break;
        case 'MISMATCH':
          summary.mismatch++;
          break;
        case 'SKIPPED':
          summary.skipped++;
          break;
      }
    }

    return summary;
  }

  /**
   * Returns recent telemetry events.
   */
  static getRecentEvents(limit = 50) {
    return telemetryEvents.slice(-limit).reverse();
  }

  /**
   * Clears telemetry in-memory buffer (primarily for test resets).
   */
  static clear() {
    telemetryEvents.length = 0;
  }
}
