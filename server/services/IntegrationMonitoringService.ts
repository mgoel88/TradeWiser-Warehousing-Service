import { WebSocket } from 'ws';

interface WebhookMetrics {
  endpoint: string;
  success: number;
  failure: number;
  totalRequests: number;
  averageResponseTime: number;
  lastRequestTime?: string;
  errors: ErrorLog[];
}

interface ErrorLog {
  timestamp: string;
  endpoint: string;
  error: string;
  errorType: 'network' | 'validation' | 'business' | 'authentication';
  statusCode?: number;
  requestId: string;
  metadata?: any;
}

interface OutboundAPIMetrics {
  moduleName: string;
  url: string;
  isHealthy: boolean;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  lastSuccessTime?: string;
  lastFailureTime?: string;
  circuitBreakerStatus: 'closed' | 'open' | 'half-open';
}

interface WebSocketMetrics {
  activeConnections: number;
  totalConnections: number;
  messagesSent: number;
  messagesReceived: number;
  subscriptions: Map<string, number>;
}

class IntegrationMonitoringService {
  private webhookMetrics: Map<string, WebhookMetrics> = new Map();
  private outboundAPIMetrics: Map<string, OutboundAPIMetrics> = new Map();
  private errorLogs: ErrorLog[] = [];
  private websocketMetrics: WebSocketMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    subscriptions: new Map()
  };
  
  private circuitBreakers: Map<string, { failures: number, lastFailTime: number, status: 'closed' | 'open' | 'half-open' }> = new Map();
  private readonly maxErrors = 1000; // Keep last 1000 errors
  private readonly circuitBreakerThreshold = 5; // Open circuit after 5 consecutive failures
  private readonly circuitBreakerTimeout = 60000; // 1 minute timeout

  constructor() {
    this.initializeMetrics();
    this.startPeriodicCleanup();
  }

  private initializeMetrics() {
    // Initialize webhook endpoint metrics
    const webhookEndpoints = [
      '/api/webhooks/warehouse/status-update',
      '/api/webhooks/warehouse/weight-update', 
      '/api/webhooks/quality/results'
    ];

    webhookEndpoints.forEach(endpoint => {
      this.webhookMetrics.set(endpoint, {
        endpoint,
        success: 0,
        failure: 0,
        totalRequests: 0,
        averageResponseTime: 0,
        errors: []
      });
    });

    // Initialize outbound API metrics
    const externalModules = [
      { name: 'warehouse', url: process.env.WAREHOUSE_MODULE_URL || 'http://localhost:3001' },
      { name: 'quality', url: process.env.QUALITY_MODULE_URL || 'http://localhost:3002' },
      { name: 'iot-gateway', url: process.env.IOT_GATEWAY_URL || 'http://localhost:3003' }
    ];

    externalModules.forEach(module => {
      this.outboundAPIMetrics.set(module.name, {
        moduleName: module.name,
        url: module.url,
        isHealthy: true,
        successCount: 0,
        failureCount: 0,
        averageLatency: 0,
        circuitBreakerStatus: 'closed'
      });
      
      this.circuitBreakers.set(module.name, {
        failures: 0,
        lastFailTime: 0,
        status: 'closed'
      });
    });
  }

  // Webhook monitoring methods
  recordWebhookRequest(endpoint: string, success: boolean, responseTime: number, error?: string, errorType?: string, statusCode?: number) {
    const metrics = this.webhookMetrics.get(endpoint);
    if (!metrics) return;

    const requestId = this.generateRequestId();
    metrics.totalRequests++;
    
    if (success) {
      metrics.success++;
    } else {
      metrics.failure++;
      
      if (error) {
        const errorLog: ErrorLog = {
          timestamp: new Date().toISOString(),
          endpoint,
          error,
          errorType: errorType as any || 'business',
          statusCode,
          requestId,
          metadata: { responseTime }
        };
        
        metrics.errors.push(errorLog);
        this.errorLogs.unshift(errorLog);
        
        // Keep only recent errors per endpoint
        if (metrics.errors.length > 100) {
          metrics.errors = metrics.errors.slice(-50);
        }
      }
    }

    // Update average response time
    metrics.averageResponseTime = Math.round(
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests
    );
    
    metrics.lastRequestTime = new Date().toISOString();
    
    // Clean up global error logs
    if (this.errorLogs.length > this.maxErrors) {
      this.errorLogs = this.errorLogs.slice(0, this.maxErrors);
    }
    
    console.log(`📊 Webhook ${endpoint}: ${success ? 'SUCCESS' : 'FAILURE'} (${responseTime}ms)`);
  }

  // Outbound API monitoring methods
  recordOutboundAPICall(moduleName: string, success: boolean, latency: number, error?: string) {
    const metrics = this.outboundAPIMetrics.get(moduleName);
    const circuitBreaker = this.circuitBreakers.get(moduleName);
    
    if (!metrics || !circuitBreaker) return;

    const now = Date.now();
    
    if (success) {
      metrics.successCount++;
      metrics.lastSuccessTime = new Date().toISOString();
      metrics.isHealthy = true;
      
      // Update average latency
      const totalCalls = metrics.successCount + metrics.failureCount;
      metrics.averageLatency = Math.round(
        (metrics.averageLatency * (totalCalls - 1) + latency) / totalCalls
      );
      
      // Reset circuit breaker on success
      circuitBreaker.failures = 0;
      if (circuitBreaker.status === 'half-open') {
        circuitBreaker.status = 'closed';
        metrics.circuitBreakerStatus = 'closed';
      }
      
    } else {
      metrics.failureCount++;
      metrics.lastFailureTime = new Date().toISOString();
      metrics.isHealthy = false;
      
      // Circuit breaker logic
      circuitBreaker.failures++;
      circuitBreaker.lastFailTime = now;
      
      if (circuitBreaker.failures >= this.circuitBreakerThreshold && circuitBreaker.status === 'closed') {
        circuitBreaker.status = 'open';
        metrics.circuitBreakerStatus = 'open';
        console.warn(`🚨 Circuit breaker OPENED for ${moduleName} after ${circuitBreaker.failures} failures`);
      }
      
      if (error) {
        const errorLog: ErrorLog = {
          timestamp: new Date().toISOString(),
          endpoint: `outbound-${moduleName}`,
          error,
          errorType: 'network',
          requestId: this.generateRequestId(),
          metadata: { moduleName, latency, url: metrics.url }
        };
        
        this.errorLogs.unshift(errorLog);
      }
    }
    
    console.log(`🔄 Outbound ${moduleName}: ${success ? 'SUCCESS' : 'FAILURE'} (${latency}ms) [CB: ${circuitBreaker.status}]`);
  }

  // Circuit breaker check
  isCircuitBreakerOpen(moduleName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(moduleName);
    if (!circuitBreaker) return false;
    
    const now = Date.now();
    
    // Check if we should transition from open to half-open
    if (circuitBreaker.status === 'open' && 
        (now - circuitBreaker.lastFailTime) > this.circuitBreakerTimeout) {
      circuitBreaker.status = 'half-open';
      const metrics = this.outboundAPIMetrics.get(moduleName);
      if (metrics) metrics.circuitBreakerStatus = 'half-open';
      console.log(`🔄 Circuit breaker for ${moduleName} transitioning to HALF-OPEN`);
    }
    
    return circuitBreaker.status === 'open';
  }

  // WebSocket monitoring methods
  recordWebSocketConnection() {
    this.websocketMetrics.activeConnections++;
    this.websocketMetrics.totalConnections++;
  }

  recordWebSocketDisconnection() {
    this.websocketMetrics.activeConnections = Math.max(0, this.websocketMetrics.activeConnections - 1);
  }

  recordWebSocketMessage(type: 'sent' | 'received', entityType?: string) {
    if (type === 'sent') {
      this.websocketMetrics.messagesSent++;
    } else {
      this.websocketMetrics.messagesReceived++;
    }
    
    if (entityType) {
      const current = this.websocketMetrics.subscriptions.get(entityType) || 0;
      this.websocketMetrics.subscriptions.set(entityType, current + 1);
    }
  }

  // Health check methods
  async performHealthCheck(moduleName: string): Promise<boolean> {
    const metrics = this.outboundAPIMetrics.get(moduleName);
    if (!metrics) return false;
    
    if (this.isCircuitBreakerOpen(moduleName)) {
      return false; // Don't perform health checks when circuit is open
    }
    
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${metrics.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'TradeWiser-HealthCheck/1.0' }
      });
      
      clearTimeout(timeoutId);
      
      const latency = Date.now() - startTime;
      const isHealthy = response.ok;
      
      this.recordOutboundAPICall(moduleName, isHealthy, latency, 
        isHealthy ? undefined : `Health check failed with status ${response.status}`);
      
      return isHealthy;
    } catch (error) {
      const latency = Date.now() - Date.now(); // Minimal latency for failed requests
      this.recordOutboundAPICall(moduleName, false, latency, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  // Data retrieval methods
  getWebhookMetrics() {
    return Array.from(this.webhookMetrics.values());
  }

  getOutboundAPIMetrics() {
    return Array.from(this.outboundAPIMetrics.values());
  }

  getWebSocketMetrics() {
    return {
      ...this.websocketMetrics,
      subscriptions: Object.fromEntries(this.websocketMetrics.subscriptions)
    };
  }

  getRecentErrors(limit: number = 50, endpoint?: string) {
    let errors = this.errorLogs;
    
    if (endpoint) {
      errors = errors.filter(e => e.endpoint === endpoint);
    }
    
    return errors.slice(0, limit);
  }

  getSystemHealth() {
    const webhookHealth = this.getWebhookMetrics().map(m => ({
      endpoint: m.endpoint,
      isHealthy: (m.success / Math.max(m.totalRequests, 1)) > 0.95, // 95% success rate
      successRate: Math.round((m.success / Math.max(m.totalRequests, 1)) * 100),
      totalRequests: m.totalRequests,
      averageResponseTime: m.averageResponseTime
    }));
    
    const apiHealth = this.getOutboundAPIMetrics().map(m => ({
      module: m.moduleName,
      isHealthy: m.isHealthy && m.circuitBreakerStatus !== 'open',
      successRate: Math.round((m.successCount / Math.max(m.successCount + m.failureCount, 1)) * 100),
      circuitBreakerStatus: m.circuitBreakerStatus,
      averageLatency: m.averageLatency
    }));
    
    const overallHealth = webhookHealth.every(w => w.isHealthy) && apiHealth.every(a => a.isHealthy);
    
    return {
      overall: overallHealth ? 'healthy' : 'degraded',
      webhooks: webhookHealth,
      externalAPIs: apiHealth,
      websockets: this.getWebSocketMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPeriodicCleanup() {
    // Clean up old data every hour
    setInterval(() => {
      // Clean up error logs older than 24 hours
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      this.errorLogs = this.errorLogs.filter(log => log.timestamp > dayAgo);
      
      // Reset daily counters (optional - for daily reports)
      console.log('🧹 Performed periodic cleanup of monitoring data');
    }, 60 * 60 * 1000); // 1 hour
  }

  // Export methods for reporting
  exportMetrics() {
    return {
      webhooks: this.getWebhookMetrics(),
      outboundAPIs: this.getOutboundAPIMetrics(),
      websockets: this.getWebSocketMetrics(),
      recentErrors: this.getRecentErrors(100),
      systemHealth: this.getSystemHealth(),
      exportTime: new Date().toISOString()
    };
  }
}

export default IntegrationMonitoringService;