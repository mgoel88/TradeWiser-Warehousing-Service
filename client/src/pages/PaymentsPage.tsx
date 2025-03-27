import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentHistory } from '../components/payments/PaymentHistory';
import { PaymentForm } from '../components/payments/PaymentForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('history');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setActiveTab('history');
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Manage your payments, view payment history, and make new payments
          </p>
        </div>
        {!showPaymentForm && activeTab === 'history' && (
          <Button onClick={() => setShowPaymentForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        )}
        {showPaymentForm && (
          <Button variant="outline" onClick={() => setShowPaymentForm(false)}>
            Cancel
          </Button>
        )}
      </div>

      <Separator />

      {showPaymentForm ? (
        <div className="max-w-md mx-auto">
          <PaymentForm
            title="Make a Payment"
            description="Fill in the details below to make a payment"
            onSuccess={handlePaymentSuccess}
          />
        </div>
      ) : (
        <Tabs
          defaultValue="history"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto">
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-6">
            <PaymentHistory />
          </TabsContent>

          <TabsContent value="methods" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  The following payment methods are available for transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <div className="h-6 w-6 text-primary">UPI</div>
                    </div>
                    <div>
                      <h3 className="font-medium">UPI</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay using UPI apps like GPay, PhonePe, Paytm, etc.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <div className="h-6 w-6 text-primary">NB</div>
                    </div>
                    <div>
                      <h3 className="font-medium">Net Banking</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay using internet banking
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <div className="h-6 w-6 text-primary">CC</div>
                    </div>
                    <div>
                      <h3 className="font-medium">Credit/Debit Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Pay using credit or debit card
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 rounded-md border p-4">
                    <div className="p-2 rounded-full bg-primary/10">
                      <div className="h-6 w-6 text-primary">BT</div>
                    </div>
                    <div>
                      <h3 className="font-medium">Bank Transfer</h3>
                      <p className="text-sm text-muted-foreground">
                        Direct bank transfer
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button onClick={() => {
                    setShowPaymentForm(true);
                    setActiveTab('history');
                  }} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Make a Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}