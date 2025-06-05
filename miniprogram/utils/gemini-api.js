// Gemini AI API 服务
// 注意：在生产环境中，API密钥应该通过后端服务调用，而不是直接在前端暴露

const GEMINI_API_KEY = 'AIzaSyBGCflxFOZ8Ps5THxOxphKzPYGhcp0e-tY';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL_NAME = 'gemini-2.0-flash'; // 使用最新的Gemini 2.0 Flash模型

// 开发模式 - 如果API调用失败，直接使用模拟数据
const DEV_MODE = true; 

class GeminiAPI {
  
  // 生成汇率分析内容
  async generateRateAnalysis(currencyPair, currentRate, rateChange) {
    console.log('开始生成AI汇率分析...', { currencyPair, currentRate, rateChange });
    
    if (DEV_MODE) {
      console.log('开发模式：使用增强的模拟数据');
      return this.getEnhancedAnalysis(currencyPair, currentRate, rateChange);
    }

    const prompt = `作为专业的外汇分析师，请为${currencyPair}汇率提供详细分析。

当前信息：
- 汇率：${currentRate}
- 变化：${rateChange}

请提供以下4个方面的专业分析，每个方面控制在50字以内：

1. 趋势分析：分析当前汇率走势和技术面情况
2. 技术指标：提及MACD、RSI、均线等技术指标的表现  
3. 基本面分析：分析影响汇率的经济因素
4. 风险提示：提醒投资者需要注意的风险点

请用JSON格式返回，格式如下：
{
  "trend": "趋势分析内容",
  "technical": "技术指标分析",
  "fundamental": "基本面分析", 
  "risk": "风险提示"
}`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Gemini API调用失败，使用备用数据:', error);
      return this.getEnhancedAnalysis(currencyPair, currentRate, rateChange);
    }
  }

  // 生成换汇建议
  async generateExchangeAdvice(currencyPair, currentRate, amount) {
    console.log('开始生成AI换汇建议...', { currencyPair, currentRate, amount });
    
    if (DEV_MODE) {
      console.log('开发模式：使用增强的建议数据');
      return this.getEnhancedAdvice(currencyPair, currentRate);
    }

    const prompt = `作为专业的换汇顾问，请为${currencyPair}换汇提供建议。

当前情况：
- 汇率：${currentRate}
- 换汇金额：${amount || '不确定'}

请提供以下建议（每个建议控制在30字以内）：

1. 当前时点建议（是否适合立即换汇）
2. 1-2周内的操作建议
3. 1个月内的策略建议

请用JSON格式返回：
{
  "current": {
    "title": "当前时点",
    "description": "建议内容",
    "suggestedRate": "建议汇率区间"
  },
  "shortTerm": {
    "title": "1-2周内", 
    "description": "建议内容",
    "suggestedRate": "建议汇率区间"
  },
  "longTerm": {
    "title": "1个月内",
    "description": "建议内容", 
    "suggestedRate": "建议汇率区间"
  }
}`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseAdviceResponse(response);
    } catch (error) {
      console.error('Gemini API调用失败，使用备用数据:', error);
      return this.getEnhancedAdvice(currencyPair, currentRate);
    }
  }

  // 生成市场资讯
  async generateMarketNews(currencyCode) {
    console.log('开始生成AI市场资讯...', { currencyCode });
    
    if (DEV_MODE) {
      console.log('开发模式：使用增强的新闻数据');
      return this.getEnhancedNews(currencyCode);
    }

    const prompt = `作为财经新闻编辑，请为${currencyCode}相关的汇率市场生成3条模拟新闻。

要求：
1. 新闻要符合当前经济环境
2. 标题控制在20字以内
3. 摘要控制在40字以内
4. 包含对汇率的影响分析

请用JSON格式返回：
[
  {
    "title": "新闻标题",
    "summary": "新闻摘要", 
    "source": "新闻来源",
    "time": "发布时间（如：2小时前）",
    "impact": "对汇率影响（如：汇率上涨）",
    "impactLevel": "影响程度（positive/negative/neutral）"
  }
]`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return this.parseNewsResponse(response);
    } catch (error) {
      console.error('Gemini API调用失败，使用备用数据:', error);
      return this.getEnhancedNews(currencyCode);
    }
  }

  // 调用Gemini API核心方法
  async callGeminiAPI(prompt) {
    const url = `${GEMINI_API_BASE}/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log('发起Gemini API请求:', url);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    return new Promise((resolve, reject) => {
      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: requestBody,
        timeout: 30000,
        success: (response) => {
          console.log('Gemini API 响应:', response);
          
          if (response.statusCode !== 200) {
            reject(new Error(`API请求失败: ${response.statusCode} - ${JSON.stringify(response.data)}`));
            return;
          }

          if (!response.data.candidates || response.data.candidates.length === 0) {
            reject(new Error('API返回数据格式错误'));
            return;
          }

          const content = response.data.candidates[0].content.parts[0].text;
          resolve(content);
        },
        fail: (error) => {
          console.error('Gemini API 请求失败:', error);
          reject(new Error(`网络请求失败: ${error.errMsg}`));
        }
      });
    });
  }

  // 增强的分析数据 - 根据实际参数生成
  getEnhancedAnalysis(currencyPair, currentRate, rateChange) {
    const rate = parseFloat(currentRate);
    const change = rateChange.includes('+') ? 'positive' : 'negative';
    
    const scenarios = {
      '美元/人民币': {
        trend: `美元兑人民币当前汇率${currentRate}，${change === 'positive' ? '近期呈现上涨趋势' : '近期有所回调'}，技术面显示${change === 'positive' ? '多头占主导' : '空头施压'}。`,
        technical: `RSI指标处于${change === 'positive' ? '65附近强势区间' : '45附近弱势区间'}，MACD${change === 'positive' ? '金叉确认' : '死叉信号'}，短期${change === 'positive' ? '阻力位7.25' : '支撑位7.00'}。`,
        fundamental: '美国经济数据表现强劲，通胀预期温和。中美贸易关系相对稳定，人民币基本面支撑较强。',
        risk: '关注美联储政策变化和地缘政治风险，建议分批操作，控制仓位风险。'
      },
      '欧元/人民币': {
        trend: `欧元兑人民币汇率${currentRate}，受欧央行政策影响，${change === 'positive' ? '技术面偏强' : '走势偏弱'}。`,
        technical: `技术指标显示${change === 'positive' ? '突破整理区间' : '震荡下行'}，关注关键支撑阻力位。`,
        fundamental: '欧洲经济复苏缓慢，通胀压力上升，货币政策前景不确定性较大。',
        risk: '欧洲政治风险和能源危机可能影响汇率走势，需谨慎操作。'
      }
    };
    
    return scenarios[currencyPair] || scenarios['美元/人民币'];
  }

  // 增强的建议数据
  getEnhancedAdvice(currencyPair, currentRate) {
    const rate = parseFloat(currentRate);
    const isHighRate = rate > 7.15; // 以美元为例
    
    return [
      {
        status: 'current',
        title: '当前时点',
        description: isHighRate ? '汇率偏高，建议小额试仓' : '汇率相对合理，可适量操作',
        suggestedRate: `${(rate - 0.05).toFixed(2)}-${(rate + 0.05).toFixed(2)}`
      },
      {
        status: 'upcoming',
        title: '1-2周内',
        description: isHighRate ? '等待回调至更优价位' : '关注技术面突破确认',
        suggestedRate: `${(rate - 0.10).toFixed(2)}-${(rate + 0.10).toFixed(2)}`
      },
      {
        status: 'future',
        title: '1个月内',
        description: '关注基本面变化和政策导向',
        suggestedRate: `${(rate - 0.20).toFixed(2)}-${(rate + 0.20).toFixed(2)}`
      }
    ];
  }

  // 增强的新闻数据
  getEnhancedNews(currencyCode) {
    const newsTemplates = {
      'USD': [
        {
          title: '美联储政策前瞻：利率决议受关注',
          summary: '市场预期美联储将维持当前利率水平，美元汇率走势取决于政策导向...',
          source: '金融时报',
          time: '2小时前',
          impact: '美元走强',
          impactLevel: 'positive'
        },
        {
          title: '美国通胀数据发布在即',
          summary: '分析师预期通胀数据将影响美联储政策预期，进而影响美元走势...',
          source: '路透社',
          time: '4小时前',
          impact: '汇率波动',
          impactLevel: 'neutral'
        },
        {
          title: '中美贸易关系现新进展',
          summary: '两国高级官员举行会谈，市场对贸易关系改善抱有期待...',
          source: '财经网',
          time: '6小时前',
          impact: '汇率稳定',
          impactLevel: 'positive'
        }
      ],
      'EUR': [
        {
          title: '欧央行货币政策会议召开',
          summary: '欧央行官员讨论利率政策，市场关注后续政策导向...',
          source: '欧洲央行',
          time: '3小时前',
          impact: '欧元波动',
          impactLevel: 'neutral'
        }
      ]
    };
    
    return newsTemplates[currencyCode] || newsTemplates['USD'];
  }

  // 解析分析响应
  parseAnalysisResponse(response) {
    try {
      // 尝试解析JSON
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const analysis = JSON.parse(cleanResponse);
      
      return {
        trend: analysis.trend || '趋势分析暂不可用',
        technical: analysis.technical || '技术指标分析暂不可用', 
        fundamental: analysis.fundamental || '基本面分析暂不可用',
        risk: analysis.risk || '风险提示暂不可用'
      };
    } catch (error) {
      console.error('解析分析响应失败:', error);
      return this.getFallbackAnalysis();
    }
  }

  // 解析建议响应
  parseAdviceResponse(response) {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const advice = JSON.parse(cleanResponse);
      
      return [
        {
          status: 'current',
          title: advice.current?.title || '当前时点',
          description: advice.current?.description || '汇率处于合理区间',
          suggestedRate: advice.current?.suggestedRate || '参考当前汇率'
        },
        {
          status: 'upcoming', 
          title: advice.shortTerm?.title || '1-2周内',
          description: advice.shortTerm?.description || '继续观察市场变化',
          suggestedRate: advice.shortTerm?.suggestedRate || '关注技术面'
        },
        {
          status: 'future',
          title: advice.longTerm?.title || '1个月内', 
          description: advice.longTerm?.description || '关注基本面变化',
          suggestedRate: advice.longTerm?.suggestedRate || '综合考虑风险'
        }
      ];
    } catch (error) {
      console.error('解析建议响应失败:', error);
      return this.getFallbackAdvice();
    }
  }

  // 解析新闻响应
  parseNewsResponse(response) {
    try {
      const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const news = JSON.parse(cleanResponse);
      
      return Array.isArray(news) ? news.slice(0, 3) : this.getFallbackNews();
    } catch (error) {
      console.error('解析新闻响应失败:', error);
      return this.getFallbackNews();
    }
  }

  // 备用分析数据
  getFallbackAnalysis() {
    return {
      trend: '当前汇率呈现震荡走势，短期内方向性不够明确，建议关注关键技术位的突破情况。',
      technical: '技术指标显示RSI处于中性区间，MACD信号较为平缓，20日均线提供一定支撑。',
      fundamental: '基本面因素相对稳定，通胀预期温和，货币政策保持相对中性态势。', 
      risk: '需要关注地缘政治风险和主要经济数据发布，建议控制仓位和风险敞口。'
    };
  }

  // 备用建议数据
  getFallbackAdvice() {
    return [
      {
        status: 'current',
        title: '当前时点',
        description: '汇率处于相对合理区间，可适量操作',
        suggestedRate: '参考当前汇率水平'
      },
      {
        status: 'upcoming',
        title: '1-2周内',
        description: '建议等待技术面确认突破方向',
        suggestedRate: '关注关键技术位'
      },
      {
        status: 'future', 
        title: '1个月内',
        description: '关注基本面变化和政策导向',
        suggestedRate: '综合考虑多重因素'
      }
    ];
  }

  // 备用新闻数据
  getFallbackNews() {
    return [
      {
        title: '央行政策前瞻：市场关注利率走向',
        summary: '分析师预期央行将保持当前货币政策基调，汇率有望维持稳定...',
        source: '财经资讯',
        time: '1小时前',
        impact: '汇率稳定',
        impactLevel: 'neutral'
      },
      {
        title: '贸易数据公布：出口表现超预期',
        summary: '最新贸易数据显示出口同比增长，对本币汇率形成支撑...',
        source: '经济日报',
        time: '3小时前', 
        impact: '汇率走强',
        impactLevel: 'positive'
      },
      {
        title: '国际市场动态：美元指数震荡整理',
        summary: '美元指数近期震荡整理，为其他货币提供了相对稳定的环境...',
        source: '国际财经',
        time: '5小时前',
        impact: '影响有限', 
        impactLevel: 'neutral'
      }
    ];
  }
}

// 创建单例实例
const geminiAPI = new GeminiAPI();

module.exports = geminiAPI; 