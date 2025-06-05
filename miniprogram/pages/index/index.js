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
    
    // 简化为状态指示器 - 专注于快速判断
    const scenarios = [
      {
        icon: '●',
        title: '汇率正常',
        status: 'good',
        brief: '适合换汇',
        quickTip: '当前价位合理'
      },
      {
        icon: '●', 
        title: '略显偏高',
        status: 'warning',
        brief: '建议观望',
        quickTip: '可等待回调'
      },
      {
        icon: '●',
        title: '相对偏低',
        status: 'excellent',
        brief: '抓紧换汇',
        quickTip: '较好时机'
      },
      {
        icon: '●',
        title: '明显偏高',
        status: 'danger',
        brief: '暂缓操作',
        quickTip: '等待更佳价位'
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
    // 跳转到详情页设置目标汇率
    wx.navigateTo({
      url: `/pages/rate-detail/rate-detail?fromIndex=${this.data.fromCurrencyIndex}&toIndex=${this.data.toCurrencyIndex}`,
      success: () => {
        console.log('跳转到汇率详情页设置目标汇率');
      }
    });
  },

  showMoreCurrencies() {
    // 显示更多币种选择
    const moreCurrencies = [
      '🇯🇵 日元 JPY',
      '🇰🇷 韩元 KRW', 
      '🇨🇦 加元 CAD',
      '🇨🇭 瑞郎 CHF',
      '🇸🇬 新币 SGD',
      '🇭🇰 港币 HKD',
      '🇹🇭 泰铢 THB',
      '🇷🇺 卢布 RUB'
    ];
    
    wx.showActionSheet({
      itemList: moreCurrencies,
      success: (res) => {
        const selectedCurrency = moreCurrencies[res.tapIndex];
        const currencyInfo = selectedCurrency.split(' ');
        const flag = currencyInfo[0];
        const name = currencyInfo[1];
        const code = currencyInfo[2];
        
        wx.showModal({
          title: '添加新币种',
          content: `${flag} ${name} (${code})\n\n这个币种将被添加到您的常用列表中，方便下次快速选择。`,
          confirmText: '添加',
          cancelText: '取消',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 添加新币种到列表（这里可以扩展currencies数组）
              wx.showToast({
                title: `${name}已添加`,
                icon: 'success'
              });
              
              // 可以在这里更新currencies数组，添加新币种
              console.log(`添加新币种：${name} (${code})`);
            }
          }
        });
      }
    });
  },

  showRateTrend() {
    // 显示汇率走势图
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    // 生成模拟走势数据
    const trendData = this.generateTrendData();
    
    wx.showModal({
      title: `${fromCurrency.name}/${toCurrency.name} 走势`,
      content: `近7日走势：\n${trendData.description}\n\n当前汇率：${this.data.currentRate}\n涨跌：${trendData.change}`,
      confirmText: '详细分析',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          // 跳转到建议页查看详细分析
          wx.navigateTo({
            url: '/pages/advice/advice'
          });
        }
      }
    });
  },

  // 生成模拟走势数据
  generateTrendData() {
    const trends = [
      { description: '📈 持续上涨趋势，技术面强势', change: '+2.3%' },
      { description: '📉 震荡下行走势，存在支撑', change: '-1.8%' },
      { description: '📊 横盘整理走势，方向待定', change: '+0.2%' },
      { description: '🚀 突破上行，动能充足', change: '+3.5%' },
      { description: '⚡ 波动加剧，注意风险', change: '-0.9%' }
    ];
    
    return trends[Math.floor(Math.random() * trends.length)];
  },

  showExchangeChannels() {
    // 显示换汇渠道选择
    const channels = [
      '🏛️ 中国银行 - 汇率稳定，网点多',
      '🏦 工商银行 - 服务优质，安全可靠', 
      '💳 招商银行 - 手续费低，APP便利',
      '📱 支付宝 - 操作简单，费率优惠',
      '🌐 专业机构 - 汇率最优，适合大额'
    ];
    
    wx.showActionSheet({
      itemList: channels,
      success: (res) => {
        const selectedChannel = channels[res.tapIndex];
        const channelName = selectedChannel.split(' - ')[0];
        
        wx.showModal({
          title: '换汇渠道详情',
          content: `您选择了：${channelName}\n\n点击"查看详情"了解更多换汇方式和最新汇率对比`,
          confirmText: '查看详情',
          cancelText: '关闭',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 跳转到建议页查看详细的换汇方式对比
              wx.navigateTo({
                url: '/pages/advice/advice'
              });
            }
          }
        });
      }
    });
  },
}); 