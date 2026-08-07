// This engine abstracts Firebase Storage or Local IndexedDB blobs.

class StorageEngine {
  constructor() {
    // In-memory mock for local storage quota limits if used purely offline
    this.maxQuota = 100 * 1024 * 1024; // 100 MB
  }

  async uploadFile(workspaceId, path, fileBlob, metadata = {}) {
    console.log(`[StorageEngine] Uploading file to ${workspaceId}/${path}`);
    
    // Check quota before upload
    const currentUsage = await this.getStorageUsage(workspaceId);
    if (currentUsage + fileBlob.size > this.maxQuota) {
      throw new Error('Storage quota exceeded');
    }

    // Mock implementation for offline mode. 
    // In production, this uploads to Firebase Storage or saves to IndexedDB
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Save base64 string to a mock map or local storage
        try {
          localStorage.setItem(`storage_${workspaceId}_${path}`, reader.result);
        } catch {
          console.warn('Local storage full');
        }
        resolve({
          url: reader.result,
          path: `${workspaceId}/${path}`,
          size: fileBlob.size
        });
      };
      reader.readAsDataURL(fileBlob);
    });
  }

  async downloadFile(workspaceId, path) {
    console.log(`[StorageEngine] Downloading file from ${workspaceId}/${path}`);
    return localStorage.getItem(`storage_${workspaceId}_${path}`);
  }

  async deleteFile(workspaceId, path) {
    console.log(`[StorageEngine] Deleting file from ${workspaceId}/${path}`);
    localStorage.removeItem(`storage_${workspaceId}_${path}`);
    return true;
  }

  async getStorageUsage(workspaceId) {
    // In production, query Firebase Storage metadata or IndexedDB size
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`storage_${workspaceId}_`)) {
        const item = localStorage.getItem(key);
        if (item) totalSize += item.length; // Approximate size
      }
    }
    return totalSize;
  }
}

export const storageEngine = new StorageEngine();
