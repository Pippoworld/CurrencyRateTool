// 引入汇率API
const exchangeRateAPI = require('../../utils/exchange-rate-api');

Page({
  data: {
    // 页面基础数据
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

    // 市场统计
    marketStats: {
      up: 0,
      down: 0,
      flat: 0,
      total: 10
    },

    // 主要货币汇率
    currencyRates: [],
    
    // 汇率计算器
    calcFrom: {
      amount: '',
      currencyIndex: 1 // USD
    },
    calcTo: {
      amount: '',
      currencyIndex: 0 // CNY
    },
    calcRate: '0.0000',

    // 换汇成本计算
    costCalc: {
      amount: '',
      feeRate: '0.5',
      baseAmount: '0.00',
      fee: '0.00',
      totalCost: '0.00',
      received: '0.00'
    },

    // 银行汇率对比
    bankCurrencyIndex: 1, // USD
    bankRates: [],

    // 走势图表
    selectedCurrency: { code: 'USD', name: '美元', flag: '🇺🇸' },
    timeRange: '7D',
    chartData: [],
    chartSummary: {
      high: '0.0000',
      low: '0.0000',
      range: '0.00',
      average: '0.0000'
    },

    // 排序控制
    sortBy: 'name',

    // 提醒预设
    alertPresets: [
      {
        id: 'low_price',
        icon: '📉',
        title: '低价买入提醒',
        description: '汇率跌至较低位置时提醒'
      },
      {
        id: 'high_price',
        icon: '📈',
        title: '高价卖出提醒', 
        description: '汇率涨至较高位置时提醒'
      },
      {
        id: 'target_price',
        icon: '🎯',
        title: '目标价位提醒',
        description: '设置具体目标价格提醒'
      },
      {
        id: 'trend_change',
        icon: '🔄',
        title: '趋势变化提醒',
        description: '汇率趋势发生重要变化时提醒'
      }
    ],

    // 更新时间
    lastUpdateTime: '',
    
    // 页面状态
    isLoading: true,
    isRefreshing: false
  },

  async onLoad() {
    console.log('汇率工具页面加载');
    await this.initializeRateData();
  },

  async onShow() {
    console.log('汇率工具页面显示');
    await this.checkAndRefreshData();
  },

  async onPullDownRefresh() {
    console.log('用户下拉刷新汇率数据');
    await this.refreshAllData(true);
  },

  /**
   * 初始化汇率数据
   */
  async initializeRateData() {
    try {
      this.setData({ isLoading: true });
      
      wx.showLoading({
        title: '加载汇率数据...',
        mask: true
      });

      // 获取汇率数据
      await this.loadRateData();
      
      // 生成银行汇率对比
      this.generateBankRates();
      
      // 生成图表数据
      this.generateChartData();
      
      // 计算市场统计
      this.calculateMarketStats();
      
      console.log('汇率数据初始化完成');
      
    } catch (error) {
      console.error('初始化汇率数据失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  /**
   * 加载汇率数据
   */
  async loadRateData() {
    try {
      const apiData = await exchangeRateAPI.getRates('USD');
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 为每个货币添加变化数据
      const enhancedRates = appData.currencies.map(currency => {
        const change24h = this.generateRealisticChange();
        const changePercent = (change24h / currency.rate * 100);
        
        return {
          ...currency,
          change24h: change24h.toFixed(4),
          changePercent: changePercent.toFixed(2),
          changeStatus: changePercent >= 0 ? 'up' : 'down',
          changeIcon: changePercent >= 0 ? '📈' : '📉'
        };
      });

      this.setData({
        currencyRates: enhancedRates,
        lastUpdateTime: appData.lastUpdate
      });
      
      // 更新计算器汇率
      this.updateCalcRate();
      
    } catch (error) {
      console.error('获取汇率数据失败:', error);
      throw error;
    }
  },

  /**
   * 生成符合实际情况的汇率变化数据
   */
  generateRealisticChange() {
    const scenarios = [
      { weight: 0.4, min: -0.02, max: 0.02 },   // 40% 小幅波动
      { weight: 0.3, min: -0.05, max: 0.05 },   // 30% 中等波动
      { weight: 0.2, min: -0.10, max: 0.10 },   // 20% 较大波动
      { weight: 0.1, min: -0.20, max: 0.20 }    // 10% 大幅波动
    ];
    
    const random = Math.random();
    let cumulative = 0;
    
    for (const scenario of scenarios) {
      cumulative += scenario.weight;
      if (random < cumulative) {
        return scenario.min + Math.random() * (scenario.max - scenario.min);
      }
    }
    
    return scenarios[0].min + Math.random() * (scenarios[0].max - scenarios[0].min);
  },

  /**
   * 检查数据是否需要刷新
   */
  async checkAndRefreshData() {
    const lastUpdate = wx.getStorageSync('market_last_update') || 0;
    const now = Date.now();
    
    // 超过2分钟自动刷新
    if (now - lastUpdate > 2 * 60 * 1000) {
      await this.refreshAllData(false);
    }
  },

  /**
   * 刷新所有数据
   */
  async refreshAllData(userTriggered = false) {
    try {
      this.setData({ isRefreshing: true });
      
      if (userTriggered) {
        wx.showLoading({ title: '刷新中...' });
      }

      await this.loadRateData();
      this.generateBankRates();
      this.generateChartData();
      this.calculateMarketStats();
      
      // 更新缓存时间
      wx.setStorageSync('market_last_update', Date.now());
      
      if (userTriggered) {
        wx.showToast({
          title: '刷新完成',
          icon: 'success'
        });
      }
      
    } catch (error) {
      console.error('刷新数据失败:', error);
      if (userTriggered) {
        wx.showToast({
          title: '刷新失败',
          icon: 'error'
        });
      }
    } finally {
      this.setData({ isRefreshing: false });
      if (userTriggered) {
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    }
  },

  /**
   * 计算市场统计
   */
  calculateMarketStats() {
    const rates = this.data.currencyRates;
    let up = 0, down = 0, flat = 0;
    
    rates.forEach(rate => {
      const change = parseFloat(rate.changePercent);
      if (change > 0.01) {
        up++;
      } else if (change < -0.01) {
        down++;
      } else {
        flat++;
      }
    });
    
    this.setData({
      'marketStats.up': up,
      'marketStats.down': down,
      'marketStats.flat': flat,
      'marketStats.total': rates.length
    });
  },

  /**
   * 生成银行汇率对比数据
   */
  generateBankRates() {
    const currency = this.data.currencies[this.data.bankCurrencyIndex];
    const baseRate = this.getCurrentRate(currency.code);
    
    const banks = [
      { name: '中国银行', icon: '🏛️', spread: 0.015 },
      { name: '工商银行', icon: '🏦', spread: 0.018 },
      { name: '建设银行', icon: '🏗️', spread: 0.020 },
      { name: '招商银行', icon: '💳', spread: 0.012 },
      { name: '交通银行', icon: '🚄', spread: 0.022 }
    ];
    
    const bankRates = banks.map(bank => {
      const buyRate = (baseRate * (1 - bank.spread/2)).toFixed(4);
      const sellRate = (baseRate * (1 + bank.spread/2)).toFixed(4);
      const spread = (bank.spread * 100).toFixed(2) + '%';
      
      return {
        ...bank,
        buyRate,
        sellRate,
        spread,
        spreadStatus: bank.spread < 0.015 ? 'good' : bank.spread < 0.020 ? 'normal' : 'high'
      };
    });
    
    this.setData({ bankRates });
  },

  /**
   * 生成图表数据
   */
  generateChartData() {
    const currency = this.data.selectedCurrency;
    const baseRate = this.getCurrentRate(currency.code);
    const points = this.getTimePoints();
    
    const chartData = points.map((point, index) => {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% 变化
      const rate = baseRate * (1 + variation);
      const height = 20 + (rate / baseRate - 0.95) * 400; // 映射到20-80%高度
      
      return {
        label: point,
        value: rate.toFixed(4),
        height: Math.max(20, Math.min(80, height)),
        color: index === points.length - 1 ? '#4CAF50' : '#2196F3'
      };
    });
    
    // 计算统计数据
    const values = chartData.map(item => parseFloat(item.value));
    const high = Math.max(...values).toFixed(4);
    const low = Math.min(...values).toFixed(4);
    const average = (values.reduce((a, b) => a + b) / values.length).toFixed(4);
    const range = (((parseFloat(high) - parseFloat(low)) / parseFloat(average)) * 100).toFixed(2);
    
    this.setData({
      chartData,
      'chartSummary.high': high,
      'chartSummary.low': low,
      'chartSummary.average': average,
      'chartSummary.range': range
    });
  },

  /**
   * 获取时间点标签
   */
  getTimePoints() {
    const timeRange = this.data.timeRange;
    if (timeRange === '1D') {
      return ['9:00', '12:00', '15:00', '18:00', '21:00'];
    } else if (timeRange === '7D') {
      return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    } else {
      return ['1号', '8号', '15号', '22号', '29号'];
    }
  },

  /**
   * 获取当前汇率
   */
  getCurrentRate(currencyCode) {
    const currency = this.data.currencyRates.find(c => c.code === currencyCode);
    return currency ? currency.rate : 1.0;
  },

  // 汇率计算器相关方法
  onCalcFromInput(e) {
    const amount = e.detail.value;
    this.setData({ 'calcFrom.amount': amount });
    this.calculateToAmount();
  },

  onCalcToInput(e) {
    const amount = e.detail.value;
    this.setData({ 'calcTo.amount': amount });
    this.calculateFromAmount();
  },

  onCalcFromCurrencyChange(e) {
    this.setData({ 'calcFrom.currencyIndex': parseInt(e.detail.value) });
    this.updateCalcRate();
    this.calculateToAmount();
  },

  onCalcToCurrencyChange(e) {
    this.setData({ 'calcTo.currencyIndex': parseInt(e.detail.value) });
    this.updateCalcRate();
    this.calculateToAmount();
  },

  swapCalcCurrencies() {
    const fromIndex = this.data.calcFrom.currencyIndex;
    const toIndex = this.data.calcTo.currencyIndex;
    const fromAmount = this.data.calcFrom.amount;
    const toAmount = this.data.calcTo.amount;
    
    this.setData({
      'calcFrom.currencyIndex': toIndex,
      'calcTo.currencyIndex': fromIndex,
      'calcFrom.amount': toAmount,
      'calcTo.amount': fromAmount
    });
    
    this.updateCalcRate();
  },

  updateCalcRate() {
    const fromCurrency = this.data.currencies[this.data.calcFrom.currencyIndex];
    const toCurrency = this.data.currencies[this.data.calcTo.currencyIndex];
    
    const fromRate = this.getCurrentRate(fromCurrency.code);
    const toRate = this.getCurrentRate(toCurrency.code);
    
    const rate = (fromRate / toRate).toFixed(4);
    this.setData({ calcRate: rate });
  },

  calculateToAmount() {
    const fromAmount = parseFloat(this.data.calcFrom.amount);
    if (isNaN(fromAmount) || fromAmount <= 0) {
      this.setData({ 'calcTo.amount': '' });
      return;
    }
    
    const rate = parseFloat(this.data.calcRate);
    const toAmount = (fromAmount * rate).toFixed(2);
    this.setData({ 'calcTo.amount': toAmount });
  },

  calculateFromAmount() {
    const toAmount = parseFloat(this.data.calcTo.amount);
    if (isNaN(toAmount) || toAmount <= 0) {
      this.setData({ 'calcFrom.amount': '' });
      return;
    }
    
    const rate = parseFloat(this.data.calcRate);
    const fromAmount = (toAmount / rate).toFixed(2);
    this.setData({ 'calcFrom.amount': fromAmount });
  },

  // 换汇成本计算
  onCostAmountInput(e) {
    this.setData({ 'costCalc.amount': e.detail.value });
    this.calculateCost();
  },

  onCostFeeInput(e) {
    this.setData({ 'costCalc.feeRate': e.detail.value });
    this.calculateCost();
  },

  calculateCost() {
    const amount = parseFloat(this.data.costCalc.amount);
    const feeRate = parseFloat(this.data.costCalc.feeRate);
    
    if (isNaN(amount) || isNaN(feeRate)) {
      return;
    }
    
    const fee = (amount * feeRate / 100);
    const totalCost = amount + fee;
    const rate = parseFloat(this.data.calcRate);
    const received = (amount * rate);
    
    this.setData({
      'costCalc.baseAmount': amount.toFixed(2),
      'costCalc.fee': fee.toFixed(2),
      'costCalc.totalCost': totalCost.toFixed(2),
      'costCalc.received': received.toFixed(2)
    });
  },

  // 银行汇率对比
  onBankCurrencyChange(e) {
    this.setData({ bankCurrencyIndex: parseInt(e.detail.value) });
    this.generateBankRates();
  },

  // 图表控制
  changeTimeRange(e) {
    const range = e.currentTarget.dataset.range;
    this.setData({ timeRange: range });
    this.generateChartData();
  },

  showChartPoint(e) {
    const point = e.currentTarget.dataset.point;
    wx.showModal({
      title: '汇率详情',
      content: `时间: ${point.label}\n汇率: ${point.value}`,
      showCancel: false
    });
  },

  // 货币操作
  selectCurrency(e) {
    const currency = e.currentTarget.dataset.currency;
    this.setData({ selectedCurrency: currency });
    this.generateChartData();
  },

  changeSortBy(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({ sortBy });
    this.sortCurrencyRates();
  },

  sortCurrencyRates() {
    const rates = [...this.data.currencyRates];
    const sortBy = this.data.sortBy;
    
    rates.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'rate') {
        return b.rate - a.rate;
      } else if (sortBy === 'change') {
        return parseFloat(b.changePercent) - parseFloat(a.changePercent);
      }
      return 0;
    });
    
    this.setData({ currencyRates: rates });
  },

  // 监控和提醒
  addToMonitor(e) {
    const currency = e.currentTarget.dataset.currency;
    wx.showToast({
      title: `已添加${currency.name}监控`,
      icon: 'success'
    });
  },

  setAlert(e) {
    const currency = e.currentTarget.dataset.currency;
    wx.navigateTo({
      url: `/pages/my-alerts/my-alerts?currency=${currency.code}&name=${currency.name}`
    });
  },

  setQuickAlert(e) {
    const preset = e.currentTarget.dataset.preset;
    wx.showModal({
      title: preset.title,
      content: preset.description + '\n\n是否立即设置此类型的提醒？',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/my-alerts/my-alerts?type=${preset.id}`
          });
        }
      }
    });
  },

  // 工具功能
  goToRateHistory() {
    wx.showModal({
      title: '历史汇率',
      content: '查看详细的历史汇率数据和趋势分析',
      confirmText: '前往',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到详细页面
          wx.switchTab({
            url: '/pages/rate-detail/rate-detail'
          });
        }
      }
    });
  },

  goToRateAlerts() {
    wx.navigateTo({
      url: '/pages/my-alerts/my-alerts'
    });
  },

  showRateComparison() {
    wx.showModal({
      title: '多币种对比',
      content: '横向对比多种货币的汇率表现，分析相对强弱',
      showCancel: false
    });
  },

  showExchangeTips() {
    wx.showModal({
      title: '💡 换汇省钱技巧',
      content: '1. 关注汇率趋势，选择合适时机\n2. 比较不同银行的汇率和手续费\n3. 避免在汇率高点大额换汇\n4. 分批换汇降低风险\n5. 使用手机银行可享受优惠汇率',
      confirmText: '知道了',
      showCancel: false
    });
  },

  showBestTiming() {
    const currency = this.data.selectedCurrency;
    const currentRate = this.getCurrentRate(currency.code);
    const change = this.data.currencyRates.find(c => c.code === currency.code)?.changePercent || '0';
    
    let timing, advice;
    if (parseFloat(change) < -2) {
      timing = '换汇好时机';
      advice = '汇率较低，适合买入';
    } else if (parseFloat(change) > 2) {
      timing = '观望时机';
      advice = '汇率较高，建议等待回调';
    } else {
      timing = '中性时机';
      advice = '汇率相对稳定，可适量操作';
    }
    
    wx.showModal({
      title: `🎯 ${currency.name}换汇时机`,
      content: `当前汇率: ${currentRate}\n24小时变化: ${change}%\n\n时机判断: ${timing}\n建议: ${advice}`,
      showCancel: false
    });
  },

  exportRateData() {
    wx.showModal({
      title: '数据导出',
      content: '导出当前汇率数据和个人监控记录，用于备份或分析',
      confirmText: '导出',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '导出功能开发中',
            icon: 'none'
          });
        }
      }
    });
  }
}); 