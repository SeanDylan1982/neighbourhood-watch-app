/**
 * Media Cache Manager for handling thumbnail and image caching
 * Uses IndexedDB for persistent storage and memory cache for quick access
 */

class MediaCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.dbName = 'MediaCache';
    this.dbVersion = 1;
    this.storeName = 'thumbnails';
    this.maxMemoryCacheSize = 100; // Maximum items in memory cache
    this.maxCacheAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.db = null;
    
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key from URL and options
   */
  generateCacheKey(url, options = {}) {
    const { width = 150, height = 150, quality = 0.7 } = options;
    return `${url}_${width}x${height}_${quality}`;
  }

  /**
   * Get cached thumbnail
   */
  async getThumbnail(url, options = {}) {
    const key = this.generateCacheKey(url, options);
    
    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (this.isValidCache(cached)) {
        return cached.data;
      } else {
        this.memoryCache.delete(key);
      }
    }

    // Check IndexedDB
    if (this.db) {
      try {
        const cached = await this.getFromDB(key);
        if (cached && this.isValidCache(cached)) {
          // Add to memory cache for quick access
          this.addToMemoryCache(key, cached);
          return cached.data;
        } else if (cached) {
          // Remove expired cache
          await this.removeFromDB(key);
        }
      } catch (error) {
        console.warn('Failed to get from cache:', error);
      }
    }

    return null;
  }

  /**
   * Store thumbnail in cache
   */
  async storeThumbnail(url, thumbnailData, options = {}) {
    const key = this.generateCacheKey(url, options);
    const cacheEntry = {
      key,
      data: thumbnailData,
      timestamp: Date.now(),
      size: this.estimateSize(thumbnailData),
      url,
      options
    };

    // Store in memory cache
    this.addToMemoryCache(key, cacheEntry);

    // Store in IndexedDB
    if (this.db) {
      try {
        await this.storeInDB(cacheEntry);
      } catch (error) {
        console.warn('Failed to store in cache:', error);
      }
    }
  }

  /**
   * Add to memory cache with size management
   */
  addToMemoryCache(key, entry) {
    // Remove oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Check if cache entry is still valid
   */
  isValidCache(entry) {
    return entry && (Date.now() - entry.timestamp) < this.maxCacheAge;
  }

  /**
   * Estimate data size in bytes
   */
  estimateSize(data) {
    if (typeof data === 'string') {
      // For data URLs, estimate based on base64 length
      return Math.round(data.length * 0.75);
    }
    return 0;
  }

  /**
   * Get entry from IndexedDB
   */
  async getFromDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Store entry in IndexedDB
   */
  async storeInDB(entry) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove entry from IndexedDB
   */
  async removeFromDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const cutoffTime = Date.now() - this.maxCacheAge;
      const range = IDBKeyRange.upperBound(cutoffTime);
      
      const request = index.openCursor(range);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const memorySize = this.memoryCache.size;
    let dbSize = 0;
    let totalSize = 0;

    if (this.db) {
      try {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        await new Promise((resolve, reject) => {
          const request = store.openCursor();
          
          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              dbSize++;
              totalSize += cursor.value.size || 0;
              cursor.continue();
            } else {
              resolve();
            }
          };
          
          request.onerror = () => reject(request.error);
        });
      } catch (error) {
        console.warn('Failed to get cache stats:', error);
      }
    }

    return {
      memoryEntries: memorySize,
      dbEntries: dbSize,
      totalSizeBytes: totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
    };
  }

  /**
   * Clear all cache
   */
  async clearCache() {
    this.memoryCache.clear();
    
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * Preload thumbnails for a list of URLs
   */
  async preloadThumbnails(urls, options = {}) {
    const { generateThumbnail } = await import('../utils/mediaOptimization');
    
    const promises = urls.map(async (url) => {
      const cached = await this.getThumbnail(url, options);
      if (!cached) {
        try {
          const thumbnail = await generateThumbnail(url, options);
          await this.storeThumbnail(url, thumbnail, options);
          return { url, success: true };
        } catch (error) {
          return { url, success: false, error: error.message };
        }
      }
      return { url, success: true, cached: true };
    });

    return Promise.all(promises);
  }
}

// Create singleton instance
const mediaCacheManager = new MediaCacheManager();

export default mediaCacheManager;