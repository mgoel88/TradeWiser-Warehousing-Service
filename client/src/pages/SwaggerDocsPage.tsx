import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, FileText, Globe, Key, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      email: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    securitySchemes: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export default function SwaggerDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch('/api/docs/openapi.json');
        if (response.ok) {
          const data = await response.json();
          setSpec(data);
        }
      } catch (error) {
        console.error('Failed to fetch OpenAPI spec:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${description} copied successfully`
    });
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'post': return 'bg-green-100 text-green-800';
      case 'get': return 'bg-blue-100 text-blue-800';
      case 'put': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 text-blue-600 animate-pulse mx-auto mb-4" />
            <p className="text-gray-600">Loading API documentation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load API documentation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{spec.info.title}</h1>
          <p className="text-gray-600 mt-1">{spec.info.description}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline">Version {spec.info.version}</Badge>
            <Badge variant="outline">OpenAPI {spec.openapi}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => copyToClipboard(JSON.stringify(spec, null, 2), 'OpenAPI specification')}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Spec
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('/api/docs/openapi.json', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Raw JSON
          </Button>
        </div>
      </div>

      {/* Server Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Server Information
          </CardTitle>
          <CardDescription>Available API servers for integration</CardDescription>
        </CardHeader>
        <CardContent>
          {spec.servers.map((server, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{server.description}</div>
                <div className="text-sm text-gray-500">{server.url}</div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(server.url, 'Server URL')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>Security schemes for API access</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.entries(spec.components.securitySchemes).map(([name, scheme]: [string, any]) => (
            <div key={name} className="p-4 border rounded-lg">
              <div className="font-medium mb-2">{name}</div>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Type:</span> {scheme.type}</div>
                <div><span className="font-medium">Location:</span> {scheme.in}</div>
                <div><span className="font-medium">Header:</span> {scheme.name}</div>
                <div className="text-gray-600 mt-2">{scheme.description}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            API Endpoints
          </CardTitle>
          <CardDescription>Available webhook endpoints for external integration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(spec.paths).map(([path, pathObj]: [string, any]) => (
            <div key={path} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <div className="font-medium">{path}</div>
              </div>
              {Object.entries(pathObj).map(([method, methodObj]: [string, any]) => (
                <div key={method} className="p-4 border-b last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`${getMethodColor(method)} border-0 font-medium uppercase`}>
                        {method}
                      </Badge>
                      <div>
                        <div className="font-medium">{methodObj.summary}</div>
                        <div className="text-sm text-gray-600">{methodObj.description}</div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(`curl -X ${method.toUpperCase()} ${spec.servers[0].url}${path} -H "X-API-Key: YOUR_API_KEY"`, 'cURL command')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      cURL
                    </Button>
                  </div>

                  {methodObj.security && (
                    <div className="mb-3">
                      <Badge variant="secondary" className="text-xs">
                        🔐 Authentication Required
                      </Badge>
                    </div>
                  )}

                  {methodObj.tags && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {methodObj.tags.map((tag: string, tagIndex: number) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Request Body Schema */}
                  {methodObj.requestBody && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Request Body Schema:</div>
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        <pre className="whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(
                            methodObj.requestBody.content['application/json'].schema,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Response Codes */}
                  {methodObj.responses && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Response Codes:</div>
                      <div className="space-y-1">
                        {Object.entries(methodObj.responses).map(([code, responseObj]: [string, any]) => (
                          <div key={code} className="flex items-center gap-2 text-xs">
                            <Badge variant={code.startsWith('2') ? 'default' : 'destructive'} className="font-mono">
                              {code}
                            </Badge>
                            <span className="text-gray-600">{responseObj.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Integration Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Examples</CardTitle>
          <CardDescription>Code examples for common integration scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium mb-2">JavaScript/Node.js Example</div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <pre>{`const response = await fetch('${spec.servers[0].url}/webhooks/warehouse/status-update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'
  },
  body: JSON.stringify({
    processId: 123,
    status: 'completed',
    stage: 'pickup_scheduled',
    timestamp: new Date().toISOString()
  })
});

const result = await response.json();
console.log('Webhook response:', result);`}</pre>
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Python Example</div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <pre>{`import requests
import json
from datetime import datetime

url = "${spec.servers[0].url}/webhooks/warehouse/status-update"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "your-api-key-here"
}
data = {
    "processId": 123,
    "status": "completed", 
    "stage": "pickup_scheduled",
    "timestamp": datetime.now().isoformat()
}

response = requests.post(url, headers=headers, json=data)
print("Webhook response:", response.json())`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Contact</CardTitle>
          <CardDescription>Get help with API integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><span className="font-medium">Team:</span> {spec.info.contact.name}</div>
            <div><span className="font-medium">Email:</span> {spec.info.contact.email}</div>
            <div className="mt-4">
              <Button 
                onClick={() => copyToClipboard(spec.info.contact.email, 'Support email')}
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}