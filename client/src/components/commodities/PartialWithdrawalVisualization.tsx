import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Box, Scissors, Link as LinkIcon } from 'lucide-react';

export interface WithdrawalData {
  id: number;
  originalSackId: number;
  newSackId: number;
  withdrawnWeight: number;
  remainingWeight: number;
  timestamp: string;
  reason: string;
  blockchainHash?: string;
}

interface PartialWithdrawalVisualizationProps {
  withdrawalData: WithdrawalData;
  onViewSack?: (sackId: number) => void;
}

export function PartialWithdrawalVisualization({ 
  withdrawalData, 
  onViewSack 
}: PartialWithdrawalVisualizationProps) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const formattedDate = new Date(withdrawalData.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const totalWeight = withdrawalData.withdrawnWeight + withdrawalData.remainingWeight;
  const withdrawnPercentage = (withdrawalData.withdrawnWeight / totalWeight) * 100;
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Partial Withdrawal Record</h3>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        
        <div className="relative h-[280px] mb-6">
          {/* Original sack */}
          <motion.div 
            className="absolute top-8 left-12 bg-primary/10 border border-primary/20 rounded-lg p-4 w-44"
            initial={{ opacity: 1, x: 0 }}
            animate={{ 
              opacity: 1,
              x: animationComplete ? -20 : 0,
              width: animationComplete ? 140 : 176
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-center mb-2">
              <Box className="w-8 h-8 mx-auto text-primary" />
              <p className="font-medium mt-1">Original Sack</p>
              <p className="text-xs text-muted-foreground">#{withdrawalData.originalSackId}</p>
            </div>
            <motion.div
              className="h-16 bg-primary/20 rounded flex items-center justify-center"
              initial={{ height: 64 }}
              animate={{ height: animationComplete ? 48 : 64 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="font-semibold">
                {animationComplete ? withdrawalData.remainingWeight : totalWeight} kg
              </p>
            </motion.div>
          </motion.div>
          
          {/* Scissors animation */}
          <motion.div
            className="absolute top-[100px] left-[160px] text-muted-foreground"
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.2, 1.2, 0.5],
              rotate: [0, 0, 15, 30]
            }}
            transition={{ 
              duration: 2.5, 
              times: [0, 0.2, 0.8, 1],
              delay: 1.0,
              onComplete: () => setAnimationComplete(true)
            }}
          >
            <Scissors className="w-12 h-12" />
          </motion.div>
          
          {/* Blockchain transaction record */}
          <motion.div 
            className="absolute top-[135px] left-[140px] bg-primary/5 border border-primary/10 rounded p-2 text-xs w-44 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: animationComplete ? 1 : 0, y: animationComplete ? 0 : 20 }}
            transition={{ duration: 0.4, delay: 3.0 }}
          >
            <div className="flex items-center justify-center gap-1 text-primary">
              <LinkIcon className="w-3 h-3" />
              <span>Blockchain Record</span>
            </div>
            {withdrawalData.blockchainHash && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-mono text-[9px] truncate mt-1 cursor-help">
                      {withdrawalData.blockchainHash}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="font-mono text-xs">
                    {withdrawalData.blockchainHash}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </motion.div>
          
          {/* New sack after withdrawal */}
          <motion.div 
            className="absolute top-8 right-12 bg-green-500/10 border border-green-500/20 rounded-lg p-4 w-44"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: animationComplete ? 1 : 0, x: animationComplete ? 0 : 100 }}
            transition={{ duration: 0.5, delay: 2.5 }}
          >
            <div className="text-center mb-2">
              <Box className="w-8 h-8 mx-auto text-green-500" />
              <p className="font-medium mt-1">New Sack</p>
              <p className="text-xs text-muted-foreground">#{withdrawalData.newSackId}</p>
            </div>
            <div className="h-12 bg-green-500/20 rounded flex items-center justify-center">
              <p className="font-semibold">{withdrawalData.withdrawnWeight} kg</p>
            </div>
          </motion.div>
          
          {/* Arrow pointing from original to new */}
          <motion.div
            className="absolute top-[100px] left-[210px]"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: animationComplete ? 1 : 0, scaleX: animationComplete ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 2.5 }}
            style={{ transformOrigin: "left" }}
          >
            <ArrowRight className="w-16 h-16 text-muted-foreground" />
          </motion.div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Weight distribution</p>
          <p className="text-xs text-muted-foreground">Total: {totalWeight} kg</p>
        </div>
        
        <div className="h-4 rounded-full bg-muted overflow-hidden mb-4">
          <div 
            className="h-full bg-primary rounded-full"
            style={{ width: `${100 - withdrawnPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs mb-6">
          <div>
            <p className="font-medium">Remaining</p>
            <p>{withdrawalData.remainingWeight} kg ({Math.round(100 - withdrawnPercentage)}%)</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Withdrawn</p>
            <p>{withdrawalData.withdrawnWeight} kg ({Math.round(withdrawnPercentage)}%)</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
        
        {showDetails && (
          <div className="mt-4 text-sm border rounded-md p-3 bg-muted/50">
            <p className="mb-2"><span className="font-medium">Reason:</span> {withdrawalData.reason}</p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewSack && onViewSack(withdrawalData.originalSackId)}
              >
                View Original Sack
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewSack && onViewSack(withdrawalData.newSackId)}
              >
                View New Sack
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}