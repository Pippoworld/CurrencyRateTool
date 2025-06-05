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
    
    // AI分析内容
    analysis: {
      trend: '美元兑人民币近期呈现震荡上行趋势，受美联储政策预期影响较大。技术面显示多头仍占主导，但需警惕短期回调风险。',
      technical: 'MACD金叉信号确认，RSI指标处于65附近的强势区间。20日均线提供有效支撑，短期阻力位在7.25附近。',
      fundamental: '美国经济数据表现强劲，通胀预期温和上升。中美贸易关系相对稳定，人民币基本面支撑仍存。',
      risk: '关注美联储下次会议纪要，警惕突发地缘政治事件。建议分批建仓，控制单次仓位不超过总资金20%。'
    },
    
    // 换汇建议时间线
    timeline: [
      {
        status: 'current',
        title: '当前时点',
        description: '汇率处于相对合理区间',
        suggestedRate: '7.10-7.15'
      },
      {
        status: 'upcoming',
        title: '1-2周内',
        description: '等待技术面确认突破',
        suggestedRate: '7.05-7.20'
      },
      {
        status: 'future',
        title: '1个月内',
        description: '关注基本面变化',
        suggestedRate: '6.95-7.30'
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

    // 市场资讯
    marketNews: [
      {
        title: '美联储暗示年内可能再次加息',
        summary: '美联储官员表示，如果通胀持续高于目标，可能考虑进一步收紧货币政策...',
        source: '路透社',
        time: '2小时前',
        impact: '汇率上涨',
        impactLevel: 'positive',
        url: 'https://example.com/news1'
      },
      {
        title: '中国出口数据超预期增长',
        summary: '最新贸易数据显示，中国11月出口同比增长8.5%，远超市场预期的3.2%...',
        source: '新华社',
        time: '4小时前',
        impact: '人民币走强',
        impactLevel: 'positive',
        url: 'https://example.com/news2'
      },
      {
        title: '地缘政治紧张局势缓解',
        summary: '国际关系专家认为，近期地缘政治风险有所下降，有利于全球资本市场稳定...',
        source: '华尔街日报',
        time: '6小时前',
        impact: '市场稳定',
        impactLevel: 'neutral',
        url: 'https://example.com/news3'
      }
    ]
  },

  onLoad() {
    this.loadCurrencyData();
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
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 打开新闻详情
  openNewsDetail(e) {
    const url = e.currentTarget.dataset.url;
    // 在实际应用中，这里应该跳转到新闻详情页或使用webview
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: `${this.data.selectedCurrency.name}汇率分析 - 当前汇率 ${this.data.currentRate}`,
      path: '/pages/advice/advice'
    };
  }
}); 