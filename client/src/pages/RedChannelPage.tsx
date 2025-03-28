import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { FileCheck, AlertCircle, ArrowRight, FileEdit, UserCheck, Shield } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiRequest } from '@/lib/queryClient';

const selfCertFormSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required'),
  commodityName: z.string().min(1, 'Commodity name is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  measurementUnit: z.string().default('MT'),
  qualityGrade: z.string().optional(),
  location: z.string().min(1, 'Storage location is required'),
  description: z.string().optional(),
  valuation: z.string().optional()
});

type SelfCertFormValues = z.infer<typeof selfCertFormSchema>;

export default function RedChannelPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<SelfCertFormValues>({
    resolver: zodResolver(selfCertFormSchema),
    defaultValues: {
      receiptNumber: `SC-${Math.floor(Math.random() * 900000) + 100000}`,
      commodityName: '',
      quantity: '',
      measurementUnit: 'MT',
      qualityGrade: '',
      location: '',
      description: '',
      valuation: ''
    }
  });

  // Fetch receipts data
  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ['/api/receipts'],
    retry: 1,
    staleTime: 60000
  });

  // Filter to only show Red Channel receipts
  const redChannelReceipts = receipts.filter((receipt: any) => {
    if (receipt.metadata && typeof receipt.metadata === 'object') {
      return receipt.channelType === 'red' || 
             (receipt.metadata as any).channelType === 'red' ||
             (receipt.metadata as any).isSelfCertified;
    }
    return false;
  });

  // Handle form submission
  const onSubmit = async (values: SelfCertFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Add channel and self-certification metadata
      const receiptData = {
        ...values,
        channelType: 'red',
        metadata: {
          isSelfCertified: true,
          certificationDate: new Date().toISOString(),
          storageLocation: values.location
        }
      };
      
      const response = await apiRequest('POST', '/api/receipts/manual', receiptData);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create self-certified receipt');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Self-Certified Receipt Created',
        description: 'Your commodity has been successfully registered in the system.',
      });
      
      // Reset form and refresh data
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      
      // Switch to receipts tab
      setActiveTab('receipts');
      
    } catch (error) {
      console.error('Error creating self-certified receipt:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Failed to create self-certified receipt',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center text-red-800">
                <FileCheck className="h-6 w-6 mr-2 text-red-600" />
                Red Channel
              </h1>
              <p className="text-muted-foreground mt-1">
                Self-certified commodity declarations for your privately stored goods
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start">
            <div className="mr-3 mt-1">
              <UserCheck className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-red-800">Self-Certification Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                The Red Channel is for self-declared commodities not stored in TradeWiser or partner warehouses. 
                Self-certified receipts have limited verification and may have restricted access to certain platform features.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="receipts">My Receipts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileEdit className="h-5 w-5 mr-2 text-red-600" />
                    Self-Declaration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create receipts for commodities stored in your private facilities or with non-integrated warehouses
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600" 
                    onClick={() => setActiveTab('create')}
                  >
                    Create now <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-red-600" />
                    Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Self-certified receipts may have limited verification status and restricted access to premium services
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600"
                    onClick={() => navigate('/green-channel')}
                  >
                    Explore Green Channel <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <FileCheck className="h-5 w-5 mr-2 text-red-600" />
                    Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Self-certified receipts can be used for record-keeping and basic platform integration
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-red-600" 
                    onClick={() => setActiveTab('receipts')}
                  >
                    View receipts <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Get Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Button 
                  onClick={() => setActiveTab('create')} 
                  size="lg" 
                  className="h-auto p-6 bg-red-600 hover:bg-red-700"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Create Self-Certified Receipt</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Register your privately stored commodities in the system
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
                <Button 
                  onClick={() => setActiveTab('receipts')} 
                  size="lg" 
                  variant="outline" 
                  className="h-auto p-6 border-red-200 bg-red-50 hover:bg-red-100 text-red-800"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-medium">View Self-Certified Receipts</h3>
                    <p className="text-sm font-normal opacity-90 mt-1">
                      Check your existing self-certified commodities with Red Channel marking
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 ml-auto text-red-600" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="create" className="mt-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">Create Self-Certified Receipt</h2>
              <p className="text-muted-foreground mb-6">
                Enter details about your commodity stored outside of TradeWiser or partner warehouses
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="receiptNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Receipt Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly placeholder="Auto-generated receipt number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="commodityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commodity Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Wheat, Rice, Cotton" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input {...field} type="text" placeholder="e.g. 100" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="measurementUnit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                                <SelectItem value="KG">Kilograms (KG)</SelectItem>
                                <SelectItem value="Quintals">Quintals</SelectItem>
                                <SelectItem value="Bales">Bales</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="qualityGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality Grade (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Grade A, Premium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Location *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g. Personal Silo, Farm Storage" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="valuation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" placeholder="e.g. 50000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional details about the commodity" 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-sm text-red-700 flex items-start">
                      <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5 text-red-600" />
                      <span>
                        <strong>Self-Certification Declaration:</strong> By submitting this form, you confirm that the 
                        information provided is accurate to the best of your knowledge. Self-certified receipts are 
                        marked as Red Channel receipts in the system and may have limited functionality.
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="border-red-200"
                      onClick={() => form.reset()}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Self-Certified Receipt'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </TabsContent>
          
          <TabsContent value="receipts" className="mt-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Self-Certified Receipts</h2>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('create')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Create New
              </Button>
            </div>
            
            {receiptsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {redChannelReceipts.length > 0 ? (
                  redChannelReceipts.map((receipt: any) => (
                    <Card key={receipt.id} className="border-l-4 border-red-500">
                      <CardHeader className="pb-2">
                        <CardTitle>{receipt.receiptNumber}</CardTitle>
                        <CardDescription>
                          Self-Certified
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commodity:</span>
                            <span className="font-medium">{receipt.commodityName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-medium">{receipt.quantity} {receipt.measurementUnit || "MT"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">
                              {receipt.metadata && typeof receipt.metadata === 'object' 
                                ? (receipt.metadata as any).storageLocation || "Private Storage"
                                : "Private Storage"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-red-200 hover:bg-red-50"
                          onClick={() => navigate(`/receipts/${receipt.id}`)}
                        >
                          View Receipt
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 p-6 text-center border rounded-lg">
                    <AlertCircle className="h-8 w-8 mb-2 mx-auto text-muted-foreground" />
                    <h3 className="font-medium text-lg">No Self-Certified Receipts</h3>
                    <p className="text-muted-foreground">
                      You haven't created any self-certified commodity receipts yet.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => setActiveTab('create')}
                    >
                      Create Self-Certified Receipt
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}