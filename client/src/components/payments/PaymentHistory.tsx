import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Eye, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Payment {
  id: string;
  amount: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  referenceId?: string;
  metadata?: any;
}

export function PaymentHistory() {
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Fetch payment history
  const { data: payments, isLoading, error } = useQuery<Payment[]>({
    queryKey: ['/api/payment/history'],
  });

  // Function to get badge variant based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to get payment method display text
  const getPaymentMethodDisplay = (method: string) => {
    const methodMap: Record<string, string> = {
      'upi': 'UPI',
      'card': 'Card',
      'netbanking': 'Net Banking',
      'bank_transfer': 'Bank Transfer',
    };
    
    return methodMap[method] || method;
  };

  // Function to handle receipt download
  const handleDownloadReceipt = (payment: Payment) => {
    toast({
      title: 'Receipt Downloaded',
      description: `Receipt for payment #${payment.id} has been downloaded.`,
      duration: 3000,
    });
  };

  // Function to view payment details
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  // Render empty state
  if (!isLoading && (!payments || payments.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all your past transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No payment history found. Make your first payment to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all your past transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md border">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render payment history
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all your past transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {format(new Date(payment.createdAt), 'dd MMM yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.createdAt), 'hh:mm a')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={payment.description}>
                        {payment.description}
                      </div>
                      {payment.referenceId && (
                        <div className="text-xs text-muted-foreground">
                          Ref: {payment.referenceId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>₹{parseFloat(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>{getPaymentMethodDisplay(payment.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Button>
                        {payment.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment)}
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Details for payment made on {selectedPayment && 
                format(new Date(selectedPayment.createdAt), 'dd MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
                  <p className="text-sm">{selectedPayment.id}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedPayment.status)}</div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">₹{parseFloat(selectedPayment.amount).toFixed(2)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-sm">{getPaymentMethodDisplay(selectedPayment.paymentMethod)}</p>
                </div>
                
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedPayment.description}</p>
                </div>
                
                {selectedPayment.referenceId && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Reference ID</p>
                    <p className="text-sm">{selectedPayment.referenceId}</p>
                  </div>
                )}
                
                <div className="space-y-1 col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="text-sm">
                    {format(new Date(selectedPayment.createdAt), 'dd MMMM yyyy')} at{' '}
                    {format(new Date(selectedPayment.createdAt), 'hh:mm a')}
                  </p>
                </div>
              </div>
              
              {selectedPayment.status === 'completed' && (
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}