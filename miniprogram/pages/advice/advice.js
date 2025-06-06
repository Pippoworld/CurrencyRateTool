// 引入汇率API
const exchangeRateAPI = require('../../utils/exchange-rate-api');

Page({
  data: {
    // 货币数据
    currencies: [
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
    ],

    // 所有可用货币（用于选择）
    allCurrencies: [
      { code: 'CNY', name: '人民币', flag: '🇨🇳' },
      { code: 'USD', name: '美元', flag: '🇺🇸' },
      { code: 'EUR', name: '欧元', flag: '🇪🇺' },
      { code: 'JPY', name: '日元', flag: '🇯🇵' },
      { code: 'GBP', name: '英镑', flag: '🇬🇧' },
      { code: 'AUD', name: '澳元', flag: '🇦🇺' },
      { code: 'CAD', name: '加元', flag: '🇨🇦' },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
      { code: 'HKD', name: '港币', flag: '🇭🇰' },
      { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
      { code: 'KRW', name: '韩元', flag: '🇰🇷' },
      { code: 'TWD', name: '新台币', flag: '🇹🇼' },
      { code: 'THB', name: '泰铢', flag: '🇹🇭' },
      { code: 'MYR', name: '马来西亚林吉特', flag: '🇲🇾' },
      { code: 'INR', name: '印度卢比', flag: '🇮🇳' },
      { code: 'RUB', name: '俄罗斯卢布', flag: '🇷🇺' }
    ],

    // 计算器相关
    baseCurrencyIndex: 0, // 默认人民币
    baseAmount: '',
    
    // 汇率数据
    ratesList: [],
    rawRatesData: {},
    selectedCurrencies: {}, // 记录已选择的货币

    // 走势图相关
    selectedCurrency: null,
    chartData: [],
    chartLabels: [],
    chartStats: {
      high: '0.0000',
      low: '0.0000',
      current: '0.0000'
    },

    // 弹窗控制
    showCurrencyModal: false,
    showTimeModal: false,

    // 更新时间
    lastUpdateTime: '',
    
    // 页面状态
    isRefreshing: false
  },

  async onLoad() {
    console.log('汇率对比页面加载');
    await this.initializeData();
  },

  async onShow() {
    console.log('汇率对比页面显示');
    await this.checkDataFreshness();
  },

  async onPullDownRefresh() {
    await this.refreshRates(true);
  },

  /**
   * 初始化数据
   */
  async initializeData() {
    try {
      wx.showLoading({
        title: '加载汇率数据...',
        mask: true
      });

      // 初始化已选择的货币
      const selectedCurrencies = {};
      this.data.currencies.forEach(currency => {
        selectedCurrencies[currency.code] = true;
      });
      
      this.setData({ selectedCurrencies });

      // 加载汇率数据
      await this.loadRateData();
      
      // 初始化汇率列表
      this.updateRatesList();
      
      // 生成走势图
      this.generateChart();
      
      console.log('汇率数据初始化完成');
      
    } catch (error) {
      console.error('初始化失败:', error);
      this.loadFallbackData();
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 加载汇率数据
   */
  async loadRateData() {
    try {
      const baseCurrency = this.data.currencies[this.data.baseCurrencyIndex];
      const apiData = await exchangeRateAPI.getRates(baseCurrency.code);
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 处理汇率数据
      const processedRates = {};
      
      // 添加基础货币
      processedRates[baseCurrency.code] = {
        code: baseCurrency.code,
        name: baseCurrency.name,
        flag: baseCurrency.flag,
        rate: 1,
        change24h: 0,
        changePercent: '0.00',
        trend: 'flat',
        changeIcon: '→'
      };
      
      // 处理其他货币
      if (appData.currencies) {
        appData.currencies.forEach(currency => {
          const change24h = this.generateRealisticChange();
          const changePercent = change24h * 100;
          
          processedRates[currency.code] = {
            ...currency,
            change24h: change24h.toFixed(4),
            changePercent: changePercent.toFixed(2),
            trend: changePercent >= 0.1 ? 'up' : changePercent <= -0.1 ? 'down' : 'flat',
            changeIcon: changePercent >= 0.1 ? '↗' : changePercent <= -0.1 ? '↘' : '→'
          };
        });
      }

      this.setData({
        rawRatesData: processedRates,
        lastUpdateTime: this.getCurrentTime()
      });
      
    } catch (error) {
      console.error('加载汇率数据失败:', error);
      throw error;
    }
  },

  /**
   * 加载备用数据
   */
  loadFallbackData() {
    console.log('使用备用汇率数据');
    const fallbackRates = {};
    const baseCurrency = this.data.currencies[this.data.baseCurrencyIndex];
    
    // 模拟汇率数据
    const mockRates = {
      'CNY': 1,
      'USD': 0.14,
      'EUR': 0.13,
      'JPY': 20,
      'GBP': 0.11,
      'AUD': 0.21,
      'CAD': 0.19,
      'CHF': 0.13,
      'HKD': 1.09,
      'SGD': 0.19,
      'KRW': 185,
      'TWD': 4.5,
      'THB': 5.1,
      'MYR': 0.65,
      'INR': 12,
      'RUB': 13
    };

    this.data.allCurrencies.forEach(currency => {
      const baseRate = mockRates[currency.code] || 1;
      const change24h = this.generateRealisticChange();
      const changePercent = change24h * 100;
      
      fallbackRates[currency.code] = {
        ...currency,
        rate: baseRate,
        change24h: change24h.toFixed(4),
        changePercent: changePercent.toFixed(2),
        trend: changePercent >= 0.1 ? 'up' : changePercent <= -0.1 ? 'down' : 'flat',
        changeIcon: changePercent >= 0.1 ? '↗' : changePercent <= -0.1 ? '↘' : '→'
      };
    });

    this.setData({
      rawRatesData: fallbackRates,
      lastUpdateTime: this.getCurrentTime()
    });
    
    this.updateRatesList();
    this.generateChart();
  },

  /**
   * 生成模拟汇率变化
   */
  generateRealisticChange() {
    const scenarios = [
      { weight: 0.6, min: -0.01, max: 0.01 },   // 60% 微小波动
      { weight: 0.3, min: -0.03, max: 0.03 },   // 30% 小幅波动
      { weight: 0.1, min: -0.08, max: 0.08 }    // 10% 大幅波动
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.weight;
      if (random < cumulative) {
        return scenario.min + Math.random() * (scenario.max - scenario.min);
      }
    }
    
    return 0;
  },

  /**
   * 更新汇率列表
   */
  updateRatesList() {
    const baseCurrency = this.data.currencies[this.data.baseCurrencyIndex];
    const baseAmount = parseFloat(this.data.baseAmount) || 0;
    
    const ratesList = this.data.currencies.map(currency => {
      const rateData = this.data.rawRatesData[currency.code];
      if (!rateData) return null;
      
      // 计算显示汇率
      let displayRate;
      let calculatedAmount = '';
      
      if (currency.code === baseCurrency.code) {
        displayRate = '1.0000';
        if (baseAmount > 0) {
          calculatedAmount = baseAmount.toFixed(2);
        }
      } else {
        displayRate = rateData.rate.toFixed(4);
        if (baseAmount > 0) {
          const amount = baseAmount * rateData.rate;
          calculatedAmount = amount.toFixed(2);
        }
      }
      
      return {
        ...rateData,
        displayRate,
        calculatedAmount
      };
    }).filter(Boolean);

    this.setData({ ratesList });
  },

  /**
   * 生成走势图
   */
  generateChart() {
    if (!this.data.selectedCurrency) {
      // 默认选择第一个非基础货币
      const baseCurrency = this.data.currencies[this.data.baseCurrencyIndex];
      const otherCurrency = this.data.currencies.find(c => c.code !== baseCurrency.code);
      if (otherCurrency) {
        this.setData({ selectedCurrency: otherCurrency });
      } else {
        return;
      }
    }

    const currency = this.data.selectedCurrency;
    const currentRate = this.data.rawRatesData[currency.code]?.rate || 1;
    
    // 生成7个数据点
    const chartData = [];
    const chartLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '今天'];
    
    for (let i = 0; i < 7; i++) {
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% 变化
      const rate = currentRate * (1 + variation);
      const height = 30 + Math.random() * 40; // 30-70% 高度
      
      chartData.push({
        rate: rate.toFixed(4),
        height: height,
        color: i === 6 ? '#4CAF50' : '#2196F3'
      });
    }
    
    // 计算统计数据
    const rates = chartData.map(item => parseFloat(item.rate));
    const high = Math.max(...rates).toFixed(4);
    const low = Math.min(...rates).toFixed(4);
    const current = rates[rates.length - 1].toFixed(4);
    
    this.setData({
      chartData,
      chartLabels,
      'chartStats.high': high,
      'chartStats.low': low,
      'chartStats.current': current
    });
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  },

  /**
   * 检查数据新鲜度
   */
  async checkDataFreshness() {
    const lastUpdate = wx.getStorageSync('rates_last_update') || 0;
    const now = Date.now();
    
    // 超过10分钟自动刷新
    if (now - lastUpdate > 10 * 60 * 1000) {
      await this.refreshRates(false);
    }
  },

  // 事件处理函数
  
  /**
   * 基础货币切换
   */
  onBaseCurrencyChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ baseCurrencyIndex: index });
    
    // 重新加载数据
    this.loadRateData().then(() => {
      this.updateRatesList();
    }).catch(() => {
      this.loadFallbackData();
    });
  },

  /**
   * 基础金额输入
   */
  onBaseAmountInput(e) {
    const amount = e.detail.value;
    this.setData({ baseAmount: amount });
    this.updateRatesList();
  },

  /**
   * 刷新汇率
   */
  async refreshRates(userTriggered = false) {
    try {
      this.setData({ isRefreshing: true });
      
      if (userTriggered) {
        wx.showLoading({ title: '刷新中...' });
      }

      await this.loadRateData();
      this.updateRatesList();
      this.generateChart();
      
      // 更新缓存时间
      wx.setStorageSync('rates_last_update', Date.now());
      
      if (userTriggered) {
        wx.showToast({
          title: '刷新完成',
          icon: 'success'
        });
      }
      
    } catch (error) {
      console.error('刷新失败:', error);
      if (userTriggered) {
        wx.showToast({
          title: '刷新失败，使用离线数据',
          icon: 'none'
        });
      }
      this.loadFallbackData();
    } finally {
      this.setData({ isRefreshing: false });
      if (userTriggered) {
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 显示更新时间
   */
  showUpdateTime() {
    this.setData({
      showTimeModal: true
    });
  },

  /**
   * 隐藏时间弹窗
   */
  hideTimeModal() {
    this.setData({
      showTimeModal: false
    });
  },

  /**
   * 显示货币选择器
   */
  showCurrencySelector() {
    this.setData({ showCurrencyModal: true });
  },

  /**
   * 隐藏货币选择器
   */
  hideCurrencySelector() {
    this.setData({ showCurrencyModal: false });
  },

  /**
   * 添加货币
   */
  addCurrency(e) {
    const currency = e.currentTarget.dataset.currency;
    
    // 添加到货币列表
    const currencies = [...this.data.currencies, currency];
    const selectedCurrencies = { ...this.data.selectedCurrencies };
    selectedCurrencies[currency.code] = true;
    
    this.setData({ 
      currencies,
      selectedCurrencies,
      showCurrencyModal: false
    });
    
    // 更新汇率列表
    this.updateRatesList();
    
    wx.showToast({
      title: `已添加${currency.name}`,
      icon: 'success'
    });
  },

  /**
   * 显示汇率详情
   */
  showRateDetail(e) {
    const point = e.currentTarget.dataset.point;
    wx.showModal({
      title: '汇率详情',
      content: `汇率: ${point.rate}`,
      showCancel: false
    });
  },

  /**
   * 显示更新时间
   */
  showUpdateTime() {
    this.setData({
      showTimeModal: true
    });
  },

  /**
   * 隐藏时间弹窗
   */
  hideTimeModal() {
    this.setData({
      showTimeModal: false
    });
  }
}); 