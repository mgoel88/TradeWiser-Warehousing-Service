import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AlertTriangle, Zap, FileText, TrendingUp } from 'lucide-react';

interface BypassDemoProps {
  processId: number;
  onComplete: () => void;
}

interface QualityResults {
  moisture?: number;
  foreignMatter?: number;
  brokenGrains?: number;
  weeviled?: number;
  freshness?: number;
  damage?: number;
  grade: string;
  score: number;
}

interface PricingData {
  baseRate: number;
  qualityScore: number;
  qualityMultiplier: string;
  marketRate: number;
  totalValue: number;
  currency: string;
  pricePerUnit: string;
}

export function BypassDemo({ processId, onComplete }: BypassDemoProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [ewrGenerated, setEwrGenerated] = useState(false);
  const [qualityResults, setQualityResults] = useState<QualityResults | null>(null);
  const [pricingData, setPricingData] = useState<PricingData | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const { toast } = useToast();

  const handleCompleteAssessment = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', `/api/bypass/complete-assessment/${processId}`);
      const data = await response.json();
      
      setQualityResults(data.qualityAssessment);
      setPricingData(data.pricing);
      setAssessmentComplete(true);
      
      // Invalidate process queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      
      toast({
        title: 'Assessment Complete',
        description: 'Quality assessment and pricing calculation completed successfully',
      });
    } catch (error) {
      console.error('Assessment error:', error);
      toast({
        title: 'Assessment Failed',
        description: 'Failed to complete quality assessment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateEWR = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest('POST', `/api/bypass/generate-ewr/${processId}`);
      const data = await response.json();
      
      setReceipt(data.receipt);
      setEwrGenerated(true);
      
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts'] });
      
      toast({
        title: 'eWR Generated',
        description: `Electronic Warehouse Receipt ${data.receipt.receiptNumber} created successfully`,
      });
      
      onComplete();
    } catch (error) {
      console.error('eWR generation error:', error);
      toast({
        title: 'eWR Generation Failed',
        description: 'Failed to generate electronic warehouse receipt',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <CardTitle>Bypass Demo Mode</CardTitle>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            External services unavailable
          </Badge>
        </div>
        <CardDescription>
          TradeWiser QA and Pricing services are currently unavailable. 
          Using simulated results for testing and demonstration purposes.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Step 1: Quality Assessment */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Quality Assessment & Pricing</h3>
            </div>
            {!assessmentComplete && (
              <Button 
                onClick={handleCompleteAssessment}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? 'Processing...' : 'Run Assessment'}
              </Button>
            )}
            {assessmentComplete && (
              <Badge className="bg-green-100 text-green-800">
                Completed
              </Badge>
            )}
          </div>
          
          {qualityResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Quality Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(qualityResults).map(([key, value]) => (
                      key !== 'grade' && key !== 'score' && (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="font-medium">
                            {typeof value === 'number' ? `${value}%` : value}
                          </span>
                        </div>
                      )
                    ))}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Grade:</span>
                      <Badge className="bg-green-100 text-green-800">
                        {qualityResults.grade}
                      </Badge>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Score:</span>
                      <span className="text-lg">{qualityResults.score}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {pricingData && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Pricing Calculation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base Rate:</span>
                        <span>₹{pricingData.baseRate.toLocaleString()}/{pricingData.pricePerUnit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Multiplier:</span>
                        <span>{pricingData.qualityMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Rate:</span>
                        <span>₹{pricingData.marketRate.toLocaleString()}/{pricingData.pricePerUnit}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Value:</span>
                        <span className="text-green-600">
                          ₹{pricingData.totalValue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Step 2: eWR Generation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Generate Electronic Warehouse Receipt</h3>
            </div>
            {assessmentComplete && !ewrGenerated && (
              <Button 
                onClick={handleGenerateEWR}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? 'Generating...' : 'Generate eWR'}
              </Button>
            )}
            {ewrGenerated && (
              <Badge className="bg-green-100 text-green-800">
                Generated
              </Badge>
            )}
            {!assessmentComplete && (
              <Badge variant="outline">
                Complete assessment first
              </Badge>
            )}
          </div>
          
          {receipt && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Electronic Warehouse Receipt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receipt Number:</span>
                    <span className="font-mono font-medium">{receipt.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Issue Date:</span>
                    <span>{new Date(receipt.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expiry Date:</span>
                    <span>{new Date(receipt.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Value:</span>
                    <span className="font-semibold text-green-600">
                      ₹{parseInt(receipt.marketValue || "0").toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grade:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {receipt.gradeAssigned}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {receipt.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {ewrGenerated && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-medium">
              🎉 Deposit process completed successfully!
            </p>
            <p className="text-sm text-green-600 mt-1">
              Your commodity is now stored and the eWR is available in your dashboard.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}