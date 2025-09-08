import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

// Commodity data with auto-category mapping
const commodities = [
  { name: 'Wheat', category: 'Cereals', basePrice: 2500 },
  { name: 'Rice', category: 'Cereals', basePrice: 3000 },
  { name: 'Maize', category: 'Cereals', basePrice: 2000 },
  { name: 'Barley', category: 'Cereals', basePrice: 2300 },
  { name: 'Bajra', category: 'Cereals', basePrice: 2200 },
  { name: 'Jowar', category: 'Cereals', basePrice: 2100 },
  { name: 'Soybean', category: 'Oilseeds', basePrice: 4500 },
  { name: 'Groundnut', category: 'Oilseeds', basePrice: 5500 },
  { name: 'Mustard', category: 'Oilseeds', basePrice: 4800 },
  { name: 'Cotton', category: 'Cash Crops', basePrice: 6000 },
  { name: 'Sugarcane', category: 'Cash Crops', basePrice: 300 },
  { name: 'Gram', category: 'Pulses', basePrice: 4200 },
  { name: 'Tur', category: 'Pulses', basePrice: 6500 },
  { name: 'Moong', category: 'Pulses', basePrice: 7000 },
  { name: 'Urad', category: 'Pulses', basePrice: 6800 }
];

const getCommodityPrice = (commodityName: string): number => {
  const commodity = commodities.find(c => c.name === commodityName);
  return commodity ? commodity.basePrice : 2500;
};

const getCommodityCategory = (commodityName: string): string => {
  const commodity = commodities.find(c => c.name === commodityName);
  return commodity ? commodity.category : '';
};

interface FormData {
  commodityName: string;
  commodityType: string;
  quantity: string;
  unit: string;
}

const StreamlinedDepositForm = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    commodityName: '',
    commodityType: '',
    quantity: '',
    unit: 'MT'
  });
  const [estimatedValue, setEstimatedValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // Real-time value calculation
  useEffect(() => {
    if (formData.commodityName && formData.quantity) {
      const basePrice = getCommodityPrice(formData.commodityName);
      const quantity = parseFloat(formData.quantity || '0');
      setEstimatedValue(basePrice * quantity);
    } else {
      setEstimatedValue(0);
    }
  }, [formData.commodityName, formData.quantity]);

  const handleCommoditySelect = (commodityName: string) => {
    const category = getCommodityCategory(commodityName);
    setFormData(prev => ({
      ...prev,
      commodityName,
      commodityType: category
    }));
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          commodityName: formData.commodityName,
          commodityType: formData.commodityType,
          quantity: formData.quantity,
          unit: formData.unit
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Deposit Successful!",
          description: `Receipt ${result.data.receipt.receiptNumber} generated successfully!`,
          duration: 5000
        });

        // Refresh portfolio data
        queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['/api/receipts/eligible-for-loans'] });

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          setLocation('/dashboard');
        }, 2000);
      } else {
        toast({
          title: "❌ Deposit Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: "❌ Network Error",
        description: 'Please check your connection and try again.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.commodityName && formData.commodityType && formData.quantity && parseFloat(formData.quantity) > 0;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit Commodity</h1>
          <p className="text-gray-600">Convert your agricultural produce into tradeable digital assets</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Commodity Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commodity Name *
              </label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-start text-left font-normal"
                  >
                    {formData.commodityName || "Select commodity..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search commodities..." />
                    <CommandList>
                      <CommandEmpty>No commodity found.</CommandEmpty>
                      {commodities.map((commodity) => (
                        <CommandItem
                          key={commodity.name}
                          onSelect={() => handleCommoditySelect(commodity.name)}
                          className="flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">{commodity.name}</div>
                            <div className="text-sm text-gray-500">{commodity.category}</div>
                          </div>
                          <div className="text-sm text-green-600">
                            ₹{commodity.basePrice}/MT
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Input
                value={formData.commodityType}
                disabled
                className="bg-gray-50"
                placeholder="Auto-populated based on commodity"
              />
            </div>
          </div>

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MT">Metric Tons (MT)</SelectItem>
                  <SelectItem value="quintal">Quintals</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estimated Value Card */}
          {estimatedValue > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Estimated Value
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between py-2 border-b border-green-200">
                  <span className="text-green-700">Market Value:</span>
                  <span className="font-medium text-green-900">₹{estimatedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-green-200">
                  <span className="text-green-700">Available for Loan:</span>
                  <span className="font-medium text-green-900">₹{(estimatedValue * 0.8).toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                <ArrowRight className="w-4 h-4" />
                <span>80% of commodity value can be used as collateral for loans</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Receipt...
              </div>
            ) : (
              'Deposit & Generate Receipt'
            )}
          </Button>

          {/* Info text */}
          <div className="text-center text-sm text-gray-500">
            Your commodity will be digitized and a blockchain-secured warehouse receipt will be generated instantly.
          </div>
        </form>
      </div>
    </div>
  );
};

export default StreamlinedDepositForm;