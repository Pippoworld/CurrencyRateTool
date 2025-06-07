// app.js
App({
  onLaunch() {
    console.log('小程序启动');

    // 检查是否是首次启动，并进行初始化
    this.initializeOnFirstLaunch();
    
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   您当前的环境ID为: cloud1-9gm2w1zn7a98a6c0
        env: 'cloud1-9gm2w1zn7a98a6c0',
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

  // 首次启动时进行初始化
  initializeOnFirstLaunch() {
    try {
      const isInitialized = wx.getStorageSync('app_initialized');
      if (!isInitialized) {
        console.log('首次启动，开始初始化...');
        
        // 1. 设置默认货币对：人民币 -> 美元
        const defaultSettings = {
          fromCurrencyIndex: 0, // 人民币
          toCurrencyIndex: 1,   // 美元
          updateTime: new Date().getTime()
        };
        wx.setStorageSync('global_currency_settings', defaultSettings);
        console.log('已设置默认货币:', defaultSettings);

        // 2. 在这里可以添加更多的首次启动设置，例如用户引导、默认主题等

        // 3. 标记初始化完成
        wx.setStorageSync('app_initialized', true);
        console.log('小程序初始化完成');
      } else {
        console.log('非首次启动');
      }
    } catch (error) {
      console.error('初始化过程失败:', error);
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
        wx.setStorageSync('global_currency_settings', settings);
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
