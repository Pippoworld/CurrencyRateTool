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
    this.updateAnalysis()
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
    const analysisData = {
      'USD': {
        trend: '美元兑人民币汇率近期表现强势，技术面和基本面均支持进一步上涨。',
        technical: 'RSI指标显示超买，但趋势依然向上，关注7.25阻力位。',
        fundamental: '美联储政策收紧预期和美国经济数据向好支撑美元走强。',
        risk: '关注中美贸易关系和地缘政治风险对汇率的影响。'
      },
      'EUR': {
        trend: '欧元兑人民币汇率受欧央行政策和经济数据影响较大。',
        technical: '技术指标显示震荡整理，短期方向不明确。',
        fundamental: '欧洲经济复苏缓慢，通胀压力上升，政策前景不确定。',
        risk: '欧洲政治风险和能源危机可能影响欧元走势。'
      }
    }

    const analysis = analysisData[currencyCode] || analysisData['USD']
    this.setData({ analysis })
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
  }
}) 