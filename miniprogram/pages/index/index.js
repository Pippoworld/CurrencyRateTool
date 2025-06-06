const api = require('../../utils/api.js');

Page({
  data: {
    // 计算器的币种选择（临时计算用）
    fromCurrencyIndex: 1, // 默认USD
    toCurrencyIndex: 0,   // 默认CNY
    fromAmount: '',
    toAmount: '',
    
    // 卡片监控的币种（长期监控，需要到详情页设置）
    cardFromCurrencyIndex: 1, // 默认USD
    cardToCurrencyIndex: 0,   // 默认CNY
    
    // 汇率信息
    currentRate: '7.12',
    rateChange: '+0.05 (+0.70%)',
    rateChangeStatus: 'positive',
    exchangeRate: '7.12',
    updateTime: '6月4日 20:14',
    reverseRate: '',
    
    // 新的汇率显示数据结构
    primaryRate: null,
    primaryFromCurrency: {},
    primaryToCurrency: {},
    secondaryRate: null,
    secondaryFromCurrency: {},
    secondaryToCurrency: {},
    
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
    this.loadSavedSettings();
    this.updateExchangeRate();
    this.updateCardRate(); // 更新卡片汇率
    this.generateAdvice();
    this.fetchRates(); // 获取实时汇率
  },

  // 页面显示时同步其他页面的变化
  onShow() {
    console.log('主页onShow - 开始同步数据');
    this.loadSavedSettings();
    this.updateExchangeRate();
    this.updateCardRate(); // 更新卡片汇率
    this.generateAdvice();
    console.log('主页onShow - 数据同步完成');
  },

  // 加载保存的设置
  loadSavedSettings() {
    try {
      // 加载卡片监控的货币设置
      const cardSettings = wx.getStorageSync('currencySettings');
      if (cardSettings) {
        console.log('主页加载到的卡片货币设置:', cardSettings);
        this.setData({
          cardFromCurrencyIndex: cardSettings.fromCurrencyIndex || 0,
          cardToCurrencyIndex: cardSettings.toCurrencyIndex || 1
        });
        
        console.log('卡片货币已更新为:', {
          cardFromCurrencyIndex: this.data.cardFromCurrencyIndex,
          cardToCurrencyIndex: this.data.cardToCurrencyIndex,
          fromCurrency: this.data.currencies[this.data.cardFromCurrencyIndex],
          toCurrency: this.data.currencies[this.data.cardToCurrencyIndex]
        });
      } else {
        console.log('主页未找到卡片货币设置，初始化默认设置');
        // 初始化默认设置：人民币（持有）/ 美元（目标）
        const defaultSettings = {
          fromCurrencyIndex: 0, // 人民币
          toCurrencyIndex: 1    // 美元
        };
        wx.setStorageSync('currencySettings', defaultSettings);
        this.setData({
          cardFromCurrencyIndex: 0,
          cardToCurrencyIndex: 1
        });
        console.log('已初始化默认货币设置: 人民币/美元');
      }
    } catch (error) {
      console.log('主页加载货币设置失败:', error);
    }
  },

  // 更新卡片汇率显示 - 固定左主右次
  updateCardRate() {
    const heldCurrency = this.data.currencies[this.data.cardFromCurrencyIndex];
    const targetCurrency = this.data.currencies[this.data.cardToCurrencyIndex];
    
    if (!heldCurrency || !targetCurrency || !heldCurrency.rate || !targetCurrency.rate) {
      console.log('Card currencies not ready for rate calculation');
      return;
    }

    // 左侧（主）：1 目标货币 = ? 持有货币
    const primaryRate = heldCurrency.rate / targetCurrency.rate;
    
    // 右侧（次）：1 持有货币 = ? 目标货币
    const secondaryRate = targetCurrency.rate / heldCurrency.rate;

    this.setData({
      // 主汇率：目标 -> 持有
      primaryRate: primaryRate.toFixed(4),
      primaryFromCurrency: targetCurrency,
      primaryToCurrency: heldCurrency,
      
      // 次汇率：持有 -> 目标
      secondaryRate: secondaryRate.toFixed(4),
      secondaryFromCurrency: heldCurrency,
      secondaryToCurrency: targetCurrency,
    });
    console.log(`Card rate updated: 1 ${targetCurrency.code} = ${primaryRate.toFixed(4)} ${heldCurrency.code}`);
  },

  // 更新汇率显示 (for calculator)
  updateExchangeRate() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    if (!fromCurrency || !toCurrency || !fromCurrency.rate || !toCurrency.rate) {
        console.log('Calculator currencies not ready for rate calculation');
        return;
    }

    // Calculator rate: 1 From = ? To
    const rate = toCurrency.rate / fromCurrency.rate;
    
    this.setData({
      exchangeRate: rate.toFixed(4)
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
  },

  // 第二个货币选择  
  onToCurrencyChange(e) {
    const newIndex = parseInt(e.detail.value);
    this.setData({
      toCurrencyIndex: newIndex
    });
    this.updateExchangeRate();
    this.calculateToAmount();
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
  },

  // 生成AI建议
  generateAdvice() {
    const scenarios = [
      {
        icon: '🟢',
        status: 'excellent',
        brief: '处于近期低位，建议分批买入'
      },
      {
        icon: '🔵',
        status: 'good',
        brief: '走势平稳，可按需兑换'
      },
      {
        icon: '🟠',
        status: 'warning',
        brief: '处于近期高位，建议谨慎观望'
      },
      {
        icon: '🔴',
        status: 'danger',
        brief: '近期波动较大，建议暂缓操作'
      }
    ];
    
    // 随机选择一个场景作为当前建议
    const randomAdvice = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    this.setData({
      advice: randomAdvice
    });
    
    console.log('AI建议已更新:', randomAdvice.brief);
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
    // 直接切换到详情页tab，确保始终能够访问
    wx.switchTab({
      url: '/pages/rate-detail/rate-detail',
      success: () => {
        console.log('跳转到汇率详情页');
      },
      fail: () => {
        // 如果还是失败，显示友好提示
        wx.showToast({
          title: '正在加载页面...',
          icon: 'loading',
          duration: 1000
        });
      }
    });
  },

  // 快捷操作 - 修复所有功能
  showRateHistory() {
    // 跳转到汇率走势分析
    this.showRateTrend();
  },

  showExchangeMethods() {
    // 跳转到换汇渠道对比
    this.showExchangeChannels();
  },

  setTargetRate() {
    // 跳转到详情页设置目标汇率
    wx.navigateTo({
      url: `/pages/rate-detail/rate-detail?fromIndex=${this.data.fromCurrencyIndex}&toIndex=${this.data.toCurrencyIndex}`,
      success: () => {
        console.log('跳转到汇率详情页设置目标汇率');
      },
      fail: () => {
        // 如果跳转失败，切换到详情页tab
        wx.switchTab({
          url: '/pages/rate-detail/rate-detail'
        });
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
    // 显示汇率走势分析
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    // 生成走势分析数据
    const trendData = this.generateTrendData();
    
    wx.showModal({
      title: `📈 ${fromCurrency.name}/${toCurrency.name} 走势`,
      content: `近7日走势分析：\n${trendData.description}\n\n📊 当前汇率：${this.data.currentRate}\n📈 近期变化：${trendData.change}\n\n💡 ${trendData.suggestion}`,
      confirmText: '详细分析',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm) {
          // 跳转到建议页查看详细分析
          wx.switchTab({
            url: '/pages/advice/advice'
          });
        }
      }
    });
  },

  // 生成走势分析数据
  generateTrendData() {
    const currentRate = parseFloat(this.data.currentRate);
    const trends = [
      { 
        description: '📈 持续上涨趋势，技术面表现强势', 
        change: '+2.3%',
        suggestion: '建议适量分批操作，关注回调机会'
      },
      { 
        description: '📉 震荡下行走势，但存在重要支撑', 
        change: '-1.8%',
        suggestion: '可关注支撑位附近的反弹机会'
      },
      { 
        description: '📊 横盘整理走势，方向性尚不明确', 
        change: '+0.2%',
        suggestion: '建议等待明确方向信号后再操作'
      },
      { 
        description: '🚀 突破上行通道，上涨动能充足', 
        change: '+3.5%',
        suggestion: '短期强势，但需注意高位风险'
      },
      { 
        description: '⚡ 波动加剧，市场情绪不稳定', 
        change: '-0.9%',
        suggestion: '建议控制风险，关注重要经济数据'
      }
    ];
    
    return trends[Math.floor(Math.random() * trends.length)];
  },

  showExchangeChannels() {
    // 显示换汇渠道选择
    const channels = [
      '🏛️ 中国银行 - 汇率稳定，网点覆盖全面',
      '🏦 工商银行 - 服务优质，安全可靠', 
      '💳 招商银行 - 手续费低，APP操作便利',
      '📱 支付宝 - 操作简单，费率相对优惠',
      '🌐 专业机构 - 汇率最优，适合大额换汇'
    ];
    
    wx.showActionSheet({
      itemList: channels,
      success: (res) => {
        const selectedChannel = channels[res.tapIndex];
        const channelInfo = selectedChannel.split(' - ');
        const channelName = channelInfo[0];
        const channelDesc = channelInfo[1];
        
        // 生成该渠道的详细信息
        const channelDetails = this.getChannelDetails(res.tapIndex);
        
        wx.showModal({
          title: `${channelName} 详情`,
          content: `${channelDesc}\n\n💰 当前汇率：${channelDetails.rate}\n💳 手续费：${channelDetails.fee}\n⏰ 到账时间：${channelDetails.time}\n\n${channelDetails.note}`,
          confirmText: '查看更多',
          cancelText: '关闭',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 跳转到建议页查看详细的换汇方式对比
              wx.switchTab({
                url: '/pages/advice/advice'
              });
            }
          }
        });
      }
    });
  },

  // 获取渠道详细信息
  getChannelDetails(index) {
    const currentRate = parseFloat(this.data.currentRate);
    const channels = [
      {
        rate: (currentRate + 0.008).toFixed(3),
        fee: '0.5%',
        time: '实时到账',
        note: '优势：网点多，服务稳定，适合首次换汇用户'
      },
      {
        rate: (currentRate + 0.005).toFixed(3),
        fee: '0.6%',
        time: '实时到账',
        note: '优势：安全性高，大额换汇有优惠'
      },
      {
        rate: (currentRate + 0.010).toFixed(3),
        fee: '0.4%',
        time: '实时到账',
        note: '优势：手续费低，手机操作便利'
      },
      {
        rate: (currentRate + 0.015).toFixed(3),
        fee: '0.3%',
        time: '2小时内',
        note: '优势：操作简单，费率相对优惠'
      },
      {
        rate: (currentRate - 0.005).toFixed(3),
        fee: '0.2%',
        time: '1个工作日',
        note: '优势：汇率最优，适合大额操作'
      }
    ];
    
    return channels[index] || channels[0];
  },

  // 获取实时汇率
  fetchRates() {
    api.getExchangeRates('CNY') // 以人民币为基准获取汇率
      .then(rates => {
        console.log('实时汇率已获取 (基准: CNY):', rates);
        
        // 更新货币列表中的汇率
        const updatedCurrencies = this.data.currencies.map(currency => {
          if (rates[currency.code]) {
            return { ...currency, rate: rates[currency.code] };
          }
          return currency;
        });

        this.setData({
          currencies: updatedCurrencies,
          updateTime: new Date().toLocaleString()
        });
        
        // 重新计算汇率
        this.updateCardRate();
        this.updateExchangeRate();
        this.generateAdvice(); // 在汇率更新后生成建议
        
        wx.showToast({
          title: '汇率已更新',
          icon: 'success',
          duration: 1500
        });
      })
      .catch(error => {
        console.error('更新汇率失败:', error);
        wx.showToast({
          title: '汇率更新失败',
          icon: 'error'
        });
      });
  },
}); 