import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  PackageCheck,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Process } from '@shared/schema';

interface WithdrawalTrackerProps {
  process: Process;
  onWithdrawalCompleted?: () => void;
}

interface StageConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function WithdrawalTracker({ process, onWithdrawalCompleted }: WithdrawalTrackerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  
  const stages: StageConfig[] = [
    {
      id: 'verification',
      title: 'Verification',
      description: 'Verifying ownership and receipt details',
      icon: <FileText className="h-8 w-8" />,
    },
    {
      id: 'preparation',
      title: 'Preparation',
      description: 'Preparing the commodity for withdrawal',
      icon: <PackageCheck className="h-8 w-8" />,
    },
    {
      id: 'document_check',
      title: 'Document Check',
      description: 'Verifying withdrawal documentation',
      icon: <CheckSquare className="h-8 w-8" />,
    },
    {
      id: 'physical_release',
      title: 'Physical Release',
      description: 'Releasing commodity for pickup',
      icon: <Truck className="h-8 w-8" />,
    },
    {
      id: 'quantity_confirmation',
      title: 'Quantity Confirmation',
      description: 'Confirming withdrawal quantity',
      icon: <CheckCircle2 className="h-8 w-8" />,
    },
    {
      id: 'receipt_update',
      title: 'Receipt Update',
      description: 'Updating receipt status and records',
      icon: <FileText className="h-8 w-8" />,
    },
  ];

  useEffect(() => {
    // Calculate progress based on completed stages
    const stageProgress = process.stageProgress || {};
    const totalStages = stages.length;
    const completedStages = Object.values(stageProgress).filter(status => status === 'completed').length;
    const progress = Math.floor((completedStages / totalStages) * 100);
    setCurrentProgress(progress);
  }, [process]);

  const getStageStatus = (stageId: string) => {
    const stageProgress = process.stageProgress as Record<string, string> || {};
    return stageProgress[stageId] || 'pending';
  };

  const handleCompleteWithdrawal = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', `/api/processes/${process.id}/complete-withdrawal`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete withdrawal');
      }
      
      const data = await response.json();
      
      // Show success message
      toast({
        title: 'Withdrawal Completed',
        description: data.message,
        variant: 'default',
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      
      // Notify parent that withdrawal is completed
      if (onWithdrawalCompleted) {
        onWithdrawalCompleted();
      }
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };
  
  const isComplete = process.status === 'completed';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Withdrawal Process</span>
          {process.status === 'in_progress' && (
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
          )}
          {process.status === 'completed' && (
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
          )}
          {process.status === 'failed' && (
            <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Failed</span>
          )}
        </CardTitle>
        <CardDescription>
          Track the status of your commodity withdrawal process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{currentProgress}%</span>
          </div>
          <Progress value={currentProgress} className="h-2" />
        </div>
        
        <div className="space-y-6 mt-6">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id);
            const isActive = process.currentStage === stage.id;
            const statusColor = getStageColor(status);
            
            return (
              <div 
                key={stage.id} 
                className={`flex items-start space-x-4 p-3 rounded-lg ${
                  isActive ? 'bg-muted' : ''
                }`}
              >
                <div className={statusColor}>{stage.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{stage.title}</h4>
                    <div className="flex items-center">
                      {status === 'completed' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {status === 'in_progress' && (
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                      )}
                      {status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      {status === 'pending' && (
                        <Clock className="h-5 w-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      {!isComplete && (
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            Updates will be shown here as the process progresses.
          </p>
          <Button 
            variant="outline" 
            onClick={handleCompleteWithdrawal}
            disabled={loading || process.status !== 'in_progress' || currentProgress < 80}
          >
            {loading ? 'Processing...' : 'Complete Withdrawal'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}