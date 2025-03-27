import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  description: string;
  icon?: string;
}

interface PaymentMethodSelectorProps {
  onMethodChange: (methodId: string) => void;
  selectedMethod?: string;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  onMethodChange,
  selectedMethod,
  disabled = false
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<string>(selectedMethod || '');

  // Fetch payment methods
  const { data: paymentMethods, isLoading, error } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment/methods'],
  });

  // Update selected method when props change
  useEffect(() => {
    if (selectedMethod) {
      setSelected(selectedMethod);
    }
  }, [selectedMethod]);

  // Handle selection change
  const handleChange = (value: string) => {
    setSelected(value);
    onMethodChange(value);
  };

  // Simplified payment methods if API fails
  const fallbackMethods = [
    { id: 'upi', name: 'UPI', type: 'digital', description: 'Pay using UPI apps like GPay, PhonePe, Paytm, etc.' },
    { id: 'netbanking', name: 'Net Banking', type: 'digital', description: 'Pay using internet banking' },
    { id: 'card', name: 'Credit/Debit Card', type: 'card', description: 'Pay using credit or debit card' },
    { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', description: 'Direct bank transfer' },
  ];

  const methodsToShow = paymentMethods || fallbackMethods;

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <Label>Select Payment Method</Label>
          <RadioGroup value={selected} onValueChange={handleChange} className="gap-3">
            {methodsToShow.map((method) => (
              <div key={method.id} className="flex items-center space-x-2">
                <RadioGroupItem value={method.id} id={method.id} disabled={disabled} />
                <Label 
                  htmlFor={method.id}
                  className={`flex flex-1 items-center space-x-3 rounded-md border p-3 cursor-pointer ${
                    selected === method.id ? 'bg-muted border-primary/50' : ''
                  }`}
                >
                  <div className="p-1 rounded-sm bg-primary/5">
                    <div className="h-5 w-5 text-primary font-medium text-xs">
                      {method.id.substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-xs text-muted-foreground">{method.description}</div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}