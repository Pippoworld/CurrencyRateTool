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
      trend: '🤖 AI分析中，请稍候...',
      technical: '🤖 AI分析中，请稍候...',
      fundamental: '🤖 AI分析中，请稍候...',
      risk: '🤖 AI分析中，请稍候...'
    },
    
    // 换汇建议时间线 - 初始化为空，将通过AI生成
    timeline: [
      {
        status: 'current',
        title: '当前时点',
        description: '🤖 正在生成AI建议，请稍候...',
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
        title: '🤖 正在获取AI资讯...',
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
    isLoadingNews: true,

    // 调试信息
    debugInfo: {
      analysisTime: 0,
      adviceTime: 0,
      newsTime: 0,
      lastUpdate: ''
    }
  },

  async onLoad() {
    console.log('建议页面开始加载...');
    this.loadCurrencyData();
    
    // 记录开始时间
    const startTime = Date.now();
    
    try {
      // 并行加载AI生成的内容
      const [analysisResult, adviceResult, newsResult] = await Promise.allSettled([
        this.loadAIAnalysis(),
        this.loadAIAdvice(), 
        this.loadAINews()
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log('AI内容加载完成，总耗时:', totalTime, 'ms');
      console.log('加载结果:', { analysisResult, adviceResult, newsResult });
      
      this.setData({
        'debugInfo.lastUpdate': new Date().toLocaleTimeString()
      });
      
      // 显示加载结果
      const failedTasks = [];
      if (analysisResult.status === 'rejected') failedTasks.push('分析');
      if (adviceResult.status === 'rejected') failedTasks.push('建议');
      if (newsResult.status === 'rejected') failedTasks.push('资讯');
      
      if (failedTasks.length > 0) {
        wx.showToast({
          title: `${failedTasks.join('、')}加载失败`,
          icon: 'none',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '🤖 AI内容加载完成',
          icon: 'success'
        });
      }
      
    } catch (error) {
      console.error('加载AI内容时发生错误:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
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
      console.log('货币数据已加载:', fromCurrency);
    }
  },

  // 加载AI分析
  async loadAIAnalysis() {
    try {
      const startTime = Date.now();
      this.setData({ isLoadingAnalysis: true });
      
      const currencyPair = `${this.data.selectedCurrency.name}/人民币`;
      console.log('开始加载AI分析，货币对:', currencyPair);
      
      const analysis = await geminiAPI.generateRateAnalysis(
        currencyPair, 
        this.data.currentRate, 
        this.data.rateChange
      );
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      this.setData({ 
        analysis: analysis,
        isLoadingAnalysis: false,
        'debugInfo.analysisTime': loadTime
      });
      
      console.log('AI分析加载完成，耗时:', loadTime, 'ms', analysis);
      return analysis;
    } catch (error) {
      console.error('加载AI分析失败:', error);
      this.setData({ isLoadingAnalysis: false });
      throw error;
    }
  },

  // 加载AI建议
  async loadAIAdvice() {
    try {
      const startTime = Date.now();
      this.setData({ isLoadingAdvice: true });
      
      const currencyPair = `${this.data.selectedCurrency.name}/人民币`;
      console.log('开始加载AI建议，货币对:', currencyPair);
      
      const advice = await geminiAPI.generateExchangeAdvice(
        currencyPair,
        this.data.currentRate
      );
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      this.setData({ 
        timeline: advice,
        isLoadingAdvice: false,
        'debugInfo.adviceTime': loadTime
      });
      
      console.log('AI建议加载完成，耗时:', loadTime, 'ms', advice);
      return advice;
    } catch (error) {
      console.error('加载AI建议失败:', error);
      this.setData({ isLoadingAdvice: false });
      throw error;
    }
  },

  // 加载AI新闻
  async loadAINews() {
    try {
      const startTime = Date.now();
      this.setData({ isLoadingNews: true });
      
      const currencyCode = this.data.selectedCurrency.code || 'USD';
      console.log('开始加载AI新闻，货币代码:', currencyCode);
      
      const news = await geminiAPI.generateMarketNews(currencyCode);
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      this.setData({ 
        marketNews: news,
        isLoadingNews: false,
        'debugInfo.newsTime': loadTime
      });
      
      console.log('AI新闻加载完成，耗时:', loadTime, 'ms', news);
      return news;
    } catch (error) {
      console.error('加载AI新闻失败:', error);
      this.setData({ isLoadingNews: false });
      throw error;
    }
  },

  // 刷新AI内容
  async refreshAIContent() {
    console.log('手动刷新AI内容...');
    
    wx.showLoading({
      title: '🤖 刷新中...'
    });

    try {
      const startTime = Date.now();
      
      await Promise.all([
        this.loadAIAnalysis(),
        this.loadAIAdvice(),
        this.loadAINews()
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      wx.hideLoading();
      wx.showToast({
        title: `🤖 AI内容已更新 (${Math.round(totalTime/1000)}s)`,
        icon: 'success'
      });
      
      this.setData({
        'debugInfo.lastUpdate': new Date().toLocaleTimeString()
      });
      
    } catch (error) {
      console.error('刷新AI内容失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '刷新失败，请重试',
        icon: 'none'
      });
    }
  },

  // 显示调试信息
  showDebugInfo() {
    const { debugInfo } = this.data;
    const debugText = `
AI分析: ${debugInfo.analysisTime}ms
AI建议: ${debugInfo.adviceTime}ms  
AI资讯: ${debugInfo.newsTime}ms
最后更新: ${debugInfo.lastUpdate}

开发模式已启用，使用增强模拟数据
如需真实AI，请配置合法域名后关闭DEV_MODE`;

    wx.showModal({
      title: '🛠️ 调试信息',
      content: debugText,
      showCancel: false,
      confirmText: '确定'
    });
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