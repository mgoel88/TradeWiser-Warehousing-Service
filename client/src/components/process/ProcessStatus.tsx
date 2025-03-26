import { useQuery } from '@tanstack/react-query';
import { formatDateTime } from '@/lib/utils';
import { Process } from '@shared/schema';
import { CheckIcon, RefreshCwIcon, ShieldIcon, FileIcon } from 'lucide-react';

export default function ProcessStatus() {
  const { data: processes, isLoading } = useQuery({
    queryKey: ['/api/processes'],
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-headings font-medium text-lg">Active Process</h2>
        </div>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading process data...</p>
        </div>
      </div>
    );
  }
  
  // Get the most recent active process
  const activeProcess = processes && processes.length > 0
    ? processes.find((process: Process) => process.status === 'in_progress')
    : null;
  
  if (!activeProcess) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h2 className="font-headings font-medium text-lg">Active Process</h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">No active processes found.</p>
        </div>
      </div>
    );
  }
  
  // Define process stages and their icons
  const processStages = [
    {
      id: 'inward_processing',
      name: 'Inward Processing',
      description: 'Digital weighbridge confirmation',
      icon: <CheckIcon className="h-5 w-5" />,
    },
    {
      id: 'pre_cleaning',
      name: 'Pre-cleaning',
      description: 'Removing foreign materials',
      icon: <RefreshCwIcon className="h-5 w-5" />,
    },
    {
      id: 'quality_assessment',
      name: 'Quality Assessment',
      description: 'Multi-parameter quality analysis',
      icon: <ShieldIcon className="h-5 w-5" />,
    },
    {
      id: 'ewr_generation',
      name: 'eWR Generation',
      description: 'Blockchain-based receipt creation',
      icon: <FileIcon className="h-5 w-5" />,
    },
  ];
  
  // Get stage progress from active process
  const getStageProgress = (stageId: string) => {
    if (!activeProcess.stageProgress) return 'pending';
    return activeProcess.stageProgress[stageId] || 'pending';
  };
  
  // Get stage status info (icon background, text, etc.)
  const getStageStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          border: '',
          statusText: `Completed: ${formatDateTime(activeProcess.completedTime || new Date())}`,
        };
      case 'in_progress':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          border: 'border-2 border-yellow-400',
          statusText: `In progress (est. completion: ${
            activeProcess.estimatedCompletionTime 
              ? formatDateTime(activeProcess.estimatedCompletionTime)
              : '1 hour'
          })`,
        };
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-400',
          border: '',
          statusText: 'Pending',
        };
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <h2 className="font-headings font-medium text-lg">Active Process</h2>
      </div>
      <div className="p-4">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">
              {/* In a real app, we would join with commodity data */}
              Commodity ID: {activeProcess.commodityId}
            </h3>
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">In Progress</span>
          </div>
          <p className="text-sm text-gray-600">
            {/* In a real app, we would join with warehouse data */}
            Warehouse ID: {activeProcess.warehouseId}
          </p>
        </div>
        
        <div className="relative">
          <div className="absolute left-5 top-0 h-full w-0.5 bg-gray-200"></div>
          
          {processStages.map((stage, index) => {
            const stageProgress = getStageProgress(stage.id);
            const statusInfo = getStageStatusInfo(stageProgress);
            
            return (
              <div key={stage.id} className="relative flex items-start mb-6">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full ${statusInfo.iconBg} ${statusInfo.border} flex items-center justify-center z-10`}>
                  <div className={statusInfo.iconColor}>
                    {stage.icon}
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-medium">{stage.name}</h4>
                  <p className="text-xs text-gray-500">{stage.description}</p>
                  <p className="text-xs text-gray-400">{statusInfo.statusText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
