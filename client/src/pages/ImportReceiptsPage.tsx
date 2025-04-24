import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, ExternalLink, ArrowRight, Download } from 'lucide-react';
import { useLocation, useRoute, Link } from 'wouter';

// Form schema for external warehouse connection
const externalWarehouseSchema = z.object({
  provider: z.string({
    required_error: 'Please select a warehouse provider',
  }),
  baseUrl: z.string({
    required_error: 'Base URL is required',
  }).url('Please enter a valid URL'),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  accessToken: z.string().optional(),
});

const ImportReceiptsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('connect');
  const [selectedProvider, setSelectedProvider] = useState('');
  
  // Form for warehouse API connection
  const form = useForm<z.infer<typeof externalWarehouseSchema>>({
    resolver: zodResolver(externalWarehouseSchema),
    defaultValues: {
      provider: '',
      baseUrl: '',
      apiKey: '',
      apiSecret: '',
      username: '',
      password: '',
      clientId: '',
      clientSecret: '',
      accessToken: '',
    },
  });
  
  // Query to get the list of imported external receipts
  const {
    data: externalReceipts = [],
    isLoading: receiptsLoading,
    error: receiptsError,
  } = useQuery({
    queryKey: ['/api/receipts', 'external'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/receipts?source=external');
      return response.json();
    },
  });
  
  // Query to get supported providers
  const {
    data: providers = [],
    isLoading: providersLoading,
  } = useQuery({
    queryKey: ['/api/external-warehouses/providers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/external-warehouses/providers');
        return response.json();
      } catch (error) {
        // If the endpoint is not implemented, use a default list for demo
        return [
          { id: 'agriapp', name: 'AgriApp Warehouse Management' },
          { id: 'agrichain', name: 'AgriChain Storage Solutions' },
          { id: 'ewarehouse', name: 'eWarehouse Digital Solutions' },
          { id: 'ncdex', name: 'NCDEX Commodity Exchange' },
        ];
      }
    },
  });
  
  // Mutation to import receipts from external source
  const importMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof externalWarehouseSchema>) => {
      const response = await apiRequest('POST', '/api/receipts/import-external', credentials);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Receipts Imported',
        description: `Successfully imported ${data.receipts?.length || 0} receipts.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      setActiveTab('receipts');
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof externalWarehouseSchema>) => {
    importMutation.mutate(values);
  };
  
  // Update form fields based on selected provider
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    form.setValue('provider', provider);
    
    // Reset credentials fields
    form.setValue('apiKey', '');
    form.setValue('apiSecret', '');
    form.setValue('username', '');
    form.setValue('password', '');
    form.setValue('clientId', '');
    form.setValue('clientSecret', '');
    form.setValue('accessToken', '');
    
    // Set default base URL based on provider
    switch (provider) {
      case 'agriapp':
        form.setValue('baseUrl', 'https://api.agriapp.example.com');
        break;
      case 'agrichain':
        form.setValue('baseUrl', 'https://api.agrichain.example.com');
        break;
      case 'ewarehouse':
        form.setValue('baseUrl', 'https://api.ewarehouse.example.com');
        break;
      case 'ncdex':
        form.setValue('baseUrl', 'https://api.ncdex.example.com');
        break;
      default:
        form.setValue('baseUrl', '');
    }
  };
  
  // Determine which credential fields to show based on provider
  const getAuthFields = () => {
    switch (selectedProvider) {
      case 'agriapp':
      case 'ncdex':
        return (
          <>
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'ewarehouse':
        return (
          <>
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      case 'agrichain':
        return (
          <>
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Secret</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Import External Receipts</h1>
          <p className="text-muted-foreground">
            Connect to external warehouse providers and import receipts into the TradeWiser platform.
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="receipts">Imported Receipts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connect" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect to External Warehouse</CardTitle>
              <CardDescription>
                Provide the credentials to connect to an external warehouse management system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse Provider</FormLabel>
                        <Select
                          onValueChange={(value) => handleProviderChange(value)}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providersLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading providers...</span>
                              </div>
                            ) : (
                              providers.map((provider: any) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="baseUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Base URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://api.example.com" />
                        </FormControl>
                        <FormDescription>
                          The base URL of the warehouse provider's API.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedProvider && getAuthFields()}
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={importMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {importMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Import Receipts
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Alert>
              <AlertTitle className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                External Warehouse Integration - Orange Channel
              </AlertTitle>
              <AlertDescription>
                The Orange Channel allows integration with third-party warehouse management systems.
                Import your existing warehouse receipts from supported providers to manage them alongside
                internal receipts in the TradeWiser platform.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
        
        <TabsContent value="receipts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Imported External Receipts</CardTitle>
              <CardDescription>
                Manage warehouse receipts imported from external providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receiptsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : receiptsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {receiptsError instanceof Error ? receiptsError.message : 'Failed to load receipts'}
                  </AlertDescription>
                </Alert>
              ) : externalReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No External Receipts Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't imported any external warehouse receipts yet.
                  </p>
                  <Button onClick={() => setActiveTab('connect')}>
                    Connect to External Warehouse
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {externalReceipts.map((receipt: any) => (
                      <Card key={receipt.id} className="border-blue-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between">
                            <CardTitle className="text-lg">
                              {receipt.receiptNumber}
                            </CardTitle>
                            <Button variant="outline" size="sm">
                              <Link href={`/receipts/${receipt.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                          <CardDescription>
                            Source: {receipt.externalSource || 'External Provider'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium">Commodity</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.commodityName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Quantity</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.quantity} {receipt.measurementUnit || 'MT'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Warehouse</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.warehouseName || 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Quality</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.qualityGrade || 'Standard'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <p className="text-sm text-muted-foreground">
                            Issued: {new Date(receipt.issuedDate).toLocaleDateString()}
                          </p>
                          {receipt.originalDocumentUrl && (
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Original Document
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportReceiptsPage;