const geminiAPI = require('../../utils/gemini-api');

Page({
  data: {
    selectedCurrency: {
      flag: '🇺🇸',
      name: '美元'
    },
    currentRate: '7.12',
    rateChange: '+0.05 (+0.70%)',
    changeStatus: 'positive',
    changeIcon: '↗',
    
    // 7日走势图数据
    chartData: [
      { height: 60, color: '#ef4444', label: '周一' },
      { height: 45, color: '#f59e0b', label: '周二' },
      { height: 70, color: '#10b981', label: '周三' },
      { height: 85, color: '#10b981', label: '周四' },
      { height: 55, color: '#ef4444', label: '周五' },
      { height: 65, color: '#10b981', label: '周六' },
      { height: 75, color: '#10b981', label: '今日' }
    ],
    
    // AI分析内容 - 初始化为空，将通过AI生成
    analysis: {
      trend: '正在分析趋势...',
      technical: '正在分析技术指标...',
      fundamental: '正在分析基本面...',
      risk: '正在分析风险...'
    },
    
    // 换汇建议时间线 - 初始化为空，将通过AI生成
    timeline: [
      {
        status: 'current',
        title: '当前时点',
        description: '正在生成建议...',
        suggestedRate: '分析中...'
      }
    ],
    
    // 换汇方式推荐
    exchangeMethods: [
      {
        icon: '🏛️',
        name: '中国银行',
        rate: '7.118',
        fee: '0.5%',
        arrivalTime: '实时到账',
        advantages: '网点多，汇率稳定，手续简便',
        recommended: true
      },
      {
        icon: '🏦',
        name: '工商银行',
        rate: '7.115',
        fee: '0.6%',
        arrivalTime: '实时到账',
        advantages: '服务优质，安全可靠',
        recommended: false
      },
      {
        icon: '💳',
        name: '招商银行',
        rate: '7.120',
        fee: '0.4%',
        arrivalTime: '实时到账',
        advantages: '手续费低，APP操作便利',
        recommended: false
      },
      {
        icon: '📱',
        name: '支付宝',
        rate: '7.125',
        fee: '0.3%',
        arrivalTime: '2小时内',
        advantages: '操作简单，费率最低',
        recommended: false
      }
    ],

    // 市场资讯 - 初始化为空，将通过AI生成
    marketNews: [
      {
        title: '正在获取最新资讯...',
        summary: 'AI正在分析当前市场情况，请稍候...',
        source: 'AI分析',
        time: '实时',
        impact: '分析中',
        impactLevel: 'neutral'
      }
    ],

    // 加载状态
    isLoadingAnalysis: true,
    isLoadingAdvice: true,
    isLoadingNews: true
  },

  async onLoad() {
    this.loadCurrencyData();
    
    // 并行加载AI生成的内容
    await Promise.all([
      this.loadAIAnalysis(),
      this.loadAIAdvice(), 
      this.loadAINews()
    ]);
  },

  // 加载货币数据
  loadCurrencyData() {
    // 模拟获取当前页面选择的货币信息
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    if (prevPage && prevPage.data) {
      const fromCurrency = prevPage.data.currencies[prevPage.data.fromCurrencyIndex];
      this.setData({
        selectedCurrency: fromCurrency,
        currentRate: prevPage.data.currentRate
      });
    }
  },

  // 加载AI分析
  async loadAIAnalysis() {
    try {
      this.setData({ isLoadingAnalysis: true });
      
      const currencyPair = `${this.data.selectedCurrency.name}/人民币`;
      const analysis = await geminiAPI.generateRateAnalysis(
        currencyPair, 
        this.data.currentRate, 
        this.data.rateChange
      );
      
      this.setData({ 
        analysis: analysis,
        isLoadingAnalysis: false 
      });
      
      console.log('AI分析加载完成:', analysis);
    } catch (error) {
      console.error('加载AI分析失败:', error);
      this.setData({ isLoadingAnalysis: false });
    }
  },

  // 加载AI建议
  async loadAIAdvice() {
    try {
      this.setData({ isLoadingAdvice: true });
      
      const currencyPair = `${this.data.selectedCurrency.name}/人民币`;
      const advice = await geminiAPI.generateExchangeAdvice(
        currencyPair,
        this.data.currentRate
      );
      
      this.setData({ 
        timeline: advice,
        isLoadingAdvice: false 
      });
      
      console.log('AI建议加载完成:', advice);
    } catch (error) {
      console.error('加载AI建议失败:', error);
      this.setData({ isLoadingAdvice: false });
    }
  },

  // 加载AI新闻
  async loadAINews() {
    try {
      this.setData({ isLoadingNews: true });
      
      const news = await geminiAPI.generateMarketNews(this.data.selectedCurrency.code || 'USD');
      
      this.setData({ 
        marketNews: news,
        isLoadingNews: false 
      });
      
      console.log('AI新闻加载完成:', news);
    } catch (error) {
      console.error('加载AI新闻失败:', error);
      this.setData({ isLoadingNews: false });
    }
  },

  // 刷新AI内容
  async refreshAIContent() {
    wx.showLoading({
      title: '正在刷新分析...'
    });

    try {
      await Promise.all([
        this.loadAIAnalysis(),
        this.loadAIAdvice(),
        this.loadAINews()
      ]);
      
      wx.hideLoading();
      wx.showToast({
        title: 'AI分析已更新',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none'
      });
    }
  },

  // 跳转到汇率详情页进行监控设置
  goToRateDetail() {
    wx.navigateTo({
      url: '/pages/rate-detail/rate-detail',
      success: () => {
        console.log('跳转到汇率详情页设置监控');
      }
    });
  },

  // 分享分析
  shareAnalysis() {
    const shareContent = `${this.data.selectedCurrency.name}汇率AI分析
💰 当前汇率：${this.data.currentRate}
📈 变化：${this.data.rateChange}

🤖 AI分析摘要：
${this.data.analysis.trend}

来自汇率助手的专业AI分析`;

    wx.setClipboardData({
      data: shareContent,
      success: () => {
        wx.showToast({
          title: '分析内容已复制',
          icon: 'success'
        });
      }
    });
  },

  // 打开新闻详情
  openNewsDetail(e) {
    const url = e.currentTarget.dataset.url;
    // 在实际应用中，这里应该跳转到新闻详情页或使用webview
    wx.showModal({
      title: '新闻详情',
      content: '此功能将在后续版本中完善，敬请期待！',
      showCancel: false
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `${this.data.selectedCurrency.name}汇率AI分析 - 当前汇率 ${this.data.currentRate}`,
      path: '/pages/advice/advice',
      imageUrl: '/images/share-cover.png' // 可以添加分享封面图
    };
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshAIContent().then(() => {
      wx.stopPullDownRefresh();
    });
  }
}); 