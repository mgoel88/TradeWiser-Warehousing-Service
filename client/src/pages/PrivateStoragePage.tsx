import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Form schema
const redChannelFormSchema = z.object({
  commodityName: z.string().min(1, "Commodity name is required"),
  quantity: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  measurementUnit: z.string().min(1, "Measurement unit is required"),
  storageLocation: z.string().min(1, "Storage location is required"),
  commodityType: z.string().min(1, "Commodity type is required"),
  qualityGrade: z.string().optional(),
  description: z.string().optional(),
  ownershipProof: z.instanceof(FileList).optional().refine(files => !files || files.length === 0 || files.length <= 3, {
    message: "You can upload up to 3 files",
  }),
});

type RedChannelFormValues = z.infer<typeof redChannelFormSchema>;

export default function PrivateStoragePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  // Form setup
  const form = useForm<RedChannelFormValues>({
    resolver: zodResolver(redChannelFormSchema),
    defaultValues: {
      commodityName: "",
      quantity: "",
      measurementUnit: "kg",
      storageLocation: "",
      commodityType: "",
      qualityGrade: "",
      description: "",
    },
  });
  
  const onSubmit = async (data: RedChannelFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real app, we would upload the files first
      // and get back URLs to include in our payload
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Receipt created successfully",
        description: "Your self-certified storage has been registered",
      });
      
      setIsSuccess(true);
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error submitting form",
        description: "There was a problem registering your storage. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Private Storage Declaration (Red Channel)</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Register Your Private Storage</CardTitle>
                <CardDescription>
                  Declare commodities stored in your own facilities or locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess ? (
                  <Alert className="mb-6 bg-green-50">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Registration Successful</AlertTitle>
                    <AlertDescription>
                      Your commodity has been registered in the Red Channel. You can now view it in your dashboard.
                    </AlertDescription>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsSuccess(false)}
                    >
                      Register Another
                    </Button>
                  </Alert>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Alert className="bg-red-50">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Red Channel Notice</AlertTitle>
                        <AlertDescription>
                          Self-certified commodities are not verified by third parties and have limited functionality. They cannot be used as collateral for loans.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="commodityName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Commodity Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Wheat" {...field} />
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
                                  <SelectItem value="grain">Grain</SelectItem>
                                  <SelectItem value="pulses">Pulses</SelectItem>
                                  <SelectItem value="oilseeds">Oilseeds</SelectItem>
                                  <SelectItem value="spices">Spices</SelectItem>
                                  <SelectItem value="fruits">Fruits</SelectItem>
                                  <SelectItem value="vegetables">Vegetables</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
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
                                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                  <SelectItem value="quintal">Quintal</SelectItem>
                                  <SelectItem value="ton">Metric Ton</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="storageLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Where is the commodity stored?" {...field} />
                            </FormControl>
                            <FormDescription>
                              Provide the address or location where the commodity is stored
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
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a grade if known" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="A">Grade A (Premium)</SelectItem>
                                <SelectItem value="B">Grade B (Standard)</SelectItem>
                                <SelectItem value="C">Grade C (Basic)</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Details (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any additional information about the commodity" 
                                className="resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="ownershipProof"
                        render={({ field: { onChange, ...rest } }) => (
                          <FormItem>
                            <FormLabel>Ownership Proof (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                multiple
                                onChange={(e) => onChange(e.target.files)}
                                accept=".pdf,.jpg,.jpeg,.png"
                                {...rest}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload receipts, photos, or other documents proving ownership
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button className="w-full" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                            Processing...
                          </>
                        ) : 'Register Private Storage'}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About Red Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  The Red Channel allows you to declare commodities that are stored in your own facilities or locations not formally verified by TradeWiser.
                </p>
                <div className="space-y-4 text-sm">
                  <div className="bg-red-50 p-3 rounded-md">
                    <h3 className="font-medium mb-1">Limited Functionality</h3>
                    <p className="text-gray-600">
                      Red Channel commodities cannot be used as collateral for loans and have limited tradability.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">When to Use Red Channel</h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>For farm-stored commodities</li>
                      <li>For home or personal storage</li>
                      <li>When a verified warehouse is not accessible</li>
                      <li>For record-keeping purposes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Upgrade Path</h3>
                    <p className="text-gray-600">
                      To unlock full functionality, transfer your commodity to a verified warehouse in the Green Channel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}