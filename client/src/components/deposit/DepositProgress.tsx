import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Process } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Truck, Package, FileCheck, ClipboardCheck, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DepositProgressProps {
  processId: number;
}

export default function DepositProgress({ processId }: DepositProgressProps) {
  const [progress, setProgress] = useState(0);
  
  // Fetch process data
  const { data: process, isLoading } = useQuery({
    queryKey: ['/api/processes', processId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/processes/${processId}`);
      return res.json();
    }
  });
  
  // Update progress based on current stage
  useEffect(() => {
    if (process) {
      const stages = [
        'pickup_scheduled',
        'pickup_assigned', 
        'pickup_in_progress', 
        'arrived_at_warehouse',
        'pre_cleaning',
        'quality_assessment',
        'ewr_generation'
      ];
      
      const currentStageIndex = stages.indexOf(process.currentStage);
      const progressPercentage = Math.round((currentStageIndex / (stages.length - 1)) * 100);
      
      setProgress(progressPercentage);
    }
  }, [process]);
  
  // Helper to get stage badge variant
  const getStageStatus = (stage: string) => {
    if (!process?.stageProgress) return 'pending';
    return process.stageProgress[stage] || 'pending';
  };
  
  // Helper to get badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Helper to get badge styling
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'in_progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'pending': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'failed': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return '';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600 animate-pulse" />;
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };
  
  // Mock data for assigned vehicle
  const assignedVehicle = {
    id: 'V-' + Math.floor(1000 + Math.random() * 9000),
    type: 'Pickup Truck',
    capacity: '4.5 MT',
    driver: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      rating: 4.8
    },
    eta: new Date(new Date().getTime() + 25 * 60000), // 25 mins from now
    currentLocation: 'Pitampura, Delhi',
    distance: '8.2 km away'
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading deposit progress...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (!process) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load deposit progress information</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Deposit Progress</CardTitle>
            <CardDescription>
              Tracking deposit #{processId} - Started on {formatDate(process.startTime)}
            </CardDescription>
          </div>
          <Badge 
            variant={process.status === 'completed' ? 'success' : 'secondary'}
            className={`text-xs ${getBadgeStyle(process.status)}`}
          >
            {process.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* Estimated completion */}
        <div className="bg-muted p-3 rounded-md flex items-center space-x-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Estimated Completion</p>
            <p className="text-sm text-muted-foreground">
              {process.estimatedCompletionTime ? 
                formatDateTime(process.estimatedCompletionTime) : 
                'Calculating...'}
            </p>
          </div>
        </div>
        
        {/* Vehicle assignment (show only in certain stages) */}
        {(['pickup_assigned', 'pickup_in_progress'].includes(process.currentStage)) && (
          <div className="border rounded-md overflow-hidden">
            <div className="bg-primary/10 p-3">
              <h3 className="font-medium flex items-center">
                <Truck className="h-4 w-4 mr-2" />
                Vehicle Assigned
              </h3>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{assignedVehicle.id}</span>
                <Badge variant="outline">{assignedVehicle.type}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Driver</p>
                  <p>{assignedVehicle.driver.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p>{assignedVehicle.driver.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Location</p>
                  <p>{assignedVehicle.currentLocation}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ETA</p>
                  <p className="font-medium">{formatDateTime(assignedVehicle.eta)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stages timeline */}
        <div className="space-y-4">
          <h3 className="font-medium">Process Timeline</h3>
          
          <div className="space-y-4">
            {/* Pickup scheduled */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('pickup_scheduled') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Pickup Scheduled</h4>
                  <Badge className={getBadgeStyle(getStageStatus('pickup_scheduled'))}>
                    {getStatusIcon(getStageStatus('pickup_scheduled'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('pickup_scheduled')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Deposit request submitted and pickup scheduled</p>
              </div>
            </div>
            
            {/* Vehicle assigned */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('pickup_assigned') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Truck className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vehicle Assigned</h4>
                  <Badge className={getBadgeStyle(getStageStatus('pickup_assigned'))}>
                    {getStatusIcon(getStageStatus('pickup_assigned'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('pickup_assigned')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Transport vehicle has been assigned for pickup</p>
              </div>
            </div>
            
            {/* Pickup in progress */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('pickup_in_progress') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Truck className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Pickup In Progress</h4>
                  <Badge className={getBadgeStyle(getStageStatus('pickup_in_progress'))}>
                    {getStatusIcon(getStageStatus('pickup_in_progress'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('pickup_in_progress')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Vehicle en route to your location for pickup</p>
              </div>
            </div>
            
            {/* Arrived at warehouse */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('arrived_at_warehouse') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Package className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Arrived at Warehouse</h4>
                  <Badge className={getBadgeStyle(getStageStatus('arrived_at_warehouse'))}>
                    {getStatusIcon(getStageStatus('arrived_at_warehouse'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('arrived_at_warehouse')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Commodity delivered to warehouse facility</p>
              </div>
            </div>
            
            {/* Pre-cleaning */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('pre_cleaning') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <FileCheck className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Pre-cleaning & Processing</h4>
                  <Badge className={getBadgeStyle(getStageStatus('pre_cleaning'))}>
                    {getStatusIcon(getStageStatus('pre_cleaning'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('pre_cleaning')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Initial cleaning and processing of commodity</p>
              </div>
            </div>
            
            {/* Quality assessment */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('quality_assessment') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div className="bg-border w-px h-full"></div>
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Quality Assessment</h4>
                  <Badge className={getBadgeStyle(getStageStatus('quality_assessment'))}>
                    {getStatusIcon(getStageStatus('quality_assessment'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('quality_assessment')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Comprehensive quality parameters assessment</p>
              </div>
            </div>
            
            {/* EWR generation */}
            <div className="flex">
              <div className="mr-3 flex flex-col items-center">
                <div className={`rounded-full p-1 ${getStageStatus('ewr_generation') === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">eWR Generation</h4>
                  <Badge className={getBadgeStyle(getStageStatus('ewr_generation'))}>
                    {getStatusIcon(getStageStatus('ewr_generation'))}
                    <span className="ml-1 uppercase text-[10px]">{getStageStatus('ewr_generation')}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Electronic Warehouse Receipt issuance</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}