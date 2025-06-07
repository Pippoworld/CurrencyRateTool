const { exchangeRateAPI } = require('../../utils/exchange-rate-api.js');

Page({
  data: {
    // 页面加载状态
    isLoading: true,
    
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
    
    // 货币列表 (动态加载真实汇率数据)
    currencies: [],
    
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
    // 初始化汇率数据
    this.initializeExchangeRates();
  },

  // 页面显示时同步其他页面的变化
  onShow() {
    console.log('[主页] onShow - 开始同步数据');
    
    // 如果还没有货币数据，重新初始化
    if (!this.data.currencies.length) {
      console.log('[主页] 货币数据为空，重新初始化');
      this.initializeExchangeRates();
      return;
    }
    
    this.loadSavedSettings();
    this.updateExchangeRate();
    this.updateCardRate(); // 更新卡片汇率
    this.generateAdvice();
    console.log('[主页] onShow - 数据同步完成');
  },

  // 加载保存的设置
  loadSavedSettings() {
    try {
      // 加载由 app.js 保证存在的全局货币设置
      const cardSettings = wx.getStorageSync('global_currency_settings');
      if (cardSettings) {
        this.setData({
          cardFromCurrencyIndex: cardSettings.fromCurrencyIndex,
          cardToCurrencyIndex: cardSettings.toCurrencyIndex
        });
      }
    } catch (error) {
      console.log('主页加载货币设置失败:', error);
      // 可以在这里增加一些错误处理，例如使用固定的默认值
      this.setData({
        cardFromCurrencyIndex: 0, // 人民币
        cardToCurrencyIndex: 1  // 美元
      });
    }
  },

  // 更新卡片汇率显示 - 固定左主右次
  updateCardRate() {
    const heldCurrency = this.data.currencies[this.data.cardFromCurrencyIndex];
    const targetCurrency = this.data.currencies[this.data.cardToCurrencyIndex];
    
    if (!heldCurrency || !targetCurrency || !heldCurrency.rate || !targetCurrency.rate) {
      console.log('[主页] Card currencies not ready for rate calculation');
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
    console.log(`[主页] Card rate updated: 1 ${targetCurrency.code} = ${primaryRate.toFixed(4)} ${heldCurrency.code}`);
  },

  // 更新汇率显示 (for calculator)
  updateExchangeRate() {
    const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
    const toCurrency = this.data.currencies[this.data.toCurrencyIndex];
    
    if (!fromCurrency || !toCurrency || !fromCurrency.rate || !toCurrency.rate) {
        console.log('[主页] Calculator currencies not ready for rate calculation');
        return;
    }

    // Calculator rate: 1 From = ? To
    const rate = toCurrency.rate / fromCurrency.rate;
    
    this.setData({
      exchangeRate: rate.toFixed(4)
    });
    console.log(`[主页] Calculator rate updated: 1 ${fromCurrency.code} = ${rate.toFixed(4)} ${toCurrency.code}`);
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

  // 生成AI建议 - 【已改造】改为调用云函数
  async generateAdvice() {
    try {
      console.log('[建议] 准备调用云函数 getAIAdvice...');
      const res = await wx.cloud.callFunction({
        name: 'getAIAdvice',
        data: {
          from: this.data.currencies[this.data.cardFromCurrencyIndex].code,
          to: this.data.currencies[this.data.cardToCurrencyIndex].code,
          rate: this.data.primaryRate
        }
      });

      if (res.result && res.result.success) {
        this.setData({
          advice: res.result.advice
        });
        console.log('[建议] 云函数返回成功:', res.result.advice);
      } else {
        throw new Error(res.result.message || '云函数返回错误');
      }
    } catch (error) {
      console.error('[建议] 调用云函数 getAIAdvice 失败:', error);
      // 调用失败时，使用一个统一的降级建议
      this.setData({
        advice: {
          icon: '⚠️',
          status: 'neutral',
          brief: '暂无法获取建议，请稍后重试'
        }
      });
    }
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

  // 显示汇率走势分析 - 【已改造】改为调用云函数
  async showRateTrend() {
    wx.showLoading({ title: '生成走势分析...', mask: true });
    try {
      const fromCurrency = this.data.currencies[this.data.fromCurrencyIndex];
      const toCurrency = this.data.currencies[this.data.toCurrencyIndex];

      console.log('[走势分析] 准备调用云函数 getTrendData...');
      const res = await wx.cloud.callFunction({
        name: 'getTrendData',
        data: {
          from: fromCurrency.code,
          to: toCurrency.code
        }
      });

      wx.hideLoading();

      if (res.result && res.result.success) {
        const trendData = res.result.data;
        wx.showModal({
          title: `📈 ${fromCurrency.name}/${toCurrency.name} 走势`,
          content: `近7日走势分析：\n${trendData.description}\n\n📊 当前汇率：${this.data.currentRate}\n📈 近期变化：${trendData.change}\n\n💡 ${trendData.suggestion}`,
          confirmText: '详细分析',
          cancelText: '关闭',
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.switchTab({ url: '/pages/advice/advice' });
            }
          }
        });
      } else {
        throw new Error(res.result.message || '云函数返回错误');
      }
    } catch (error) {
      console.error('[走势分析] 调用云函数 getTrendData 失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '获取走势失败',
        icon: 'none'
      });
    }
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

  /**
   * 初始化汇率数据
   */
  async initializeExchangeRates() {
    this.setData({ isLoading: true });
    try {
      console.log('[主页] 开始初始化汇率数据...');
      await this.loadExchangeRates();
      
      // 加载保存的设置
      this.loadSavedSettings();
      
      // 更新汇率显示
      this.updateExchangeRate();
      this.updateCardRate();
      this.generateAdvice();
      
      console.log('[主页] 汇率数据初始化完成');
      
    } catch (error) {
      console.error('[主页] 初始化失败:', error);
      wx.showToast({
        title: '数据获取失败',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 加载汇率数据
   */
  async loadExchangeRates() {
    try {
      console.log('[主页] 开始获取实时汇率数据...');
      
      // 获取以USD为基准的汇率数据
      const apiData = await exchangeRateAPI.getRates('USD');
      
      // 转换为应用格式
      const appData = exchangeRateAPI.convertToAppFormat(apiData);
      
      // 更新页面数据
      this.setData({
        currencies: appData.currencies,
        updateTime: appData.lastUpdate
      });
      
      console.log('[主页] 汇率数据更新成功:', {
        source: appData.source,
        currencyCount: appData.currencies.length,
        lastUpdate: appData.lastUpdate
      });
      
    } catch (error) {
      console.error('[主页] 获取汇率数据失败:', error);
      
      // 如果没有数据，使用降级数据
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
    console.log('[主页] 加载降级汇率数据');
    
    const fallbackApiData = exchangeRateAPI.getFallbackRates('USD');
    const appData = exchangeRateAPI.convertToAppFormat(fallbackApiData);
    
    this.setData({
      currencies: appData.currencies,
      updateTime: appData.lastUpdate
    });
  },

  // 获取实时汇率 (用于手动刷新)
  fetchRates() {
    this.initializeExchangeRates()
      .then(() => {
        wx.showToast({
          title: '汇率已更新',
          icon: 'success',
          duration: 1500
        });
      })
      .catch(error => {
        console.error('[主页] 更新汇率失败:', error);
        wx.showToast({
          title: '汇率更新失败',
          icon: 'error'
        });
      });
  },
}); 