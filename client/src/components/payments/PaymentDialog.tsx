import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, ChevronsUp, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { 
  createPayment, 
  PaymentMethod, 
  getAvailablePaymentMethods,
  processLoanRepayment
} from "@/lib/paymentGateway";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transactionId: string) => void;
  amount: number;
  description: string;
  paymentType: 'loan_repayment' | 'service_fee' | 'premium_service';
  referenceId: string | number;
}

export default function PaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  amount,
  description,
  paymentType,
  referenceId
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [walletProvider, setWalletProvider] = useState('');
  const [saveDetails, setSaveDetails] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id: PaymentMethod;
    name: string;
    description: string;
    enabled: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const methods = await getAvailablePaymentMethods();
      setPaymentMethods(methods);
      // Set first available method as default
      if (methods.length > 0) {
        setSelectedMethod(methods[0].id);
      }
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      let response;
      
      if (paymentType === 'loan_repayment') {
        response = await processLoanRepayment(
          Number(referenceId),
          amount,
          selectedMethod
        );
      } else {
        // Generic payment creation for other payment types
        response = await createPayment({
          amount,
          description,
          referenceId: String(referenceId),
          paymentMethod: selectedMethod,
          metadata: {
            type: paymentType
          }
        });
      }
      
      if (response.success) {
        setIsSuccess(true);
        
        setTimeout(() => {
          if (onSuccess && response.transactionId) {
            onSuccess(response.transactionId);
          }
          handleClose();
        }, 2000);
        
        toast({
          title: "Payment Successful",
          description: `Payment of ₹${amount.toLocaleString()} processed successfully.`,
        });
      } else {
        setError(response.errorMessage || "Payment failed. Please try again.");
        
        toast({
          title: "Payment Failed",
          description: response.errorMessage || "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err) {
      setError("An error occurred during payment processing.");
      
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setSelectedMethod('upi');
    setCardDetails({
      number: '',
      name: '',
      expiry: '',
      cvv: ''
    });
    setUpiId('');
    setBankName('');
    setWalletProvider('');
    setSaveDetails(false);
    setIsSuccess(false);
    setError(null);
    
    onClose();
  };

  const renderPaymentMethodForm = () => {
    switch (selectedMethod) {
      case 'card':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Expiry Date</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  type="password"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-card"
                checked={saveDetails}
                onCheckedChange={(checked) => setSaveDetails(checked as boolean)}
              />
              <label
                htmlFor="save-card"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Save card for future payments
              </label>
            </div>
          </div>
        );
      
      case 'upi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                placeholder="your-name@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supports all UPI apps including Google Pay, PhonePe, and Paytm
              </p>
            </div>
            <div className="mt-6">
              <RadioGroup defaultValue="google-pay" className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value="google-pay" id="google-pay" className="peer sr-only" />
                  <Label
                    htmlFor="google-pay"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 11V8L15 11M15 11L12 14V11M15 11H9M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="mt-2 text-xs">Google Pay</div>
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value="phonepe" id="phonepe" className="peer sr-only" />
                  <Label
                    htmlFor="phonepe"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.5 9.5L9 15M9 9.5L14.5 15M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="mt-2 text-xs">PhonePe</div>
                  </Label>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <RadioGroupItem value="paytm" id="paytm" className="peer sr-only" />
                  <Label
                    htmlFor="paytm"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 14.5C10.5 15.3284 11.1716 16 12 16C12.8284 16 13.5 15.3284 13.5 14.5C13.5 13.6716 12.8284 13 12 13C11.1716 13 10.5 13.6716 10.5 14.5Z" fill="currentColor" />
                      <path d="M6.5 10C6.5 10.8284 7.17157 11.5 8 11.5C8.82843 11.5 9.5 10.8284 9.5 10C9.5 9.17157 8.82843 8.5 8 8.5C7.17157 8.5 6.5 9.17157 6.5 10Z" fill="currentColor" />
                      <path d="M17.5 10C17.5 10.8284 16.8284 11.5 16 11.5C15.1716 11.5 14.5 10.8284 14.5 10C14.5 9.17157 15.1716 8.5 16 8.5C16.8284 8.5 17.5 9.17157 17.5 10Z" fill="currentColor" />
                      <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <div className="mt-2 text-xs">Other UPI</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      
      case 'netbanking':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bank-select">Select Bank</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger id="bank-select">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sbi">State Bank of India</SelectItem>
                  <SelectItem value="hdfc">HDFC Bank</SelectItem>
                  <SelectItem value="icici">ICICI Bank</SelectItem>
                  <SelectItem value="axis">Axis Bank</SelectItem>
                  <SelectItem value="kotak">Kotak Mahindra Bank</SelectItem>
                  <SelectItem value="other">Other Banks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'wallet':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-select">Select Wallet</Label>
              <Select value={walletProvider} onValueChange={setWalletProvider}>
                <SelectTrigger id="wallet-select">
                  <SelectValue placeholder="Select your wallet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paytm">Paytm</SelectItem>
                  <SelectItem value="phonepe">PhonePe</SelectItem>
                  <SelectItem value="amazonpay">Amazon Pay</SelectItem>
                  <SelectItem value="mobikwik">MobiKwik</SelectItem>
                  <SelectItem value="other">Other Wallets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Payment method icons
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'upi':
        return <ChevronsUp className="h-5 w-5" />;
      case 'netbanking':
        return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 8L11.7317 3.13416C11.9006 3.04971 12.0994 3.0497 12.2683 3.13416L22 8M3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16V8M7 21V18M17 21V18M12 11H12.01M8 11H8.01M16 11H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
      case 'wallet':
        return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 7C2 5.89543 2.89543 5 4 5H20C21.1046 5 22 5.89543 22 7V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 14C16 14.5523 16.4477 15 17 15C17.5523 15 18 14.5523 18 14C18 13.4477 17.5523 13 17 13C16.4477 13 16 13.4477 16 14Z" fill="currentColor"/>
          <path d="M2 9H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>
            {description} - ₹{amount.toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Loading payment options...</p>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">Payment Successful</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Your payment of ₹{amount.toLocaleString()} has been processed successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedMethod(method.id)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 w-full h-20 ${
                        selectedMethod === method.id
                          ? "border-primary bg-primary/10"
                          : "border-muted"
                      }`}
                    >
                      {getPaymentMethodIcon(method.id)}
                      <span className="mt-2 text-xs font-medium">{method.name}</span>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                {renderPaymentMethodForm()}
              </div>
              
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Your payment information is secure and encrypted. We do not store your card details.
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-0">
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing} className="gap-2">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{amount.toLocaleString()}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}