import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowRight, 
  Clipboard, 
  ExternalLink, 
  Link2, 
  UserCheck, 
  Warehouse, 
} from "lucide-react";
import { formatDate } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";

interface SackMovement {
  id: number;
  sackId: number;
  fromLocationId: number | null;
  toLocationId: number | null;
  fromOwnerId: number | null;
  toOwnerId: number | null;
  movementType: string;
  movementDate: string;
  transactionHash: string | null;
  metadata: any;
  // Enhanced data (will be fetched separately or joined)
  fromLocationName?: string;
  toLocationName?: string;
  fromOwnerName?: string;
  toOwnerName?: string;
}

interface QualityAssessment {
  id: number;
  sackId: number;
  inspectionDate: string;
  inspectorId: number | null;
  qualityParameters: any;
  gradeAssigned: string | null;
  notes: string | null;
  attachmentUrls: string[];
  blockchainHash: string | null;
  // Enhanced data
  inspectorName?: string;
}

interface SackHistoryProps {
  sackId: number;
  movementHistory: SackMovement[];
  qualityHistory: QualityAssessment[];
  isLoading?: boolean;
}

export function SackHistory({ sackId, movementHistory, qualityHistory, isLoading = false }: SackHistoryProps) {
  const { toast } = useToast();
  
  // Helper to copy blockchain hash to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard"
    });
  };

  // Helper to format movement type for display
  const formatMovementType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Sack History...</CardTitle>
          <CardDescription>Please wait while we retrieve the data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="movements">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="movements">Movement History</TabsTrigger>
        <TabsTrigger value="quality">Quality Assessments</TabsTrigger>
      </TabsList>
      
      {/* Movement History Tab */}
      <TabsContent value="movements">
        <Card>
          <CardHeader>
            <CardTitle>Sack Movement History</CardTitle>
            <CardDescription>
              Tracking of all movements and transfers for sack #{sackId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {movementHistory.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No movement history</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This sack has not been moved or transferred yet.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {movementHistory.map((movement, index) => (
                  <div key={movement.id} className="relative">
                    {/* Movement card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="outline">
                            {formatMovementType(movement.movementType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(new Date(movement.movementDate))}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {/* From */}
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">From</p>
                            {movement.movementType.includes('ownership') ? (
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-1 text-gray-500" />
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
                            <ArrowRight className="h-5 w-5 text-gray-400" />
                          </div>
                          
                          {/* To */}
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">To</p>
                            {movement.movementType.includes('ownership') ? (
                              <div className="flex items-center">
                                <UserCheck className="h-4 w-4 mr-1 text-gray-500" />
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
                        
                        {movement.metadata?.notes && (
                          <>
                            <Separator className="my-3" />
                            <div className="text-sm">
                              <p className="text-xs text-gray-500 mb-1">Notes</p>
                              <p>{movement.metadata.notes}</p>
                            </div>
                          </>
                        )}
                        
                        {movement.transactionHash && (
                          <div className="mt-4 pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-1">
                                <Link2 className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Blockchain Transaction:</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => copyToClipboard(movement.transactionHash!)}
                                >
                                  <Clipboard className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => window.open(`/blockchain/tx/${movement.transactionHash}`, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs mt-1 font-mono text-gray-500 truncate">
                              {movement.transactionHash}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Connector line for all but the last item */}
                    {index < movementHistory.length - 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 h-8 w-0.5 bg-gray-200 bottom-0 translate-y-full" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Quality Assessments Tab */}
      <TabsContent value="quality">
        <Card>
          <CardHeader>
            <CardTitle>Quality Assessment History</CardTitle>
            <CardDescription>
              Record of all quality assessments performed on sack #{sackId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {qualityHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clipboard className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No quality assessments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This sack has not been assessed for quality yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {qualityHistory.map((assessment) => (
                  <Card key={assessment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={assessment.gradeAssigned ? "default" : "outline"}>
                            {assessment.gradeAssigned ? `Grade: ${assessment.gradeAssigned}` : 'No Grade Assigned'}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(new Date(assessment.inspectionDate))}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Inspector</p>
                          <p className="text-sm">
                            {assessment.inspectorName || `Inspector #${assessment.inspectorId}`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Quality Parameters</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Standard</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(assessment.qualityParameters).map(([key, value]: [string, any]) => (
                                <TableRow key={key}>
                                  <TableCell className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</TableCell>
                                  <TableCell>
                                    {typeof value === 'object' ? 
                                      `${value.value} ${value.unit || ''}` : 
                                      `${value}`}
                                  </TableCell>
                                  <TableCell>
                                    {typeof value === 'object' && value.standard ? 
                                      `${value.standard.min || ''} - ${value.standard.max || ''}` : 
                                      '—'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {assessment.notes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm">{assessment.notes}</p>
                          </div>
                        )}
                        
                        {assessment.attachmentUrls && assessment.attachmentUrls.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Attachments</p>
                            <div className="grid grid-cols-2 gap-2">
                              {assessment.attachmentUrls.map((url, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => window.open(url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Attachment {index + 1}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {assessment.blockchainHash && (
                          <div className="pt-3 border-t">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-1">
                                <Link2 className="h-3 w-3 text-gray-500" />
                                <span className="text-xs text-gray-500">Blockchain Transaction:</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => copyToClipboard(assessment.blockchainHash!)}
                                >
                                  <Clipboard className="h-3 w-3 mr-1" />
                                  Copy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => window.open(`/blockchain/tx/${assessment.blockchainHash}`, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs mt-1 font-mono text-gray-500 truncate">
                              {assessment.blockchainHash}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}