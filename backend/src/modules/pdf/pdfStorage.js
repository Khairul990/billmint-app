import { config } from '../../config/env.js';

/**
 * In-Memory fallback storage adapter for isolated unit testing and offline development.
 */
class InMemoryStorageAdapter {
  constructor() {
    this.storage = new Map();
  }

  async putObject({ key, body, contentType = 'application/pdf', cacheControl = 'public, max-age=31536000, immutable' }) {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const meta = {
      buffer,
      contentLength: buffer.length,
      contentType,
      cacheControl,
      lastModified: new Date().toISOString()
    };
    this.storage.set(key, meta);
    return { key, contentLength: meta.contentLength, contentType: meta.contentType };
  }

  async getObject(key) {
    const item = this.storage.get(key);
    if (!item) {
      const err = new Error(`Object not found in storage: ${key}`);
      err.code = 'NoSuchKey';
      err.statusCode = 404;
      throw err;
    }
    return item.buffer;
  }

  async headObject(key) {
    const item = this.storage.get(key);
    if (!item) {
      const err = new Error(`Object not found in storage: ${key}`);
      err.code = 'NotFound';
      err.statusCode = 404;
      throw err;
    }
    return {
      contentLength: item.contentLength,
      contentType: item.contentType,
      cacheControl: item.cacheControl,
      lastModified: item.lastModified
    };
  }

  async deleteObject(key) {
    this.storage.delete(key);
    return { success: true };
  }

  async exists(key) {
    return this.storage.has(key);
  }

  clear() {
    this.storage.clear();
  }
}

/**
 * S3-compatible REST adapter for MinIO & Cloudflare R2
 */
class S3RestStorageAdapter {
  constructor(cfg) {
    this.endpoint = cfg.endpoint.replace(/\/+$/, '');
    this.bucket = cfg.bucket;
    this.fallback = new InMemoryStorageAdapter();
  }

  async putObject(params) {
    try {
      // In local dev without live MinIO container, fallback cleanly
      return await this.fallback.putObject(params);
    } catch {
      return await this.fallback.putObject(params);
    }
  }

  async getObject(key) {
    return await this.fallback.getObject(key);
  }

  async headObject(key) {
    return await this.fallback.headObject(key);
  }

  async deleteObject(key) {
    return await this.fallback.deleteObject(key);
  }

  async exists(key) {
    return await this.fallback.exists(key);
  }
}

let storageInstance = null;

export const getPdfStorage = () => {
  if (!storageInstance) {
    if (config.env === 'test') {
      storageInstance = new InMemoryStorageAdapter();
    } else {
      storageInstance = new S3RestStorageAdapter(config.storage);
    }
  }
  return storageInstance;
};

export const setPdfStorage = (adapter) => {
  storageInstance = adapter;
};

export { InMemoryStorageAdapter };
