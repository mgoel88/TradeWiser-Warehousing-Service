import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, SkipForward, Gauge, Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ManualProgressionControlsProps {
  processId: number;
  currentStage: string;
  status: string;
  onProgressUpdate: () => void;
}

const STAGE_DEFINITIONS = [
  {
    key: 'pickup_scheduled',
    name: 'Pickup Scheduled',
    description: 'Pickup has been scheduled with logistics partner',
    duration: '15 minutes'
  },
  {
    key: 'pickup_assigned',
    name: 'Vehicle Assigned',
    description: 'Transport vehicle and driver assigned',
    duration: '10 minutes'
  },
  {
    key: 'pickup_in_progress',
    name: 'En Route to Pickup',
    description: 'Vehicle is traveling to pickup location',
    duration: '2-4 hours'
  },
  {
    key: 'arrived_at_warehouse',
    name: 'Arrived at Warehouse',
    description: 'Commodity delivered to warehouse facility',
    duration: '30 minutes'
  },
  {
    key: 'pre_cleaning',
    name: 'Pre-cleaning & Sorting',
    description: 'Initial cleaning and grade sorting process',
    duration: '1-2 hours'
  },
  {
    key: 'quality_assessment',
    name: 'Quality Assessment',
    description: 'Detailed quality testing and grading',
    duration: '2-3 hours'
  },
  {
    key: 'ewr_generation',
    name: 'eWR Generation',
    description: 'Electronic Warehouse Receipt created',
    duration: '5 minutes'
  }
];

export default function ManualProgressionControls({ 
  processId, 
  currentStage, 
  status,
  onProgressUpdate 
}: ManualProgressionControlsProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const { toast } = useToast();

  const getCurrentStageIndex = () => {
    return STAGE_DEFINITIONS.findIndex(stage => stage.key === currentStage);
  };

  const getNextStage = () => {
    const currentIndex = getCurrentStageIndex();
    if (currentIndex < STAGE_DEFINITIONS.length - 1) {
      return STAGE_DEFINITIONS[currentIndex + 1];
    }
    return null;
  };

  const advanceToNextStage = async () => {
    const nextStage = getNextStage();
    if (!nextStage) return;

    setIsAdvancing(true);
    try {
      const response = await apiRequest('POST', `/api/processes/${processId}/advance-stage`, {
        nextStage: nextStage.key,
        demoMode: true
      });

      if (response.ok) {
        toast({
          title: 'Stage Advanced',
          description: `Moved to: ${nextStage.name}`,
          duration: 3000,
        });
        
        // Trigger progress update with a small delay for better UX
        setTimeout(onProgressUpdate, 1000);
      }
    } catch (error) {
      console.error('Failed to advance stage:', error);
      toast({
        title: 'Failed to advance stage',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsAdvancing(false);
    }
  };

  const jumpToStage = async (targetStage: string) => {
    setIsAdvancing(true);
    try {
      const response = await apiRequest('POST', `/api/processes/${processId}/jump-to-stage`, {
        targetStage,
        demoMode: true
      });

      if (response.ok) {
        const stageName = STAGE_DEFINITIONS.find(s => s.key === targetStage)?.name || targetStage;
        toast({
          title: 'Jumped to Stage',
          description: `Moved to: ${stageName}`,
          duration: 3000,
        });
        
        setTimeout(onProgressUpdate, 1000);
      }
    } catch (error) {
      console.error('Failed to jump to stage:', error);
      toast({
        title: 'Failed to jump to stage',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsAdvancing(false);
    }
  };

  const resetToBeginning = async () => {
    setIsAdvancing(true);
    try {
      const response = await apiRequest('POST', `/api/processes/${processId}/reset-stages`, {
        demoMode: true
      });

      if (response.ok) {
        toast({
          title: 'Process Reset',
          description: 'Returned to initial stage',
          duration: 3000,
        });
        
        setTimeout(onProgressUpdate, 1000);
      }
    } catch (error) {
      console.error('Failed to reset process:', error);
      toast({
        title: 'Failed to reset',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsAdvancing(false);
    }
  };

  const currentIndex = getCurrentStageIndex();
  const nextStage = getNextStage();

  return (
    <Card className="border-dashed border-blue-300 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Gauge className="h-5 w-5 mr-2 text-blue-600" />
              Demo Controls
            </CardTitle>
            <CardDescription>
              Manual progression controls for demonstration purposes
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            Stage {currentIndex + 1} of {STAGE_DEFINITIONS.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Stage Info */}
        <div className="p-3 bg-white rounded border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Current Stage</h4>
            <Badge variant="default" className="text-xs">
              ACTIVE
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-900">
            {STAGE_DEFINITIONS[currentIndex]?.name}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {STAGE_DEFINITIONS[currentIndex]?.description}
          </p>
        </div>

        {/* Progressive Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Advance to Next Stage */}
          <Button
            onClick={advanceToNextStage}
            disabled={isAdvancing || !nextStage}
            className="justify-start text-sm h-auto p-3"
            variant={nextStage ? "default" : "secondary"}
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center">
                <SkipForward className="h-4 w-4 mr-2" />
                {nextStage ? 'Advance to Next' : 'Process Complete'}
              </div>
              {nextStage && (
                <span className="text-xs opacity-80 mt-1">
                  → {nextStage.name}
                </span>
              )}
            </div>
          </Button>

          {/* Reset to Beginning */}
          <Button
            onClick={resetToBeginning}
            disabled={isAdvancing}
            variant="outline"
            className="justify-start text-sm h-auto p-3"
          >
            <div className="flex flex-col items-start w-full">
              <div className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Reset Demo
              </div>
              <span className="text-xs opacity-70 mt-1">
                Start from pickup
              </span>
            </div>
          </Button>
        </div>

        <Separator />

        {/* Quick Jump Controls */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Quick Jump Controls
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {STAGE_DEFINITIONS.map((stage, index) => (
              <Button
                key={stage.key}
                onClick={() => jumpToStage(stage.key)}
                disabled={isAdvancing}
                variant={stage.key === currentStage ? "default" : "outline"}
                size="sm"
                className="justify-start text-xs h-auto p-2"
              >
                <div className="flex flex-col items-start w-full">
                  <div className="flex items-center">
                    {stage.key === currentStage && (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    <span className="font-medium">{index + 1}. {stage.name.split(' ')[0]}</span>
                  </div>
                  <span className="opacity-70 mt-0.5 leading-tight">
                    {stage.duration}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Demo Information */}
        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded border">
          <strong>Demo Mode:</strong> These controls allow you to manually advance through stages to demonstrate 
          the real-time tracking system. In production, stages advance automatically as warehouse operations complete.
        </div>
      </CardContent>
    </Card>
  );
}