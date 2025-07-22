import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, Download, Share2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessActionsProps {
  status: string;
  currentStage: string;
  processId: number;
  onStartNew?: () => void;
}

export default function ProcessActions({ 
  status, 
  currentStage, 
  processId, 
  onStartNew 
}: ProcessActionsProps) {
  
  const isCompleted = status === 'completed' && currentStage === 'ewr_generated';
  const isInProgress = status === 'in_progress';
  
  if (!isCompleted && !isInProgress) {
    return null;
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Completed Process Actions */}
          {isCompleted && (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Process Complete!</h3>
                  <p className="text-sm text-green-700">
                    Your eWR has been generated and is ready for use
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* View Receipt */}
                <Button 
                  className="w-full justify-center"
                  onClick={() => window.location.href = '/receipts'}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View eWR
                </Button>
                
                {/* Download Receipt */}
                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={() => window.open(`/api/receipts/${processId}/download`, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {/* Share Receipt */}
                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/receipts/${processId}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'TradeWiser eWR',
                        text: 'Electronic Warehouse Receipt',
                        url: shareUrl
                      });
                    } else {
                      navigator.clipboard.writeText(shareUrl);
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                {/* Start New Deposit */}
                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={onStartNew}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  New Deposit
                </Button>
              </div>
              
              {/* Next Steps Information */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use your eWR as collateral for commodity financing</li>
                  <li>• Track your commodity storage and quality over time</li>
                  <li>• Transfer ownership through secure blockchain transactions</li>
                </ul>
              </div>
            </>
          )}
          
          {/* In Progress Actions */}
          {isInProgress && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="font-medium">Processing Your Deposit</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your commodity is being processed. You'll be notified when each stage completes.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}