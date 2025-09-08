import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DepositTrackerProps {
  depositId: number;
}

export default function DepositTracker({ depositId }: DepositTrackerProps) {
  const { data: deposit, isLoading } = useQuery({
    queryKey: ['deposit-progress', depositId],
    queryFn: () => fetch(`/api/deposits/${depositId}/progress`, {
      credentials: 'include'
    }).then(r => r.json()),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    retry: 3
  });

  const stages = [
    { key: 'pickup_scheduled', name: 'Submitted', icon: '📝' },
    { key: 'in_transit', name: 'In Transit', icon: '🚚' },
    { key: 'arrived_warehouse', name: 'Arrived', icon: '🏢' },
    { key: 'quality_check', name: 'Quality Assessment', icon: '🔬' },
    { key: 'receipt_generated', name: 'Receipt Ready', icon: '📄' }
  ];

  const getStageStatus = (stageKey: string) => {
    if (!deposit?.progress) return 'pending';
    return deposit.progress[stageKey] || 'pending';
  };

  const currentStageIndex = stages.findIndex(s => s.key === deposit?.currentStage);
  const progressPercentage = currentStageIndex >= 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="flex justify-between items-center mb-8">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded mb-6"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Deposit Progress</h2>

        {/* Linear Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.key);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              const isPending = status === 'pending';

              return (
                <div key={stage.key} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl
                    ${isCompleted ? 'bg-green-100 text-green-600 ring-2 ring-green-200' : 
                      isCurrent ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300 animate-pulse' :
                      'bg-gray-100 text-gray-400'}`}
                  >
                    {stage.icon}
                  </div>
                  <span className={`text-sm text-center mt-2 px-2
                    ${isCompleted ? 'text-green-600 font-medium' : 
                      isCurrent ? 'text-blue-600 font-medium' :
                      'text-gray-500'}`}
                  >
                    {stage.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded transition-all duration-1000 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Current Status */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-400">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Current Status
          </h3>
          <p className="text-blue-800 mt-1">{deposit?.statusMessage}</p>
          {deposit?.estimatedCompletion && (
            <p className="text-blue-600 text-sm mt-2 flex items-center gap-1">
              <span>⏰</span>
              Estimated completion: {new Date(deposit.estimatedCompletion).toLocaleString()}
            </p>
          )}
        </div>

        {/* Progress Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Process ID</h4>
            <p className="text-sm text-gray-600">#{depositId}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Progress</h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-center text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Updates automatically every 10 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}