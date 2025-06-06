Page({
  data: {
    userInfo: {
      nickname: '留学生小王',
      avatar: ''
    },
    
    countries: [
      { name: '无', code: 'NONE', currency: null },
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
      { code: 'CNY', name: '人民币', flag: '🇨🇳' },
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
    this.loadUserSettings();
    this.checkFirstTimeUser();
  },

  onShow: function () {
    // 页面显示时刷新设置
    this.loadUserSettings();
  },

  // 检查是否首次使用，获取微信用户信息
  checkFirstTimeUser() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.nickname) {
        // 首次使用，尝试获取微信用户信息
        wx.getUserProfile({
          desc: '用于完善个人资料',
          success: (res) => {
            this.setData({
              'userInfo.nickname': res.userInfo.nickName,
              'userInfo.avatar': res.userInfo.avatarUrl
            });
            this.saveSettings();
            
            wx.showToast({
              title: '欢迎使用汇率助手',
              icon: 'success',
              duration: 2000
            });
          },
          fail: (error) => {
            console.log('用户拒绝授权', error);
            // 用户拒绝授权，使用默认信息
            this.setData({
              'userInfo.nickname': '留学生',
              'userInfo.avatar': ''
            });
          }
        });
      }
    } catch (error) {
      console.error('检查首次用户失败:', error);
    }
  },

  // 长按头像显示调试面板
  onAvatarLongPress() {
    const debugPath = '/pages/debug/debug';
    
    wx.showModal({
      title: '开发者选项',
      content: '是否进入调试模式？\n\n调试模式可以查看应用状态、测试功能连通性等。',
      confirmText: '进入调试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: debugPath,
            success: () => {
              wx.showToast({
                title: '进入调试模式',
                icon: 'success'
              });
            },
            fail: (error) => {
              console.error('跳转调试页失败:', error);
              wx.showToast({
                title: '调试模式暂不可用',
                icon: 'error'
              });
            }
          });
        }
      }
    });
    
    this.vibrate();
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
    const newCountryIndex = parseInt(e.detail.value)
    const selectedCountry = this.data.countries[newCountryIndex]
    const oldCountryIndex = this.data.countryIndex
    
    // 如果选择的是同一个国家，不做处理
    if (newCountryIndex === oldCountryIndex) {
      return
    }
    
    // 先更新UI显示
    this.setData({ countryIndex: newCountryIndex })
    
    // 如果选择的是"无"
    if (selectedCountry.code === 'NONE') {
      wx.showModal({
        title: '留学国家设置',
        content: '您选择了"无"，系统将不会根据留学国家自动推荐货币。您可以在首页和汇率详情页手动选择关注的货币。',
        confirmText: '确定',
        showCancel: false,
        success: () => {
          this.saveSettings()
          this.vibrate()
        }
      })
      return
    }
    
    // 查找对应货币
    const currencyIndex = this.data.currencies.findIndex(
      currency => currency.code === selectedCountry.currency
    )
    
    if (currencyIndex >= 0) {
      const targetCurrency = this.data.currencies[currencyIndex]
      
      wx.showModal({
        title: '更新监控货币',
        content: `您选择了${selectedCountry.name}作为留学国家。\n\n是否要将目标货币更改为${targetCurrency.flag} ${targetCurrency.name}？\n\n持有货币将保持不变，这将影响首页的汇率计算器和监控设置。`,
        confirmText: '是，同步更改',
        cancelText: '否，保持原设置',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: `已切换到${targetCurrency.name}`,
              icon: 'success',
              duration: 2000
            })
            
            // 通知其他页面货币设置已更改
            this.syncCurrencyToAllPages(currencyIndex)
          }
          
          this.saveSettings()
          this.vibrate()
        }
      })
    } else {
      // 没有找到对应货币，只保存国家设置
      this.saveSettings()
      this.vibrate()
    }
  },

  // 同步货币设置到所有页面 - 只修改目标货币
  syncCurrencyToAllPages(currencyIndex) {
    try {
      // 获取当前的货币设置
      const currentSettings = wx.getStorageSync('currencySettings') || {};
      
      // 保持持有货币不变，只更改目标货币
      const fromIndex = currentSettings.fromCurrencyIndex || 0; // 保持原有的持有货币，默认人民币
      const toIndex = currencyIndex; // 目标货币改为选择的国家货币
      
      const globalSettings = {
        fromCurrencyIndex: fromIndex,
        toCurrencyIndex: toIndex
      }
      
      wx.setStorageSync('currencySettings', globalSettings)
      
      // 通知app.js同步到其他页面
      const app = getApp()
      if (app && app.syncCurrencySettings) {
        app.syncCurrencySettings(globalSettings)
      }
      
      const fromCurrency = this.data.currencies[fromIndex]
      const toCurrency = this.data.currencies[toIndex]
      console.log(`已同步货币设置: 持有${fromCurrency.name} → 目标${toCurrency.name}`, globalSettings)
    } catch (error) {
      console.error('同步货币设置失败:', error)
    }
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
  },

  // 跳转到汇率详情页进行监控设置
  goToRateDetail() {
    wx.switchTab({
      url: '/pages/rate-detail/rate-detail',
      success: () => {
        console.log('从设置页跳转到汇率详情页');
        wx.showToast({
          title: '正在进入监控设置',
          icon: 'success',
          duration: 1500
        });
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'error'
        });
      }
    });
  }
}) 