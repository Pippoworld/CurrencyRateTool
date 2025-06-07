// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { from, to, rate } = event;

  console.log(`[云函数 getAlertSuggestions] 收到请求: from=${from}, to=${to}, rate=${rate}`);

  // --- 在这里编写您的真实提醒建议逻辑 ---
  // 目前，我们先返回一个固定的、成功的模拟建议
  const mockSuggestions = {
    buyAlert: {
      price: (rate * 0.98).toFixed(4),
      reason: '云端建议：比当前低2%'
    },
    sellAlert: {
      price: (rate * 1.02).toFixed(4),
      reason: '云端建议：比当前高2%'
    }
  };

  return {
    success: true,
    suggestions: mockSuggestions,
    message: '获取提醒建议成功'
  };
}; 