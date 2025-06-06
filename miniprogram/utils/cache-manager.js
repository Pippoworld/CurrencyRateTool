/**
 * 智能缓存管理器
 * 支持数据缓存、过期管理、压缩存储等功能
 */

class CacheManager {
  constructor() {
    this.cachePrefix = 'cache_';
    this.defaultExpiry = 5 * 60 * 1000; // 5分钟默认过期时间
    this.maxCacheSize = 10 * 1024 * 1024; // 10MB最大缓存大小
  }

  /**
   * 设置缓存
   * @param {string} key 缓存key
   * @param {any} data 缓存数据
   * @param {number} expiry 过期时间（毫秒），默认5分钟
   */
  set(key, data, expiry = this.defaultExpiry) {
    try {
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expiry: expiry,
        version: '1.0'
      };

      const cacheKey = this.cachePrefix + key;
      const compressedData = this.compress(JSON.stringify(cacheData));
      
      wx.setStorageSync(cacheKey, compressedData);
      console.log(`缓存已设置: ${key}, 过期时间: ${expiry}ms`);
      
      // 检查缓存大小
      this.checkCacheSize();
      
      return true;
    } catch (error) {
      console.error('设置缓存失败:', error);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存key
   * @returns {any|null} 缓存数据或null
   */
  get(key) {
    try {
      const cacheKey = this.cachePrefix + key;
      const compressedData = wx.getStorageSync(cacheKey);
      
      if (!compressedData) {
        console.log(`缓存不存在: ${key}`);
        return null;
      }

      const decompressedData = this.decompress(compressedData);
      const cacheData = JSON.parse(decompressedData);
      
      // 检查是否过期
      const now = Date.now();
      if (now - cacheData.timestamp > cacheData.expiry) {
        console.log(`缓存已过期: ${key}`);
        this.delete(key);
        return null;
      }

      console.log(`缓存命中: ${key}`);
      return cacheData.data;
    } catch (error) {
      console.error('获取缓存失败:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key 缓存key
   */
  delete(key) {
    try {
      const cacheKey = this.cachePrefix + key;
      wx.removeStorageSync(cacheKey);
      console.log(`缓存已删除: ${key}`);
    } catch (error) {
      console.error('删除缓存失败:', error);
    }
  }

  /**
   * 清除所有缓存
   */
  clear() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const keys = storageInfo.keys.filter(key => key.startsWith(this.cachePrefix));
      
      keys.forEach(key => {
        wx.removeStorageSync(key);
      });
      
      console.log(`已清除 ${keys.length} 个缓存项`);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key 缓存key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 获取或设置缓存（如果不存在则调用获取函数）
   * @param {string} key 缓存key
   * @param {Function} fetchFn 数据获取函数
   * @param {number} expiry 过期时间
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, expiry = this.defaultExpiry) {
    let data = this.get(key);
    
    if (data === null) {
      console.log(`缓存未命中，调用获取函数: ${key}`);
      try {
        data = await fetchFn();
        this.set(key, data, expiry);
      } catch (error) {
        console.error('获取数据失败:', error);
        throw error;
      }
    }
    
    return data;
  }

  /**
   * 压缩数据（简单的字符串压缩）
   * @param {string} str 要压缩的字符串
   * @returns {string}
   */
  compress(str) {
    // 简单的重复字符压缩算法
    return str.replace(/(.)\1+/g, (match, char) => {
      return char + match.length;
    });
  }

  /**
   * 解压数据
   * @param {string} str 压缩的字符串
   * @returns {string}
   */
  decompress(str) {
    // 简单解压算法的逆向
    return str.replace(/(.)\d+/g, (match, char) => {
      const count = parseInt(match.slice(1));
      return char.repeat(count);
    });
  }

  /**
   * 检查缓存大小，如果超出限制则清理最旧的缓存
   */
  checkCacheSize() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const currentSize = storageInfo.currentSize * 1024; // KB转Byte
      
      if (currentSize > this.maxCacheSize) {
        console.log(`缓存大小超限: ${currentSize}B > ${this.maxCacheSize}B`);
        this.cleanOldCache();
      }
    } catch (error) {
      console.error('检查缓存大小失败:', error);
    }
  }

  /**
   * 清理最旧的缓存
   */
  cleanOldCache() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const cacheKeys = storageInfo.keys.filter(key => key.startsWith(this.cachePrefix));
      
      // 获取所有缓存的时间戳
      const cacheItems = cacheKeys.map(key => {
        try {
          const data = wx.getStorageSync(key);
          const decompressed = this.decompress(data);
          const parsed = JSON.parse(decompressed);
          return {
            key: key,
            timestamp: parsed.timestamp
          };
        } catch (error) {
          return {
            key: key,
            timestamp: 0
          };
        }
      });

      // 按时间戳排序，删除最旧的25%
      cacheItems.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = Math.ceil(cacheItems.length * 0.25);
      
      for (let i = 0; i < toDelete; i++) {
        wx.removeStorageSync(cacheItems[i].key);
      }
      
      console.log(`已清理 ${toDelete} 个旧缓存项`);
    } catch (error) {
      console.error('清理旧缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {object}
   */
  getStats() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const cacheKeys = storageInfo.keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalItems = 0;
      let expiredItems = 0;
      const now = Date.now();
      
      cacheKeys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          const decompressed = this.decompress(data);
          const parsed = JSON.parse(decompressed);
          
          totalItems++;
          if (now - parsed.timestamp > parsed.expiry) {
            expiredItems++;
          }
        } catch (error) {
          // 忽略错误项
        }
      });

      return {
        totalItems: totalItems,
        expiredItems: expiredItems,
        validItems: totalItems - expiredItems,
        currentSize: storageInfo.currentSize,
        maxSize: storageInfo.limitSize
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        totalItems: 0,
        expiredItems: 0,
        validItems: 0,
        currentSize: 0,
        maxSize: 0
      };
    }
  }

  /**
   * 清理过期缓存
   */
  cleanExpired() {
    try {
      const storageInfo = wx.getStorageInfoSync();
      const cacheKeys = storageInfo.keys.filter(key => key.startsWith(this.cachePrefix));
      const now = Date.now();
      let cleanedCount = 0;
      
      cacheKeys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          const decompressed = this.decompress(data);
          const parsed = JSON.parse(decompressed);
          
          if (now - parsed.timestamp > parsed.expiry) {
            wx.removeStorageSync(key);
            cleanedCount++;
          }
        } catch (error) {
          // 删除损坏的缓存项
          wx.removeStorageSync(key);
          cleanedCount++;
        }
      });
      
      console.log(`已清理 ${cleanedCount} 个过期缓存项`);
      return cleanedCount;
    } catch (error) {
      console.error('清理过期缓存失败:', error);
      return 0;
    }
  }
}

// 创建全局实例
const cacheManager = new CacheManager();

// 汇率数据专用缓存方法
const RateCache = {
  // 汇率数据缓存（5分钟过期）
  setRates: (currencyPair, rates) => {
    const key = `rates_${currencyPair}`;
    return cacheManager.set(key, rates, 5 * 60 * 1000);
  },

  getRates: (currencyPair) => {
    const key = `rates_${currencyPair}`;
    return cacheManager.get(key);
  },

  // AI分析缓存（30分钟过期）
  setAnalysis: (currencyPair, analysis) => {
    const key = `analysis_${currencyPair}`;
    return cacheManager.set(key, analysis, 30 * 60 * 1000);
  },

  getAnalysis: (currencyPair) => {
    const key = `analysis_${currencyPair}`;
    return cacheManager.get(key);
  },

  // 银行汇率缓存（1小时过期）
  setBankRates: (currency, bankRates) => {
    const key = `bank_rates_${currency}`;
    return cacheManager.set(key, bankRates, 60 * 60 * 1000);
  },

  getBankRates: (currency) => {
    const key = `bank_rates_${currency}`;
    return cacheManager.get(key);
  },

  // 市场新闻缓存（15分钟过期）
  setNews: (news) => {
    return cacheManager.set('market_news', news, 15 * 60 * 1000);
  },

  getNews: () => {
    return cacheManager.get('market_news');
  }
};

module.exports = {
  cacheManager,
  RateCache
}; 