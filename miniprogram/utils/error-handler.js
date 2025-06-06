/**
 * 全局错误处理器
 * 提供统一的错误处理、用户反馈和错误上报机制
 */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.reportEndpoint = 'https://your-error-report-api.com/report';
    this.retryAttempts = 3;
  }

  /**
   * 处理错误
   * @param {Error|string} error 错误对象或错误信息
   * @param {string} context 错误上下文
   * @param {object} extra 额外信息
   * @param {boolean} showToUser 是否向用户显示错误
   */
  handle(error, context = 'unknown', extra = {}, showToUser = true) {
    const errorInfo = this.processError(error, context, extra);
    
    // 记录错误日志
    this.logError(errorInfo);
    
    // 添加到错误队列
    this.addToQueue(errorInfo);
    
    // 显示用户友好的错误信息
    if (showToUser) {
      this.showUserError(errorInfo);
    }
    
    // 异步上报错误
    this.reportError(errorInfo);
    
    return errorInfo;
  }

  /**
   * 处理网络错误
   * @param {object} networkError 网络错误对象
   * @param {string} url 请求URL
   */
  handleNetworkError(networkError, url = '') {
    const errorInfo = {
      type: 'network',
      message: this.getNetworkErrorMessage(networkError),
      code: networkError.errMsg || networkError.statusCode,
      url: url,
      timestamp: Date.now(),
      userAgent: this.getUserAgent()
    };

    this.handle(errorInfo, 'network', {}, true);
    return errorInfo;
  }

  /**
   * 处理API错误
   * @param {object} apiError API错误响应
   * @param {string} endpoint API端点
   */
  handleApiError(apiError, endpoint = '') {
    const errorInfo = {
      type: 'api',
      message: apiError.message || '服务器响应错误',
      code: apiError.code || apiError.statusCode,
      endpoint: endpoint,
      response: apiError.data,
      timestamp: Date.now()
    };

    this.handle(errorInfo, 'api', {}, true);
    return errorInfo;
  }

  /**
   * 处理存储错误
   * @param {Error} storageError 存储错误
   * @param {string} operation 操作类型
   */
  handleStorageError(storageError, operation = '') {
    const errorInfo = {
      type: 'storage',
      message: '数据存储出现问题',
      originalMessage: storageError.message,
      operation: operation,
      timestamp: Date.now()
    };

    this.handle(errorInfo, 'storage', {}, false);
    return errorInfo;
  }

  /**
   * 处理JavaScript运行时错误
   * @param {Error} jsError JavaScript错误
   * @param {string} source 错误来源
   */
  handleJSError(jsError, source = '') {
    const errorInfo = {
      type: 'javascript',
      message: jsError.message,
      stack: jsError.stack,
      source: source,
      timestamp: Date.now()
    };

    this.handle(errorInfo, 'javascript', {}, false);
    return errorInfo;
  }

  /**
   * 处理错误对象
   * @param {Error|string|object} error 错误
   * @param {string} context 上下文
   * @param {object} extra 额外信息
   * @returns {object} 格式化的错误信息
   */
  processError(error, context, extra) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      context: context,
      userAgent: this.getUserAgent(),
      ...extra
    };

    if (error instanceof Error) {
      errorInfo.type = 'exception';
      errorInfo.message = error.message;
      errorInfo.stack = error.stack;
      errorInfo.name = error.name;
    } else if (typeof error === 'string') {
      errorInfo.type = 'message';
      errorInfo.message = error;
    } else if (typeof error === 'object') {
      errorInfo.type = 'object';
      errorInfo.message = error.message || JSON.stringify(error);
      Object.assign(errorInfo, error);
    } else {
      errorInfo.type = 'unknown';
      errorInfo.message = String(error);
    }

    return errorInfo;
  }

  /**
   * 记录错误日志
   * @param {object} errorInfo 错误信息
   */
  logError(errorInfo) {
    const logLevel = this.getLogLevel(errorInfo.type);
    const logMessage = `[${logLevel}] ${errorInfo.context}: ${errorInfo.message}`;
    
    if (logLevel === 'ERROR') {
      console.error(logMessage, errorInfo);
    } else if (logLevel === 'WARN') {
      console.warn(logMessage, errorInfo);
    } else {
      console.log(logMessage, errorInfo);
    }
  }

  /**
   * 显示用户友好的错误信息
   * @param {object} errorInfo 错误信息
   */
  showUserError(errorInfo) {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    const icon = this.getErrorIcon(errorInfo.type);

    wx.showToast({
      title: userMessage,
      icon: icon,
      duration: 3000,
      mask: true
    });

    // 对于严重错误，显示模态对话框
    if (this.isCriticalError(errorInfo)) {
      setTimeout(() => {
        wx.showModal({
          title: '系统提示',
          content: userMessage + '\n\n如问题持续出现，请联系客服。',
          confirmText: '知道了',
          showCancel: false
        });
      }, 3500);
    }
  }

  /**
   * 获取用户友好的错误信息
   * @param {object} errorInfo 错误信息
   * @returns {string}
   */
  getUserFriendlyMessage(errorInfo) {
    const messageMap = {
      network: '网络连接不稳定，请检查网络设置',
      api: '服务暂时不可用，请稍后再试',
      storage: '数据保存失败，请重试',
      javascript: '程序出现异常，正在修复中',
      timeout: '请求超时，请检查网络连接',
      permission: '权限不足，请检查应用权限设置',
      rate_limit: '请求过于频繁，请稍后再试',
      validation: '输入数据有误，请检查后重试'
    };

    // 特殊错误码处理
    if (errorInfo.code) {
      const codeMessages = {
        400: '请求参数错误',
        401: '身份验证失败',
        403: '访问被拒绝',
        404: '请求的资源不存在',
        429: '请求过于频繁',
        500: '服务器内部错误',
        502: '服务器网关错误',
        503: '服务暂时不可用'
      };

      if (codeMessages[errorInfo.code]) {
        return codeMessages[errorInfo.code];
      }
    }

    return messageMap[errorInfo.type] || '操作失败，请重试';
  }

  /**
   * 获取网络错误信息
   * @param {object} networkError 网络错误
   * @returns {string}
   */
  getNetworkErrorMessage(networkError) {
    const errMsg = networkError.errMsg || '';
    
    if (errMsg.includes('timeout')) {
      return '网络请求超时';
    } else if (errMsg.includes('fail')) {
      return '网络请求失败';
    } else if (errMsg.includes('abort')) {
      return '网络请求被取消';
    } else {
      return '网络连接异常';
    }
  }

  /**
   * 获取错误图标
   * @param {string} errorType 错误类型
   * @returns {string}
   */
  getErrorIcon(errorType) {
    const iconMap = {
      network: 'loading',
      api: 'error',
      storage: 'none',
      javascript: 'error'
    };

    return iconMap[errorType] || 'none';
  }

  /**
   * 判断是否为关键错误
   * @param {object} errorInfo 错误信息
   * @returns {boolean}
   */
  isCriticalError(errorInfo) {
    const criticalTypes = ['javascript', 'api'];
    const criticalCodes = [500, 502, 503];
    
    return criticalTypes.includes(errorInfo.type) || 
           criticalCodes.includes(errorInfo.code);
  }

  /**
   * 获取日志级别
   * @param {string} errorType 错误类型
   * @returns {string}
   */
  getLogLevel(errorType) {
    const levelMap = {
      javascript: 'ERROR',
      api: 'ERROR',
      network: 'WARN',
      storage: 'WARN'
    };

    return levelMap[errorType] || 'INFO';
  }

  /**
   * 添加错误到队列
   * @param {object} errorInfo 错误信息
   */
  addToQueue(errorInfo) {
    this.errorQueue.push(errorInfo);
    
    // 保持队列大小
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * 上报错误
   * @param {object} errorInfo 错误信息
   */
  async reportError(errorInfo) {
    try {
      // 在生产环境中才上报
      if (this.isProduction()) {
        const reportData = {
          ...errorInfo,
          appVersion: this.getAppVersion(),
          systemInfo: this.getSystemInfo()
        };

        // 异步上报，不影响主流程
        setTimeout(() => {
          this.sendErrorReport(reportData);
        }, 1000);
      }
    } catch (error) {
      console.warn('错误上报失败:', error);
    }
  }

  /**
   * 发送错误报告
   * @param {object} reportData 报告数据
   */
  async sendErrorReport(reportData) {
    let attempts = 0;
    
    while (attempts < this.retryAttempts) {
      try {
        await this.makeReportRequest(reportData);
        console.log('错误报告发送成功');
        break;
      } catch (error) {
        attempts++;
        if (attempts >= this.retryAttempts) {
          console.warn('错误报告发送失败，已达到最大重试次数');
        } else {
          // 指数退避重试
          await this.delay(Math.pow(2, attempts) * 1000);
        }
      }
    }
  }

  /**
   * 发起错误报告请求
   * @param {object} reportData 报告数据
   */
  makeReportRequest(reportData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.reportEndpoint,
        method: 'POST',
        data: reportData,
        header: {
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`报告请求失败: ${res.statusCode}`));
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * 获取系统信息
   * @returns {object}
   */
  getSystemInfo() {
    try {
      return wx.getSystemInfoSync();
    } catch (error) {
      return {};
    }
  }

  /**
   * 获取应用版本
   * @returns {string}
   */
  getAppVersion() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo.miniProgram.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 获取用户代理信息
   * @returns {string}
   */
  getUserAgent() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      return `${systemInfo.platform} ${systemInfo.system} WeChat/${systemInfo.version}`;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * 判断是否为生产环境
   * @returns {boolean}
   */
  isProduction() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo.miniProgram.envVersion === 'release';
    } catch (error) {
      return false;
    }
  }

  /**
   * 生成错误ID
   * @returns {string}
   */
  generateErrorId() {
    return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 延迟函数
   * @param {number} ms 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取错误统计
   * @returns {object}
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorQueue.length,
      errorsByType: {},
      recentErrors: this.errorQueue.slice(-10)
    };

    this.errorQueue.forEach(error => {
      const type = error.type || 'unknown';
      stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 清空错误队列
   */
  clearErrorQueue() {
    this.errorQueue = [];
    console.log('错误队列已清空');
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler();

// 便捷方法
const ErrorUtils = {
  // 网络错误处理
  handleNetworkError: (error, url) => errorHandler.handleNetworkError(error, url),
  
  // API错误处理  
  handleApiError: (error, endpoint) => errorHandler.handleApiError(error, endpoint),
  
  // 存储错误处理
  handleStorageError: (error, operation) => errorHandler.handleStorageError(error, operation),
  
  // JavaScript错误处理
  handleJSError: (error, source) => errorHandler.handleJSError(error, source),
  
  // 通用错误处理
  handle: (error, context, extra, showToUser) => errorHandler.handle(error, context, extra, showToUser),
  
  // 获取错误统计
  getStats: () => errorHandler.getErrorStats(),
  
  // 清空错误记录
  clear: () => errorHandler.clearErrorQueue()
};

module.exports = {
  errorHandler,
  ErrorUtils
}; 