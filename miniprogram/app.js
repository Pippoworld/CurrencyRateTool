// app.js
App({
  onLaunch() {
    console.log('小程序启动');
    this.initGlobalData();
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
  },

  onShow() {
    console.log('小程序显示');
  },

  onHide() {
    console.log('小程序隐藏');
  },

  // 初始化全局数据
  initGlobalData() {
    try {
      // 确保全局货币设置存在
      const settings = wx.getStorageSync('currencySettings');
      if (!settings) {
        const defaultSettings = {
          fromCurrencyIndex: 1, // 美元
          toCurrencyIndex: 0,   // 人民币
          updateTime: new Date().getTime()
        };
        wx.setStorageSync('currencySettings', defaultSettings);
        console.log('已初始化默认货币设置:', defaultSettings);
      } else {
        console.log('全局货币设置已存在:', settings);
      }
    } catch (error) {
      console.error('初始化全局数据失败:', error);
    }
  },

  // 全局数据
  globalData: {
    // env 参数说明：
    //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
    //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
    //   如不填则使用默认环境（第一个创建的环境）
    env: "",
    
    // 当前版本
    version: '1.0.0',
    
    // 强制刷新所有页面的数据
    forceRefreshAllPages() {
      const pages = getCurrentPages();
      console.log('强制刷新所有页面数据，当前页面数:', pages.length);
      
      pages.forEach((page, index) => {
        if (page.loadGlobalCurrencySettings) {
          console.log(`刷新页面${index}的数据:`, page.route);
          page.loadGlobalCurrencySettings();
        }
        if (page.updateExchangeRate) {
          page.updateExchangeRate();
        }
        if (page.generateAdvice) {
          page.generateAdvice();
        }
      });
    },

    // 同步货币设置到所有页面
    syncCurrencySettings(settings) {
      try {
        wx.setStorageSync('currencySettings', settings);
        console.log('全局货币设置已更新:', settings);
        
        // 立即同步到所有已打开的页面
        this.forceRefreshAllPages();
        
        return true;
      } catch (error) {
        console.error('同步货币设置失败:', error);
        return false;
      }
    }
  }
});
