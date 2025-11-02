import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Process, Commodity, Warehouse } from '@shared/schema';
import { formatDate, formatDateTime } from '@/lib/utils';
import { FileText, Package, MapPin, Calendar, Weight, Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface WarehouseReceiptCardProps {
  process: Process;
  commodity?: Commodity;
  warehouse?: Warehouse;
  onRequestReweighing?: () => void;
  onRequestReassessment?: () => void;
}

export default function WarehouseReceiptCard({
  process,
  commodity,
  warehouse,
  onRequestReweighing,
  onRequestReassessment
}: WarehouseReceiptCardProps) {
  const isReceiptGenerated = process.status === 'receipt_generated' || process.status === 'completed';
  const isQualityAssessed = ['quality_assessment', 'receipt_generated', 'completed'].includes(process.status);
  const isWeighed = ['arrived_warehouse', 'quality_assessment', 'receipt_generated', 'completed'].includes(process.status);

  return (
    <Card className="w-full border-2 border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Electronic Warehouse Receipt (eWR)</CardTitle>
              <CardDescription>
                {isReceiptGenerated 
                  ? `Receipt #${process.id} - Generated on ${formatDate(process.updatedAt)}`
                  : 'Receipt will be generated upon completion of quality assessment'}
              </CardDescription>
            </div>
          </div>
          {isReceiptGenerated && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Issued
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Commodity Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Package className="h-4 w-4" />
              Commodity Information
            </h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{commodity?.name || process.commodityName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="font-medium">{commodity?.type || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Declared Quantity:</span>
                <span className="font-medium">{commodity?.quantity || 'N/A'} {commodity?.measurementUnit || 'MT'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Actual Quantity:</span>
                {isWeighed ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-600">
                      {process.actualQuantity || commodity?.quantity || 'N/A'} {commodity?.measurementUnit || 'MT'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Weighed
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Warehouse Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Warehouse Information
            </h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Name:</span>
                <span className="font-medium">{warehouse?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="font-medium text-right">{warehouse?.city || 'N/A'}, {warehouse?.state || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Deposit Date:</span>
                <span className="font-medium">{process.createdAt ? formatDate(process.createdAt) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Receipt Date:</span>
                {isReceiptGenerated ? (
                  <span className="font-medium text-green-600">{formatDate(process.updatedAt)}</span>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quality Assessment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Quality Assessment
            </h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              {isQualityAssessed ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Grade:</span>
                    <Badge className="bg-green-500">{commodity?.gradeAssigned || 'A'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Moisture:</span>
                    <span className="font-medium">{commodity?.qualityParameters?.moisture || '12.5'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Foreign Matter:</span>
                    <span className="font-medium">{commodity?.qualityParameters?.foreignMatter || '0.5'}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Broken Grains:</span>
                    <span className="font-medium">{commodity?.qualityParameters?.brokenGrains || '2.0'}%</span>
                  </div>
                  {onRequestReassessment && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={onRequestReassessment}
                    >
                      <RefreshCw className="h-3 w-3 mr-2" />
                      Request Re-assessment
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-6">
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Quality assessment in progress
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Valuation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Weight className="h-4 w-4" />
              Valuation & Status
            </h3>
            <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Value:</span>
                <span className="font-medium">₹{commodity?.valuation || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={isReceiptGenerated ? "default" : "secondary"}>
                  {process.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Updated:</span>
                <span className="font-medium text-xs">{formatDateTime(process.updatedAt)}</span>
              </div>
              {isWeighed && onRequestReweighing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={onRequestReweighing}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Request Re-weighing
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Final Receipt Notice */}
        {isReceiptGenerated && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">Electronic Warehouse Receipt Issued</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your eWR has been generated and is now available in your account. This receipt can be used for 
                  financing, trading, or withdrawal of your commodity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Notice */}
        {!isReceiptGenerated && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900">Receipt Generation in Progress</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your warehouse receipt will be automatically generated once the quality assessment is complete 
                  and all details are verified. You can track the progress above.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
