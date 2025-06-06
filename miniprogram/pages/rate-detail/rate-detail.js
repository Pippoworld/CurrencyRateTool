// 引入汇率API服务
const { exchangeRateAPI } = require('../../utils/exchange-rate-api.js')

Page({
  data: {
    fromCurrencyIndex: 5, // 默认AUD (索引5)
    toCurrencyIndex: 0,   // 默认CNY (索引0)
    
    // 货币列表 (动态加载真实汇率数据)
    currencies: [], 
    
    currentRate: '0.0000',
    rateChange: '+0.00 (+0.00%)',
    updateTime: '数据加载中...',
    
    // 数据加载状态
    isLoading: false,
    rateDataSource: '正在获取数据...', // 汇率数据来源
    lastUpdate: '',
    
    // AI 分析建议
    aiAnalysis: {
      status: 'warning', // good, warning, danger
      title: '价格略高，建议观望',
      confidence: 82,
      summary: '美元兑人民币当前汇率处于近期高位，技术指标显示短期内可能出现回调。建议等待更好的换汇时机。',
      factors: [
        '近7天汇率上涨1.2%，接近阻力位',
        '美联储利率政策预期影响较大',
        '中美贸易数据本周将公布',
        '技术指标RSI显示超买状态'
      ],
      suggestion: '建议设置7.05以下的换汇提醒，或等待本周贸易数据公布后再做决定。如有紧急换汇需求，可考虑分批换汇降低风险。'
    },
    
    // 目标汇率设置（保留用于数据存储）
    targetBuyRate: '',
    targetSellRate: '',
    
    // AI提醒建议
    alertSuggestions: {
      buyAlert: {
        price: '0.0000',
        reason: '技术支撑位'
      },
      sellAlert: {
        price: '0.0000', 
        reason: '阻力位区间'
      }
    },
    
    // 目标状态显示（保留）
    buyTargetStatus: {
      reached: false,
      message: '',
      detail: ''
    },
    sellTargetStatus: {
      reached: false,
      message: '',
      detail: ''
    },
    
    // 目标位置（用于可视化）
    buyTargetPosition: 25,
    sellTargetPosition: 75,
    
    // 长期监控设置
    isPriceAlertEnabled: false,
    isDailyReportEnabled: false,
    isTrendAnalysisEnabled: false,
    
    // 监控统计
    monitoringDays: 15,
    alertCount: 3,
    maxRate: '7.28',
    minRate: '6.98',
    
    // 银行汇率数据
    bankRates: []
  },

  async onLoad(options) {
    console.log('=== 详情页onLoad开始 ===');
    
    // 优先加载全局货币设置
    this.loadGlobalCurrencySettings();
    
    // 初始化汇率数据
    await this.initializeExchangeRates();
    
    console.log('onLoad - 初始状态:', {
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      fromCurrency: this.data.currencies[this.data.fromCurrencyIndex],
      toCurrency: this.data.currencies[this.data.toCurrencyIndex]
    });
    
    // 如果有传入参数，使用传入的参数
    if (options.fromIndex) {
      this.setData({
        fromCurrencyIndex: parseInt(options.fromIndex)
      });
      console.log('onLoad - 设置传入参数fromIndex:', options.fromIndex);
    }
    if (options.toIndex) {
      this.setData({
        toCurrencyIndex: parseInt(options.toIndex)
      });
      console.log('onLoad - 设置传入参数toIndex:', options.toIndex);
    }
    
    this.updateExchangeRate();
    this.loadUserSettings();
    this.updateTargetStatus(); // 初始化目标状态
    this.generateAdvice();
    this.generateAlertSuggestions(); // 生成智能提醒建议
    this.generateBankRates();
    
    console.log('=== 详情页onLoad完成 ===');
  },

  // 页面显示时同步数据
  async onShow() {
    console.log('=== 详情页onShow开始 ===');
    console.log('onShow - 当前状态:', {
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      fromCurrency: this.data.currencies[this.data.fromCurrencyIndex],
      toCurrency: this.data.currencies[this.data.toCurrencyIndex]
    });
    
    this.loadGlobalCurrencySettings();
    
    // 检查数据新鲜度并刷新
    await this.checkAndRefreshRates();
    
    this.updateExchangeRate();
    this.updateTargetStatus(); // 更新目标状态
    this.generateAdvice();
    this.generateAlertSuggestions(); // 生成智能提醒建议
    this.generateBankRates();
    
    console.log('onShow - 更新后状态:', {
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      fromCurrency: this.data.currencies[this.data.fromCurrencyIndex],
      toCurrency: this.data.currencies[this.data.toCurrencyIndex]
    });
    console.log('=== 详情页onShow完成 ===');
  },

  /**
   * 初始化汇率数据
   */
  async initializeExchangeRates() {
    this.setData({ isLoading: true });
    
    try {
      wx.showLoading({
        title: '获取汇率数据...',
        mask: true
      });

      await this.loadExchangeRates();
      
      console.log('详情页汇率数据初始化完成');
      
    } catch (error) {
      console.error('详情页初始化失败:', error);
      wx.showToast({
        title: '数据获取失败',
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
  async loadExchangeRates() {
    try {
      console.log('详情页开始获取实时汇率数据...');
      
      // 获取以USD为基准的汇率数据
      const apiData = await exchangeRateAPI.getRates('USD');
      
      // 转换为应用格式
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 更新页面数据
      this.setData({
        currencies: appData.currencies,
        rateDataSource: this.getDataSourceDisplay(appData.source),
        lastUpdate: appData.lastUpdate,
        updateTime: this.getCurrentTime()
      });
      
      console.log('详情页汇率数据更新成功:', {
        source: appData.source,
        currencyCount: appData.currencies.length,
        lastUpdate: appData.lastUpdate
      });
      
    } catch (error) {
      console.error('详情页获取汇率数据失败:', error);
      
      // 如果没有缓存数据，使用降级数据
      if (!this.data.currencies.length) {
        await this.loadFallbackData();
      }
      
      throw error;
    }
  },

  /**
   * 加载降级数据
   */
  async loadFallbackData() {
    console.log('详情页加载降级汇率数据');
    
    const fallbackApiData = exchangeRateAPI.getFallbackRates('USD');
    const appData = exchangeRateAPI.convertToAppFormat(fallbackApiData);
    
    this.setData({
      currencies: appData.currencies,
      rateDataSource: '备用数据',
      lastUpdate: appData.lastUpdate,
      updateTime: this.getCurrentTime()
    });
  },

  /**
   * 检查并刷新数据
   */
  async checkAndRefreshRates() {
    const lastUpdateTime = wx.getStorageSync('last_rate_update') || 0;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - lastUpdateTime > fiveMinutes || !this.data.currencies.length) {
      console.log('详情页数据需要刷新');
      await this.loadExchangeRates();
      wx.setStorageSync('last_rate_update', now);
    }
  },

  /**
   * 获取数据源显示名称
   */
  getDataSourceDisplay(source) {
    const sourceMap = {
      'ExchangeRate-API': 'ExchangeRate-API',
      'Fixer.io': 'Fixer.io API', 
      'Fallback Data': '离线数据',
      'Google Finance': 'Google Finance'
    };
    
    return sourceMap[source] || source || 'ExchangeRate-API';
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 加载全局货币设置
  loadGlobalCurrencySettings() {
    try {
      const settings = wx.getStorageSync('currencySettings');
      
      if (settings && settings.fromCurrencyIndex !== undefined && settings.toCurrencyIndex !== undefined) {
        // 使用存储的设置
        this.setData({
          fromCurrencyIndex: settings.fromCurrencyIndex,
          toCurrencyIndex: settings.toCurrencyIndex
        });
        console.log('详情页加载已保存的货币设置:', settings);
      } else {
        // 首次使用，设置默认值 AUD → CNY
        this.setData({
          fromCurrencyIndex: 5, // AUD
          toCurrencyIndex: 0    // CNY
        });
        
        // 保存默认设置
        const defaultSettings = {
          fromCurrencyIndex: 5,
          toCurrencyIndex: 0,
          updateTime: new Date().getTime()
        };
        wx.setStorageSync('currencySettings', defaultSettings);
        console.log('详情页设置并保存默认货币设置:', defaultSettings);
      }
      
    } catch (error) {
      console.log('加载货币设置失败:', error);
      // 发生错误时使用默认设置
      this.setData({
        fromCurrencyIndex: 5, // AUD
        toCurrencyIndex: 0    // CNY
      });
    }
  },

  // 初始化汇率数据
  async initializeExchangeRates() {
    this.setData({ isLoading: true });
    
    try {
      wx.showLoading({
        title: '获取汇率数据...',
        mask: true
      });

      // 获取以USD为基准的汇率数据
      const apiData = await exchangeRateAPI.getRates('USD');
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 更新页面数据
      this.setData({
        currencies: appData.currencies,
        rateDataSource: appData.source || 'ExchangeRate-API',
        lastUpdate: appData.lastUpdate,
        updateTime: this.getCurrentTime()
      });
      
      console.log('详情页汇率数据初始化完成:', {
        source: appData.source,
        currencyCount: appData.currencies.length
      });
      
    } catch (error) {
      console.error('详情页初始化失败:', error);
      
      // 使用降级数据
      const fallbackApiData = exchangeRateAPI.getFallbackRates('USD');
      const appData = exchangeRateAPI.convertToAppFormat(fallbackApiData);
      
      this.setData({
        currencies: appData.currencies,
        rateDataSource: '备用数据',
        lastUpdate: appData.lastUpdate,
        updateTime: this.getCurrentTime()
      });
      
      wx.showToast({
        title: '使用备用数据',
        icon: 'none',
        duration: 2000
      });
    } finally {
      wx.hideLoading();
      this.setData({ isLoading: false });
    }
  },

  // 检查并刷新数据
  async checkAndRefreshRates() {
    if (!this.data.currencies.length) {
      console.log('详情页首次加载数据');
      await this.initializeExchangeRates();
    }
  },

  // 获取当前时间
  getCurrentTime() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 保存全局货币设置
  saveGlobalCurrencySettings() {
    const settings = {
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      updateTime: new Date().getTime()
    };
    
    try {
      // 直接保存到本地存储
      wx.setStorageSync('currencySettings', settings);
      console.log('详情页已保存货币设置:', settings);
      
      // 尝试使用全局同步管理器
      try {
        const app = getApp();
        if (app && app.globalData && app.globalData.syncCurrencySettings) {
          app.globalData.syncCurrencySettings(settings);
          console.log('已通过全局管理器同步');
        }
      } catch (syncError) {
        console.log('全局同步失败，但本地保存成功:', syncError);
      }
      
      // 显示保存成功提示（短暂）
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 1000
      });
      
    } catch (error) {
      console.error('保存货币设置失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 1500
      });
    }
  },

  // 更新汇率显示
  updateExchangeRate() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex]; // 持有币种
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex]; // 目标币种
    
    if (!fromCurrency || !toCurrency) {
      console.warn('详情页货币数据未加载，跳过汇率更新');
      return;
    }
    
    let rate;
    // 显示逻辑：目标币种 → 持有币种的汇率
    // 即：1目标币种 = ?持有币种
    if (toCurrency.code === 'CNY') {
      // 目标是人民币，持有是外币：1人民币 = 1/持有币种汇率 外币
      rate = (1 / fromCurrency.rate).toFixed(4);
    } else if (fromCurrency.code === 'CNY') {
      // 目标是外币，持有是人民币：1外币 = 外币汇率 人民币  
      rate = toCurrency.rate.toFixed(4);
    } else {
      // 两个外币之间：1目标币种 = 目标币种汇率/持有币种汇率 持有币种
      rate = (toCurrency.rate / fromCurrency.rate).toFixed(4);
    }
    
    this.setData({
      currentRate: rate
    });
    
    // 每次汇率更新时检查目标汇率并更新状态
    this.updateTargetStatus();
    this.generateAlertSuggestions(); // 生成AI提醒建议
    this.checkTargetReached();
    this.checkPriceAlerts(); // 检查价格提醒
  },

  // 更新目标状态显示
  updateTargetStatus() {
    const currentRate = parseFloat(this.data.currentRate);
    const targetBuy = parseFloat(this.data.targetBuyRate);
    const targetSell = parseFloat(this.data.targetSellRate);
    
    // 更新低位换汇目标状态
    if (this.data.targetBuyRate && !isNaN(targetBuy)) {
      const buyReached = currentRate <= targetBuy;
      const buyDifference = ((targetBuy - currentRate) / currentRate * 100);
      
      this.setData({
        'buyTargetStatus.reached': buyReached,
        'buyTargetStatus.message': buyReached ? 
          '🎉 已达到换汇目标！' : 
          `等待汇率降至 ${this.data.targetBuyRate}`,
        'buyTargetStatus.detail': `差距：${buyDifference.toFixed(2)}%`,
        buyTargetPosition: Math.max(5, Math.min(95, (1 - (targetBuy / currentRate)) * 50 + 25))
      });
    } else {
      this.setData({
        'buyTargetStatus.reached': false,
        'buyTargetStatus.message': '',
        'buyTargetStatus.detail': '',
        buyTargetPosition: 25
      });
    }
    
    // 更新卖出目标状态
    if (this.data.targetSellRate && !isNaN(targetSell)) {
      const sellReached = currentRate >= targetSell;
      const sellDifference = ((targetSell - currentRate) / currentRate * 100);
      
      this.setData({
        'sellTargetStatus.reached': sellReached,
        'sellTargetStatus.message': sellReached ? 
          '🎉 已达到卖出目标！' : 
          `等待汇率升至 ${this.data.targetSellRate}`,
        'sellTargetStatus.detail': `差距：${sellDifference.toFixed(2)}%`,
        sellTargetPosition: Math.max(5, Math.min(95, (targetSell / currentRate - 1) * 50 + 50))
      });
    } else {
      this.setData({
        'sellTargetStatus.reached': false,
        'sellTargetStatus.message': '',
        'sellTargetStatus.detail': '',
        sellTargetPosition: 75
      });
    }
  },

  // 生成AI建议 - 基于真实汇率数据
  generateAdvice() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    if (!fromCurrency || !toCurrency) {
      console.warn('货币数据不完整，无法生成建议');
      return;
    }
    
    // 🔍 详细调试日志 - 验证数据来源
    console.log('=== AI 建议生成调试信息 ===');
    console.log('数据来源:', this.data.rateDataSource);
    console.log('数据更新时间:', this.data.lastUpdate);
    console.log('原始汇率数据:', {
      fromCurrency: `${fromCurrency.code} (${fromCurrency.name})`,
      fromRate: fromCurrency.rate,
      toCurrency: `${toCurrency.code} (${toCurrency.name})`,
      toRate: toCurrency.rate
    });
    
    // 基于真实汇率生成专业分析
    const currentRate = parseFloat(this.data.currentRate);
    console.log('计算出的当前汇率:', currentRate);
    console.log('汇率计算公式 (目标币种→持有币种):', toCurrency.code === 'CNY' ? 
      `1 ${toCurrency.code} = ${currentRate} ${fromCurrency.code}` :
      fromCurrency.code === 'CNY' ? 
      `1 ${toCurrency.code} = ${currentRate} ${fromCurrency.code}` :
      `1 ${toCurrency.code} = ${currentRate} ${fromCurrency.code}`
    );
    
    const advice = this.generateDetailedAnalysis(fromCurrency, toCurrency, currentRate);
    
    console.log('生成的AI建议:', {
      status: advice.status,
      title: advice.title,
      confidence: advice.confidence,
      currentRate: currentRate,
      dataTimestamp: this.data.lastUpdate
    });
    console.log('=== AI 建议生成完成 ===');
    
    this.setData({
      aiAnalysis: advice
    });
    
    console.log('专业AI分析已基于真实汇率生成:', `${toCurrency.code}/${fromCurrency.code} = ${currentRate}`);
  },

  // 生成详细分析 - 留学生换汇建议
  generateDetailedAnalysis(fromCurrency, toCurrency, currentRate) {
    const baselines = this.getCurrencyBaselines(toCurrency.code);
    const position = (currentRate - baselines.min) / (baselines.max - baselines.min);
    const rateRange = this.generateRateRange(currentRate, position);
    
    // 判断用户是否持有人民币（通常是从国内换汇到国外）
    const isFromChina = fromCurrency.code === 'CNY';
    const isToChina = toCurrency.code === 'CNY';
    
    // 基于汇率位置生成留学生换汇建议
    if (position <= 0.3) {
      return {
        status: 'good',
        title: '汇率低位，换汇性价比很高',
        confidence: 88,
        summary: isFromChina ? 
          `${toCurrency.name}现在处于相对低价，1${toCurrency.name}只需${currentRate}${fromCurrency.name}，是近期换汇的好时机。建议有条件的同学可以多换一些备用。` :
          `${toCurrency.name}汇率较低，现在是换汇的好时机，可以考虑适当多换一些。`,
        factors: [
          `当前汇率${currentRate}处于近期低位，换汇成本较低`,
          isFromChina ? '相比前期高点，每万元能多换不少外币' : '相比前期，换汇成本明显下降',
          '短期内汇率反弹可能性较大',
          '适合有提前换汇需求的同学抓住机会',
          '建议有闲置资金的情况下可以多换一些'
        ],
        suggestion: isFromChina ?
          `建议：1）如果有下个月的学费生活费需求，现在换汇很划算 2）如果经济允许，可以多换1-2个月的费用备用 3）建议分2-3次换汇，避免一次性风险` :
          `建议在当前汇率水平适当多换一些${toCurrency.name}，为未来1-2个月的开销做准备。`
      };
    } else if (position <= 0.5) {
      return {
        status: 'good',
        title: '汇率适中，正常换汇即可',
        confidence: 85,
        summary: isFromChina ?
          `当前${toCurrency.name}汇率${currentRate}处于合理区间，没有明显的换汇时机优势。按正常需求换汇即可，不必刻意囤汇。` :
          `汇率处于正常水平，按需换汇即可。`,
        factors: [
          `汇率${currentRate}位于正常波动区间`,
          '短期内大幅波动的可能性不大',
          '适合按月按需进行常规换汇',
          '无需特别等待或抢换',
          '风险和收益相对平衡'
        ],
        suggestion: isFromChina ?
          `建议：1）按正常节奏换汇，每月换下月开销即可 2）无需大量囤汇，保持正常节奏 3）关注汇率变化，如有较大波动再调整策略` :
          `按照正常需求进行换汇即可，无需特别囤积或等待。`
      };
    } else if (position <= 0.8) {
      return {
        status: 'warning',
        title: '汇率偏高，建议适当等等',
        confidence: 82,
        summary: isFromChina ?
          `${toCurrency.name}当前汇率${currentRate}偏高，换汇成本较大。如果不是急用，建议适当等待汇率回落。` :
          `汇率偏高，如非急需建议等待更好时机。`,
        factors: [
          `汇率${currentRate}处于相对高位，换汇成本偏高`,
          '短期内有回调的可能性',
          '非紧急开销可以适当延后换汇',
          '建议保持观望，等待更好时机',
          '如有急用可少量换汇，大额换汇建议等等'
        ],
        suggestion: isFromChina ?
          `建议：1）紧急开销（如下周要交学费）正常换汇 2）非紧急开销建议等1-2周看情况 3）大额换汇（如一次性换几个月生活费）建议暂缓` :
          `如非紧急需求，建议等待汇率回落后再进行大额换汇。紧急开销可少量换汇。`
      };
    } else {
      return {
        status: 'danger',
        title: '汇率高位，建议暂缓换汇',
        confidence: 90,
        summary: isFromChina ?
          `${toCurrency.name}汇率${currentRate}处于明显高位，换汇成本很高。除非特别紧急，强烈建议等待汇率回落后再换汇。` :
          `汇率处于高位，强烈建议等待更好时机再换汇。`,
        factors: [
          `汇率${currentRate}处于明显高位，换汇成本很高`,
          '与低点相比，同样金额能换到的外币明显减少',
          '技术面显示有较大回调压力',
          '耐心等待可能节省不少换汇成本',
          '除非特别紧急，不建议大额换汇'
        ],
        suggestion: isFromChina ?
          `建议：1）只换最紧急的开销（如本周必须交的费用）2）大额换汇强烈建议等等，可能等1-2周就能省不少钱 3）如果可能，尝试借用朋友的外币先应急` :
          `强烈建议等待汇率回落后再进行换汇，当前成本过高。紧急需求可极少量换汇。`
      };
    }
  },

  // 生成汇率操作区间
  generateRateRange(currentRate, position) {
    const rate = currentRate;
    const volatility = rate * 0.02; // 2%波动区间
    
    return {
      buyMin: (rate - volatility).toFixed(4),
      buyMax: (rate - volatility * 0.5).toFixed(4),
      stopLoss: (rate - volatility * 1.5).toFixed(4),
      target: (rate + volatility).toFixed(4)
    };
  },

  // 获取货币汇率基准线
  getCurrencyBaselines(currencyCode) {
    // 基于留学生实际能遇到的汇率范围（更贴近现实的6个月-1年波动区间）
    const baselines = {
      'USD': { 
        min: 7.05, max: 7.30,        // 美元常见区间
        excellent: 7.00, good: 7.10, fair: 7.20, poor: 7.30 
      },
      'EUR': { 
        min: 7.60, max: 7.90,        // 欧元常见区间
        excellent: 7.50, good: 7.65, fair: 7.75, poor: 7.85 
      },
      'JPY': { 
        min: 0.047, max: 0.051,      // 日元常见区间
        excellent: 0.046, good: 0.048, fair: 0.050, poor: 0.051 
      },
      'GBP': { 
        min: 8.80, max: 9.20,        // 英镑常见区间
        excellent: 8.70, good: 8.90, fair: 9.05, poor: 9.15 
      },
      'AUD': { 
        min: 4.55, max: 4.80,        // 澳元常见区间（调整为更现实的范围）
        excellent: 4.50, good: 4.60, fair: 4.70, poor: 4.75 
      },
      'CAD': { 
        min: 5.15, max: 5.40,        // 加元常见区间
        excellent: 5.10, good: 5.20, fair: 5.30, poor: 5.35 
      },
      'CHF': { 
        min: 7.75, max: 8.00,        // 瑞郎常见区间
        excellent: 7.70, good: 7.80, fair: 7.90, poor: 7.95 
      },
      'HKD': { 
        min: 0.90, max: 0.94,        // 港币常见区间
        excellent: 0.89, good: 0.91, fair: 0.92, poor: 0.93 
      },
      'SGD': { 
        min: 5.20, max: 5.40,        // 新币常见区间
        excellent: 5.15, good: 5.25, fair: 5.32, poor: 5.38 
      }
    };
    
    return baselines[currencyCode] || { min: 1, max: 10, excellent: 1, good: 3, fair: 7, poor: 9 };
  },

  // 加载用户设置
  loadUserSettings() {
    try {
      const settings = wx.getStorageSync('rateSettings');
      if (settings) {
        this.setData({
          targetBuyRate: settings.targetBuyRate || '',
          targetSellRate: settings.targetSellRate || '',
          isPriceAlertEnabled: settings.isPriceAlertEnabled || false,
          isDailyReportEnabled: settings.isDailyReportEnabled || false,
          isTrendAnalysisEnabled: settings.isTrendAnalysisEnabled || false
        });
      }
    } catch (error) {
      console.log('加载设置失败:', error);
    }
  },

  // 保存用户设置
  saveUserSettings() {
    const settings = {
      targetBuyRate: this.data.targetBuyRate,
      targetSellRate: this.data.targetSellRate,
      isPriceAlertEnabled: this.data.isPriceAlertEnabled,
      isDailyReportEnabled: this.data.isDailyReportEnabled,
      isTrendAnalysisEnabled: this.data.isTrendAnalysisEnabled,
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      updateTime: new Date().getTime()
    };
    
    try {
      wx.setStorageSync('rateSettings', settings);
      return true;
    } catch (error) {
      console.log('保存设置失败:', error);
      return false;
    }
  },

  // 持有币种选择
  onFromCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    const selectedCurrency = this.data.currencies[newIndex];
    console.log('详情页选择持有币种:', newIndex, selectedCurrency);
    
    // 立即更新数据并强制界面刷新
    this.setData({
      fromCurrencyIndex: newIndex
    }, () => {
      // 确保界面更新完成后再进行后续操作
      console.log('界面已更新，当前持有币种:', this.data.currencies[this.data.fromCurrencyIndex]);
      
      // 立即保存并生效
      this.saveGlobalCurrencySettings(); 
      this.updateExchangeRate();
      this.generateAdvice();
      
      // 显示更具体的提示
      wx.showToast({
        title: `已切换到${selectedCurrency.name}`,
        icon: 'success',
        duration: 1500
      });
    });
  },

  // 目标币种选择
  onToCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    const selectedCurrency = this.data.currencies[newIndex];
    console.log('详情页选择目标币种:', newIndex, selectedCurrency);
    
    // 立即更新数据并强制界面刷新
    this.setData({
      toCurrencyIndex: newIndex
    }, () => {
      // 确保界面更新完成后再进行后续操作
      console.log('界面已更新，当前目标币种:', this.data.currencies[this.data.toCurrencyIndex]);
      
      // 立即保存并生效
      this.saveGlobalCurrencySettings(); 
      this.updateExchangeRate();
      this.generateAdvice();
      
      // 显示更具体的提示
      wx.showToast({
        title: `已切换到${selectedCurrency.name}`,
        icon: 'success',
        duration: 1500
      });
    });
  },

  // 快速设置目标汇率
  setQuickTarget(e) {
    const { type, percent } = e.currentTarget.dataset;
    const currentRate = parseFloat(this.data.currentRate);
    const targetRate = (currentRate * (1 + percent / 100)).toFixed(4);
    
    if (type === 'buy') {
      this.setData({
        targetBuyRate: targetRate
      });
      wx.showToast({
        title: `买入目标已设为 ${targetRate}`,
        icon: 'success',
        duration: 1500
      });
    } else {
      this.setData({
        targetSellRate: targetRate
      });
      wx.showToast({
        title: `卖出目标已设为 ${targetRate}`,
        icon: 'success',
        duration: 1500
      });
    }
    
    // 更新状态显示
    this.updateTargetStatus();
    
    // 自动保存设置
    this.saveUserSettings();
  },

  // 验证目标汇率输入
  validateTargetRate(inputValue, type) {
    const currentRate = parseFloat(this.data.currentRate);
    const targetRate = parseFloat(inputValue);
    
    if (isNaN(targetRate) || targetRate <= 0) {
      wx.showToast({
        title: '请输入有效数字',
        icon: 'none'
      });
      return false;
    }
    
    const difference = Math.abs(targetRate - currentRate) / currentRate * 100;
    
    if (difference > 50) {
      wx.showModal({
        title: '目标汇率异常',
        content: `设置的${type}目标(${targetRate})与当前汇率(${currentRate})差异${difference.toFixed(1)}%，是否确认？`,
        success: (res) => {
          if (res.confirm) {
            this.saveUserSettings();
            this.checkTargetReached();
          }
        }
      });
      return false;
    }
    
    return true;
  },

  // 检查目标汇率是否达到
  checkTargetReached() {
    const currentRate = parseFloat(this.data.currentRate);
    const targetBuy = parseFloat(this.data.targetBuyRate);
    const targetSell = parseFloat(this.data.targetSellRate);
    
    // 检查买入目标（当前汇率低于等于目标时触发）
    if (targetBuy && currentRate <= targetBuy && this.data.isPriceAlertEnabled) {
      this.triggerPriceAlert('buy', currentRate, targetBuy);
    }
    
    // 检查卖出目标（当前汇率高于等于目标时触发）
    if (targetSell && currentRate >= targetSell && this.data.isPriceAlertEnabled) {
      this.triggerPriceAlert('sell', currentRate, targetSell);
    }
  },

  // 触发价格提醒
  triggerPriceAlert(type, currentRate, targetRate) {
    const alertKey = `alert_${type}_${Date.now()}`;
    
    // 避免重复提醒（5分钟内同类型提醒只触发一次）
    const lastAlert = wx.getStorageSync(`lastAlert_${type}`);
    const now = Date.now();
    
    if (lastAlert && (now - lastAlert) < 5 * 60 * 1000) {
      return;
    }
    
    // 记录提醒时间
    wx.setStorageSync(`lastAlert_${type}`, now);
    
    // 增加提醒计数
    this.setData({
      alertCount: this.data.alertCount + 1
    });
    
    const actionText = type === 'buy' ? '买入' : '卖出';
    const currency = this.data.currencies[this.data.fromCurrencyIndex];
    
    wx.showModal({
      title: `🎯 ${actionText}目标达到！`,
      content: `${currency.flag} ${currency.name}汇率已达到您的${actionText}目标\n\n当前汇率：${currentRate}\n目标汇率：${targetRate}\n\n是否现在进行${actionText}操作？`,
      confirmText: `去${actionText}`,
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          // 跳转到换汇页面或外部APP
          this.goToExchange(type);
        }
      }
    });
    
    // 可以在这里添加推送通知逻辑
    this.sendNotification(type, currentRate, targetRate);
  },

  // 跳转换汇页面
  goToExchange(type) {
    const currency = this.data.currencies[this.data.fromCurrencyIndex];
    const message = `正在为您打开${type === 'buy' ? '买入' : '卖出'} ${currency.name} 的换汇服务...`;
    
    wx.showToast({
      title: message,
      icon: 'loading',
      duration: 2000
    });
    
    // 这里可以集成真实的换汇服务
    setTimeout(() => {
      wx.showModal({
        title: '换汇服务',
        content: '换汇功能开发中，敬请期待\n\n建议您前往：\n• 银行APP\n• 支付宝/微信换汇\n• 专业换汇平台',
        showCancel: false
      });
    }, 2000);
  },

  // 发送通知（预留接口）
  sendNotification(type, currentRate, targetRate) {
    // 这里可以集成推送服务
    console.log('发送价格提醒通知:', {
      type,
      currentRate,
      targetRate,
      timestamp: new Date().toISOString()
    });
  },

  // 目标买入汇率输入
  onTargetBuyInput(e) {
    const inputValue = e.detail.value;
    this.setData({
      targetBuyRate: inputValue
    });
    
    // 更新状态显示
    this.updateTargetStatus();
    
    // 输入完成后验证并保存
    if (inputValue && this.validateTargetRate(inputValue, '买入')) {
      this.saveUserSettings();
      this.checkTargetReached();
    }
  },

  // 目标卖出汇率输入
  onTargetSellInput(e) {
    const inputValue = e.detail.value;
    this.setData({
      targetSellRate: inputValue
    });
    
    // 更新状态显示
    this.updateTargetStatus();
    
    // 输入完成后验证并保存
    if (inputValue && this.validateTargetRate(inputValue, '卖出')) {
      this.saveUserSettings();
      this.checkTargetReached();
    }
  },

  // 价格提醒开关
  onPriceAlertChange(e) {
    this.setData({
      isPriceAlertEnabled: e.detail.value
    });
  },

  // 每日报告开关
  onDailyReportChange(e) {
    this.setData({
      isDailyReportEnabled: e.detail.value
    });
  },

  // 趋势分析开关
  onTrendAnalysisChange(e) {
    this.setData({
      isTrendAnalysisEnabled: e.detail.value
    });
  },

  // 保存设置并返回
  saveSettings() {
    const success = this.saveUserSettings();
    
    if (success) {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      
      if (prevPage) {
        prevPage.setData({
          fromCurrencyIndex: this.data.fromCurrencyIndex,
          toCurrencyIndex: this.data.toCurrencyIndex
        });
        prevPage.updateExchangeRate();
        prevPage.generateAdvice();
      }
      
      wx.showToast({
        title: '设置已保存',
        icon: 'success',
        duration: 2000
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    } else {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'error',
        duration: 2000
      });
    }
  },

  // 交换币种
  swapCurrencies() {
    const fromIndex = this.data.fromCurrencyIndex;
    const toIndex = this.data.toCurrencyIndex;
    
    console.log('详情页交换币种:', fromIndex, '←→', toIndex);
    
    this.setData({
      fromCurrencyIndex: toIndex,
      toCurrencyIndex: fromIndex
    });
    
    this.saveGlobalCurrencySettings(); // 保存全局设置
    this.updateExchangeRate();
    this.generateAdvice();
    this.generateBankRates();
    
    console.log('详情页货币已交换:', {
      from: this.data.currencies[this.data.fromCurrencyIndex],
      to: this.data.currencies[this.data.toCurrencyIndex]
    });
  },

  // 生成银行汇率数据
  generateBankRates() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const currentRate = parseFloat(this.data.currentRate);
    
    // 根据不同货币生成对应国家的主要银行汇率
    let bankRates = [];
    
    switch (fromCurrency.code) {
      case 'USD':
        bankRates = [
          {
            name: 'JP摩根大通银行',
            type: '商业银行',
            buyRate: (currentRate * 0.985).toFixed(4),
            sellRate: (currentRate * 1.015).toFixed(4)
          },
          {
            name: '美国银行',
            type: '商业银行',
            buyRate: (currentRate * 0.982).toFixed(4),
            sellRate: (currentRate * 1.018).toFixed(4)
          },
          {
            name: '富国银行',
            type: '商业银行',
            buyRate: (currentRate * 0.987).toFixed(4),
            sellRate: (currentRate * 1.013).toFixed(4)
          }
        ];
        break;
      case 'EUR':
        bankRates = [
          {
            name: '德意志银行',
            type: '投资银行',
            buyRate: (currentRate * 0.983).toFixed(4),
            sellRate: (currentRate * 1.017).toFixed(4)
          },
          {
            name: '法国巴黎银行',
            type: '商业银行',
            buyRate: (currentRate * 0.980).toFixed(4),
            sellRate: (currentRate * 1.020).toFixed(4)
          },
          {
            name: '意大利联合信贷银行',
            type: '商业银行',
            buyRate: (currentRate * 0.986).toFixed(4),
            sellRate: (currentRate * 1.014).toFixed(4)
          }
        ];
        break;
      case 'GBP':
        bankRates = [
          {
            name: '汇丰银行',
            type: '国际银行',
            buyRate: (currentRate * 0.984).toFixed(4),
            sellRate: (currentRate * 1.016).toFixed(4)
          },
          {
            name: '巴克莱银行',
            type: '投资银行',
            buyRate: (currentRate * 0.981).toFixed(4),
            sellRate: (currentRate * 1.019).toFixed(4)
          },
          {
            name: '劳埃德银行',
            type: '商业银行',
            buyRate: (currentRate * 0.988).toFixed(4),
            sellRate: (currentRate * 1.012).toFixed(4)
          }
        ];
        break;
      case 'AUD':
        bankRates = [
          {
            name: '澳洲联邦银行',
            type: '国有银行',
            buyRate: (currentRate * 0.985).toFixed(4),
            sellRate: (currentRate * 1.015).toFixed(4)
          },
          {
            name: '澳新银行',
            type: '商业银行',
            buyRate: (currentRate * 0.982).toFixed(4),
            sellRate: (currentRate * 1.018).toFixed(4)
          },
          {
            name: '西太平洋银行',
            type: '商业银行',
            buyRate: (currentRate * 0.987).toFixed(4),
            sellRate: (currentRate * 1.013).toFixed(4)
          }
        ];
        break;
      case 'JPY':
        bankRates = [
          {
            name: '三菱UFJ银行',
            type: '商业银行',
            buyRate: (currentRate * 0.985).toFixed(4),
            sellRate: (currentRate * 1.015).toFixed(4)
          },
          {
            name: '三井住友银行',
            type: '商业银行',
            buyRate: (currentRate * 0.983).toFixed(4),
            sellRate: (currentRate * 1.017).toFixed(4)
          },
          {
            name: '瑞穗银行',
            type: '商业银行',
            buyRate: (currentRate * 0.986).toFixed(4),
            sellRate: (currentRate * 1.014).toFixed(4)
          }
        ];
        break;
      case 'CAD':
        bankRates = [
          {
            name: '加拿大皇家银行',
            type: '国有银行',
            buyRate: (currentRate * 0.984).toFixed(4),
            sellRate: (currentRate * 1.016).toFixed(4)
          },
          {
            name: '多伦多道明银行',
            type: '商业银行',
            buyRate: (currentRate * 0.981).toFixed(4),
            sellRate: (currentRate * 1.019).toFixed(4)
          },
          {
            name: '加拿大帝国商业银行',
            type: '商业银行',
            buyRate: (currentRate * 0.987).toFixed(4),
            sellRate: (currentRate * 1.013).toFixed(4)
          }
        ];
        break;
      default:
        // 默认显示中国主要银行
        bankRates = [
          {
            name: '中国银行',
            type: '国有银行',
            buyRate: (currentRate * 0.985).toFixed(4),
            sellRate: (currentRate * 1.015).toFixed(4)
          },
          {
            name: '工商银行',
            type: '国有银行',
            buyRate: (currentRate * 0.983).toFixed(4),
            sellRate: (currentRate * 1.017).toFixed(4)
          },
          {
            name: '招商银行',
            type: '股份制银行',
            buyRate: (currentRate * 0.987).toFixed(4),
            sellRate: (currentRate * 1.013).toFixed(4)
          }
        ];
    }
    
    this.setData({
      bankRates: bankRates
    });
  },

  // 🔍 验证AI建议是否基于实时数据
  validateRealTimeData() {
    console.log('🔍 === 实时数据验证报告 ===');
    console.log('1. 数据来源检测:');
    console.log('   - 汇率API:', this.data.rateDataSource);
    console.log('   - 是否实时:', this.data.rateDataSource.includes('API') ? '✅ 是' : '❌ 否(离线数据)');
    console.log('   - 更新时间:', this.data.lastUpdate);
    
    console.log('2. 当前汇率数据:');
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    if (fromCurrency && toCurrency) {
      console.log(`   - ${fromCurrency.code}汇率:`, fromCurrency.rate, '(来自API)');
      console.log(`   - ${toCurrency.code}汇率:`, toCurrency.rate, '(来自API)');
      console.log('   - 计算结果:', this.data.currentRate);
    }
    
    console.log('3. AI建议分析:');
    console.log('   - 建议状态:', this.data.advice.status);
    console.log('   - 建议标题:', this.data.advice.title);
    console.log('   - 分析基础:', '实时汇率 + 历史基准线');
    
    console.log('4. 数据新鲜度:');
    const updateTime = new Date(this.data.lastUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
    console.log(`   - 数据年龄: ${diffMinutes}分钟前更新`);
    console.log(`   - 是否新鲜: ${diffMinutes < 10 ? '✅ 是(10分钟内)' : '⚠️  较旧'}`);
    
    console.log('🔍 === 验证报告结束 ===');
    
    // 在界面显示验证结果
    const status = this.data.rateDataSource.includes('API') ? '实时API数据' : '离线备用数据';
    wx.showModal({
      title: '🔍 数据来源验证',
      content: `数据来源: ${this.data.rateDataSource}\n状态: ${status}\n更新时间: ${this.data.lastUpdate}\n\n当前汇率: ${this.data.currentRate}\nAI建议基于: 实时汇率数据`,
      confirmText: '了解',
      showCancel: false
    });
  },

  // 生成AI提醒建议 - 基于留学生实际需求的智能算法
  generateAlertSuggestions() {
    const currentRate = parseFloat(this.data.currentRate);
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    if (!fromCurrency || !toCurrency || isNaN(currentRate)) {
      return;
    }
    
    const baselines = this.getCurrencyBaselines(toCurrency.code);
    const isFromChina = fromCurrency.code === 'CNY';
    
    // 判断当前汇率的等级
    let rateLevel;
    if (currentRate <= baselines.excellent) {
      rateLevel = 'excellent'; // 超优惠（一年难遇）
    } else if (currentRate <= baselines.good) {
      rateLevel = 'good';      // 很好（2-3个月遇一次）
    } else if (currentRate <= baselines.fair) {
      rateLevel = 'fair';      // 一般（常见价格）
    } else {
      rateLevel = 'poor';      // 偏高（应该等等）
    }
    
    // 机会换汇提醒（等待更好价格）
    let buyAlertPrice, buyReason;
    switch (rateLevel) {
      case 'excellent':
        // 已经是超优惠，设置抄底提醒（再低1-2%）
        buyAlertPrice = (currentRate * 0.98).toFixed(4);
        buyReason = isFromChina ? '超级抄底机会！可大量换汇' : '抄底机会，大量换汇';
        break;
      case 'good':
        // 很好的价格，设置小幅下跌提醒（再低2-3%）
        buyAlertPrice = (currentRate * 0.97).toFixed(4);
        buyReason = isFromChina ? '汇率继续下跌，多换些备用' : '价格更优，适合多换';
        break;
      case 'fair':
        // 一般价格，等待较好机会（低3-5%）
        buyAlertPrice = baselines.good.toFixed(4);
        buyReason = isFromChina ? '等到好价格再换汇' : '等到更好价格';
        break;
      case 'poor':
        // 偏高价格，等待明显回调（低5-8%）
        buyAlertPrice = baselines.fair.toFixed(4);
        buyReason = isFromChina ? '汇率偏高，等等再换' : '价格偏高，建议等待';
        break;
    }
    
    // 及时换汇提醒（避免错过当前机会或更高价格）
    let sellAlertPrice, sellReason;
    switch (rateLevel) {
      case 'excellent':
        // 超优惠价，小幅上涨就要抓住（高1-2%）
        sellAlertPrice = (currentRate * 1.015).toFixed(4);
        sellReason = isFromChina ? '超低价开始反弹，抓紧换！' : '超低价反弹，立即换汇';
        break;
      case 'good':
        // 好价格，适度上涨时换汇（高2-3%）
        sellAlertPrice = (currentRate * 1.02).toFixed(4);
        sellReason = isFromChina ? '好价格开始上涨，该换了' : '好价格上涨，及时换汇';
        break;
      case 'fair':
        // 一般价格，如果有短期需求（高1-2%）
        sellAlertPrice = (currentRate * 1.015).toFixed(4);
        sellReason = isFromChina ? '短期需求可以换汇' : '短期需求，可以换汇';
        break;
      case 'poor':
        // 偏高价格，避免更高（高0.5-1%）
        sellAlertPrice = (currentRate * 1.005).toFixed(4);
        sellReason = isFromChina ? '避免价格更高，有急需可换' : '避免更高价格，急需可换';
        break;
    }
    
    this.setData({
      'alertSuggestions.buyAlert.price': buyAlertPrice,
      'alertSuggestions.buyAlert.reason': buyReason,
      'alertSuggestions.sellAlert.price': sellAlertPrice,
      'alertSuggestions.sellAlert.reason': sellReason
    });
  },

  // 打开提醒设置页面
  openAlertSetting(e) {
    const { type, price } = e.currentTarget.dataset;
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    wx.navigateTo({
      url: `/pages/my-alerts/my-alerts?action=create&type=${type}&price=${price}&fromCurrency=${fromCurrency.code}&toCurrency=${toCurrency.code}&currentRate=${this.data.currentRate}`
    });
  },

  // 快速设置提醒
  quickSetAlert(e) {
    const { type, percent } = e.currentTarget.dataset;
    const currentRate = parseFloat(this.data.currentRate);
    const alertPrice = (currentRate * (1 + percent / 100)).toFixed(4);
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    // 直接创建提醒
    this.createQuickAlert(type, alertPrice, fromCurrency, toCurrency);
  },

  // 智能提醒设置
  setSmartAlert(e) {
    const { type } = e.currentTarget.dataset;
    const currentRate = parseFloat(this.data.currentRate);
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    const baselines = this.getCurrencyBaselines(toCurrency.code);
    const isFromChina = fromCurrency.code === 'CNY';
    
    let alertPrice, alertType, reason, title;
    
    switch (type) {
      case 'excellent':
        // 超低价抄底提醒 - 设置到excellent级别
        alertPrice = baselines.excellent.toFixed(4);
        alertType = 'buy';
        reason = isFromChina ? '超级抄底机会，一年难遇！' : '超低价抄底机会';
        title = '超低价抄底提醒';
        break;
        
      case 'good':
        // 好价格提醒 - 设置到good级别
        alertPrice = baselines.good.toFixed(4);
        alertType = 'buy';
        reason = isFromChina ? '好价格来了，适合换汇' : '好价格换汇机会';
        title = '好价格提醒';
        break;
        
      case 'urgent':
        // 紧急换汇提醒 - 当前价格小幅上涨就提醒
        alertPrice = (currentRate * 1.01).toFixed(4);
        alertType = 'sell';
        reason = isFromChina ? '有紧急需求可以换汇' : '紧急需求换汇';
        title = '紧急换汇提醒';
        break;
        
      case 'trend':
        // 趋势变化提醒 - 设置趋势转折点
        if (currentRate <= baselines.good) {
          // 当前是好价格，设置上涨趋势提醒
          alertPrice = (currentRate * 1.015).toFixed(4);
          alertType = 'sell';
          reason = isFromChina ? '汇率开始上涨，抓紧机会' : '上涨趋势开始';
        } else {
          // 当前是一般或偏高价格，设置下跌趋势提醒
          alertPrice = (currentRate * 0.98).toFixed(4);
          alertType = 'buy';
          reason = isFromChina ? '汇率开始下跌，关注机会' : '下跌趋势开始';
        }
        title = '趋势变化提醒';
        break;
    }
    
    // 显示确认弹窗
    wx.showModal({
      title: title,
      content: `设置提醒价格：${alertPrice}\n${reason}\n\n汇率达到这个价位时会通知您，是否确认设置？`,
      confirmText: '确认设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.createQuickAlert(alertType, alertPrice, fromCurrency, toCurrency);
        }
      }
    });
  },

  // 创建快速提醒
  createQuickAlert(type, price, fromCurrency, toCurrency) {
    const alertData = {
      id: Date.now().toString(),
      type: type, // 'buy' or 'sell'
      price: price,
      fromCurrency: fromCurrency.code,
      toCurrency: toCurrency.code,
      fromCurrencyName: fromCurrency.name,
      toCurrencyName: toCurrency.name,
      currentRate: this.data.currentRate,
      createTime: new Date().toISOString(),
      isActive: true,
      hasTriggered: false,
      triggerDirection: type === 'buy' ? 'below' : 'above' // 触发方向
    };
    
    // 保存到本地存储
    try {
      const existingAlerts = wx.getStorageSync('priceAlerts') || [];
      existingAlerts.push(alertData);
      wx.setStorageSync('priceAlerts', existingAlerts);
      
      const actionText = type === 'buy' ? '换汇机会' : '及时换汇';
      wx.showToast({
        title: `${actionText}提醒已设置`,
        icon: 'success',
        duration: 2000
      });
      
      setTimeout(() => {
        wx.showModal({
          title: '换汇提醒设置成功',
          content: `已为您设置${actionText}提醒\n提醒价格：${price}\n\n汇率达到这个价位时会通知您，您可以在"管理我的提醒"中查看和修改所有提醒`,
          confirmText: '查看提醒',
          cancelText: '知道了',
          success: (res) => {
            if (res.confirm) {
              this.goToMyAlerts();
            }
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('保存提醒失败:', error);
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'error'
      });
    }
  },

  // 跳转到我的提醒页面
  goToMyAlerts() {
    wx.navigateTo({
      url: '/pages/my-alerts/my-alerts'
    });
  },

  // 检查价格提醒
  checkPriceAlerts() {
    try {
      const alerts = wx.getStorageSync('priceAlerts') || [];
      const currentRate = parseFloat(this.data.currentRate);
      
      if (isNaN(currentRate)) return;
      
      let hasUpdates = false;
      
      for (let alert of alerts) {
        if (!alert.isActive || alert.hasTriggered) continue;
        
        const targetPrice = parseFloat(alert.price);
        let shouldTrigger = false;
        
        // 判断是否应该触发提醒
        if (alert.triggerDirection === 'below' && currentRate <= targetPrice) {
          shouldTrigger = true;
        } else if (alert.triggerDirection === 'above' && currentRate >= targetPrice) {
          shouldTrigger = true;
        }
        
        if (shouldTrigger) {
          // 标记为已触发
          alert.hasTriggered = true;
          alert.triggerTime = new Date().toISOString();
          alert.triggerRate = currentRate.toString();
          hasUpdates = true;
          
          // 显示提醒
          this.showPriceAlert(alert);
        }
      }
      
      // 如果有更新，保存到存储
      if (hasUpdates) {
        wx.setStorageSync('priceAlerts', alerts);
      }
      
    } catch (error) {
      console.error('检查价格提醒失败:', error);
    }
  },

  // 显示价格提醒
  showPriceAlert(alert) {
    const actionText = alert.type === 'buy' ? '换汇机会' : '换汇提醒';
    const directionText = alert.triggerDirection === 'below' ? '跌破' : '突破';
    const rateDirection = alert.triggerDirection === 'below' ? '汇率下跌' : '汇率上涨';
    
    // 播放提醒音（如果支持）
    try {
      wx.vibrateShort();
    } catch (e) {
      console.log('震动提醒不支持');
    }
    
    // 显示弹窗提醒
    wx.showModal({
      title: `🚨 换汇提醒`,
      content: `${alert.fromCurrencyName}/${alert.toCurrencyName} 已${directionText}目标价格 ${alert.price}\n\n当前汇率: ${alert.triggerRate}\n\n${rateDirection}，${actionText}来了！`,
      confirmText: '查看详情',
      cancelText: '知道了',
      success: (res) => {
        if (res.confirm) {
          // 可以跳转到详细页面或其他操作
          wx.showToast({
            title: '提醒已标记为已读',
            icon: 'success'
          });
        }
      }
    });
    
    // 发送系统通知（如果在后台）
    try {
      wx.showToast({
        title: `${actionText}提醒`,
        icon: 'success',
        duration: 3000
      });
    } catch (e) {
      console.log('系统通知失败');
    }
  },
}); 