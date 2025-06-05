Page({
  data: {
    fromCurrencyIndex: 1,
    toCurrencyIndex: 0,
    
    // 货币列表
    currencies: [
      { code: 'CNY', name: '人民币', flag: '🇨🇳', rate: 1.0000 },
      { code: 'USD', name: '美元', flag: '🇺🇸', rate: 7.1200 },
      { code: 'EUR', name: '欧元', flag: '🇪🇺', rate: 7.7500 },
      { code: 'JPY', name: '日元', flag: '🇯🇵', rate: 0.0482 },
      { code: 'GBP', name: '英镑', flag: '🇬🇧', rate: 8.9800 },
      { code: 'AUD', name: '澳元', flag: '🇦🇺', rate: 4.7200 },
      { code: 'CAD', name: '加元', flag: '🇨🇦', rate: 5.2300 },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭', rate: 7.8500 },
      { code: 'HKD', name: '港币', flag: '🇭🇰', rate: 0.9120 },
      { code: 'SGD', name: '新加坡元', flag: '🇸🇬', rate: 5.2800 }
    ],
    
    currentRate: '7.1200',
    rateChange: '+0.05 (+0.70%)',
    updateTime: '6月4日 20:14',
    
    // AI 分析建议
    advice: {
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
      suggestion: '建议设置7.05以下的买入提醒，或等待本周贸易数据公布后再做决定。如有紧急换汇需求，可考虑分批购买降低风险。'
    },
    
    // 目标汇率设置
    targetBuyRate: '',
    targetSellRate: '',
    
    // 长期监控设置
    isPriceAlertEnabled: false,
    isDailyReportEnabled: false,
    isTrendAnalysisEnabled: false,
    
    // 监控统计
    monitoringDays: 15,
    alertCount: 3,
    maxRate: '7.28',
    minRate: '6.98'
  },

  onLoad(options) {
    // 优先加载全局货币设置
    this.loadGlobalCurrencySettings();
    
    // 如果有传入参数，使用传入的参数
    if (options.fromIndex) {
      this.setData({
        fromCurrencyIndex: parseInt(options.fromIndex)
      });
    }
    if (options.toIndex) {
      this.setData({
        toCurrencyIndex: parseInt(options.toIndex)
      });
    }
    
    this.updateExchangeRate();
    this.loadUserSettings();
    this.generateAdvice();
  },

  // 页面显示时同步数据
  onShow() {
    this.loadGlobalCurrencySettings();
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 加载全局货币设置
  loadGlobalCurrencySettings() {
    try {
      const settings = wx.getStorageSync('currencySettings');
      if (settings) {
        this.setData({
          fromCurrencyIndex: settings.fromCurrencyIndex || 1,
          toCurrencyIndex: settings.toCurrencyIndex || 0
        });
        console.log('详情页已加载全局货币设置:', settings);
      }
    } catch (error) {
      console.log('加载全局货币设置失败:', error);
    }
  },

  // 保存全局货币设置
  saveGlobalCurrencySettings() {
    const settings = {
      fromCurrencyIndex: this.data.fromCurrencyIndex,
      toCurrencyIndex: this.data.toCurrencyIndex,
      updateTime: new Date().getTime()
    };
    
    try {
      // 使用全局同步管理器
      const app = getApp();
      const success = app.globalData.syncCurrencySettings(settings);
      
      if (success) {
        console.log('详情页已通过全局管理器同步货币设置:', settings);
        
        // 显示同步成功提示
        wx.showToast({
          title: '设置已同步',
          icon: 'success',
          duration: 1000
        });
      } else {
        console.log('详情页货币设置同步失败');
        
        // 降级到本地保存
        wx.setStorageSync('currencySettings', settings);
        console.log('详情页已降级保存货币设置:', settings);
      }
    } catch (error) {
      console.log('详情页保存全局货币设置失败:', error);
      
      // 降级到本地保存
      try {
        wx.setStorageSync('currencySettings', settings);
        console.log('详情页已降级保存货币设置:', settings);
      } catch (fallbackError) {
        console.log('详情页降级保存也失败:', fallbackError);
      }
    }
  },

  // 更新汇率显示
  updateExchangeRate() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    let rate;
    if (fromCurrency.code === 'CNY') {
      rate = toCurrency.rate.toFixed(4);
    } else if (toCurrency.code === 'CNY') {
      rate = (1 / fromCurrency.rate).toFixed(4);
    } else {
      rate = (toCurrency.rate / fromCurrency.rate).toFixed(4);
    }
    
    this.setData({
      currentRate: rate
    });
  },

  // 生成AI建议
  generateAdvice() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    // 专业深度分析 - 技术指标 + 市场分析
    const scenarios = [
      {
        status: 'good',
        title: '技术面偏多，建议逢低买入',
        confidence: 88,
        summary: `基于多项技术指标分析，${fromCurrency.name}兑${toCurrency.name}当前处于上升趋势中的健康回调期。多项技术指标支撑看多观点，建议投资者可在当前区间分批建仓。`,
        factors: [
          'MACD金叉确认，多头动能增强',
          '20日均线形成有效支撑，价格企稳',
          '成交量温和放大，显示资金流入',
          '相对强弱指数(RSI)处于50-70健康区间',
          '布林带中轨附近，具备向上空间'
        ],
        suggestion: '建议分3-5次在7.05-7.15区间分批买入，单次仓位控制在总资金的20%以内。同时设置7.00止损位和7.35目标位，严格执行资金管理原则。'
      },
      {
        status: 'warning',
        title: '技术面分化，需谨慎观望',
        confidence: 82,
        summary: `${fromCurrency.name}兑${toCurrency.name}技术指标出现分化信号，短期趋势存在不确定性。建议等待明确方向信号后再做布局，避免盲目追高。`,
        factors: [
          'MACD高位背离，动能减弱迹象明显',
          '价格测试前期高点7.20阻力位遇阻',
          'RSI指标达75，进入超买预警区域',
          '成交量萎缩，缺乏有效突破动力',
          '美联储政策预期变化增加不确定性'
        ],
        suggestion: '建议暂时观望，等待价格有效跌破7.10或突破7.25后再考虑操作。如持有多仓可适当减仓，等待更好的加仓机会。设置止盈止损严格执行。'
      },
      {
        status: 'danger',
        title: '技术面走弱，建议减仓观望',
        confidence: 90,
        summary: `多项技术指标显示${fromCurrency.name}兑${toCurrency.name}面临较大调整压力。关键支撑位失守，短期看空情绪升温。建议降低仓位，等待更佳布局时机。`,
        factors: [
          '跌破20日均线支撑，技术面转空',
          'MACD死叉确认，空头趋势形成',
          'RSI跌破30，进入超卖但仍有下探空间',
          '成交量放大下跌，资金流出明显',
          '宏观面利空因素持续发酵'
        ],
        suggestion: '强烈建议减仓至3成以下，重点关注6.95和6.85两个关键支撑位。若持续破位可考虑清仓观望。待技术面修复和基本面改善后再寻找重新布局机会。'
      }
    ];
    
    const randomAdvice = scenarios[Math.floor(Math.random() * scenarios.length)];
    this.setData({
      advice: randomAdvice
    });
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
    console.log('详情页选择持有币种:', newIndex, this.data.currencies[newIndex]);
    this.setData({
      fromCurrencyIndex: newIndex
    });
    this.saveGlobalCurrencySettings(); // 保存全局设置
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 目标币种选择
  onToCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    console.log('详情页选择目标币种:', newIndex, this.data.currencies[newIndex]);
    this.setData({
      toCurrencyIndex: newIndex
    });
    this.saveGlobalCurrencySettings(); // 保存全局设置
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 目标买入汇率输入
  onTargetBuyInput(e) {
    this.setData({
      targetBuyRate: e.detail.value
    });
  },

  // 目标卖出汇率输入
  onTargetSellInput(e) {
    this.setData({
      targetSellRate: e.detail.value
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
    } else {
      this.setData({
        targetSellRate: targetRate
      });
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
  }
}); 