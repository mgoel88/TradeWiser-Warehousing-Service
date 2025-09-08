import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { TimeSlotPicker } from "@/components/time-slot-picker";
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
import { 
  Check, Truck, Package, FileText, ArrowLeft, MapPin, Search, 
  Calendar, Activity, Globe, Navigation, Locate, Map 
} from "lucide-react";
import { calculateDistance } from "@/lib/utils";
import DepositProgress from "./DepositProgress";
import LocationPicker from "./LocationPicker";
import ContextualTooltip from "../help/ContextualTooltip";
import HelpButton from "../help/HelpButton";
import HelpOverlay from "../help/HelpOverlay";
import { CommoditySelector, type Commodity } from '@/components/ui/commodity-selector';
import { WarehouseSelector } from '@/components/warehouse/WarehouseSelector';
import commoditiesData from '@shared/commodities.json';

// Create schema for the deposit form
const depositCommoditySchema = z.object({
  name: z.string().min(2, "Commodity name must be at least 2 characters"),
  type: z.string().min(2, "Type is required"),
  quantity: z.union([
    z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) throw new Error("Invalid number");
      return num;
    }),
    z.number().positive("Quantity must be a positive number")
  ]),
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
  initialWarehouseId?: number;
  initialCommodity?: string;
  initialQuantity?: string;
}

export default function DepositFlow({ 
  warehouses, 
  userLocation, 
  initialWarehouseId, 
  initialCommodity, 
  initialQuantity 
}: DepositFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.CommodityDetails);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupTime, setPickupTime] = useState<string>("");
  const [pickupAddress, setPickupAddress] = useState<string>("");
  const [pickupCoordinates, setPickupCoordinates] = useState<[number, number] | null>(null);
  const [useWarehouseDelivery, setUseWarehouseDelivery] = useState<boolean>(false);
  const [processId, setProcessId] = useState<number | null>(null);
  const [selectedQualityParams, setSelectedQualityParams] = useState<Record<string, string>>({
    moisture: "",
    foreignMatter: "",
    brokenGrains: ""
  });

  const commodities = commoditiesData as Commodity[];

  // Handle commodity selection and auto-populate type
  const handleCommodityChange = (commodityName: string) => {
    form.setValue("name", commodityName);
    
    // Find the commodity to auto-populate type
    const selectedCommodity = commodities.find(c => 
      `${c.english} (${c.hindi})` === commodityName || c.english === commodityName
    );
    
    if (selectedCommodity) {
      // Map category to form type values
      const categoryTypeMap: Record<string, string> = {
        'Grains': 'Grain',
        'Pulses': 'Pulses', 
        'Spices': 'Spices',
        'Oilseeds': 'Oilseeds',
        'Fibres': 'Fibres',
        'Cash Crops': 'Cash Crops',
        'Nuts': 'Nuts'
      };
      
      const typeValue = categoryTypeMap[selectedCommodity.category] || 'Other';
      form.setValue("type", typeValue);
    }
  };

  // Handle category selection from commodity selector
  const handleCategorySelect = (category: string) => {
    const categoryTypeMap: Record<string, string> = {
      'Grains': 'Grain',
      'Pulses': 'Pulses',
      'Spices': 'Spices', 
      'Oilseeds': 'Oilseeds',
      'Fibres': 'Fibres',
      'Cash Crops': 'Cash Crops',
      'Nuts': 'Nuts'
    };
    
    const typeValue = categoryTypeMap[category] || 'Other';
    form.setValue("type", typeValue);
  };

  // Initialize form
  const form = useForm<DepositCommodityFormValues>({
    resolver: zodResolver(depositCommoditySchema),
    defaultValues: {
      name: initialCommodity || "",
      type: "",
      quantity: initialQuantity || "0" as any, // Type assertion to resolve string type in a numeric field
      measurementUnit: "MT",
      qualityParameters: {},
      gradeAssigned: "",
      warehouseId: initialWarehouseId || 0,
      notes: "",
    },
  });
  
  // Initialize form fields and steps from URL parameters
  useEffect(() => {
    // If we have warehouse ID from URL, find and select that warehouse
    if (initialWarehouseId) {
      const warehouse = warehouses.find(w => w.id === initialWarehouseId);
      if (warehouse) {
        setSelectedWarehouse(warehouse);
        // If we also have commodity and quantity data, we can skip to scheduling
        if (initialCommodity && initialQuantity) {
          setCurrentStep(DepositStep.SchedulePickup);
        }
      }
    }
    
    // Set commodity name if provided
    if (initialCommodity) {
      form.setValue("name", initialCommodity);
    }
    
    // Set quantity if provided and valid
    if (initialQuantity) {
      const qty = parseFloat(initialQuantity);
      if (!isNaN(qty)) {
        form.setValue("quantity", initialQuantity as any);
      }
    }
  }, [initialWarehouseId, initialCommodity, initialQuantity, warehouses, form]);

  // Sort warehouses by distance if user location is available
  const sortedWarehouses = warehouses.slice().sort((a, b) => {
    if (!userLocation) return 0;

    const distanceA = calculateDistance(
      userLocation[0],
      userLocation[1],
      parseFloat(a.latitude || '0'),
      parseFloat(a.longitude || '0')
    );

    const distanceB = calculateDistance(
      userLocation[0],
      userLocation[1],
      parseFloat(b.latitude || '0'),
      parseFloat(b.longitude || '0')
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

  // Validate pickup date is not in the past
  const isValidPickupDate = (date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  };

  // Mock function to check slot availability (replace with actual API call)
  const isSlotAvailable = (slot: string) => {
    // For demo purposes, randomly make some slots unavailable
    return Math.random() > 0.3;
  };

  // Handle moving to next step
  const handleNextStep = async () => {
    if (currentStep === DepositStep.CommodityDetails) {
      try {
        const result = await form.trigger(['name', 'type', 'quantity', 'measurementUnit']);
        if (result === true) { // Explicit true check
          setCurrentStep(DepositStep.SelectWarehouse);
        }
      } catch (error) {
        console.error("Validation error:", error);
      }
    } else if (currentStep === DepositStep.SchedulePickup) {
      // Validation for pickup details
      if (useWarehouseDelivery) {
        // For self-delivery, only pickup date is required
        if (!pickupDate) {
          toast({
            title: "Missing information",
            description: "Please select a delivery date",
            variant: "destructive",
          });
          return;
        }
      } else {
        // For managed pickup, we need date, time and address
        if (!pickupDate || !isValidPickupDate(pickupDate) || !pickupTime || !pickupAddress) {
          toast({
            title: "Missing information",
            description: "Please fill in all the required pickup details",
            variant: "destructive",
          });
          return;
        }
      }
      // All validations passed, proceed to next step
      setCurrentStep(DepositStep.ReviewSubmit);
    }
  };

  // Handle going back to previous step
  const handlePreviousStep = () => {
    if (currentStep === DepositStep.SelectWarehouse) {
      setCurrentStep(DepositStep.CommodityDetails);
    } else if (currentStep === DepositStep.CommodityDetails) {
      // This is for cases where we navigate back from CommodityDetails (if applicable)
      // Just stay in the same step if this is our starting point
    } else if (currentStep === DepositStep.SchedulePickup) {
      setCurrentStep(DepositStep.SelectWarehouse);
    } else if (currentStep === DepositStep.ReviewSubmit) {
      setCurrentStep(DepositStep.SchedulePickup);
    } else if (currentStep === DepositStep.TrackDeposit) {
      setCurrentStep(DepositStep.Confirmation);
    }
  };

  // Handle form submission
  const onSubmit = async (data: DepositCommodityFormValues) => {
    try {
      // Show loading toast
      toast({
        title: "Processing",
        description: "Initiating your deposit request...",
      });

      if (!selectedWarehouse) {
        toast({
          title: "Error",
          description: "Please select a warehouse first",
          variant: "destructive",
        });
        return;
      }

      // Check if user is authenticated by making a direct session check
      const sessionResponse = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      if (!sessionResponse.ok) {
        console.error("Session validation failed:", await sessionResponse.text());
        toast({
          title: "Authentication required",
          description: "Your session has expired. Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      
      const userData = await sessionResponse.json();
      console.log("Session validated, user data:", userData);
      
      if (!userData || !userData.id) {
        toast({
          title: "Authentication required",
          description: "Please log in to continue",
          variant: "destructive",
        });
        return;
      }

      // Parse quantity as a number for validation but keep as string for API
      let quantityValue: number;
      if (typeof data.quantity === 'string') {
        quantityValue = parseFloat(data.quantity);
      } else {
        quantityValue = data.quantity;
      }

      if (isNaN(quantityValue)) {
        toast({
          title: "Invalid quantity",
          description: "Please enter a valid number for quantity",
          variant: "destructive",
        });
        return;
      }

      // Always convert quantity to string for the API
      const quantityString = quantityValue.toString();

      // Include quality parameters from the state
      const formattedData = {
        ...data,
        qualityParameters: selectedQualityParams,
        ownerId: userData.id, // Use the validated user data from session check
        status: "processing", // Initial status
        channelType: "green", // Default channel
        quantity: quantityString, // Send as string to match API expectations
        valuation: (quantityValue * 50).toString(), // Rs 50 per kg standard rate
        // Add pickup/delivery details
        depositDetails: {
          pickupDate,
          pickupTime: useWarehouseDelivery ? null : pickupTime,
          pickupAddress: useWarehouseDelivery ? null : pickupAddress,
          pickupCoordinates: useWarehouseDelivery ? null : pickupCoordinates,
          useWarehouseDelivery,
        }
      };

      console.log("Submitting commodity data:", formattedData);

      // Create deposit process directly (includes commodity creation)
      const processPayload = {
        type: "deposit",
        commodityName: data.name,
        commodityType: data.type,
        quantity: quantityValue,
        warehouseId: typeof selectedWarehouse.id === 'string' ? parseInt(selectedWarehouse.id) : selectedWarehouse.id,
        deliveryMethod: useWarehouseDelivery ? "self_delivery" : "managed_pickup",
        scheduledDate: pickupDate,
        scheduledTime: useWarehouseDelivery ? null : pickupTime,
        pickupAddress: useWarehouseDelivery ? null : pickupAddress,
        estimatedValue: quantityValue * 50, // Rs 50 per kg standard rate
        qualityParameters: selectedQualityParams,
        notes: data.notes || ""
      };

      console.log("Creating deposit process:", processPayload);

      const processResponse = await apiRequest(
        "POST",
        "/api/processes",
        processPayload
      );

      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create deposit process");
      }

      const processResult = await processResponse.json();
      console.log("Process created:", processResult);

      if (processResult && processResult.id) {
        setProcessId(processResult.id);

        // Move to confirmation step
        setCurrentStep(DepositStep.Confirmation);

        toast({
          title: "Deposit initiated successfully",
          description: "Your commodity deposit process has been started",
        });
      } else {
        throw new Error("Process ID not returned from server");
      }
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create deposit. Please try again.",
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>Select Warehouse</CardTitle>
                    <CardDescription>
                      Choose from our network of authentic Indian mandi-based warehouse facilities
                    </CardDescription>
                  </div>
                </div>
                <HelpButton 
                  onClick={() => setIsHelpOpen(true)} 
                  showLabel={true}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Choose Warehouse</label>
                <WarehouseSelector
                  warehouses={warehouses as any}
                  selectedWarehouse={selectedWarehouse as any}
                  onSelect={handleSelectWarehouse as any}
                />
              </div>
              
              {selectedWarehouse && (
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{selectedWarehouse.name}</h3>
                        {(selectedWarehouse as any).mandiName && (selectedWarehouse as any).mandiName !== selectedWarehouse.city && (
                          <p className="text-sm text-muted-foreground">
                            Based on {(selectedWarehouse as any).mandiName} Mandi
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {(selectedWarehouse as any).district && (selectedWarehouse as any).district !== selectedWarehouse.city ? 
                              `${selectedWarehouse.city}, ${(selectedWarehouse as any).district}` : 
                              selectedWarehouse.city
                            }
                          </div>
                          {userLocation && selectedWarehouse.latitude && selectedWarehouse.longitude && (
                            <span>
                              {calculateDistance(
                                userLocation[0],
                                userLocation[1],
                                parseFloat(selectedWarehouse.latitude),
                                parseFloat(selectedWarehouse.longitude)
                              ).toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>
                      <Check className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleNextStep}
                disabled={!selectedWarehouse}
              >
                Continue to Pickup Schedule
              </Button>
            </CardFooter>
          </Card>
        )}

        {currentStep === DepositStep.CommodityDetails && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
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
                <HelpButton 
                  onClick={() => setIsHelpOpen(true)} 
                  showLabel={true}
                />
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
                        <FormLabel>
                          <ContextualTooltip
                            title="Commodity Name"
                            description="Smart bilingual commodity selector with standard agricultural products. Select from predefined commodities or enter custom names."
                            tips={[
                              "Search in English or Hindi: 'Wheat' or 'गेहूं'",
                              "Categories include: Grains, Pulses, Spices, Oilseeds, Fibres",
                              "Custom commodities allowed if not in predefined list",
                              "Bilingual display helps with local documentation"
                            ]}
                          >
                            Commodity Name
                          </ContextualTooltip>
                        </FormLabel>
                        <FormControl>
                          <CommoditySelector
                            value={field.value}
                            onChange={field.onChange}
                            onCategorySelect={(category) => {
                              // Auto-populate the commodity type based on selected category
                              form.setValue("type", category);
                            }}
                            placeholder="Search commodities in English or Hindi..."
                          />
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Grains">Grains</SelectItem>
                            <SelectItem value="Pulses">Pulses</SelectItem>
                            <SelectItem value="Oilseeds">Oilseeds</SelectItem>
                            <SelectItem value="Spices">Spices</SelectItem>
                            <SelectItem value="Fibres">Fibres</SelectItem>
                            <SelectItem value="Cash Crops">Cash Crops</SelectItem>
                            <SelectItem value="Nuts">Nuts</SelectItem>
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
                          <FormLabel>
                            <ContextualTooltip
                              title="Quantity"
                              description="The total weight of commodity you want to deposit. This will be verified during quality assessment."
                              tips={[
                                "Enter the approximate weight in metric tons (MT)",
                                "Final weight will be confirmed during warehouse intake",
                                "Minimum quantity is 0.1 MT for most commodities"
                              ]}
                            >
                              Quantity
                            </ContextualTooltip>
                          </FormLabel>
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
                      <label className="text-sm font-medium mb-1.5 block">Available Time Slots</label>
                      <TimeSlotPicker
                        selectedDate={pickupDate ? new Date(pickupDate) : new Date()}
                        value={pickupTime}
                        onChange={(selectedTime) => setPickupTime(selectedTime)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Pickup Address *</label>
                      <LocationPicker 
                        onLocationSelect={(address, coordinates) => {
                          setPickupAddress(address);
                          setPickupCoordinates(coordinates); // Store coordinates in state
                          console.log("Selected coordinates:", coordinates);
                        }}
                        initialAddress={pickupAddress}
                        className="mt-2"
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
      
      {/* Help Overlay */}
      <HelpOverlay
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        currentStage="commodity_details"
        processType="deposit_form"
      />
    </div>
  );
}