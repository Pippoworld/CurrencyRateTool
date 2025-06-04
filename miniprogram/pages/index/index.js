Page({
  data: {
    // 双币种选择
    fromCurrencyIndex: 1, // 默认USD
    toCurrencyIndex: 0,   // 默认CNY
    fromAmount: '',
    toAmount: '',
    
    // 汇率信息
    currentRate: '7.12',
    rateChange: '+0.05 (+0.70%)',
    rateChangeStatus: 'positive',
    exchangeRate: '7.12',
    updateTime: '6月4日 20:14',
    
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
    
    // AI建议
    advice: {
      icon: '●',
      title: '价格偏高',
      status: 'danger',
      summary: '美元汇率近期呈下降趋势，当前价格适合购买。建议在7.10-7.15区间内分批购买。',
      brief: '建议等待回调'
    }
  },

  onLoad() {
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 更新汇率显示
  updateExchangeRate() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    let rate;
    if (fromCurrency.code === 'CNY') {
      rate = toCurrency.rate;
    } else if (toCurrency.code === 'CNY') {
      rate = (1 / fromCurrency.rate).toFixed(4);
    } else {
      rate = (toCurrency.rate / fromCurrency.rate).toFixed(4);
    }
    
    this.setData({
      exchangeRate: rate,
      currentRate: rate
    });
  },

  // 第一个货币选择
  onFromCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    this.setData({
      fromCurrencyIndex: newIndex
    });
    this.updateExchangeRate();
    this.calculateToAmount();
    this.generateAdvice();
  },

  // 第二个货币选择  
  onToCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    this.setData({
      toCurrencyIndex: newIndex
    });
    this.updateExchangeRate();
    this.calculateToAmount();
    this.generateAdvice();
  },

  // 第一个金额输入
  onFromAmountInput(e) {
    const amount = e.detail.value;
    this.setData({
      fromAmount: amount
    });
    this.calculateToAmount();
  },

  // 第二个金额输入
  onToAmountInput(e) {
    const amount = e.detail.value;
    this.setData({
      toAmount: amount
    });
    this.calculateFromAmount();
  },

  // 计算目标货币金额
  calculateToAmount() {
    const fromAmount = parseFloat(this.data.fromAmount);
    if (!fromAmount || isNaN(fromAmount)) {
      this.setData({ toAmount: '' });
      return;
    }

    const rate = parseFloat(this.data.exchangeRate);
    const toAmount = (fromAmount * rate).toFixed(2);
    
    this.setData({
      toAmount: toAmount
    });
  },

  // 计算原货币金额
  calculateFromAmount() {
    const toAmount = parseFloat(this.data.toAmount);
    if (!toAmount || isNaN(toAmount)) {
      this.setData({ fromAmount: '' });
      return;
    }

    const rate = parseFloat(this.data.exchangeRate);
    const fromAmount = (toAmount / rate).toFixed(2);
    
    this.setData({
      fromAmount: fromAmount
    });
  },

  // 交换货币
  swapCurrencies() {
    const fromIndex = this.data.fromCurrencyIndex;
    const toIndex = this.data.toCurrencyIndex;
    const fromAmount = this.data.fromAmount;
    const toAmount = this.data.toAmount;
    
    this.setData({
      fromCurrencyIndex: toIndex,
      toCurrencyIndex: fromIndex,
      fromAmount: toAmount,
      toAmount: fromAmount
    });
    
    this.updateExchangeRate();
    this.generateAdvice();
  },

  // 生成AI建议
  generateAdvice() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    // 模拟AI分析 - 简洁实用的建议
    const scenarios = [
      {
        icon: '●',
        title: '价格适中',
        status: 'good',
        summary: `${fromCurrency.name}汇率处于合理区间，当前可以换汇。建议在此价位分批购买，降低风险。`,
        brief: '可以换汇'
      },
      {
        icon: '●', 
        title: '价格略高',
        status: 'warning',
        summary: `${fromCurrency.name}汇率偏高，建议观望。预计1-2周内可能回调，可设置价格提醒。`,
        brief: '建议观望'
      },
      {
        icon: '●',
        title: '价格偏低',
        status: 'excellent',
        summary: `${fromCurrency.name}汇率偏低，是较好的换汇时机。建议尽快购买，但注意风险控制。`,
        brief: '抓紧换汇'
      },
      {
        icon: '●',
        title: '价格偏高',
        status: 'danger',
        summary: `${fromCurrency.name}汇率处于高位，不建议当前换汇。建议等待2-3周，观察回调机会。`,
        brief: '等等再买'
      }
    ];
    
    const randomAdvice = scenarios[Math.floor(Math.random() * scenarios.length)];
    this.setData({
      advice: randomAdvice
    });
  },

  // 设置快捷提醒
  setQuickReminder() {
    wx.showToast({
      title: '提醒已设置',
      icon: 'success'
    });
  },

  // 跳转到详细分析
  goToAdvice() {
    wx.switchTab({
      url: '/pages/advice/advice'
    });
  },

  // 跳转到汇率详情页设置
  goToRateDetail() {
    wx.navigateTo({
      url: `/pages/rate-detail/rate-detail?fromIndex=${this.data.fromCurrencyIndex}&toIndex=${this.data.toCurrencyIndex}`,
      success: () => {
        console.log('跳转到汇率详情页');
      },
      fail: () => {
        // 如果页面不存在，显示提示
        wx.showToast({
          title: '功能开发中',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 快捷操作
  showRateHistory() {
    wx.showToast({
      title: '查看汇率走势',
      icon: 'none'
    });
  },

  showExchangeMethods() {
    wx.showToast({
      title: '换汇渠道对比',
      icon: 'none'
    });
  },

  setTargetRate() {
    wx.showToast({
      title: '设置目标汇率',
      icon: 'none'
    });
  },

  showMoreCurrencies() {
    wx.showToast({
      title: '更多币种',
      icon: 'none'
    });
  }
}); 