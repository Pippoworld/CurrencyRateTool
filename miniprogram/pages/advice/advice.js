Page({
  data: {
    selectedCurrency: { code: 'USD', name: '美元', flag: '🇺🇸' },
    currentRate: 7.12,
    rateChange: '+0.05 (+0.7%)',
    changeStatus: 'positive',
    changeIcon: '📈',
    
    // 7日汇率走势图数据
    chartData: [
      { height: 60, color: '#4CAF50', label: '1/15' },
      { height: 75, color: '#FFC107', label: '1/16' },
      { height: 85, color: '#F44336', label: '1/17' },
      { height: 70, color: '#4CAF50', label: '1/18' },
      { height: 90, color: '#F44336', label: '1/19' },
      { height: 65, color: '#4CAF50', label: '1/20' },
      { height: 80, color: '#667eea', label: '今日' }
    ],
    
    // AI分析数据
    analysis: {
      trend: '美元兑人民币汇率近7日呈现震荡上行趋势，技术面显示短期内可能继续走强。建议关注美联储政策动向和中美贸易关系变化。',
      technical: 'RSI指标显示超买信号，MACD金叉形成，布林带上轨压力明显。短期阻力位7.25，支撑位7.05。',
      fundamental: '美国经济数据向好，通胀预期上升，美联储鹰派言论增多。中国经济复苏稳健，人民币基本面支撑较强。',
      risk: '国际地缘政治风险、美联储货币政策转向、中美关系变化等因素可能导致汇率大幅波动，建议分散风险。'
    },
    
    // 换汇建议时间线
    timeline: [
      {
        status: 'active',
        title: '立即换汇',
        description: '当前汇率处于相对低位，适合小额换汇满足近期需求',
        suggestedRate: '7.10-7.15'
      },
      {
        status: 'warning',
        title: '3-5天后',
        description: '预计汇率可能小幅上升，如不急需建议等待回调',
        suggestedRate: '7.05-7.12'
      },
      {
        status: 'neutral',
        title: '1-2周后',
        description: '中期趋势不明确，建议关注重要经济数据和政策动向',
        suggestedRate: '6.95-7.20'
      }
    ],
    
    // 换汇方式推荐
    exchangeMethods: [
      {
        icon: '🏦',
        name: '银行柜台',
        rate: '7.12',
        fee: '免费',
        arrivalTime: '即时',
        recommended: false,
        advantages: '安全可靠，汇率透明，适合大额换汇'
      },
      {
        icon: '💳',
        name: '手机银行',
        rate: '7.10',
        fee: '0.1%',
        arrivalTime: '即时',
        recommended: true,
        advantages: '汇率优惠，操作便捷，24小时可用'
      },
      {
        icon: '📱',
        name: '支付宝',
        rate: '7.15',
        fee: '0.2%',
        arrivalTime: '即时',
        recommended: false,
        advantages: '操作简单，到账快速，适合小额换汇'
      },
      {
        icon: '🌐',
        name: '专业机构',
        rate: '7.08',
        fee: '0.3%',
        arrivalTime: '1-2小时',
        recommended: false,
        advantages: '汇率最优，服务专业，适合频繁换汇'
      }
    ],
    
    // 提醒设置
    reminderSettings: {
      rateAlert: true,
      dailyAnalysis: false,
      eventAlert: true
    },
    
    targetRate: '7.05'
  },

  onLoad: function (options) {
    // 从本地存储获取当前选择的货币
    try {
      const currentCurrency = wx.getStorageSync('currentCurrency')
      if (currentCurrency) {
        this.setData({
          selectedCurrency: currentCurrency
        })
        this.loadCurrencyData(currentCurrency.code)
      }
    } catch (error) {
      console.log('获取当前货币失败，使用默认货币')
    }
    
    this.generateChartData()
  },

  onShow: function () {
    console.log('建议页onShow - 开始同步数据');
    this.loadGlobalCurrencySettings();
    this.loadCurrencyData();
    this.updateCurrencyDisplay();
    console.log('建议页onShow - 数据同步完成');
  },

  // 加载特定货币的数据
  loadCurrencyData(currencyCode) {
    // 模拟加载不同货币的数据
    const currencyData = {
      'USD': {
        currentRate: 7.12,
        rateChange: '+0.05 (+0.7%)',
        changeStatus: 'positive',
        changeIcon: '📈'
      },
      'EUR': {
        currentRate: 7.65,
        rateChange: '-0.03 (-0.4%)',
        changeStatus: 'negative',
        changeIcon: '📉'
      },
      'GBP': {
        currentRate: 8.92,
        rateChange: '+0.12 (+1.4%)',
        changeStatus: 'positive',
        changeIcon: '📈'
      },
      'AUD': {
        currentRate: 4.68,
        rateChange: '-0.08 (-1.7%)',
        changeStatus: 'negative',
        changeIcon: '📉'
      }
    }

    const data = currencyData[currencyCode] || currencyData['USD']
    this.setData(data)
    
    this.updateExchangeMethods(currencyCode)
    this.updateAnalysisForCurrency(currencyCode)
  },

  // 生成图表数据
  generateChartData() {
    const today = new Date()
    const chartData = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const height = 50 + Math.random() * 40 // 50-90之间的随机高度
      const colors = ['#4CAF50', '#FFC107', '#F44336', '#667eea']
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      chartData.push({
        height: height,
        color: color,
        label: i === 0 ? '今日' : `${date.getMonth() + 1}/${date.getDate()}`
      })
    }
    
    this.setData({ chartData })
  },

  // 更新分析内容
  updateAnalysis() {
    // 这里可以调用AI接口获取最新分析
    console.log('更新AI分析内容')
  },

  // 更新特定货币的分析
  updateAnalysisForCurrency(currencyCode) {
    console.log('根据货币更新分析内容:', currencyCode);
    
    const analysisData = {
      'USD': {
        trend: '美元兑人民币汇率近期表现强势，美联储政策和经济数据支持美元走强。技术面显示继续上涨潜力。',
        technical: 'RSI指标显示超买但趋势向上，MACD金叉确认，关注7.25阻力位和7.05支撑位。',
        fundamental: '美联储政策收紧预期、美国经济数据向好、就业市场强劲，多重因素支撑美元。',
        risk: '关注中美贸易关系变化、美联储政策转向风险、全球地缘政治因素影响。'
      },
      'EUR': {
        trend: '欧元兑人民币汇率受欧央行政策影响较大，经济复苏缓慢导致汇率波动加大。',
        technical: '技术指标显示震荡整理，短期方向不明确，关注7.60-7.80区间突破情况。',
        fundamental: '欧洲经济复苏缓慢，通胀压力上升，欧央行政策前景存在不确定性。',
        risk: '欧洲政治风险、能源危机、通胀持续高企等因素可能影响欧元走势。'
      },
      'GBP': {
        trend: '英镑兑人民币汇率波动较大，英国经济政策和央行决策对汇率影响显著。',
        technical: '技术面显示高位震荡，关注8.80-9.20关键区间，突破方向将决定后续走势。',
        fundamental: '英国经济增长放缓，通胀压力依然存在，英央行政策立场相对鹰派。',
        risk: '英国政治不确定性、脱欧后续影响、与欧盟关系变化等风险需要关注。'
      },
      'JPY': {
        trend: '日元兑人民币汇率受日央行超宽松政策影响，长期处于相对弱势地位。',
        technical: '技术指标显示低位徘徊，短期难有大幅上涨，关注0.045-0.055区间。',
        fundamental: '日本央行维持超宽松政策，经济复苏缓慢，通胀目标难以达成。',
        risk: '日央行政策转向风险、日本经济结构性问题、老龄化社会挑战等因素。'
      },
      'AUD': {
        trend: '澳元兑人民币汇率与大宗商品价格关联度高，中澳贸易关系影响显著。',
        technical: '技术面显示区间震荡，关注4.50-5.00重要区间，商品价格是关键驱动因素。',
        fundamental: '澳洲经济依赖资源出口，中国需求和铁矿石价格对澳元影响较大。',
        risk: '中澳关系变化、大宗商品价格波动、澳洲房地产市场调整等风险。'
      },
      'CNY': {
        trend: '人民币作为基准货币，主要关注对其他主要货币的相对强弱变化。',
        technical: '人民币汇率指数相对稳定，央行政策工具丰富，双向波动特征明显。',
        fundamental: '中国经济稳健增长，货币政策相对稳健，国际化进程持续推进。',
        risk: '外部经济环境变化、贸易摩擦、资本流动波动等因素影响汇率稳定。'
      }
    };

    const analysis = analysisData[currencyCode] || analysisData['USD'];
    this.setData({ analysis });
    
    console.log(`${currencyCode}分析内容已更新:`, analysis.trend.substring(0, 30) + '...');
  },

  // 更新换汇方式
  updateExchangeMethods(currencyCode) {
    // 根据不同货币更新汇率和推荐方式
    const methods = this.data.exchangeMethods.map(method => {
      // 模拟不同货币的汇率差异
      const rate = this.data.currentRate
      const adjustment = (Math.random() - 0.5) * 0.1
      
      return {
        ...method,
        rate: (rate + adjustment).toFixed(3)
      }
    })
    
    this.setData({ exchangeMethods: methods })
  },

  // 设置目标汇率
  setTargetRate() {
    wx.showModal({
      title: '设置目标汇率',
      content: '请输入您期望的汇率价位，达到后我们会及时提醒您。',
      editable: true,
      placeholderText: '输入目标汇率',
      success: (res) => {
        if (res.confirm && res.content) {
          this.setData({ targetRate: res.content })
          wx.showToast({
            title: '目标汇率设置成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 分享分析
  shareAnalysis() {
    wx.showActionSheet({
      itemList: ['分享给微信好友', '分享到朋友圈', '复制分析内容'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 分享给好友
            wx.showToast({ title: '功能开发中', icon: 'none' })
            break
          case 1:
            // 分享到朋友圈
            wx.showToast({ title: '功能开发中', icon: 'none' })
            break
          case 2:
            // 复制内容
            const content = `${this.data.selectedCurrency.name}汇率分析\n当前汇率: ${this.data.currentRate}\n变化: ${this.data.rateChange}\n\n趋势分析: ${this.data.analysis.trend}`
            wx.setClipboardData({
              data: content,
              success: () => {
                wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
              }
            })
            break
        }
      }
    })
  },

  // 提醒设置变化
  onRateAlertChange(e) {
    this.setData({
      'reminderSettings.rateAlert': e.detail.value
    })
  },

  onDailyAnalysisChange(e) {
    this.setData({
      'reminderSettings.dailyAnalysis': e.detail.value
    })
  },

  onEventAlertChange(e) {
    this.setData({
      'reminderSettings.eventAlert': e.detail.value
    })
  },

  // 目标汇率输入
  onTargetRateInput(e) {
    this.setData({
      targetRate: e.detail.value
    })
  },

  // 保存目标汇率
  saveTargetRate() {
    if (!this.data.targetRate) {
      wx.showToast({
        title: '请输入目标汇率',
        icon: 'none'
      })
      return
    }

    // 这里应该保存到后端或本地存储
    wx.showToast({
      title: '目标汇率保存成功',
      icon: 'success'
    })
  },

  // 加载全局货币设置
  loadGlobalCurrencySettings() {
    try {
      const settings = wx.getStorageSync('currencySettings');
      if (settings) {
        // 更新选中的货币信息
        const fromCurrency = this.getCurrencyInfo(settings.fromCurrencyIndex);
        this.setData({
          selectedCurrency: {
            flag: fromCurrency.flag,
            name: fromCurrency.name,
            code: fromCurrency.code
          }
        });
        console.log('建议页已更新为全局货币设置:', fromCurrency);
        
        // 根据新货币更新分析内容
        this.updateAnalysisForCurrency(fromCurrency.code);
        this.loadCurrencyData(fromCurrency.code);
      }
    } catch (error) {
      console.log('建议页加载全局货币设置失败:', error);
    }
  },

  // 获取货币信息
  getCurrencyInfo(index) {
    const currencies = [
      { code: 'CNY', name: '人民币', flag: '🇨🇳' },
      { code: 'USD', name: '美元', flag: '🇺🇸' },
      { code: 'EUR', name: '欧元', flag: '🇪🇺' },
      { code: 'JPY', name: '日元', flag: '🇯🇵' },
      { code: 'GBP', name: '英镑', flag: '🇬🇧' },
      { code: 'AUD', name: '澳元', flag: '🇦🇺' },
      { code: 'CAD', name: '加元', flag: '🇨🇦' },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
      { code: 'HKD', name: '港币', flag: '🇭🇰' },
      { code: 'SGD', name: '新加坡元', flag: '🇸🇬' }
    ];
    return currencies[index] || currencies[1]; // 默认美元
  },

  // 更新货币显示
  updateCurrencyDisplay() {
    // 更新页面标题或其他显示的货币信息
    const currentCurrency = this.data.selectedCurrency;
    console.log('建议页当前显示货币:', currentCurrency);
    
    // 如果AI内容已加载，重新生成适合当前货币的内容
    if (!this.data.isLoadingAnalysis) {
      this.refreshAIAnalysisOnly();
    }
  },

  // 仅刷新AI分析（不显示加载状态）
  async refreshAIAnalysisOnly() {
    try {
      const currencyPair = `${this.data.selectedCurrency.name}/人民币`;
      console.log('静默刷新AI分析，货币对:', currencyPair);
      
      const analysis = await geminiAPI.generateRateAnalysis(
        currencyPair, 
        this.data.currentRate, 
        this.data.rateChange
      );
      
      this.setData({ 
        analysis: analysis
      });
      
      console.log('AI分析静默更新完成');
    } catch (error) {
      console.error('静默刷新AI分析失败:', error);
    }
  },
}) 