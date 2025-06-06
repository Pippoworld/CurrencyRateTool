const API_KEY = '6dd11d18251299e0c7b6ecec';
const API_BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;

// 获取汇率数据
const getExchangeRates = (baseCurrency = 'USD') => {
  return new Promise((resolve, reject) => {
    // 检查缓存
    const cachedData = wx.getStorageSync('exchangeRates');
    const now = new Date().getTime();

    // 如果有缓存且未过期（例如1小时内），则使用缓存
    if (cachedData && (now - cachedData.timestamp < 3600 * 1000)) {
      console.log('使用缓存的汇率数据');
      resolve(cachedData.rates);
      return;
    }

    // 发起网络请求
    wx.request({
      url: `${API_BASE_URL}${baseCurrency}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.result === 'success') {
          console.log('成功获取实时汇率数据:', res.data);
          
          // 缓存数据和时间戳
          const ratesData = {
            rates: res.data.conversion_rates,
            timestamp: now
          };
          wx.setStorageSync('exchangeRates', ratesData);
          
          resolve(res.data.conversion_rates);
        } else {
          console.error('获取汇率失败:', res.data.error_type);
          reject(res.data.error_type || '获取汇率失败');
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
        reject('网络请求失败');
      }
    });
  });
};

module.exports = {
  getExchangeRates
}; 