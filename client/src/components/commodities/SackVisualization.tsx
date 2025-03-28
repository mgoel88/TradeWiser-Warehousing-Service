import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  Package,
  Truck,
  User,
  Warehouse,
  Scissors,
  ArrowDownCircle,
  Link as LinkIcon,
  PieChart
} from "lucide-react";
import { formatDate } from '@/lib/utils';

interface Movement {
  id: number;
  sackId: number;
  movementType: string;
  movementDate: string;
  fromLocationName?: string;
  toLocationName?: string;
  fromOwnerName?: string;
  toOwnerName?: string;
  fromLocationId: number | null;
  toLocationId: number | null;
  fromOwnerId: number | null;
  toOwnerId: number | null;
  transactionHash: string | null;
  metadata: any;
}

interface SackVisualizationProps {
  sacks: any[];
  movements: Movement[];
  partialWithdrawals?: {
    id: number;
    originalSackId: number;
    newSackId: number;
    withdrawnWeight: number;
    remainingWeight: number;
    timestamp: string;
    reason: string;
  }[];
  isLoading?: boolean;
}

export function SackVisualization({ sacks, movements, partialWithdrawals = [], isLoading = false }: SackVisualizationProps) {
  const [selectedSackId, setSelectedSackId] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [displayMovements, setDisplayMovements] = useState<Movement[]>([]);
  
  // Sort movements by date
  useEffect(() => {
    if (movements.length > 0) {
      const sortedMovements = [...movements].sort(
        (a, b) => new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime()
      );
      setDisplayMovements(sortedMovements);
    }
  }, [movements]);
  
  // Auto-select first sack if none selected
  useEffect(() => {
    if (sacks.length > 0 && !selectedSackId) {
      setSelectedSackId(sacks[0].id);
    }
  }, [sacks, selectedSackId]);

  // Filter movements for selected sack
  const filteredMovements = displayMovements.filter(m => 
    selectedSackId ? m.sackId === selectedSackId : true
  );
  
  // Find partial withdrawals for selected sack
  const sackPartialWithdrawals = partialWithdrawals.filter(pw => 
    selectedSackId ? pw.originalSackId === selectedSackId : false
  );

  // Play movement animation
  const handlePlayAnimation = () => {
    setShowAnimation(true);
    // Reset after animation completes
    setTimeout(() => setShowAnimation(false), filteredMovements.length * 2000 + 1000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Visualization</CardTitle>
          <CardDescription>Please wait while we load the visualization data</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (sacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Sacks Available</CardTitle>
          <CardDescription>There are no sacks to visualize</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-6">
          <Package className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 max-w-md">
            No commodity sacks have been created yet. Generate sacks for this warehouse receipt to visualize their movements and blockchain tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedSack = sacks.find(s => s.id === selectedSackId);

  // Helper function to render movement icon based on type
  const getMovementIcon = (type: string) => {
    if (type.includes('location') || type.includes('transport')) {
      return <Truck className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('ownership')) {
      return <User className="h-5 w-5 text-green-500" />;
    } else if (type.includes('withdrawal') || type.includes('withdraw')) {
      return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
    } else if (type.includes('partial')) {
      return <Scissors className="h-5 w-5 text-amber-500" />;
    } else {
      return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format movement type for display
  const formatMovementType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Sack Visualization</span>
            <Badge variant="outline" className="ml-2">Blockchain Tracked</Badge>
          </CardTitle>
          <CardDescription>
            Track the movement and ownership history of individual sacks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {sacks.slice(0, 4).map((sack) => (
              <motion.div 
                key={sack.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer h-full ${selectedSackId === sack.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedSackId(sack.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{sack.status}</Badge>
                          {sack.isOwnerHidden && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" title="Private ownership" />
                          )}
                        </div>
                        <h3 className="font-medium mb-1">Sack #{sack.sackId}</h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {sack.weight} {sack.measurementUnit}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Last updated: {formatDate(new Date(sack.lastUpdated))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {selectedSack && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Selected Sack Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1 p-4 bg-muted rounded-md">
                  <span className="text-xs text-gray-500">ID</span>
                  <span className="font-medium">{selectedSack.sackId}</span>
                </div>
                <div className="flex flex-col space-y-1 p-4 bg-muted rounded-md">
                  <span className="text-xs text-gray-500">Weight</span>
                  <span className="font-medium">{selectedSack.weight} {selectedSack.measurementUnit}</span>
                </div>
                <div className="flex flex-col space-y-1 p-4 bg-muted rounded-md">
                  <span className="text-xs text-gray-500">Grade</span>
                  <span className="font-medium">{selectedSack.gradeAssigned || "Ungraded"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Visual journey map */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Journey Map</h3>
              {filteredMovements.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePlayAnimation}
                  disabled={showAnimation}
                >
                  {showAnimation ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    "Play Animation"
                  )}
                </Button>
              )}
            </div>

            {filteredMovements.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <Truck className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No Movement History</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This sack has not been moved or transferred yet.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Journey visualization */}
                <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-200 -translate-x-1/2 z-0" />
                
                <div className="relative z-10">
                  {filteredMovements.map((movement, index) => (
                    <AnimatePresence key={movement.id}>
                      <motion.div 
                        className="mb-6 relative"
                        initial={{ opacity: showAnimation ? 0 : 1, y: showAnimation ? 20 : 0 }}
                        animate={{ 
                          opacity: showAnimation 
                            ? index === 0 || showAnimation && index <= Math.floor((Date.now() - (new Date(showAnimation ? Date.now() : 0)).getTime()) / 2000) 
                              ? 1 
                              : 0.3
                            : 1,
                          y: 0 
                        }}
                        transition={{ 
                          delay: showAnimation ? index * 2 : 0,
                          duration: 0.5 
                        }}
                      >
                        <div className="flex items-center mb-2">
                          <div className="rounded-full p-2 bg-white border border-gray-200 mr-3">
                            {getMovementIcon(movement.movementType)}
                          </div>
                          <div>
                            <Badge variant="outline" className="mb-1">
                              {formatMovementType(movement.movementType)}
                            </Badge>
                            <div className="text-sm text-gray-500">
                              {formatDate(new Date(movement.movementDate))}
                            </div>
                          </div>
                        </div>
                        
                        <motion.div 
                          className="ml-7 pl-6 border-l border-dashed border-gray-200"
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          transition={{ duration: 0.5 }}
                        >
                          <Card>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-3 gap-4 mb-3">
                                {/* From */}
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500">From</p>
                                  {movement.movementType.includes('ownership') ? (
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-1 text-gray-500" />
                                      <span className="text-sm font-medium">
                                        {movement.fromOwnerName || `User #${movement.fromOwnerId}`}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <Warehouse className="h-4 w-4 mr-1 text-gray-500" />
                                      <span className="text-sm font-medium">
                                        {movement.fromLocationName || `Warehouse #${movement.fromLocationId}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Arrow */}
                                <div className="flex justify-center items-center">
                                  <motion.div
                                    animate={showAnimation && index === Math.floor((Date.now() - (new Date(showAnimation ? Date.now() : 0)).getTime()) / 2000) ? 
                                      { x: [0, 10, 0] } : {}}
                                    transition={{ repeat: showAnimation ? Infinity : 0, duration: 1 }}
                                  >
                                    <ArrowRight className="h-5 w-5 text-primary" />
                                  </motion.div>
                                </div>
                                
                                {/* To */}
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500">To</p>
                                  {movement.movementType.includes('ownership') ? (
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-1 text-gray-500" />
                                      <span className="text-sm font-medium">
                                        {movement.toOwnerName || `User #${movement.toOwnerId}`}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      <Warehouse className="h-4 w-4 mr-1 text-gray-500" />
                                      <span className="text-sm font-medium">
                                        {movement.toLocationName || `Warehouse #${movement.toLocationId}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {movement.transactionHash && (
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <LinkIcon className="h-3 w-3 mr-1" />
                                  <span className="font-mono truncate" title={movement.transactionHash}>
                                    {movement.transactionHash}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </motion.div>
                    </AnimatePresence>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Partial Withdrawals Visualization */}
          {sackPartialWithdrawals.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Partial Withdrawals</h3>
              
              <div className="space-y-4">
                {sackPartialWithdrawals.map((withdrawal) => (
                  <motion.div 
                    key={withdrawal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          Partial Withdrawal on {formatDate(new Date(withdrawal.timestamp))}
                        </CardTitle>
                        <CardDescription>
                          {withdrawal.reason || "Standard partial withdrawal"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Original Sack #{withdrawal.originalSackId}</span>
                              <Badge variant="outline">Original</Badge>
                            </div>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="font-medium">{withdrawal.remainingWeight} kg remaining</span>
                            </div>
                            <Progress 
                              value={(withdrawal.remainingWeight / (withdrawal.remainingWeight + withdrawal.withdrawnWeight)) * 100} 
                              className="h-2 bg-blue-100" 
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Withdrawn Sack #{withdrawal.newSackId}</span>
                              <Badge variant="outline">Withdrawn</Badge>
                            </div>
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2 text-amber-500" />
                              <span className="font-medium">{withdrawal.withdrawnWeight} kg withdrawn</span>
                            </div>
                            <Progress 
                              value={(withdrawal.withdrawnWeight / (withdrawal.remainingWeight + withdrawal.withdrawnWeight)) * 100} 
                              className="h-2 bg-amber-100" 
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-center">
                          <motion.div
                            className="flex items-center"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => window.location.href = `/commodity-sacks/${withdrawal.newSackId}/details`}>
                              View Withdrawn Sack
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}