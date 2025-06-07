/**
 * 汇率数据API服务
 * 使用多个数据源确保数据准确性和可用性
 */

class ExchangeRateAPI {
  constructor() {
    // 配置多个API源以确保可用性
    this.apiSources = [
      {
        name: 'ExchangeRate-API',
        baseUrl: 'https://v6.exchangerate-api.com/v6/6dd11d18251299e0c7b6ecec/latest',
        free: true,
        rateLimit: 1500 // 每月免费请求数
      },
      {
        name: 'ExchangeRate-API-V4',
        baseUrl: 'https://api.exchangerate-api.com/v4/latest',
        free: true,
        rateLimit: 1500 // 每月免费请求数
      }
    ];
    
    this.currentSource = 0;
    this.baseCurrency = 'USD'; // 以美元为基准货币
    this.retryCount = 3;
    this.timeout = 10000; // 10秒超时
  }

  /**
   * 获取实时汇率数据
   * @param {string} baseCurrency 基准货币代码
   * @returns {Promise<object>} 汇率数据
   */
  async getRates(baseCurrency = 'USD') {
    const cacheKey = `rates_${baseCurrency}_${Date.now()}`;
    
    try {
      console.log(`[汇率API] 开始获取 ${baseCurrency} 实时汇率数据...`);
      
      // 尝试从缓存获取（5分钟内的数据）
      const cachedData = this.getCachedRates(baseCurrency);
      if (cachedData) {
        console.log('[汇率API] 使用缓存的汇率数据');
        return cachedData;
      }

      // 获取实时数据
      const rateData = await this.fetchRatesWithRetry(baseCurrency);
      
      // 缓存数据
      this.cacheRates(baseCurrency, rateData);
      
      console.log('[汇率API] 实时汇率数据获取成功:', {
        source: rateData.source,
        base: rateData.base,
        ratesCount: Object.keys(rateData.rates || {}).length,
        cnyRate: rateData.rates?.CNY
      });
      return rateData;
      
    } catch (error) {
      console.error('[汇率API] 获取汇率数据失败:', error.message);
      
      // 降级到本地缓存或默认数据
      const fallbackData = this.getFallbackRates(baseCurrency);
      console.log('[汇率API] 使用降级数据:', {
        source: fallbackData.source,
        cnyRate: fallbackData.rates?.CNY
      });
      return fallbackData;
    }
  }

  /**
   * 带重试机制的数据获取
   * @param {string} baseCurrency 基准货币
   * @returns {Promise<object>}
   */
  async fetchRatesWithRetry(baseCurrency) {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      for (let sourceIndex = 0; sourceIndex < this.apiSources.length; sourceIndex++) {
        try {
          const source = this.apiSources[sourceIndex];
          console.log(`[汇率API] 尝试数据源 ${source.name} (第${attempt + 1}次尝试)`);
          
          const data = await this.fetchFromSource(source, baseCurrency);
          
          // 成功获取数据，更新当前源
          this.currentSource = sourceIndex;
          console.log(`[汇率API] 数据源 ${source.name} 获取成功`);
          return data;
          
        } catch (error) {
          console.warn(`[汇率API] 数据源 ${this.apiSources[sourceIndex].name} 失败:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      // 如果所有源都失败，等待后重试
      if (attempt < this.retryCount - 1) {
        await this.delay(2000 * (attempt + 1)); // 指数退避
      }
    }
    
    throw new Error(`所有数据源获取失败: ${lastError.message}`);
  }

  /**
   * 从指定源获取数据
   * @param {object} source API源配置
   * @param {string} baseCurrency 基准货币
   * @returns {Promise<object>}
   */
  async fetchFromSource(source, baseCurrency) {
    return new Promise((resolve, reject) => {
      const url = `${source.baseUrl}/${baseCurrency}`;
      
      wx.request({
        url: url,
        method: 'GET',
        timeout: this.timeout,
        header: {
          'Content-Type': 'application/json'
        },
        success: (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.data}`));
            return;
          }

          const data = response.data;
          
          // 处理V6 API的响应格式
          if (data.result === 'success' && data.conversion_rates) {
            // 兼容性修复：将 "Sat, 07 Jun 2025 00:00:01 +0000" 这样的RFC 2822格式转换为iOS兼容的 "yyyy/MM/dd HH:mm:ss" 格式
            let dateStr = data.time_last_update_utc;
            if (dateStr) {
              try {
                // 移除星期几部分, e.g., "07 Jun 2025 00:00:01 +0000"
                let parts = dateStr.split(' ');
                if (parts.length > 4) {
                  let day = parts[1];
                  let monthStr = parts[2];
                  let year = parts[3];
                  let time = parts[4];
                  const months = { 'Jan':'01', 'Feb':'02', 'Mar':'03', 'Apr':'04', 'May':'05', 'Jun':'06', 'Jul':'07', 'Aug':'08', 'Sep':'09', 'Oct':'10', 'Nov':'11', 'Dec':'12' };
                  let month = months[monthStr];
                  // 构造成 '2025/06/07 00:00:01'
                  dateStr = `${year}/${month}/${day} ${time}`;
                }
              } catch(e) {
                // 如果解析失败，则使用当前时间作为备用
                console.error("解析V6 API日期失败, 使用当前时间", e);
                dateStr = new Date().toLocaleString('sv-SE').replace(/-/g, '/');
              }
            } else {
              dateStr = new Date().toLocaleString('sv-SE').replace(/-/g, '/');
            }

            const standardizedData = {
              base: data.base_code || baseCurrency,
              date: new Date(dateStr).toISOString().split('T')[0],
              rates: data.conversion_rates,
              source: source.name,
              timestamp: Date.now()
            };
            resolve(standardizedData);
            return;
          }
          
          // 处理V4 API的响应格式
          if (data.rates) {
            const standardizedData = {
              base: data.base || baseCurrency,
              date: data.date || new Date().toISOString().split('T')[0],
              rates: data.rates,
              source: source.name,
              timestamp: Date.now()
            };
            resolve(standardizedData);
            return;
          }
          
          reject(new Error('API返回数据格式错误'));
        },
        fail: (error) => {
          reject(new Error(`网络请求失败: ${error.errMsg}`));
        }
      });
    });
  }

  /**
   * 将API数据转换为应用格式
   * @param {object} apiData API返回的数据
   * @returns {array} 应用格式的货币列表
   */
  convertToAppFormat(apiData) {
    const { rates, base, source, timestamp } = apiData;
    
    // 货币配置：代码、名称、国旗、在API中的汇率
    const currencyConfig = [
      { code: 'CNY', name: '人民币', flag: '🇨🇳' },
      { code: 'USD', name: '美元', flag: '🇺🇸' },
      { code: 'EUR', name: '欧元', flag: '🇪🇺' },
      { code: 'JPY', name: '日元', flag: '🇯🇵' },
      { code: 'GBP', name: '英镑', flag: '🇬🇧' },
      { code: 'AUD', name: '澳元', flag: '🇦🇺' },
      { code: 'CAD', name: '加元', flag: '🇨🇦' },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
      { code: 'HKD', name: '港币', flag: '🇭🇰' },
      { code: 'SGD', name: '新加坡元', flag: '🇸🇬' }
    ];

    // 转换为应用格式（以人民币为基准，显示1外币=?人民币）
    const cnyRate = rates.CNY || 7.1785; // 基准货币对CNY的汇率（如1 USD = 7.1785 CNY）
    
    const appFormatData = currencyConfig.map(currency => {
      let rate;
      
      if (currency.code === 'CNY') {
        rate = 1.0000; // 人民币基准：1 CNY = 1 CNY
      } else if (currency.code === base) {
        rate = parseFloat(cnyRate.toFixed(4)); // 基准货币：1 USD = 7.1785 CNY
      } else {
        const currencyToBase = rates[currency.code]; // 如 1 USD = 1.52 AUD
        if (currencyToBase && currencyToBase > 0) {
          // 计算 1 AUD = ? CNY：1 AUD = (1 USD / 1.52 AUD) = (7.1785 CNY / 1.52) CNY
          rate = parseFloat((cnyRate / currencyToBase).toFixed(4));
        } else {
          // 如果没有该货币的汇率数据，跳过
          return null;
        }
      }
      
      return {
        code: currency.code,
        name: currency.name,
        flag: currency.flag,
        rate: rate // 现在表示：1该货币 = rate人民币
      };
    }).filter(Boolean); // 过滤掉null值

    return {
      currencies: appFormatData,
      source: source,
      timestamp: timestamp,
      lastUpdate: new Date().toLocaleString('zh-CN')
    };
  }

  /**
   * 缓存汇率数据
   * @param {string} baseCurrency 基准货币
   * @param {object} data 汇率数据
   */
  cacheRates(baseCurrency, data) {
    try {
      const cacheKey = `exchange_rates_${baseCurrency}`;
      const cacheData = {
        data: data,
        timestamp: Date.now(),
        expiry: 5 * 60 * 1000 // 5分钟过期
      };
      
      wx.setStorageSync(cacheKey, JSON.stringify(cacheData));
      console.log(`汇率数据已缓存: ${baseCurrency}`);
    } catch (error) {
      console.warn('缓存汇率数据失败:', error);
    }
  }

  /**
   * 获取缓存的汇率数据
   * @param {string} baseCurrency 基准货币
   * @returns {object|null}
   */
  getCachedRates(baseCurrency) {
    try {
      const cacheKey = `exchange_rates_${baseCurrency}`;
      const cached = wx.getStorageSync(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // 检查是否过期
      if (now - cacheData.timestamp > cacheData.expiry) {
        wx.removeStorageSync(cacheKey);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.warn('读取缓存汇率数据失败:', error);
      return null;
    }
  }

  /**
   * 获取降级数据
   * @param {string} baseCurrency 基准货币
   * @returns {object}
   */
  getFallbackRates(baseCurrency) {
    console.log('使用降级汇率数据');
    
    // 返回备用的静态数据（基于最新汇率更新）
    // 这些数据表示：1 USD = rates[currency] currency
    const fallbackData = {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: {
        CNY: 7.1785,    // 1 USD = 7.1785 CNY
        USD: 1.0000,    // 1 USD = 1 USD
        EUR: 0.8740,    // 1 USD = 0.874 EUR
        JPY: 143.45,    // 1 USD = 143.45 JPY
        GBP: 0.7370,    // 1 USD = 0.737 GBP
        AUD: 1.5361,    // 1 USD = 1.5361 AUD
        CAD: 1.3700,    // 1 USD = 1.37 CAD
        CHF: 0.8200,    // 1 USD = 0.82 CHF
        HKD: 7.8500,    // 1 USD = 7.85 HKD
        SGD: 1.2900     // 1 USD = 1.29 SGD
      },
      source: 'Fallback Data',
      timestamp: Date.now()
    };
    
    return fallbackData;
  }

  /**
   * 延迟函数
   * @param {number} ms 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取API使用统计
   * @returns {object}
   */
  getUsageStats() {
    try {
      const stats = wx.getStorageSync('api_usage_stats') || {
        totalRequests: 0,
        todayRequests: 0,
        lastRequestDate: '',
        successRate: 100
      };
      
      return stats;
    } catch (error) {
      return {
        totalRequests: 0,
        todayRequests: 0,
        lastRequestDate: '',
        successRate: 100
      };
    }
  }

  /**
   * 更新API使用统计
   * @param {boolean} success 请求是否成功
   */
  updateUsageStats(success = true) {
    try {
      const stats = this.getUsageStats();
      const today = new Date().toDateString();
      
      // 重置每日计数
      if (stats.lastRequestDate !== today) {
        stats.todayRequests = 0;
        stats.lastRequestDate = today;
      }
      
      stats.totalRequests++;
      stats.todayRequests++;
      
      // 更新成功率
      if (success) {
        stats.successRate = Math.min(100, stats.successRate + 0.1);
      } else {
        stats.successRate = Math.max(0, stats.successRate - 1);
      }
      
      wx.setStorageSync('api_usage_stats', stats);
    } catch (error) {
      console.warn('更新API统计失败:', error);
    }
  }
}

// 创建全局实例
const exchangeRateAPI = new ExchangeRateAPI();

module.exports = {
  exchangeRateAPI
}; 