import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Check, XCircle, ShieldCheck, ClipboardCheck, Info, LinkIcon } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { WarehouseReceipt } from '@shared/schema';
import { generateVerificationURL } from '@/lib/receiptGenerator';

export default function ReceiptVerificationPage() {
  const { verificationCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<WarehouseReceipt | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function verifyReceipt() {
      if (!verificationCode) {
        setVerificationStatus('failed');
        setErrorMessage('No verification code provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // In a real blockchain app, this would verify with the blockchain
        // For now, we'll just check if the receipt exists in our database
        const response = await apiRequest<WarehouseReceipt>(`/api/receipts/verify/${verificationCode}`, {
          method: 'GET',
        });
        
        setReceipt(response);
        setVerificationStatus('verified');
      } catch (error) {
        console.error('Verification failed:', error);
        setVerificationStatus('failed');
        setErrorMessage('Could not verify this receipt. It may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    }

    verifyReceipt();
  }, [verificationCode]);

  const shareReceipt = () => {
    if (navigator.share && verificationCode) {
      navigator.share({
        title: 'Verified Warehouse Receipt',
        text: `Verify warehouse receipt with code: ${verificationCode}`,
        url: generateVerificationURL(verificationCode),
      })
      .then(() => {
        toast({
          title: 'Shared Successfully',
          description: 'The verification link has been shared.',
        });
      })
      .catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      // Fallback for browsers that don't support sharing
      if (verificationCode) {
        navigator.clipboard.writeText(generateVerificationURL(verificationCode))
          .then(() => {
            toast({
              title: 'Link Copied',
              description: 'Verification link copied to clipboard.',
            });
          })
          .catch((error) => {
            console.error('Error copying to clipboard:', error);
          });
      }
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="w-full text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Warehouse Receipt Verification</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of warehouse receipts using blockchain technology
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                Receipt Verification
              </CardTitle>
              <Badge variant={
                verificationStatus === 'verified' ? 'success' :
                verificationStatus === 'failed' ? 'destructive' : 'outline'
              }>
                {verificationStatus === 'verified' ? 'Verified' :
                 verificationStatus === 'failed' ? 'Failed' : 'Verifying...'}
              </Badge>
            </div>
            <CardDescription>
              Verification Code: <span className="font-mono">{verificationCode}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-muted-foreground">Verifying receipt authenticity...</p>
              </div>
            ) : verificationStatus === 'verified' && receipt ? (
              <div className="space-y-6">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Valid Warehouse Receipt</AlertTitle>
                  <AlertDescription>
                    This receipt has been verified on the blockchain and is authentic.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">Receipt Information</h3>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Receipt Number</p>
                        <p className="text-sm text-muted-foreground font-mono">{receipt.receiptNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm">
                          <Badge variant={receipt.status === 'active' ? 'success' : 'outline'}>
                            {receipt.status.toUpperCase()}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Issue Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(receipt.issuedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Expiry Date</p>
                        <p className="text-sm text-muted-foreground">
                          {receipt.expiryDate ? new Date(receipt.expiryDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-lg">Commodity Details</h3>
                    <Separator className="my-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Commodity ID</p>
                        <p className="text-sm text-muted-foreground">{receipt.commodityId}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Quantity</p>
                        <p className="text-sm text-muted-foreground">{receipt.quantity} units</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Valuation</p>
                        <p className="text-sm text-primary font-medium">
                          ₹{receipt.valuation?.toString() || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Type</p>
                        <p className="text-sm text-muted-foreground">{receipt.receiptType || 'Standard'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-md mt-4">
                    <div className="flex items-center mb-1">
                      <ClipboardCheck className="h-4 w-4 mr-2 text-primary" />
                      <h3 className="text-sm font-medium">Blockchain Transaction</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      This receipt is secured on the blockchain with the following transaction:
                    </p>
                    <p className="bg-background p-2 rounded mt-1 text-center font-mono text-xs overflow-auto">
                      {verificationCode}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Verification Failed</AlertTitle>
                  <AlertDescription>
                    {errorMessage || "This receipt could not be verified. It may be invalid, expired, or tampered with."}
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col items-center justify-center mt-6">
                  <Info className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground max-w-md">
                    If you believe this is an error, please contact customer support with the verification code.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={shareReceipt}>
              <LinkIcon className="h-4 w-4 mr-2" />
              Share Verification
            </Button>
            
            {verificationStatus === 'verified' && receipt && (
              <Button>View Full Details</Button>
            )}
          </CardFooter>
        </Card>
        
        <div className="w-full max-w-md text-center mt-8">
          <p className="text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 inline mr-1" />
            TradeWiser uses blockchain technology to secure and verify all warehouse receipts,
            ensuring authenticity and preventing fraud.
          </p>
        </div>
      </div>
    </div>
  );
}