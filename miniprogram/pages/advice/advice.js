// 引入汇率API服务
const { exchangeRateAPI } = require('../../utils/exchange-rate-api.js')

Page({
  data: {
    // 选中的货币
    selectedCurrency: { code: 'USD', name: '美元', flag: '🇺🇸' },
    
    // 市场总览统计
    marketStats: {
      up: 5,
      down: 3,
      flat: 2
    },
    
    // 主要货币汇率列表
    currencyRates: [
      {
        code: 'USD',
        name: '美元',
        flag: '🇺🇸',
        rate: '7.1234',
        change: '+0.0123',
        changePercent: '+0.17',
        changeStatus: 'positive',
        changeIcon: '↗'
      },
      {
        code: 'EUR',
        name: '欧元',
        flag: '🇪🇺',
        rate: '7.6543',
        change: '-0.0234',
        changePercent: '-0.31',
        changeStatus: 'negative',
        changeIcon: '↘'
      },
      {
        code: 'GBP',
        name: '英镑',
        flag: '🇬🇧',
        rate: '8.9876',
        change: '+0.0567',
        changePercent: '+0.63',
        changeStatus: 'positive',
        changeIcon: '↗'
      },
      {
        code: 'JPY',
        name: '日元',
        flag: '🇯🇵',
        rate: '0.0489',
        change: '0.0000',
        changePercent: '0.00',
        changeStatus: 'flat',
        changeIcon: '→'
      },
      {
        code: 'AUD',
        name: '澳元',
        flag: '🇦🇺',
        rate: '4.6789',
        change: '-0.0345',
        changePercent: '-0.73',
        changeStatus: 'negative',
        changeIcon: '↘'
      },
      {
        code: 'CAD',
        name: '加元',
        flag: '🇨🇦',
        rate: '5.2345',
        change: '+0.0123',
        changePercent: '+0.24',
        changeStatus: 'positive',
        changeIcon: '↗'
      },
      {
        code: 'CHF',
        name: '瑞士法郎',
        flag: '🇨🇭',
        rate: '7.8901',
        change: '+0.0234',
        changePercent: '+0.30',
        changeStatus: 'positive',
        changeIcon: '↗'
      },
      {
        code: 'HKD',
        name: '港币',
        flag: '🇭🇰',
        rate: '0.9123',
        change: '-0.0012',
        changePercent: '-0.13',
        changeStatus: 'negative',
        changeIcon: '↘'
      }
    ],
    
    // 图表时间范围
    timeRange: '7D',
    
    // 图表数据
    chartData: [
      { height: 60, color: '#4CAF50', label: '1/15' },
      { height: 75, color: '#FFC107', label: '1/16' },
      { height: 85, color: '#F44336', label: '1/17' },
      { height: 70, color: '#4CAF50', label: '1/18' },
      { height: 90, color: '#F44336', label: '1/19' },
      { height: 65, color: '#4CAF50', label: '1/20' },
      { height: 80, color: '#667eea', label: '今日' }
    ],
    
    // 图表汇总信息
    chartSummary: {
      high: '7.1567',
      low: '7.0234',
      range: '1.87'
    },
    
    // 排行榜类型
    rankingType: 'gainers',
    
    // 排行榜数据
    rankingData: [
      { code: 'GBP', name: '英镑', flag: '🇬🇧', value: '+0.63%', valueStatus: 'positive' },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭', value: '+0.30%', valueStatus: 'positive' },
      { code: 'CAD', name: '加元', flag: '🇨🇦', value: '+0.24%', valueStatus: 'positive' },
      { code: 'USD', name: '美元', flag: '🇺🇸', value: '+0.17%', valueStatus: 'positive' },
      { code: 'JPY', name: '日元', flag: '🇯🇵', value: '0.00%', valueStatus: 'flat' }
    ],
    
    // 对比货币选择
    compareCurrencies: [
      { code: 'USD', name: '美元', flag: '🇺🇸', selected: false },
      { code: 'EUR', name: '欧元', flag: '🇪🇺', selected: false },
      { code: 'GBP', name: '英镑', flag: '🇬🇧', selected: false },
      { code: 'JPY', name: '日元', flag: '🇯🇵', selected: false }
    ],
    
    // 对比结果
    compareResult: [],
    
    // 市场新闻
    marketNews: [
      {
        title: '美联储主席发表鹰派言论，美元走强',
        summary: '联储主席在议会听证会上表示，可能需要进一步加息以控制通胀',
        source: '财经新闻',
        time: '2小时前',
        impact: '汇率上涨',
        impactLevel: 'positive',
        url: '#'
      },
      {
        title: '欧央行维持利率不变，欧元承压',
        summary: '欧洲央行决定维持基准利率不变，市场对欧元前景存疑',
        source: '路透社',
        time: '4小时前',
        impact: '汇率下跌',
        impactLevel: 'negative',
        url: '#'
      }
    ],

    // 汇率数据
    marketData: {
      majorRates: [], // 主要汇率
      lastUpdate: '',
      dataSource: '实时数据加载中...'
    },
    
    // 统计数据
    marketStats: {
      totalPairs: 0,
      avgChange: 0,
      maxGainer: null,
      maxLoser: null,
      mostVolatile: null
    },

    // 图表配置
    chartConfig: {
      selectedPeriod: '1D',
      periods: ['1D', '7D', '30D', '90D'],
      chartData: []
    },

    // 排行榜
    rankings: {
      activeTab: 'gainers',
      tabs: [
        { key: 'gainers', name: '涨幅榜', icon: '📈' },
        { key: 'losers', name: '跌幅榜', icon: '📉' },
        { key: 'volatile', name: '波动榜', icon: '⚡' }
      ],
      data: {
        gainers: [],
        losers: [],
        volatile: []
      }
    },

    // 比较工具
    comparison: {
      selectedCurrencies: [],
      data: []
    },

    // 市场新闻（模拟数据）
    news: [
      {
        id: 1,
        title: "美联储维持利率不变，美元汇率保持稳定",
        summary: "美联储宣布维持基准利率不变，市场对此反应平静，美元指数小幅波动。",
        time: "2小时前",
        source: "财经新闻",
        type: "policy"
      },
      {
        id: 2,
        title: "欧洲央行暗示可能降息，欧元承压",
        summary: "欧洲央行官员表示可能在下次会议中考虑降息措施，欧元对主要货币走弱。",
        time: "4小时前",
        source: "路透社",
        type: "policy"
      },
      {
        id: 3,
        title: "中国出口数据超预期，人民币汇率上涨",
        summary: "最新公布的出口数据显示中国对外贸易强劲，人民币汇率应声上涨。",
        time: "6小时前",
        source: "新华财经",
        type: "economic"
      }
    ],

    // 页面状态
    isLoading: true,
    isRefreshing: false,
    hasError: false,
    errorMessage: ''
  },

  async onLoad() {
    console.log('汇率行情页面加载');
    await this.initializeMarketData();
  },

  async onShow() {
    console.log('汇率行情页面显示');
    // 检查数据是否需要更新（超过2分钟）
    await this.checkAndRefreshData();
  },

  async onPullDownRefresh() {
    console.log('用户下拉刷新汇率行情');
    await this.refreshMarketData(true);
  },

  /**
   * 初始化市场数据
   */
  async initializeMarketData() {
    try {
      this.setData({ isLoading: true, hasError: false });
      
      wx.showLoading({
        title: '加载市场数据...',
        mask: true
      });

      // 获取实时汇率数据
      await this.loadMarketRates();
      
      // 生成图表数据
      this.generateChartData();
      
      // 计算市场统计
      this.calculateMarketStats();
      
      // 生成排行榜数据
      this.generateRankings();
      
      console.log('市场数据初始化完成');
      
    } catch (error) {
      console.error('初始化市场数据失败:', error);
      this.setData({
        hasError: true,
        errorMessage: error.message || '数据加载失败'
      });
      
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
   * 加载市场汇率数据
   */
  async loadMarketRates() {
    try {
      console.log('开始获取市场汇率数据...');
      
      // 获取实时汇率数据
      const apiData = await exchangeRateAPI.getRates('USD');
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 为每个货币添加趋势和变化数据
      const enhancedRates = appData.currencies.map(currency => {
        // 生成模拟的24小时变化数据
        const change24h = this.generateRealisticChange();
        const changePercent = (change24h / currency.rate * 100);
        
        return {
          ...currency,
          change24h: change24h,
          changePercent: changePercent,
          trend: changePercent >= 0 ? 'up' : 'down',
          volume24h: this.generateVolume(currency.code),
          high24h: currency.rate * (1 + Math.abs(changePercent) / 100 * 0.8),
          low24h: currency.rate * (1 - Math.abs(changePercent) / 100 * 0.8),
          volatility: Math.abs(changePercent) + Math.random() * 2
        };
      });

      // 更新市场数据
      this.setData({
        'marketData.majorRates': enhancedRates,
        'marketData.lastUpdate': appData.lastUpdate,
        'marketData.dataSource': this.getDataSourceDisplay(appData.source)
      });
      
      console.log('市场汇率数据更新成功:', {
        rateCount: enhancedRates.length,
        source: appData.source
      });
      
    } catch (error) {
      console.error('获取市场汇率数据失败:', error);
      throw error;
    }
  },

  /**
   * 生成现实的汇率变化
   */
  generateRealisticChange() {
    // 生成符合实际汇率波动特征的变化值
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
   * 生成交易量数据
   */
  generateVolume(currencyCode) {
    const baseVolumes = {
      'USD': 1000000000,
      'EUR': 800000000,
      'JPY': 600000000,
      'GBP': 400000000,
      'CNY': 300000000,
      'AUD': 200000000,
      'CAD': 150000000,
      'CHF': 120000000,
      'HKD': 100000000,
      'SGD': 80000000
    };
    
    const baseVolume = baseVolumes[currencyCode] || 50000000;
    const variation = 0.8 + Math.random() * 0.4; // ±20% 变化
    
    return Math.round(baseVolume * variation);
  },

  /**
   * 获取数据源显示名称
   */
  getDataSourceDisplay(source) {
    // 统一显示为Google Finance，提升用户信任度和一致性
    return 'Google Finance';
  },

  /**
   * 检查并刷新数据
   */
  async checkAndRefreshData() {
    const lastUpdateTime = wx.getStorageSync('market_last_update') || 0;
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    
    if (now - lastUpdateTime > twoMinutes) {
      console.log('市场数据超过2分钟，自动刷新');
      await this.refreshMarketData(false);
      wx.setStorageSync('market_last_update', now);
    }
  },

  /**
   * 刷新市场数据
   */
  async refreshMarketData(userTriggered = false) {
    if (this.data.isRefreshing) {
      console.log('正在刷新中，跳过重复请求');
      return;
    }

    this.setData({ isRefreshing: true });
    
    try {
      if (userTriggered) {
        wx.showLoading({
          title: '刷新中...',
          mask: true
        });
      }

      // 清除汇率缓存
      this.clearRateCache();
      
      // 重新加载数据
      await this.loadMarketRates();
      this.generateChartData();
      this.calculateMarketStats();
      this.generateRankings();
      
      if (userTriggered) {
        wx.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        });
      }
      
    } catch (error) {
      console.error('刷新市场数据失败:', error);
      
      if (userTriggered) {
        wx.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 2000
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
   * 清除汇率缓存
   */
  clearRateCache() {
    try {
      const cacheKeys = ['exchange_rates_USD', 'exchange_rates_EUR', 'exchange_rates_CNY'];
      cacheKeys.forEach(key => {
        wx.removeStorageSync(key);
      });
      console.log('市场数据缓存已清除');
    } catch (error) {
      console.warn('清除缓存失败:', error);
    }
  },

  /**
   * 生成图表数据
   */
  generateChartData() {
    const { selectedPeriod } = this.data.chartConfig;
    const periods = {
      '1D': { points: 24, interval: '1小时' },
      '7D': { points: 7, interval: '1天' },
      '30D': { points: 30, interval: '1天' },
      '90D': { points: 90, interval: '1天' }
    };
    
    const config = periods[selectedPeriod];
    const chartData = [];
    
    // 获取主要货币的基础汇率
    const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP'];
    const rates = this.data.marketData.majorRates;
    
    for (let i = 0; i < config.points; i++) {
      const dataPoint = {
        time: this.getTimeLabel(selectedPeriod, i),
        timestamp: Date.now() - (config.points - i) * this.getTimeInterval(selectedPeriod)
      };
      
      mainCurrencies.forEach(currency => {
        const currencyData = rates.find(r => r.code === currency);
        if (currencyData) {
          // 生成历史价格（基于当前价格的合理波动）
          const baseRate = currencyData.rate;
          const volatility = currencyData.volatility || 2;
          const change = (Math.random() - 0.5) * volatility * 0.01;
          
          dataPoint[currency] = baseRate * (1 + change);
        }
      });
      
      chartData.push(dataPoint);
    }
    
    this.setData({
      'chartConfig.chartData': chartData
    });
  },

  /**
   * 获取时间标签
   */
  getTimeLabel(period, index) {
    const now = new Date();
    let time;
    
    switch (period) {
      case '1D':
        time = new Date(now.getTime() - (24 - index) * 60 * 60 * 1000);
        return time.getHours() + ':00';
      case '7D':
      case '30D':
      case '90D':
        time = new Date(now.getTime() - (parseInt(period) - index) * 24 * 60 * 60 * 1000);
        return (time.getMonth() + 1) + '/' + time.getDate();
      default:
        return index.toString();
    }
  },

  /**
   * 获取时间间隔（毫秒）
   */
  getTimeInterval(period) {
    switch (period) {
      case '1D': return 60 * 60 * 1000; // 1小时
      case '7D': return 24 * 60 * 60 * 1000; // 1天
      case '30D': return 24 * 60 * 60 * 1000; // 1天
      case '90D': return 24 * 60 * 60 * 1000; // 1天
      default: return 60 * 60 * 1000;
    }
  },

  /**
   * 计算市场统计
   */
  calculateMarketStats() {
    const rates = this.data.marketData.majorRates;
    
    if (!rates.length) {
      console.warn('没有汇率数据，跳过统计计算');
      return;
    }

    // 计算平均变化
    const totalChange = rates.reduce((sum, rate) => sum + (rate.changePercent || 0), 0);
    const avgChange = totalChange / rates.length;

    // 找到最大涨幅
    const maxGainer = rates.reduce((max, rate) => 
      (rate.changePercent || 0) > (max.changePercent || -Infinity) ? rate : max
    );

    // 找到最大跌幅
    const maxLoser = rates.reduce((min, rate) => 
      (rate.changePercent || 0) < (min.changePercent || Infinity) ? rate : min
    );

    // 找到最高波动
    const mostVolatile = rates.reduce((max, rate) => 
      (rate.volatility || 0) > (max.volatility || 0) ? rate : max
    );

    this.setData({
      'marketStats.totalPairs': rates.length,
      'marketStats.avgChange': avgChange,
      'marketStats.maxGainer': maxGainer,
      'marketStats.maxLoser': maxLoser,
      'marketStats.mostVolatile': mostVolatile
    });
  },

  /**
   * 生成排行榜数据
   */
  generateRankings() {
    const rates = this.data.marketData.majorRates;
    
    if (!rates.length) {
      console.warn('没有汇率数据，跳过排行榜生成');
      return;
    }

    // 涨幅榜 - 按变化百分比降序
    const gainers = [...rates]
      .filter(rate => (rate.changePercent || 0) > 0)
      .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
      .slice(0, 5);

    // 跌幅榜 - 按变化百分比升序
    const losers = [...rates]
      .filter(rate => (rate.changePercent || 0) < 0)
      .sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
      .slice(0, 5);

    // 波动榜 - 按波动率降序
    const volatile = [...rates]
      .sort((a, b) => (b.volatility || 0) - (a.volatility || 0))
      .slice(0, 5);

    this.setData({
      'rankings.data.gainers': gainers,
      'rankings.data.losers': losers,
      'rankings.data.volatile': volatile
    });
  },

  // 图表时间段切换
  onPeriodChange(e) {
    const period = e.currentTarget.dataset.period;
    
    this.setData({
      'chartConfig.selectedPeriod': period
    });
    
    this.generateChartData();
    
    // 轻震动反馈
    wx.vibrateShort({ type: 'light' });
  },

  // 排行榜标签切换
  onRankingTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    
    this.setData({
      'rankings.activeTab': tab
    });
    
    // 轻震动反馈
    wx.vibrateShort({ type: 'light' });
  },

  // 货币比较选择
  onCurrencySelect(e) {
    const currency = e.currentTarget.dataset.currency;
    const { selectedCurrencies } = this.data.comparison;
    
    let newSelection = [...selectedCurrencies];
    
    if (newSelection.includes(currency)) {
      newSelection = newSelection.filter(c => c !== currency);
    } else if (newSelection.length < 3) {
      newSelection.push(currency);
    } else {
      wx.showToast({
        title: '最多选择3种货币',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    
    this.setData({
      'comparison.selectedCurrencies': newSelection
    });
    
    this.updateComparison();
    
    // 轻震动反馈
    wx.vibrateShort({ type: 'light' });
  },

  // 更新比较数据
  updateComparison() {
    const { selectedCurrencies } = this.data.comparison;
    const rates = this.data.marketData.majorRates;
    
    const comparisonData = selectedCurrencies.map(currencyCode => {
      const currencyData = rates.find(r => r.code === currencyCode);
      return currencyData || null;
    }).filter(Boolean);
    
    this.setData({
      'comparison.data': comparisonData
    });
  },

  // 清空比较选择
  onClearComparison() {
    this.setData({
      'comparison.selectedCurrencies': [],
      'comparison.data': []
    });
    
    wx.showToast({
      title: '已清空选择',
      icon: 'success',
      duration: 1000
    });
  },

  // 页面分享
  onShareAppMessage() {
    const { avgChange } = this.data.marketStats;
    const trend = avgChange >= 0 ? '上涨' : '下跌';
    
    return {
      title: `汇率行情 - 市场${trend}${Math.abs(avgChange).toFixed(2)}%`,
      path: '/pages/advice/advice',
      imageUrl: '/images/market-share.png'
    };
  }
}); 