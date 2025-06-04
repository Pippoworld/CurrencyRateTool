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
    // 接收传入的参数
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
    
    // 模拟不同的AI分析场景
    const scenarios = [
      {
        status: 'good',
        title: '价格适中，可以换汇',
        confidence: 88,
        summary: `${fromCurrency.name}兑${toCurrency.name}当前汇率处于合理区间，各项技术指标显示相对稳定，是较好的换汇时机。`,
        factors: [
          '汇率在近期震荡区间内',
          '成交量平稳，市场情绪稳定',
          '基本面支撑相对强劲',
          '技术指标未显示极端信号'
        ],
        suggestion: '建议在当前价位分批购买，可设置少量仓位试探，同时关注重要经济数据发布。'
      },
      {
        status: 'warning',
        title: '价格略高，建议观望',
        confidence: 82,
        summary: `${fromCurrency.name}兑${toCurrency.name}当前汇率处于近期高位，技术指标显示短期内可能出现回调。建议等待更好的换汇时机。`,
        factors: [
          '近7天汇率上涨1.2%，接近阻力位',
          '相关央行政策预期影响较大',
          '重要经济数据即将公布',
          '技术指标RSI显示超买状态'
        ],
        suggestion: '建议设置较低价位的买入提醒，或等待重要数据公布后再做决定。如有紧急需求，可考虑分批购买。'
      },
      {
        status: 'danger',
        title: '价格偏高，等等再买',
        confidence: 90,
        summary: `${fromCurrency.name}兑${toCurrency.name}当前汇率已达近期高点，多项指标显示回调风险较大，不建议在此时换汇。`,
        factors: [
          '汇率已突破前期阻力位',
          '技术指标严重超买',
          '市场情绪过度乐观',
          '基本面预期已充分反映'
        ],
        suggestion: '强烈建议等待回调后再考虑换汇，可设置目标价位提醒，密切关注市场变化。'
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
    this.setData({
      fromCurrencyIndex: newIndex
    });
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 目标币种选择
  onToCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    this.setData({
      toCurrencyIndex: newIndex
    });
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
    
    this.setData({
      fromCurrencyIndex: toIndex,
      toCurrencyIndex: fromIndex
    });
    
    this.updateExchangeRate();
    this.generateAdvice();
  }
}); 