import { auth } from '../firebaseConfig.js';
import { dualWriteConfig } from './dualWriteConfig.js';

/**
 * Isolated PostgreSQL REST client for Dual-Write mirror operations.
 * Uses the authenticated Firebase ID token and executes non-blocking requests.
 */
export class PostgresClient {
  /**
   * Retrieves the active Firebase ID token safely.
   */
  static async getAuthToken() {
    try {
      if (auth && auth.currentUser && typeof auth.currentUser.getIdToken === 'function') {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (err) {
      dualWriteConfig.log('warn', 'Failed to retrieve Firebase ID token for PostgreSQL client', { error: err.message });
      return null;
    }
  }

  /**
   * Executes an authenticated HTTP request to PostgreSQL REST API with timeout.
   */
  static async request(endpoint, options = {}) {
    const url = `${dualWriteConfig.apiBaseUrl}${endpoint}`;
    const method = options.method || 'GET';
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Attach Bearer token if not already supplied
    if (!headers.Authorization && !headers.authorization) {
      const token = await this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), dualWriteConfig.timeoutMs) : null;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: data?.error || { message: `Request failed with status ${response.status}` },
          data
        };
      }

      return {
        ok: true,
        status: response.status,
        data: data?.data !== undefined ? data.data : data
      };
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      dualWriteConfig.log('warn', `PostgreSQL request error on ${method} ${endpoint}`, {
        isTimeout,
        error: err.message
      });
      return {
        ok: false,
        status: isTimeout ? 408 : 0,
        error: {
          code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
          message: err.message
        }
      };
    }
  }
}
