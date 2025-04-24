import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, Link } from 'wouter';

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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  AlertCircle, 
  FileCheck, 
  Upload, 
  Camera, 
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Clock,
  Shield 
} from 'lucide-react';

// Form schema for self-certified storage
const selfCertificationSchema = z.object({
  commodityName: z.string({
    required_error: 'Commodity name is required',
  }),
  commodityType: z.string({
    required_error: 'Commodity type is required',
  }),
  quantity: z.string({
    required_error: 'Quantity is required',
  }),
  measurementUnit: z.string({
    required_error: 'Measurement unit is required',
  }).default('kg'),
  storageLocation: z.string({
    required_error: 'Storage location is required',
  }),
  qualityGrade: z.string().optional(),
  description: z.string().optional(),
});

const PrivateStoragePage = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('create');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Form for self-certified storage
  const form = useForm<z.infer<typeof selfCertificationSchema>>({
    resolver: zodResolver(selfCertificationSchema),
    defaultValues: {
      commodityName: '',
      commodityType: '',
      quantity: '',
      measurementUnit: 'kg',
      storageLocation: '',
      qualityGrade: 'Standard',
      description: '',
    },
  });
  
  // Query to get the list of private receipts
  const {
    data: privateReceipts = [],
    isLoading: receiptsLoading,
    error: receiptsError,
  } = useQuery({
    queryKey: ['/api/receipts', 'private'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/receipts?source=private');
      return response.json();
    },
  });
  
  // Query to get commodity types
  const { data: commodityTypes = [] } = useQuery({
    queryKey: ['/api/commodity-types'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/commodity-types');
        return response.json();
      } catch (error) {
        // If endpoint not implemented, use default list
        return [
          { id: 'Grain', name: 'Grain' },
          { id: 'Pulses', name: 'Pulses' },
          { id: 'Oilseeds', name: 'Oilseeds' },
          { id: 'Spices', name: 'Spices' },
          { id: 'Fruits', name: 'Fruits' },
          { id: 'Vegetables', name: 'Vegetables' },
        ];
      }
    },
  });
  
  // Mutation to create a self-certified receipt
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof selfCertificationSchema>) => {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add photo if selected
      if (selectedPhoto) {
        formData.append('photo', selectedPhoto);
      }
      
      // Add source for private storage
      formData.append('source', 'private');
      formData.append('channel', 'red');
      
      const response = await apiRequest('POST', '/api/receipts/manual', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Self-Certification Created',
        description: 'Your commodity has been successfully registered.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      setActiveTab('receipts');
      form.reset();
      setSelectedPhoto(null);
      setPhotoPreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof selfCertificationSchema>) => {
    createMutation.mutate(values);
  };
  
  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Private Storage</h1>
          <p className="text-muted-foreground">
            Self-certify your commodity storage for digital record-keeping and potential lending.
          </p>
        </div>
      </div>
      
      <Alert className="mb-6 border-purple-200 bg-purple-50">
        <Shield className="h-4 w-4 text-purple-500" />
        <AlertTitle>Red Channel - Self-Certification</AlertTitle>
        <AlertDescription>
          The Red Channel allows farmers and traders to self-certify commodities stored in private facilities.
          While self-certified receipts have limited collateral value, they serve as digital proof of ownership
          and can be used for record-keeping purposes.
        </AlertDescription>
      </Alert>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="create">Create Certificate</TabsTrigger>
          <TabsTrigger value="receipts">My Certificates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Self-Certification</CardTitle>
              <CardDescription>
                Register commodities stored in your private facility or farm.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="commodityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commodity Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Premium Wheat" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="commodityType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commodity Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {commodityTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input {...field} type="text" inputMode="decimal" />
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
                          <FormLabel>Unit of Measurement</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                              <SelectItem value="mt">Metric Tons (MT)</SelectItem>
                              <SelectItem value="quintal">Quintals</SelectItem>
                              <SelectItem value="bag">Bags</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="storageLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Storage Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Farm Storage, Village Silo" />
                          </FormControl>
                          <FormDescription>
                            Where is the commodity stored?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="qualityGrade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality Grade (Optional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || 'Standard'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Premium">Premium</SelectItem>
                              <SelectItem value="Grade A">Grade A</SelectItem>
                              <SelectItem value="Grade B">Grade B</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Mixed">Mixed Quality</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Additional Details (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Provide any additional details about the commodity, storage conditions, etc."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="border rounded-md p-4">
                    <FormLabel className="block mb-2">Upload Photo (Optional)</FormLabel>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      <div className="w-full md:w-1/3">
                        {photoPreview ? (
                          <div className="relative aspect-square rounded-md overflow-hidden">
                            <img 
                              src={photoPreview} 
                              alt="Commodity preview" 
                              className="object-cover w-full h-full" 
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setSelectedPhoto(null);
                                setPhotoPreview(null);
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed rounded-md flex flex-col items-center justify-center p-6 h-full aspect-square bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-center text-muted-foreground">
                              No photo uploaded
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="w-full md:w-2/3 flex flex-col gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="w-full justify-start"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload from Device
                        </Button>
                        <input 
                          id="photo-upload" 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange} 
                          className="hidden" 
                        />
                        
                        <Button 
                          type="button" 
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            // Open camera on mobile devices
                            document.getElementById('camera-capture')?.click();
                          }}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Take Photo
                        </Button>
                        <input 
                          id="camera-capture" 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={handlePhotoChange} 
                          className="hidden" 
                        />
                        
                        <FormDescription>
                          Adding a photo of your commodity helps establish the authenticity of your self-certification.
                        </FormDescription>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {createMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Self-Certification
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="receipts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Self-Certified Storage</CardTitle>
              <CardDescription>
                View and manage your self-certified commodity storage receipts.
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
              ) : privateReceipts.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Self-Certifications Found</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't created any self-certified storage records yet.
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    Create Self-Certification
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {privateReceipts.map((receipt: any) => (
                      <Card key={receipt.id} className="border-purple-200">
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
                          <CardDescription className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Created: {new Date(receipt.issuedDate).toLocaleDateString()}
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
                                {receipt.quantity} {receipt.measurementUnit || 'kg'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Storage Location</p>
                              <p className="text-sm text-muted-foreground">
                                {receipt.storageLocation || receipt.warehouseName || 'Private Storage'}
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
                          <p className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Self-Certified
                          </p>
                          {receipt.photoUrl && (
                            <Button variant="ghost" size="sm">
                              <ImageIcon className="h-4 w-4 mr-1" />
                              View Photo
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

export default PrivateStoragePage;