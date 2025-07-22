import { CheckCircle2, Clock, AlertCircle, Package, Truck, ClipboardCheck, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProcessStage {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  estimatedTime?: string;
}

interface ProcessStatusVisualizationProps {
  currentStage: string;
  stageProgress: Record<string, string>;
  status: string;
  processType: string;
}

const getStageIcon = (stageId: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    pickup_scheduled: Package,
    pickup_assigned: Truck,
    pickup_in_progress: Truck,
    arrived_at_warehouse: Package,
    pre_cleaning: ClipboardCheck,
    quality_assessment: ClipboardCheck,
    ewr_generation: FileText,
    ewr_generated: CheckCircle2
  };
  
  return iconMap[stageId] || Package;
};

const getStageStatus = (stageId: string, currentStage: string, stageProgress: Record<string, string>): 'completed' | 'in_progress' | 'pending' | 'failed' => {
  if (stageProgress && stageProgress[stageId]) {
    return stageProgress[stageId] as 'completed' | 'in_progress' | 'pending' | 'failed';
  }
  
  // Define stage order
  const stageOrder = [
    'pickup_scheduled',
    'pickup_assigned', 
    'pickup_in_progress',
    'arrived_at_warehouse',
    'pre_cleaning',
    'quality_assessment',
    'ewr_generation',
    'ewr_generated'
  ];
  
  const currentIndex = stageOrder.indexOf(currentStage);
  const stageIndex = stageOrder.indexOf(stageId);
  
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'in_progress';
  return 'pending';
};

const getStatusColor = (status: 'completed' | 'in_progress' | 'pending' | 'failed') => {
  switch (status) {
    case 'completed': return 'text-green-600 bg-green-100';
    case 'in_progress': return 'text-blue-600 bg-blue-100';
    case 'pending': return 'text-gray-500 bg-gray-100';
    case 'failed': return 'text-red-600 bg-red-100';
    default: return 'text-gray-500 bg-gray-100';
  }
};

const getStatusIcon = (status: 'completed' | 'in_progress' | 'pending' | 'failed') => {
  switch (status) {
    case 'completed': return CheckCircle2;
    case 'in_progress': return Clock;
    case 'failed': return AlertCircle;
    default: return Clock;
  }
};

export default function ProcessStatusVisualization({ 
  currentStage, 
  stageProgress, 
  status, 
  processType 
}: ProcessStatusVisualizationProps) {
  
  const stages: ProcessStage[] = [
    {
      id: 'pickup_scheduled',
      title: 'Pickup Scheduled',
      description: 'Your deposit request has been confirmed and pickup scheduled',
      icon: Package,
      status: getStageStatus('pickup_scheduled', currentStage, stageProgress),
      estimatedTime: '5 mins'
    },
    {
      id: 'pickup_assigned',
      title: 'Vehicle Assigned',
      description: 'Transport vehicle assigned for commodity pickup',
      icon: Truck,
      status: getStageStatus('pickup_assigned', currentStage, stageProgress),
      estimatedTime: '15 mins'
    },
    {
      id: 'pickup_in_progress',
      title: 'Pickup In Progress',
      description: 'Vehicle en route to your location for pickup',
      icon: Truck,
      status: getStageStatus('pickup_in_progress', currentStage, stageProgress),
      estimatedTime: '30-60 mins'
    },
    {
      id: 'arrived_at_warehouse',
      title: 'Arrived at Warehouse',
      description: 'Commodity delivered to warehouse facility',
      icon: Package,
      status: getStageStatus('arrived_at_warehouse', currentStage, stageProgress),
      estimatedTime: '10 mins'
    },
    {
      id: 'pre_cleaning',
      title: 'Pre-cleaning & Processing',
      description: 'Initial cleaning and preparation of commodity',
      icon: ClipboardCheck,
      status: getStageStatus('pre_cleaning', currentStage, stageProgress),
      estimatedTime: '2-4 hours'
    },
    {
      id: 'quality_assessment',
      title: 'Quality Assessment',
      description: 'Comprehensive quality analysis and grading',
      icon: ClipboardCheck,
      status: getStageStatus('quality_assessment', currentStage, stageProgress),
      estimatedTime: '1-2 hours'
    },
    {
      id: 'ewr_generation',
      title: 'eWR Generation',
      description: 'Electronic Warehouse Receipt creation and validation',
      icon: FileText,
      status: getStageStatus('ewr_generation', currentStage, stageProgress),
      estimatedTime: '15 mins'
    }
  ];

  // Calculate overall progress
  const completedStages = stages.filter(stage => stage.status === 'completed').length;
  const progressPercentage = Math.round((completedStages / stages.length) * 100);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header with overall progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Process Status</h3>
              <Badge variant="outline" className={cn(
                "font-medium",
                status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              )}>
                {status === 'completed' ? 'Completed' :
                 status === 'in_progress' ? 'In Progress' : 
                 'Pending'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>

          {/* Stage progression */}
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const StatusIcon = getStatusIcon(stage.status);
              const isLast = index === stages.length - 1;
              
              return (
                <div key={stage.id} className="relative">
                  <div className="flex items-start space-x-4">
                    {/* Stage icon and connector */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "rounded-full p-2 border-2 transition-colors",
                        stage.status === 'completed' ? 'bg-green-100 border-green-500' :
                        stage.status === 'in_progress' ? 'bg-blue-100 border-blue-500' :
                        stage.status === 'failed' ? 'bg-red-100 border-red-500' :
                        'bg-gray-100 border-gray-300'
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          stage.status === 'completed' ? 'text-green-600' :
                          stage.status === 'in_progress' ? 'text-blue-600' :
                          stage.status === 'failed' ? 'text-red-600' :
                          'text-gray-500'
                        )} />
                      </div>
                      
                      {/* Connector line */}
                      {!isLast && (
                        <div className={cn(
                          "w-px h-8 mt-1",
                          stage.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                        )} />
                      )}
                    </div>

                    {/* Stage content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={cn(
                            "font-medium",
                            stage.status === 'completed' ? 'text-green-900' :
                            stage.status === 'in_progress' ? 'text-blue-900' :
                            stage.status === 'failed' ? 'text-red-900' :
                            'text-gray-700'
                          )}>
                            {stage.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {stage.description}
                          </p>
                          {stage.estimatedTime && stage.status === 'in_progress' && (
                            <p className="text-xs text-blue-600 mt-1">
                              Estimated time: {stage.estimatedTime}
                            </p>
                          )}
                        </div>
                        
                        {/* Status indicator */}
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                            getStatusColor(stage.status)
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="capitalize">
                              {stage.status === 'in_progress' ? 'Active' : stage.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Additional info for completed processes */}
          {status === 'completed' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Process Complete!</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Your commodity has been successfully processed and your electronic warehouse receipt (eWR) 
                    has been generated. You can now view it in the Receipts section or use it as collateral for lending.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}