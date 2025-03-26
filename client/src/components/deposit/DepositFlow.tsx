import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Steps, Step } from "@/components/ui/steps";
import { Warehouse } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Truck, Package, FileText, ArrowLeft, MapPin, Search, Calendar, Activity } from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import DepositProgress from "./DepositProgress";

// Create schema for the deposit form
const depositCommoditySchema = z.object({
  name: z.string().min(2, "Commodity name must be at least 2 characters"),
  type: z.string().min(2, "Type is required"),
  quantity: z.string().transform((val) => parseFloat(val)).refine(val => !isNaN(val) && val > 0, "Quantity must be a positive number"),
  measurementUnit: z.string().min(1, "Unit is required"),
  qualityParameters: z.record(z.string()).optional(),
  gradeAssigned: z.string().optional(),
  warehouseId: z.number(),
  notes: z.string().optional(),
});

type DepositCommodityFormValues = z.infer<typeof depositCommoditySchema>;

enum DepositStep {
  CommodityDetails = 0,
  SelectWarehouse = 1,
  SchedulePickup = 2,
  ReviewSubmit = 3,
  Confirmation = 4,
  TrackDeposit = 5
}

interface DepositFlowProps {
  warehouses: Warehouse[];
  userLocation?: [number, number] | null;
}

export default function DepositFlow({ warehouses, userLocation }: DepositFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.CommodityDetails);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [useWarehouseDelivery, setUseWarehouseDelivery] = useState<boolean>(false);
  const [processId, setProcessId] = useState<number | null>(null);
  const [selectedQualityParams, setSelectedQualityParams] = useState<Record<string, string>>({
    moisture: "",
    foreignMatter: "",
    brokenGrains: ""
  });
  
  // Initialize form
  const form = useForm<DepositCommodityFormValues>({
    resolver: zodResolver(depositCommoditySchema),
    defaultValues: {
      name: "",
      type: "",
      quantity: "0",
      measurementUnit: "MT",
      qualityParameters: {},
      gradeAssigned: "",
      warehouseId: 0,
      notes: "",
    },
  });

  // Sort warehouses by distance if user location is available
  const sortedWarehouses = warehouses.slice().sort((a, b) => {
    if (!userLocation) return 0;
    
    const distanceA = calculateDistance(
      userLocation[0],
      userLocation[1],
      parseFloat(a.latitude),
      parseFloat(a.longitude)
    );
    
    const distanceB = calculateDistance(
      userLocation[0],
      userLocation[1],
      parseFloat(b.latitude),
      parseFloat(b.longitude)
    );
    
    return distanceA - distanceB;
  });
  
  // Filter warehouses based on search query
  const filteredWarehouses = searchQuery 
    ? sortedWarehouses.filter(warehouse => 
        warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        warehouse.state.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedWarehouses;

  // Handle selecting a warehouse
  const handleSelectWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    form.setValue("warehouseId", warehouse.id);
    setCurrentStep(DepositStep.SchedulePickup);
  };
  
  // Handle moving to next step
  const handleNextStep = () => {
    if (currentStep === DepositStep.CommodityDetails) {
      const result = form.trigger(['name', 'type', 'quantity', 'measurementUnit']);
      if (result) {
        setCurrentStep(DepositStep.SelectWarehouse);
      }
    } else if (currentStep === DepositStep.SchedulePickup) {
      if (
        (!useWarehouseDelivery && (!pickupDate || !pickupTime || !pickupAddress)) ||
        (useWarehouseDelivery && !pickupDate)
      ) {
        toast({
          title: "Missing information",
          description: "Please fill in all the required pickup/delivery details",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(DepositStep.ReviewSubmit);
    }
  };
  
  // Handle going back to previous step
  const handlePreviousStep = () => {
    if (currentStep === DepositStep.CommodityDetails) {
      setCurrentStep(DepositStep.SelectWarehouse);
    } else if (currentStep === DepositStep.SchedulePickup) {
      setCurrentStep(DepositStep.CommodityDetails);
    } else if (currentStep === DepositStep.ReviewSubmit) {
      setCurrentStep(DepositStep.SchedulePickup);
    } else if (currentStep === DepositStep.TrackDeposit) {
      setCurrentStep(DepositStep.Confirmation);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: DepositCommodityFormValues) => {
    try {
      // Include quality parameters from the state
      const formattedData = {
        ...data,
        qualityParameters: selectedQualityParams,
        ownerId: user?.id,
        status: "processing", // Initial status
        channelType: "green", // Default channel
        quantity: data.quantity.toString(), // Keep as string for API compatibility
        valuation: parseFloat(data.quantity.toString()) * 2100, // Sample valuation calculation
        // Add pickup/delivery details
        depositDetails: {
          pickupDate,
          pickupTime: useWarehouseDelivery ? null : pickupTime,
          pickupAddress: useWarehouseDelivery ? null : pickupAddress,
          useWarehouseDelivery,
        }
      };
      
      // Call API to create a new commodity
      const response = await apiRequest(
        "POST",
        "/api/commodities",
        formattedData
      );
      const commodity = await response.json();

      if (commodity) {
        // Create a process for this deposit
        const processData = {
          commodityId: commodity.id,
          warehouseId: selectedWarehouse?.id,
          userId: user?.id,
          processType: "inward_processing",
          status: "pending",
          currentStage: "pickup_scheduled",
          stageProgress: {
            pickup_scheduled: "completed",
            pre_cleaning: "pending",
            quality_assessment: "pending",
            ewr_generation: "pending"
          },
          estimatedCompletionTime: new Date(new Date().setHours(new Date().getHours() + 48)) // 48 hours estimate
        };
        
        const processResponse = await apiRequest(
          "POST",
          "/api/processes",
          processData
        );
        
        const processResult = await processResponse.json();
        if (processResult && processResult.id) {
          setProcessId(processResult.id);
        }
        
        setCurrentStep(DepositStep.Confirmation);
        toast({
          title: "Deposit initiated successfully",
          description: "Your commodity deposit process has been started",
        });
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast({
        title: "Error",
        description: "Failed to create deposit. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper to get appropriate warehouse channel color class
  const getChannelClass = (channelType: string) => {
    switch (channelType) {
      case "green": 
        return "bg-green-500";
      case "orange": 
        return "bg-orange-500";
      case "red": 
        return "bg-red-500";
      default: 
        return "bg-gray-500";
    }
  };
  
  // Helper to format the address
  const formatAddress = (warehouse: Warehouse) => {
    return `${warehouse.address}, ${warehouse.city}, ${warehouse.state} - ${warehouse.pincode}`;
  };

  return (
    <div className="container mx-auto py-6">
      <Steps currentStep={currentStep} totalSteps={6}>
        <Step icon={<Package />} label="Commodity Details" />
        <Step icon={<MapPin />} label="Select Warehouse" />
        <Step icon={<Truck />} label="Schedule Pickup" />
        <Step icon={<FileText />} label="Review & Submit" />
        <Step icon={<Check />} label="Confirmation" />
        <Step icon={<Activity />} label="Track Deposit" />
      </Steps>
      
      <div className="mt-8">
        {currentStep === DepositStep.SelectWarehouse && (
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Select a Warehouse</CardTitle>
                  <CardDescription>
                    Choose a warehouse closest to you or based on your requirements
                  </CardDescription>
                </div>
              </div>
              
              <div className="relative mt-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search warehouses by name, city or state..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid gap-4">
                  {filteredWarehouses.length > 0 ? (
                    filteredWarehouses.map((warehouse) => {
                      // Calculate distance if user location is available
                      let distanceText = "";
                      if (userLocation) {
                        const distance = calculateDistance(
                          userLocation[0],
                          userLocation[1],
                          parseFloat(warehouse.latitude),
                          parseFloat(warehouse.longitude)
                        );
                        distanceText = `${distance.toFixed(1)} km away`;
                      }
                      
                      return (
                        <Card
                          key={warehouse.id}
                          className="cursor-pointer hover:bg-accent/20 transition-colors"
                          onClick={() => handleSelectWarehouse(warehouse)}
                        >
                          <CardContent className="p-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center mb-1">
                                <div className={`h-3 w-3 rounded-full mr-2 ${getChannelClass(warehouse.channelType)}`} />
                                <h3 className="font-medium">{warehouse.name}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">{formatAddress(warehouse)}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Array.isArray((warehouse.specializations as any)?.crops) ? 
                                  (warehouse.specializations as any).crops.map((crop: string, i: number) => (
                                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                                      {crop}
                                    </span>
                                  ))
                                : <span className="text-xs text-muted-foreground">No specializations</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm text-muted-foreground">{distanceText}</span>
                              <p className="text-sm mt-1">
                                <span className="font-medium">{warehouse.availableSpace}</span>
                                /{warehouse.capacity} MT
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No warehouses found matching your search criteria</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        
        {currentStep === DepositStep.CommodityDetails && (
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Commodity Details</CardTitle>
                  <CardDescription>
                    Provide information about the commodity you want to deposit
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commodity Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Grain">Grain</SelectItem>
                            <SelectItem value="Pulses">Pulses</SelectItem>
                            <SelectItem value="Oilseeds">Oilseeds</SelectItem>
                            <SelectItem value="Spices">Spices</SelectItem>
                            <SelectItem value="Fruits">Fruits</SelectItem>
                            <SelectItem value="Vegetables">Vegetables</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0.1" 
                              step="0.1" 
                              placeholder="e.g. 500" 
                              {...field} 
                            />
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
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MT">Metric Ton (MT)</SelectItem>
                              <SelectItem value="KG">Kilogram (KG)</SelectItem>
                              <SelectItem value="Quintal">Quintal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div>
                    <h3 className="mb-2 font-medium">Quality Parameters (if known)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <FormLabel>Moisture (%)</FormLabel>
                        <Input 
                          type="text"
                          placeholder="e.g. 12.5%"
                          value={selectedQualityParams.moisture}
                          onChange={(e) => setSelectedQualityParams({...selectedQualityParams, moisture: e.target.value})}
                        />
                      </div>
                      <div>
                        <FormLabel>Foreign Matter (%)</FormLabel>
                        <Input 
                          type="text"
                          placeholder="e.g. 0.5%"
                          value={selectedQualityParams.foreignMatter}
                          onChange={(e) => setSelectedQualityParams({...selectedQualityParams, foreignMatter: e.target.value})}
                        />
                      </div>
                      <div>
                        <FormLabel>Broken Grains (%)</FormLabel>
                        <Input 
                          type="text"
                          placeholder="e.g. 2%"
                          value={selectedQualityParams.brokenGrains}
                          onChange={(e) => setSelectedQualityParams({...selectedQualityParams, brokenGrains: e.target.value})}
                        />
                      </div>
                    </div>
                    <FormDescription className="mt-2">
                      These values are optional. Quality assessment will be done at the warehouse.
                    </FormDescription>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special handling instructions or additional information"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button onClick={handleNextStep}>
                Continue to Select Warehouse
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === DepositStep.SchedulePickup && (
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Schedule Pickup</CardTitle>
                  <CardDescription>
                    Arrange for pickup or self-delivery of your commodity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Delivery Method</h3>
                <div className="flex space-x-4">
                  <Button
                    variant={!useWarehouseDelivery ? "default" : "outline"}
                    onClick={() => setUseWarehouseDelivery(false)}
                    className="flex-1"
                  >
                    <Truck className="mr-2 h-4 w-4" /> Request Pickup
                  </Button>
                  <Button
                    variant={useWarehouseDelivery ? "default" : "outline"}
                    onClick={() => setUseWarehouseDelivery(true)}
                    className="flex-1"
                  >
                    <Package className="mr-2 h-4 w-4" /> Self Delivery
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium">Preferred Date</label>
                  <Input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1.5"
                  />
                </div>
                
                {!useWarehouseDelivery && (
                  <>
                    <div>
                      <label className="text-sm font-medium">Preferred Time</label>
                      <Input
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Pickup Address</label>
                      <Textarea
                        placeholder="Enter the complete address for pickup"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="resize-none mt-1.5"
                      />
                    </div>
                  </>
                )}
                
                {useWarehouseDelivery && (
                  <div className="bg-muted p-4 rounded-md mt-2">
                    <h4 className="font-medium mb-2">Warehouse Delivery Information</h4>
                    <p className="text-sm text-muted-foreground mb-2">Deliver your commodity to:</p>
                    <div className="text-sm">
                      <p className="font-medium">{selectedWarehouse?.name}</p>
                      <p>{formatAddress(selectedWarehouse!)}</p>
                      <p className="mt-2">Operating Hours: 8:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button onClick={handleNextStep}>
                Continue to Review
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === DepositStep.ReviewSubmit && (
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Review Deposit Details</CardTitle>
                  <CardDescription>
                    Verify all information before confirming the deposit
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Selected Warehouse</h3>
                  <Card className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-1">
                        <div className={`h-3 w-3 rounded-full mr-2 ${getChannelClass(selectedWarehouse?.channelType || 'green')}`} />
                        <h3 className="font-medium">{selectedWarehouse?.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatAddress(selectedWarehouse!)}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Commodity Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Name</p>
                      <p className="text-sm text-muted-foreground">{form.getValues("name")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <p className="text-sm text-muted-foreground">{form.getValues("type")}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quantity</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("quantity")} {form.getValues("measurementUnit")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Estimated Value</p>
                      <p className="text-sm text-muted-foreground">
                        ₹ {(parseFloat(form.getValues("quantity").toString()) * 2100).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Delivery Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium">Delivery Method</p>
                      <p className="text-sm text-muted-foreground">
                        {useWarehouseDelivery ? 'Self Delivery to Warehouse' : 'Requested Pickup'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm text-muted-foreground">{pickupDate}</p>
                    </div>
                    {!useWarehouseDelivery && (
                      <>
                        <div>
                          <p className="text-sm font-medium">Time</p>
                          <p className="text-sm text-muted-foreground">{pickupTime}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Pickup Address</p>
                          <p className="text-sm text-muted-foreground">{pickupAddress}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Important Notes
                  </h4>
                  <ul className="text-xs text-yellow-700 list-disc pl-4 space-y-1">
                    <li>Quality assessment will be performed at the warehouse</li>
                    <li>Final valuation may change based on actual quality parameters</li>
                    <li>A warehouse receipt will be generated after successful processing</li>
                    <li>Standard storage charges will apply as per warehouse policy</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviousStep}>
                Go Back
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)}>
                Confirm Deposit
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === DepositStep.Confirmation && (
          <Card className="w-full max-w-xl mx-auto text-center">
            <CardHeader>
              <div className="mx-auto my-4 bg-green-100 h-16 w-16 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Deposit Initiated!</CardTitle>
              <CardDescription className="text-base">
                Your commodity deposit process has been successfully initiated
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium">Next Steps:</h3>
                  <ul className="text-sm text-muted-foreground mt-2 text-left list-decimal pl-5 space-y-1">
                    <li>Prepare your commodity for {useWarehouseDelivery ? "delivery" : "pickup"}</li>
                    <li>Our team will contact you to confirm the details</li>
                    <li>Quality assessment will be performed at the warehouse</li>
                    <li>An electronic Warehouse Receipt (eWR) will be generated</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  You can track the status of your deposit in the "Processes" section
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={() => processId ? setCurrentStep(DepositStep.TrackDeposit) : null}
              >
                Track This Deposit
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCurrentStep(DepositStep.CommodityDetails)}
              >
                Start New Deposit
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {currentStep === DepositStep.TrackDeposit && processId && (
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>Track Deposit</CardTitle>
                  <CardDescription>
                    Follow the progress of your commodity deposit in real-time
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <DepositProgress processId={processId} />
            </CardContent>
            
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/receipts")}
              >
                View All Receipts
              </Button>
              <Button 
                onClick={() => setCurrentStep(DepositStep.CommodityDetails)}
              >
                Start New Deposit
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}