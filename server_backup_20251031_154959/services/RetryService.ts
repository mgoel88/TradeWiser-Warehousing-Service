interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

class RetryService {
  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffFactor: 2,
    retryCondition: (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') return true;
      if (error?.status >= 500 && error?.status < 600) return true;
      if (error?.message?.includes('fetch failed')) return true;
      return false;
    }
  };

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts}`);
        
        const result = await operation();
        
        const totalTime = Date.now() - startTime;
        console.log(`✅ Operation succeeded on attempt ${attempt} (${totalTime}ms)`);
        
        return {
          success: true,
          result,
          attempts: attempt,
          totalTime
        };
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`❌ Attempt ${attempt} failed:`, lastError.message);
        
        // Check if we should retry
        if (attempt < finalConfig.maxAttempts && finalConfig.retryCondition?.(lastError)) {
          const delay = this.calculateDelay(attempt - 1, finalConfig);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        } else if (attempt < finalConfig.maxAttempts) {
          console.log(`🚫 Error not retryable, stopping retry attempts`);
          break;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.error(`💥 All retry attempts failed (${totalTime}ms)`);
    
    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxAttempts,
      totalTime
    };
  }

  private calculateDelay(attemptNumber: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attemptNumber);
    return Math.min(delay, config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specialized retry configurations for different scenarios
  getWebhookRetryConfig(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffFactor: 2,
      retryCondition: (error) => {
        // Don't retry authentication errors or client errors
        if (error?.status >= 400 && error?.status < 500) return false;
        return this.defaultConfig.retryCondition!(error);
      }
    };
  }

  getOutboundAPIRetryConfig(): RetryConfig {
    return {
      maxAttempts: parseInt(process.env.OUTBOUND_API_RETRY_ATTEMPTS || '3'),
      baseDelay: 2000,
      maxDelay: 30000,
      backoffFactor: 2.5,
      retryCondition: (error) => {
        // More aggressive retry for outbound APIs
        return this.defaultConfig.retryCondition!(error);
      }
    };
  }

  getHealthCheckRetryConfig(): RetryConfig {
    return {
      maxAttempts: 2, // Quick health checks
      baseDelay: 500,
      maxDelay: 2000,
      backoffFactor: 2,
      retryCondition: (error) => this.defaultConfig.retryCondition!(error)
    };
  }
}

export default RetryService;