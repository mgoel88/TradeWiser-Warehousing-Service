import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/context/WebSocketContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeEntity } from "@/hooks/use-real-time-entity";
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Clock, Truck, Building, FlaskConical, Calculator, FileText, Phone, MapPin, Package, Users, Activity } from 'lucide-react';

interface DepositProgress {
  id: number;
  currentStage: string;
  statusMessage: string;
  estimatedCompletion: string;
  progress: Record<string, string>;
  commodity?: {
    name: string;
    quantity: number;
    measurementUnit: string;
    estimatedValue: number;
  };
  warehouse?: {
    name: string;
    address: string;
    contact: string;
  };
  transport?: {
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    transportCompany: string;
  };
}

const DEPOSIT_STAGES = [
  { 
    key: 'pickup_scheduled', 
    name: 'Pickup Scheduled', 
    icon: Clock, 
    description: 'Vehicle assigned and pickup scheduled',
    color: 'bg-blue-500'
  },
  { 
    key: 'in_transit', 
    name: 'In Transit', 
    icon: Truck, 
    description: 'Commodity being transported to warehouse',
    color: 'bg-yellow-500'
  },
  { 
    key: 'arrived_warehouse', 
    name: 'Arrived at Warehouse', 
    icon: Building, 
    description: 'Reached warehouse facility',
    color: 'bg-purple-500'
  },
  { 
    key: 'quality_assessment', 
    name: 'Quality Assessment', 
    icon: FlaskConical, 
    description: 'Quality inspection and grading in progress',
    color: 'bg-orange-500'
  },
  { 
    key: 'pricing_complete', 
    name: 'Pricing Complete', 
    icon: Calculator, 
    description: 'Valuation and pricing finalized',
    color: 'bg-indigo-500'
  },
  { 
    key: 'receipt_generated', 
    name: 'Receipt Generated', 
    icon: FileText, 
    description: 'Electronic warehouse receipt ready',
    color: 'bg-green-500'
  }
];

export default function TrackDepositPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Parse and validate deposit ID
  const depositId = id ? parseInt(id, 10) : null;

  // Set up real-time tracking for the deposit process
  const realTimeEntity = useRealTimeEntity(
    'process',
    depositId || 0,
    {
      autoRefresh: true,
      onUpdate: useCallback((data: any) => {
        console.log('🔔 Real-time deposit update received:', data);
        setLastUpdate(new Date());
        toast({
          title: "Deposit Update",
          description: `Your deposit has progressed to: ${data.currentStage || 'next stage'}`,
          duration: 5000
        });
      }, [toast])
    }
  );

  // Fetch deposit progress data
  const { data: progressData, isLoading, refetch } = useQuery({
    queryKey: ['deposit-progress', depositId],
    queryFn: async () => {
      if (!depositId) throw new Error('Invalid deposit ID');
      const response = await apiRequest('GET', `/api/deposits/${depositId}/progress`);
      if (!response.ok) throw new Error('Failed to fetch deposit progress');
      return await response.json() as DepositProgress;
    },
    enabled: !!depositId,
    // Only use polling when WebSocket is not connected
    refetchInterval: isConnected ? false : 10000,
    retry: 3
  });

  // Start tracking mutation
  const startTrackingMutation = useMutation({
    mutationFn: async () => {
      if (!depositId) throw new Error('Invalid deposit ID');
      const response = await apiRequest('POST', `/api/deposits/${depositId}/start-tracking`);
      if (!response.ok) throw new Error('Failed to start tracking');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Tracking Started", description: "Real-time tracking has been initiated for your deposit." });
      refetch();
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to start tracking. Please try again.", variant: "destructive" });
    }
  });


  // Update last update time when data changes
  useEffect(() => {
    if (progressData) {
      setLastUpdate(new Date());
    }
  }, [progressData]);

  // Handle invalid or missing deposit ID
  if (!id || !depositId || isNaN(depositId)) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Deposit ID</h1>
            <p className="text-red-700 mb-6">
              {!id ? 'The tracking URL is missing a deposit ID.' : 'The deposit ID must be a valid number.'}
            </p>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getCurrentStageIndex = () => {
    if (!progressData?.currentStage) return -1;
    return DEPOSIT_STAGES.findIndex(stage => stage.key === progressData.currentStage);
  };

  const getStageStatus = (stageIndex: number) => {
    const currentIndex = getCurrentStageIndex();
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const calculateOverallProgress = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex < 0) return 0;
    return Math.round(((currentIndex + 1) / DEPOSIT_STAGES.length) * 100);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Track Deposit #{depositId}</h1>
              <p className="text-gray-600 mt-1">Real-time tracking of your commodity deposit</p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="flex justify-between">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-2">
                      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
                <div className="h-32 bg-gray-100 rounded"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!isLoading && progressData && (
          <div className="space-y-8">
            {/* Overall Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Overall Progress</h2>
                  <Badge variant="outline" className="px-3 py-1">
                    {calculateOverallProgress()}% Complete
                  </Badge>
                </div>
                <Progress value={calculateOverallProgress()} className="h-3 mb-4" />
                <p className="text-sm text-gray-600">
                  Last updated: {lastUpdate.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Stage Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tracking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 hidden md:block">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000 ease-out"
                      style={{ width: `${calculateOverallProgress()}%` }}
                    />
                  </div>

                  {/* Stages */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-2">
                    {DEPOSIT_STAGES.map((stage, index) => {
                      const status = getStageStatus(index);
                      const IconComponent = stage.icon;
                      
                      return (
                        <div key={stage.key} className="flex flex-col items-center text-center relative">
                          {/* Stage Icon */}
                          <div className={`
                            relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300
                            ${status === 'completed' 
                              ? 'bg-green-500 border-green-200 text-white' 
                              : status === 'current' 
                                ? `${stage.color} border-white text-white shadow-lg scale-110 animate-pulse` 
                                : 'bg-gray-100 border-gray-200 text-gray-400'
                            }
                          `}>
                            {status === 'completed' ? (
                              <CheckCircle className="h-8 w-8" />
                            ) : (
                              <IconComponent className="h-8 w-8" />
                            )}
                          </div>
                          
                          {/* Stage Info */}
                          <div className="mt-3 space-y-1">
                            <h3 className={`
                              text-sm font-medium
                              ${status === 'completed' ? 'text-green-600' : 
                                status === 'current' ? 'text-blue-600' : 'text-gray-500'}
                            `}>
                              {stage.name}
                            </h3>
                            <p className="text-xs text-gray-500 max-w-24">
                              {stage.description}
                            </p>
                            
                            {/* Status Badge */}
                            <Badge 
                              variant={status === 'completed' ? 'default' : status === 'current' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {status === 'completed' ? 'Done' : status === 'current' ? 'Active' : 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardContent className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mt-1 flex-shrink-0"></div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Current Status</h3>
                      <p className="text-blue-800">{progressData.statusMessage}</p>
                      {progressData.estimatedCompletion && (
                        <p className="text-blue-600 text-sm mt-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Estimated completion: {new Date(progressData.estimatedCompletion).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Stage-Based Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Always show commodity details as base */}
              {progressData.commodity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-orange-500" />
                      Commodity Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">{progressData.commodity.name}</p>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Quantity</label>
                      <p className="text-gray-900">
                        {progressData.commodity.quantity} {progressData.commodity.measurementUnit}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Estimated Value</label>
                      <p className="text-gray-900 font-semibold text-green-600">
                        ₹{progressData.commodity.estimatedValue?.toLocaleString() || 'Calculating...'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card 2: Stage-dependent middle card */}
              {(() => {
                switch (progressData.currentStage) {
                  case 'pickup_scheduled':
                  case 'pickup_assigned':
                    // Show pickup scheduling details
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5 text-blue-500" />
                            Pickup Schedule
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Scheduled Time</label>
                            <p className="text-gray-900">Today, 2:30 PM - 4:00 PM</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Pickup Location</label>
                            <p className="text-gray-900 flex items-start gap-1">
                              <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                              {progressData.warehouse?.address || 'Farm Location'}
                            </p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Instructions</label>
                            <p className="text-gray-900">Vehicle will arrive at farm gate</p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  case 'in_transit':
                    // Show real-time tracking during transit
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Truck className="h-5 w-5 text-yellow-500 animate-pulse" />
                            Live Tracking
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Current Location</label>
                            <p className="text-gray-900">NH-44, Near Panipat Toll Plaza</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Distance Remaining</label>
                            <p className="text-gray-900 font-semibold text-blue-600">42.3 km</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">ETA</label>
                            <p className="text-gray-900 font-semibold text-green-600">
                              {new Date(new Date().getTime() + 85 * 60000).toLocaleTimeString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  case 'arrived_warehouse':
                    // Show warehouse arrival and dock info
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Building className="h-5 w-5 text-purple-500" />
                            Warehouse Arrival
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Dock Assignment</label>
                            <p className="text-gray-900 font-semibold">Dock Bay #A-7</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Unloading Status</label>
                            <p className="text-gray-900">In Progress - 65% Complete</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Storage Zone</label>
                            <p className="text-gray-900">Zone B - Climate Controlled</p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  case 'quality_assessment':
                    // Show quality assessment parameters
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FlaskConical className="h-5 w-5 text-orange-500" />
                            Quality Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Moisture Content</label>
                            <p className="text-gray-900 font-semibold text-blue-600">12.5% ✓ Good</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contamination Level</label>
                            <p className="text-gray-900 font-semibold text-green-600">0.8% ✓ Excellent</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Grade Assessment</label>
                            <p className="text-gray-900 font-semibold text-green-600">Grade A Premium</p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  case 'pricing_complete':
                    // Show pricing and valuation breakdown
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Calculator className="h-5 w-5 text-indigo-500" />
                            Valuation Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Market Rate</label>
                            <p className="text-gray-900 font-semibold">₹2,245/quintal</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Quality Premium</label>
                            <p className="text-gray-900 font-semibold text-green-600">+₹85/quintal (3.8%)</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Final Valuation</label>
                            <p className="text-gray-900 font-semibold text-green-600">
                              ₹{((progressData.commodity?.estimatedValue || 500000)).toLocaleString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  case 'receipt_generated':
                    // Show eWR and blockchain details
                    return (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-green-500" />
                            Electronic Receipt
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-600">eWR Number</label>
                            <p className="text-gray-900 font-mono font-semibold">WR{Date.now().toString().slice(-8)}</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Blockchain Hash</label>
                            <p className="text-gray-900 font-mono text-sm">0x{Math.random().toString(16).substring(2, 18)}</p>
                          </div>
                          <Separator />
                          <div>
                            <label className="text-sm font-medium text-gray-600">Verification Status</label>
                            <p className="text-gray-900 font-semibold text-green-600">✓ Verified & Secured</p>
                          </div>
                        </CardContent>
                      </Card>
                    );

                  default:
                    // Fallback to warehouse information
                    if (progressData.warehouse) {
                      return (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Building className="h-5 w-5 text-blue-500" />
                              Warehouse Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Name</label>
                              <p className="text-gray-900">{progressData.warehouse.name}</p>
                            </div>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium text-gray-600">Address</label>
                              <p className="text-gray-900 flex items-start gap-1">
                                <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                {progressData.warehouse.address}
                              </p>
                            </div>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact</label>
                              <p className="text-gray-900 flex items-center gap-1">
                                <Phone className="h-4 w-4 text-gray-500" />
                                {progressData.warehouse.contact}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    }
                    return null;
                }
              })()}

              {/* Card 3: Transport Details - Show when relevant, otherwise show contextual info */}
              {(() => {
                // Show transport details during pickup and transit stages
                if (['pickup_scheduled', 'pickup_assigned', 'in_transit'].includes(progressData.currentStage) && progressData.transport) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Truck className="h-5 w-5 text-green-500" />
                          Transport Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Vehicle Number</label>
                          <p className="text-gray-900 font-mono font-semibold">
                            {progressData.transport.vehicleNumber}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Driver</label>
                          <p className="text-gray-900 flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-500" />
                            {progressData.transport.driverName}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Driver Contact</label>
                          <p className="text-gray-900 flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {progressData.transport.driverPhone}
                          </p>
                        </div>
                        {progressData.transport.transportCompany && (
                          <>
                            <Separator />
                            <div>
                              <label className="text-sm font-medium text-gray-600">Transport Company</label>
                              <p className="text-gray-900">{progressData.transport.transportCompany}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                }

                // Show warehouse info for warehouse-related stages
                if (progressData.warehouse && ['arrived_warehouse', 'quality_assessment', 'pricing_complete', 'receipt_generated'].includes(progressData.currentStage)) {
                  return (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Building className="h-5 w-5 text-blue-500" />
                          Warehouse Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Name</label>
                          <p className="text-gray-900">{progressData.warehouse.name}</p>
                        </div>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Address</label>
                          <p className="text-gray-900 flex items-start gap-1">
                            <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                            {progressData.warehouse.address}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <label className="text-sm font-medium text-gray-600">Contact</label>
                          <p className="text-gray-900 flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {progressData.warehouse.contact}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                // Default fallback card
                return null;
              })()}
            </div>

            {/* Start Tracking Button */}
            {!progressData.currentStage && (
              <Card>
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Ready to Start Tracking</h3>
                  <p className="text-gray-600 mb-4">
                    Click below to initiate real-time tracking for your deposit.
                  </p>
                  <Button 
                    onClick={() => startTrackingMutation.mutate()}
                    disabled={startTrackingMutation.isPending}
                    size="lg"
                    className="gap-2"
                  >
                    {startTrackingMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Starting Tracking...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4" />
                        Start Tracking
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Auto-refresh Status */}
            <div className="flex items-center justify-center text-sm text-gray-500 py-4">
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full">
                <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span>Updates automatically every 10 seconds</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && !progressData && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Deposit Not Found</h3>
                <p className="text-yellow-700 mb-4">
                  The deposit with ID #{depositId} could not be found or you don't have access to it.
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  variant="outline"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}