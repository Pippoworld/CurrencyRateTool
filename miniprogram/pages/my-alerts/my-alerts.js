Page({
  data: {
    alerts: [],
    activeAlerts: [],
    triggeredAlerts: [],
    isLoading: true,
    
    // 新建/编辑提醒
    showCreateForm: false,
    formData: {
      type: 'buy', // buy/sell
      price: '',
      fromCurrency: 'AUD',
      toCurrency: 'CNY',
      fromCurrencyName: '澳元',
      toCurrencyName: '人民币',
      currentRate: ''
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  onLoad(options) {
    // 处理从详情页跳转的参数
    if (options.action === 'create') {
      this.setData({
        showCreateForm: true,
        'formData.type': options.type || 'buy',
        'formData.price': options.price || '',
        'formData.fromCurrency': options.fromCurrency || 'AUD',
        'formData.toCurrency': options.toCurrency || 'CNY',
        'formData.currentRate': options.currentRate || ''
      });
    }
    
    this.loadAlerts();
  },

  onShow() {
    this.loadAlerts();
  },

  // 加载提醒列表
  loadAlerts() {
    try {
      const alerts = wx.getStorageSync('priceAlerts') || [];
      const activeAlerts = alerts.filter(alert => alert.isActive && !alert.hasTriggered);
      const triggeredAlerts = alerts.filter(alert => alert.hasTriggered);
      
      this.setData({
        alerts: alerts,
        activeAlerts: activeAlerts,
        triggeredAlerts: triggeredAlerts,
        isLoading: false
      });
    } catch (error) {
      console.error('加载提醒失败:', error);
      this.setData({
        isLoading: false
      });
    }
  },

  // 显示创建表单
  showCreateAlert() {
    this.setData({
      showCreateForm: true,
      'formData.type': 'buy',
      'formData.price': '',
      'formData.fromCurrency': 'AUD',
      'formData.toCurrency': 'CNY'
    });
  },

  // 隐藏创建表单
  hideCreateForm() {
    this.setData({
      showCreateForm: false
    });
  },

  // 表单输入处理
  onFormInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 切换提醒类型
  switchAlertType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      'formData.type': type
    });
  },

  // 保存提醒
  saveAlert() {
    const { formData } = this.data;
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      wx.showToast({
        title: '请输入有效价格',
        icon: 'error'
      });
      return;
    }

    const alertData = {
      id: Date.now().toString(),
      type: formData.type,
      price: parseFloat(formData.price).toFixed(4),
      fromCurrency: formData.fromCurrency,
      toCurrency: formData.toCurrency,
      fromCurrencyName: formData.fromCurrencyName,
      toCurrencyName: formData.toCurrencyName,
      currentRate: formData.currentRate,
      createTime: new Date().toISOString(),
      isActive: true,
      hasTriggered: false,
      triggerDirection: formData.type === 'buy' ? 'below' : 'above'
    };

    try {
      const existingAlerts = wx.getStorageSync('priceAlerts') || [];
      existingAlerts.push(alertData);
      wx.setStorageSync('priceAlerts', existingAlerts);

      wx.showToast({
        title: '提醒设置成功',
        icon: 'success'
      });

      this.hideCreateForm();
      this.loadAlerts();
    } catch (error) {
      console.error('保存提醒失败:', error);
      wx.showToast({
        title: '设置失败，请重试',
        icon: 'error'
      });
    }
  },

  // 删除提醒
  deleteAlert(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个价格提醒吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const alerts = wx.getStorageSync('priceAlerts') || [];
            const filteredAlerts = alerts.filter(alert => alert.id !== id);
            wx.setStorageSync('priceAlerts', filteredAlerts);
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            this.loadAlerts();
          } catch (error) {
            console.error('删除提醒失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 切换提醒状态
  toggleAlert(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      const alerts = wx.getStorageSync('priceAlerts') || [];
      const alertIndex = alerts.findIndex(alert => alert.id === id);
      
      if (alertIndex !== -1) {
        alerts[alertIndex].isActive = !alerts[alertIndex].isActive;
        wx.setStorageSync('priceAlerts', alerts);
        this.loadAlerts();
        
        wx.showToast({
          title: alerts[alertIndex].isActive ? '提醒已启用' : '提醒已暂停',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('切换提醒状态失败:', error);
    }
  },

  // 重置已触发的提醒
  resetAlert(e) {
    const { id } = e.currentTarget.dataset;
    
    try {
      const alerts = wx.getStorageSync('priceAlerts') || [];
      const alertIndex = alerts.findIndex(alert => alert.id === id);
      
      if (alertIndex !== -1) {
        alerts[alertIndex].hasTriggered = false;
        alerts[alertIndex].isActive = true;
        wx.setStorageSync('priceAlerts', alerts);
        this.loadAlerts();
        
        wx.showToast({
          title: '提醒已重置',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('重置提醒失败:', error);
    }
  },

  // 清空所有已触发提醒
  clearTriggeredAlerts() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有已触发的提醒记录吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            const alerts = wx.getStorageSync('priceAlerts') || [];
            const activeAlerts = alerts.filter(alert => !alert.hasTriggered);
            wx.setStorageSync('priceAlerts', activeAlerts);
            
            wx.showToast({
              title: '清空成功',
              icon: 'success'
            });
            
            this.loadAlerts();
          } catch (error) {
            console.error('清空失败:', error);
            wx.showToast({
              title: '清空失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 格式化时间
  formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN');
  }
}); 