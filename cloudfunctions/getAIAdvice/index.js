// 云函数入口文件
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 辅助函数：获取N天前的日期，格式为 YYYY/MM/DD
function getPastDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { from, to, rate: currentRateStr } = event;
  const currentRate = parseFloat(currentRateStr);

  // 1. 定义API密钥和基础URL (建议未来将密钥存储在环境变量中)
  const apiKey = '6dd11d18251299e0c7b6ecec';
  const historyBaseUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/history`;

  try {
    // 2. 获取7天前的日期和对应的历史汇率
    const pastDate = getPastDate(7);
    const historyUrl = `${historyBaseUrl}/${from}/${pastDate}`;
    
    console.log(`[云函数 getAIAdvice] 请求历史数据URL: ${historyUrl}`);
    const response = await axios.get(historyUrl);

    if (response.data.result !== 'success' || !response.data.conversion_rates) {
      throw new Error('获取历史汇率API失败');
    }
    
    const historicalRates = response.data.conversion_rates;
    const historicalRate = historicalRates[to];

    if (!historicalRate) {
      throw new Error(`在历史数据中未找到目标货币 ${to}`);
    }

    // 3. 比较汇率并生成动态建议
    const percentageChange = ((currentRate - historicalRate) / historicalRate) * 100;
    const changeText = percentageChange.toFixed(2) + '%';
    
    let advice;
    if (percentageChange > 2) { // 上涨超过2%
      advice = {
        icon: '🟠',
        status: 'warning',
        brief: `价格偏高, 比7日前上涨${changeText}`
      };
    } else if (percentageChange < -2) { // 下跌超过2%
      advice = {
        icon: '🟢',
        status: 'excellent',
        brief: `价格处于低位, 比7日前下跌${changeText}`
      };
    } else { // 波动在-2%到2%之间
      advice = {
        icon: '🔵',
        status: 'good',
        brief: `价格平稳, 7日内波动${changeText}`
      };
    }

    console.log(`[云函数 getAIAdvice] 分析完成: 当前=${currentRate}, 7日前=${historicalRate}, 波动=${changeText}`);

    return {
      success: true,
      advice: advice,
      message: '获取建议成功'
    };

  } catch (error) {
    console.error('[云函数 getAIAdvice] 逻辑执行失败:', error.message);
    // 返回一个标准的错误信息
    return {
      success: false,
      advice: {
        icon: '⚠️',
        status: 'neutral',
        brief: 'AI建议服务暂时不可用'
      },
      message: error.message
    };
  }
}; 