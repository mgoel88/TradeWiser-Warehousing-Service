import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SackTable } from '@/components/commodities/SackTable';
import { SackGenerationForm } from '@/components/commodities/SackGenerationForm';
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  Loader2, 
  Package, 
  QrCode 
} from 'lucide-react';

export default function ReceiptSacksPage() {
  const [, params] = useRoute('/receipt/:id/sacks');
  const receiptId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  // Fetch the receipt details
  const { 
    data: receipt, 
    isLoading: isLoadingReceipt, 
    error: receiptError 
  } = useQuery({
    queryKey: ['/api/warehouse-receipts', receiptId],
    enabled: !!receiptId,
  });

  // Fetch the sacks for this receipt
  const { 
    data: sacks, 
    isLoading: isLoadingSacks, 
    error: sacksError,
    refetch: refetchSacks
  } = useQuery({
    queryKey: ['/api/commodity-sacks', { receiptId }],
    queryFn: () => 
      fetch(`/api/commodity-sacks?receiptId=${receiptId}`)
        .then(res => res.json()),
    enabled: !!receiptId,
  });

  // Handle successful sack generation
  const handleSacksGenerated = () => {
    refetchSacks();
    setShowGenerateForm(false);
    toast({
      title: "Sacks Generated",
      description: "New commodity sacks have been successfully created",
    });
  };

  if (isLoadingReceipt || isLoadingSacks) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading receipt and sacks...</span>
        </div>
      </div>
    );
  }

  if (receiptError || sacksError) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {receiptError ? 'Failed to load receipt details' : 'Failed to load sacks'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the data. Please try again.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Not Found</CardTitle>
            <CardDescription>
              The warehouse receipt you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The receipt may have been deleted or you may have followed an invalid link.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Receipt
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Receipt Sacks
            </h1>
            <p className="text-gray-500">
              Individual sacks for warehouse receipt #{receipt.receiptNumber}
            </p>
          </div>
          <Badge variant="outline" className="text-base font-normal px-3 py-1">
            {receipt.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receipt Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Receipt Number</dt>
                <dd className="font-medium">{receipt.receiptNumber}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Commodity</dt>
                <dd className="font-medium">{receipt.commodityName || "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Total Quantity</dt>
                <dd className="font-medium">{receipt.quantity} {receipt.measurementUnit}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Warehouse</dt>
                <dd className="font-medium">{receipt.warehouseName || `Warehouse #${receipt.warehouseId}`}</dd>
              </div>
              {receipt.blockchainHash && (
                <div>
                  <dt className="text-gray-500 flex items-center">
                    <LinkIcon className="h-3 w-3 mr-1" />
                    Blockchain Hash
                  </dt>
                  <dd className="font-mono text-xs truncate" title={receipt.blockchainHash}>
                    {receipt.blockchainHash}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sack Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Total Sacks</dt>
                <dd className="font-medium">{sacks ? sacks.length : 0}</dd>
              </div>
              {sacks && sacks.length > 0 && (
                <>
                  <div>
                    <dt className="text-gray-500">Standard Weight</dt>
                    <dd className="font-medium">
                      {sacks[0].weight} {sacks[0].measurementUnit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Active Sacks</dt>
                    <dd className="font-medium">
                      {sacks.filter(s => s.status === 'active').length}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full justify-start" variant="outline">
                  <Package className="mr-2 h-4 w-4" />
                  Generate Sacks
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Generate Commodity Sacks</AlertDialogTitle>
                  <AlertDialogDescription>
                    Create individual sack records for this warehouse receipt.
                    Each sack will have its own unique blockchain identity and tracking.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <SackGenerationForm 
                  receiptId={receiptId!}
                  onSuccess={handleSacksGenerated}
                />
                <AlertDialogFooter className="mt-4">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button className="w-full justify-start" variant="outline" disabled={!sacks || sacks.length === 0}>
              <QrCode className="mr-2 h-4 w-4" />
              Print QR Codes
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="my-8">
        <h2 className="text-xl font-semibold mb-4">Individual Sacks</h2>
        <SackTable 
          sacks={sacks || []} 
          receiptId={receiptId!} 
          onSackUpdated={refetchSacks}
        />
      </div>
    </div>
  );
}