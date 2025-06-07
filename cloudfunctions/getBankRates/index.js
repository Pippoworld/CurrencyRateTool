// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { currencyCode } = event;

  console.log(`[云函数 getBankRates] 收到请求: currencyCode=${currencyCode}`);

  // --- 在这里编写您的真实银行汇率获取逻辑 ---
  // 这通常需要调用一个能提供各银行外汇牌价的第三方API
  
  // 目前，我们先返回一个固定的、成功的模拟数据
  const mockRates = [
    { name: '中国银行(云端)', type: '国有银行', buy: (7.18 * 0.99).toFixed(4), sell: (7.18 * 1.01).toFixed(4) },
    { name: '工商银行(云端)', type: '国有银行', buy: (7.18 * 0.98).toFixed(4), sell: (7.18 * 1.02).toFixed(4) },
    { name: '招商银行(云端)', type: '股份制银行', buy: (7.18 * 0.97).toFixed(4), sell: (7.18 * 1.03).toFixed(4) }
  ];

  return {
    success: true,
    rates: mockRates,
    message: '获取银行汇率成功'
  };
}; 