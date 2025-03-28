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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SackTable } from '@/components/commodities/SackTable';
import { SackGenerationForm } from '@/components/commodities/SackGenerationForm';
import { PartialWithdrawalVisualization } from '@/components/commodities/PartialWithdrawalVisualization';
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  Loader2, 
  Package, 
  QrCode,
  Scissors
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

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full justify-start" 
                  variant="outline" 
                  disabled={!sacks || sacks.length === 0}
                >
                  <Scissors className="mr-2 h-4 w-4" />
                  Partial Withdrawal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Partial Sack Withdrawal</AlertDialogTitle>
                  <AlertDialogDescription>
                    Create a partial withdrawal from an existing sack.
                    This will generate a new sack record with the withdrawn quantity.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a sack and specify the quantity to withdraw.
                    Both the original and new sack will be tracked on the blockchain.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="sack-select">Select Sack</Label>
                      <Select disabled={!sacks || sacks.length === 0}>
                        <SelectTrigger id="sack-select">
                          <SelectValue placeholder="Select a sack" />
                        </SelectTrigger>
                        <SelectContent>
                          {sacks && sacks.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              Sack #{s.sackId} - {s.weight} {s.measurementUnit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-quantity">Withdrawal Quantity (kg)</Label>
                      <Input id="withdraw-quantity" type="number" placeholder="25" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason for Withdrawal</Label>
                      <Textarea id="reason" placeholder="Reason for partial withdrawal" />
                    </div>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Partial withdrawal will be available in the next update.",
                    });
                  }}>
                    Process Withdrawal
                  </AlertDialogAction>
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
      
      {/* Demo visualization of partial withdrawal - will be hidden in production until actual partial withdrawals exist */}
      {sacks && sacks.length > 0 && (
        <div className="my-12">
          <h2 className="text-xl font-semibold mb-6">Sample Partial Withdrawal Visualization</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This demonstrates how partial withdrawals will be visualized with blockchain tracking. The animation shows how the system will track splits of physical sacks.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PartialWithdrawalVisualization 
              withdrawalData={{
                id: 1,
                originalSackId: sacks[0].id,
                newSackId: 999,
                withdrawnWeight: 15,
                remainingWeight: 35,
                timestamp: new Date().toISOString(),
                reason: "Sample withdrawal for quality testing",
                blockchainHash: "0x872de28b880dca45e9a0dedff473c44cd7e50c40bb7c9c3b2921ee22e69cc21e"
              }}
              onViewSack={(id) => {
                if (id === 999) {
                  toast({
                    title: "Demo Only",
                    description: "This is just a visualization demo, no actual withdrawal exists yet."
                  });
                } else {
                  window.location.href = `/commodity-sacks/${id}/details`;
                }
              }}
            />
            
            <div className="bg-muted p-6 rounded-lg flex flex-col justify-center">
              <h3 className="text-lg font-semibold mb-4">Blockchain Traceability</h3>
              <p className="mb-4">
                Each partial withdrawal is recorded on the blockchain, creating a secure, immutable record of:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-6">
                <li>Original sack identity and weight</li>
                <li>New sack created from the partial withdrawal</li>
                <li>Timestamp and authorized user who performed the withdrawal</li>
                <li>Complete chain of custody for regulatory compliance</li>
              </ul>
              <p className="text-sm text-muted-foreground italic">
                Note: This visualization is a technology demo. Actual partial withdrawals will be tracked and verified on the blockchain in real-time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}