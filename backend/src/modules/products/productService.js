import { ProductRepository } from './productRepository.js';
import { query } from '../../db/pool.js';

export class ProductService {
  static async verifyWorkspaceMembership(workspaceId, firebaseUid, email) {
    const res = await query(
      `SELECT wm.role, u.id AS user_id
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.workspace_id = $1 AND (u.firebase_uid = $2 OR u.email = $3) AND w.is_suspended = FALSE
       LIMIT 1`,
      [workspaceId, firebaseUid, email]
    );

    if (res.rows.length === 0) {
      const err = new Error('Access denied. You are not an authorized member of this workspace.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_WORKSPACE_ACCESS';
      throw err;
    }

    return res.rows[0];
  }

  static async createProduct(auth, data) {
    await this.verifyWorkspaceMembership(data.workspaceId, auth.firebaseUid, auth.email);
    return await ProductRepository.create(data);
  }

  static async listProducts(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await ProductRepository.list(queryParams);
  }

  static async getProduct(auth, workspaceId, productId) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const product = await ProductRepository.findById(workspaceId, productId);
    if (!product) {
      const err = new Error('Product not found in this workspace.');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    return product;
  }

  static async updateProduct(auth, workspaceId, productId, updates) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const existing = await ProductRepository.findById(workspaceId, productId);
    if (!existing) {
      const err = new Error('Product not found in this workspace.');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    return await ProductRepository.update(workspaceId, productId, updates);
  }

  static async deleteProduct(auth, workspaceId, productId) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const existing = await ProductRepository.findById(workspaceId, productId);
    if (!existing) {
      const err = new Error('Product not found in this workspace.');
      err.statusCode = 404;
      err.code = 'PRODUCT_NOT_FOUND';
      throw err;
    }
    const success = await ProductRepository.softDelete(workspaceId, productId);
    return { success, message: 'Product deleted successfully.' };
  }
}
