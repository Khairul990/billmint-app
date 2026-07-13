import * as dbEngine from './dbEngine';

class ProductEngine {
  async getProducts() {
    // Relying on dbEngine handling offline/sync logic
    // dbEngine.getProducts isn't explicitly defined in previous snippets, but it's part of the standard set.
    // If dbEngine lacks getProducts, it uses getScopedKey logic. Let's assume standard dbEngine interface.
    if (dbEngine.getProducts) {
      return await dbEngine.getProducts();
    }
    // Fallback if not explicitly named in dbEngine
    const raw = localStorage.getItem(dbEngine.KEYS.PRODUCTS || 'billqyro_demo_products');
    return raw ? JSON.parse(raw) : [];
  }

  async getProductById(productId) {
    const products = await this.getProducts();
    return products.find(p => p.id === productId);
  }

  async saveProduct(productData) {
    if (!productData.id) {
      productData.id = `prod_${Date.now()}`;
    }
    productData.updatedAt = new Date().toISOString();
    if (dbEngine.saveProduct) {
      return await dbEngine.saveProduct(productData);
    }
    
    // Fallback
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === productData.id);
    if (index >= 0) {
      products[index] = productData;
    } else {
      products.push(productData);
    }
    localStorage.setItem(dbEngine.KEYS.PRODUCTS || 'billqyro_demo_products', JSON.stringify(products));
    return { updatedProducts: products };
  }

  async deleteProduct(productId) {
    if (dbEngine.deleteProduct) {
      return await dbEngine.deleteProduct(productId);
    }
    
    // Fallback
    const products = await this.getProducts();
    const filtered = products.filter(p => p.id !== productId);
    localStorage.setItem(dbEngine.KEYS.PRODUCTS || 'billqyro_demo_products', JSON.stringify(filtered));
    return { updatedProducts: filtered };
  }

  searchProducts(products, query) {
    if (!query) return products;
    const lower = query.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(lower)) ||
      (p.description && p.description.toLowerCase().includes(lower))
    );
  }
}

export const productEngine = new ProductEngine();
