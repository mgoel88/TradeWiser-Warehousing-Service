import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Activity, Zap, Database, Globe, Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  webhooks: Array<{
    endpoint: string;
    isHealthy: boolean;
    successRate: number;
    totalRequests: number;
    averageResponseTime: number;
  }>;
  externalAPIs: Array<{
    module: string;
    isHealthy: boolean;
    successRate: number;
    circuitBreakerStatus: string;
    averageLatency: number;
  }>;
  websockets: {
    activeConnections: number;
    totalConnections: number;
    messagesSent: number;
    messagesReceived: number;
    subscriptions: Record<string, number>;
  };
  timestamp: string;
}

interface ErrorLog {
  timestamp: string;
  endpoint: string;
  error: string;
  errorType: string;
  statusCode?: number;
  requestId: string;
}

export default function AdminDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setSystemHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const fetchErrorLogs = async () => {
    try {
      const response = await fetch('/api/admin/error-logs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setErrorLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchSystemHealth(), fetchErrorLogs()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSystemHealth(), fetchErrorLogs()]);
      setIsLoading(false);
    };

    loadInitialData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50';
      case 'degraded': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getCircuitBreakerIcon = (status: string) => {
    switch (status) {
      case 'closed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'half-open': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'open': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading system metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Health Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time monitoring and analytics for TradeWiser integrations</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          {refreshing ? <Activity className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              System Health Overview
            </CardTitle>
            <CardDescription>Overall system status and key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Badge className={`${getStatusColor(systemHealth.overall)} border-0 px-4 py-2 text-sm font-semibold uppercase`}>
                {systemHealth.overall}
              </Badge>
              <span className="text-sm text-gray-500">Last updated: {formatTimestamp(systemHealth.timestamp)}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Webhook Endpoints</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.webhooks.length}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemHealth.webhooks.filter(w => w.isHealthy).length} healthy
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">External APIs</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.externalAPIs.length}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemHealth.externalAPIs.filter(a => a.isHealthy).length} healthy
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">WebSocket Connections</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.websockets.activeConnections}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemHealth.websockets.totalConnections} total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Messages Sent</span>
                  </div>
                  <div className="text-2xl font-bold mt-1">{systemHealth.websockets.messagesSent}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemHealth.websockets.messagesReceived} received
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">Webhook Endpoints</TabsTrigger>
          <TabsTrigger value="external-apis">External APIs</TabsTrigger>
          <TabsTrigger value="websockets">WebSocket Metrics</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
        </TabsList>

        {/* Webhook Endpoints */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoint Health</CardTitle>
              <CardDescription>Status and performance metrics for incoming webhook endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth?.webhooks.map((webhook, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(webhook.isHealthy)}
                      <div>
                        <div className="font-medium">{webhook.endpoint}</div>
                        <div className="text-sm text-gray-500">
                          {webhook.totalRequests} requests • {webhook.successRate}% success rate
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{webhook.averageResponseTime}ms</div>
                      <div className="text-xs text-gray-500">avg response time</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* External APIs */}
        <TabsContent value="external-apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External API Health</CardTitle>
              <CardDescription>Status and performance metrics for outbound API calls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth?.externalAPIs.map((api, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(api.isHealthy)}
                      <div>
                        <div className="font-medium capitalize">{api.module} Module</div>
                        <div className="text-sm text-gray-500">
                          {api.successRate}% success rate
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{api.averageLatency}ms</div>
                        <div className="text-xs text-gray-500">avg latency</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {getCircuitBreakerIcon(api.circuitBreakerStatus)}
                        <span className="text-xs capitalize">{api.circuitBreakerStatus}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WebSocket Metrics */}
        <TabsContent value="websockets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WebSocket Metrics</CardTitle>
              <CardDescription>Real-time connection and messaging statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {systemHealth?.websockets.activeConnections || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Connections</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {systemHealth?.websockets.messagesSent || 0}
                  </div>
                  <div className="text-sm text-gray-600">Messages Sent</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {systemHealth?.websockets.messagesReceived || 0}
                  </div>
                  <div className="text-sm text-gray-600">Messages Received</div>
                </div>
              </div>

              {systemHealth?.websockets.subscriptions && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Active Subscriptions by Type</h4>
                  <div className="space-y-2">
                    {Object.entries(systemHealth.websockets.subscriptions).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Logs */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Error Logs</CardTitle>
              <CardDescription>Latest integration errors and issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorLogs.length > 0 ? (
                  errorLogs.map((error, index) => (
                    <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-800">{error.endpoint}</span>
                            <Badge variant="outline" className="text-xs">
                              {error.errorType}
                            </Badge>
                            {error.statusCode && (
                              <Badge variant="destructive" className="text-xs">
                                {error.statusCode}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-red-700 mb-2">{error.error}</div>
                          <div className="text-xs text-red-600">
                            {formatTimestamp(error.timestamp)} • {error.requestId}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-600">No recent errors found. System is running smoothly!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}