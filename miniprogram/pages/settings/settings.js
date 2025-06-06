Page({
  data: {
    userInfo: {
      nickname: '留学生小王',
      avatar: ''
    },
    
    countries: [
      { name: '美国', code: 'US', currency: 'USD' },
      { name: '英国', code: 'GB', currency: 'GBP' },
      { name: '澳大利亚', code: 'AU', currency: 'AUD' },
      { name: '加拿大', code: 'CA', currency: 'CAD' },
      { name: '德国', code: 'DE', currency: 'EUR' },
      { name: '法国', code: 'FR', currency: 'EUR' },
      { name: '日本', code: 'JP', currency: 'JPY' },
      { name: '韩国', code: 'KR', currency: 'KRW' },
      { name: '新加坡', code: 'SG', currency: 'SGD' },
      { name: '瑞士', code: 'CH', currency: 'CHF' }
    ],
    countryIndex: 0,
    
    currencies: [
      { code: 'USD', name: '美元', flag: '🇺🇸' },
      { code: 'EUR', name: '欧元', flag: '🇪🇺' },
      { code: 'GBP', name: '英镑', flag: '🇬🇧' },
      { code: 'JPY', name: '日元', flag: '🇯🇵' },
      { code: 'AUD', name: '澳元', flag: '🇦🇺' },
      { code: 'CAD', name: '加元', flag: '🇨🇦' },
      { code: 'CHF', name: '瑞士法郎', flag: '🇨🇭' },
      { code: 'HKD', name: '港币', flag: '🇭🇰' },
      { code: 'SGD', name: '新加坡元', flag: '🇸🇬' },
      { code: 'KRW', name: '韩元', flag: '🇰🇷' }
    ],
    defaultCurrencyIndex: 0,
    
    precisionOptions: [
      { label: '2位小数 (7.12)', value: 2 },
      { label: '3位小数 (7.123)', value: 3 },
      { label: '4位小数 (7.1234)', value: 4 }
    ],
    precisionIndex: 0,
    
    darkMode: false,
    vibrationFeedback: true,
    
    notifications: {
      rateAlert: true,
      dailyReport: false,
      importantEvents: true
    },
    
    pushTime: '09:00'
  },

  onLoad: function () {
    this.loadUserSettings()
  },

  onShow: function () {
    // 页面显示时刷新设置
    this.loadUserSettings()
  },

  // 加载用户设置
  loadUserSettings() {
    try {
      // 从本地存储加载设置
      const settings = wx.getStorageSync('userSettings')
      if (settings) {
        this.setData({
          ...this.data,
          ...settings
        })
      }
      
      // 加载用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({ userInfo })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },

  // 保存设置到本地
  saveSettings() {
    try {
      const settings = {
        countryIndex: this.data.countryIndex,
        defaultCurrencyIndex: this.data.defaultCurrencyIndex,
        precisionIndex: this.data.precisionIndex,
        darkMode: this.data.darkMode,
        vibrationFeedback: this.data.vibrationFeedback,
        notifications: this.data.notifications,
        pushTime: this.data.pushTime
      }
      
      wx.setStorageSync('userSettings', settings)
      
      // 保存用户信息
      wx.setStorageSync('userInfo', this.data.userInfo)
      
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  },

  // 选择头像
  chooseAvatar() {
    // 微信小程序头像选择
    wx.chooseAvatar({
      success: (res) => {
        const avatarUrl = res.avatarUrl;
        this.setData({
          'userInfo.avatar': avatarUrl
        });
        this.saveSettings();
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
        
        this.vibrate();
      },
      fail: (error) => {
        console.error('选择头像失败:', error);
        // 降级方案：使用普通图片选择
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          success: (res) => {
            const tempFilePath = res.tempFiles[0].tempFilePath;
            this.setData({
              'userInfo.avatar': tempFilePath
            });
            this.saveSettings();
            
            wx.showToast({
              title: '头像更新成功',
              icon: 'success'
            });
            
            this.vibrate();
          },
          fail: (mediaError) => {
            console.error('图片选择失败:', mediaError);
            wx.showToast({
              title: '头像选择失败',
              icon: 'error'
            });
          }
        });
      }
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickname': e.detail.value
    })
    
    // 延迟保存，避免频繁写入
    clearTimeout(this.nicknameTimer)
    this.nicknameTimer = setTimeout(() => {
      this.saveSettings()
    }, 1000)
  },

  // 留学国家变化
  onCountryChange(e) {
    const countryIndex = parseInt(e.detail.value)
    this.setData({ countryIndex })
    
    // 自动设置对应的默认货币
    const selectedCountry = this.data.countries[countryIndex]
    const currencyIndex = this.data.currencies.findIndex(
      currency => currency.code === selectedCountry.currency
    )
    
    if (currencyIndex >= 0) {
      this.setData({ defaultCurrencyIndex: currencyIndex })
    }
    
    this.saveSettings()
    this.vibrate()
  },

  // 默认货币变化
  onDefaultCurrencyChange(e) {
    this.setData({
      defaultCurrencyIndex: parseInt(e.detail.value)
    })
    this.saveSettings()
    this.vibrate()
  },

  // 精度变化
  onPrecisionChange(e) {
    this.setData({
      precisionIndex: parseInt(e.detail.value)
    })
    this.saveSettings()
    this.vibrate()
  },

  // 暗黑模式切换
  onDarkModeChange(e) {
    this.setData({
      darkMode: e.detail.value
    })
    this.saveSettings()
    this.vibrate()
    
    // 这里可以实现主题切换逻辑
    if (e.detail.value) {
      wx.showToast({
        title: '暗黑模式开启',
        icon: 'none'
      })
    }
  },

  // 震动反馈切换
  onVibrationChange(e) {
    this.setData({
      vibrationFeedback: e.detail.value
    })
    this.saveSettings()
    
    if (e.detail.value) {
      wx.vibrateShort()
    }
  },

  // 汇率提醒切换
  onRateNotificationChange(e) {
    this.setData({
      'notifications.rateAlert': e.detail.value
    })
    this.saveSettings()
    this.vibrate()
  },

  // 每日报告切换
  onDailyReportChange(e) {
    this.setData({
      'notifications.dailyReport': e.detail.value
    })
    this.saveSettings()
    this.vibrate()
  },

  // 重要事件提醒切换
  onEventsNotificationChange(e) {
    this.setData({
      'notifications.importantEvents': e.detail.value
    })
    this.saveSettings()
    this.vibrate()
  },

  // 推送时间变化
  onPushTimeChange(e) {
    this.setData({
      pushTime: e.detail.value
    })
    this.saveSettings()
    this.vibrate()
  },

  // 清理缓存
  clearCache() {
    wx.showModal({
      title: '清理缓存',
      content: '确定要清理所有缓存数据吗？这将删除汇率数据缓存、API使用统计等临时数据，但不会影响您的个人设置。',
      confirmText: '确定清理',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清理中...'
          });
          
          this.performCacheClear();
        }
      }
    });
  },

  // 执行真实的缓存清理
  performCacheClear() {
    try {
      // 获取所有存储的key
      const info = wx.getStorageInfoSync();
      const allKeys = info.keys;
      let clearedCount = 0;
      
      // 定义需要保留的用户数据key（不清理）
      const preserveKeys = [
        'userSettings',
        'userInfo', 
        'currencySettings',
        'rateSettings',
        'priceAlerts'
      ];
      
      // 清理缓存类数据
      allKeys.forEach(key => {
        if (!preserveKeys.includes(key)) {
          // 清理汇率缓存
          if (key.startsWith('exchange_rates_') || 
              key.startsWith('cache_') ||
              key.startsWith('api_') ||
              key.startsWith('lastAlert_') ||
              key.includes('last_update') ||
              key.includes('market_') ||
              key === 'api_usage_stats') {
            try {
              wx.removeStorageSync(key);
              clearedCount++;
              console.log(`已清理缓存: ${key}`);
            } catch (error) {
              console.warn(`清理缓存失败: ${key}`, error);
            }
          }
        }
      });
      
      // 模拟清理时间
      setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: `清理完成，删除${clearedCount}项`,
          icon: 'success',
          duration: 2000
        });
        this.vibrate();
      }, 1000);
      
    } catch (error) {
      console.error('清理缓存失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '清理失败，请重试',
        icon: 'error'
      });
    }
  },

  // 重置设置
  resetSettings() {
    wx.showModal({
      title: '重置设置',
      content: '确定要重置所有设置为默认值吗？此操作不可撤销。',
      confirmText: '确定',
      cancelText: '取消',
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          try {
            wx.removeStorageSync('userSettings')
            
            // 重置页面数据
            this.setData({
              countryIndex: 0,
              defaultCurrencyIndex: 0,
              precisionIndex: 0,
              darkMode: false,
              vibrationFeedback: true,
              notifications: {
                rateAlert: true,
                dailyReport: false,
                importantEvents: true
              },
              pushTime: '09:00'
            })
            
            wx.showToast({
              title: '设置已重置',
              icon: 'success'
            })
            
            this.vibrate()
          } catch (error) {
            console.error('重置设置失败:', error)
            wx.showToast({
              title: '重置失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 显示隐私政策
  showPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们非常重视您的隐私保护。本应用仅收集必要的汇率数据用于为您提供服务，不会收集您的个人敏感信息。',
      confirmText: '了解',
      showCancel: false
    })
    this.vibrate()
  },

  // 显示用户协议
  showUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '感谢您使用汇率助手。使用本应用即表示您同意遵守相关使用条款。汇率数据仅供参考，实际交易请以银行报价为准。',
      confirmText: '同意',
      showCancel: false
    })
    this.vibrate()
  },

  // 联系客服
  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '如有问题或建议，请通过以下方式联系我们：\n\n📧 邮箱：support@currency-helper.com\n💬 微信：currency_helper\n📱 客服热线：400-123-4567',
      confirmText: '好的',
      showCancel: false
    })
    this.vibrate()
  },

  // 给应用评分
  rateApp() {
    wx.showModal({
      title: '给个好评',
      content: '如果您觉得汇率助手对您有帮助，请在应用商店给我们5星好评，这是对我们最大的支持！',
      confirmText: '去评分',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '感谢您的支持',
            icon: 'success'
          })
        }
      }
    })
    this.vibrate()
  },

  // 震动反馈
  vibrate() {
    if (this.data.vibrationFeedback) {
      wx.vibrateShort()
    }
  }
}) 