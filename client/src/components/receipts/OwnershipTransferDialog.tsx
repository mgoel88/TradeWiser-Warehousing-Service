import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowRight, Shield } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { transferOwnership } from "@/lib/blockchainUtils";
import { WarehouseReceipt } from "@shared/schema";

interface OwnershipTransferDialogProps {
  receipt: WarehouseReceipt;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete: () => void;
}

export default function OwnershipTransferDialog({
  receipt,
  isOpen,
  onClose,
  onTransferComplete
}: OwnershipTransferDialogProps) {
  const { toast } = useToast();
  const [receiverEmail, setReceiverEmail] = useState("");
  const [receiverId, setReceiverId] = useState<number | null>(null);
  const [transferNote, setTransferNote] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isBlockchainProcessing, setIsBlockchainProcessing] = useState(false);

  // Query to fetch users for verification
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen, // Only fetch when dialog is open
  });

  // Verify user email
  const handleVerifyUser = () => {
    if (!receiverEmail || !users) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      const user = users.find((u: any) => u.email === receiverEmail);
      if (user) {
        setReceiverId(user.id);
        toast({
          title: "User Verified",
          description: `Verified user: ${user.fullName || user.username}`,
        });
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with this email address.",
          variant: "destructive",
        });
      }
      setIsVerifying(false);
    }, 1000);
  };

  // Transfer ownership
  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!receiverId) {
        throw new Error("No receiver selected");
      }

      setIsBlockchainProcessing(true);
      
      try {
        // Record on blockchain first
        const blockchainResult = await transferOwnership(
          receipt.id,
          receiverId,
          receipt.ownerId
        );
        
        // Then record in our system
        const response = await apiRequest("POST", `/api/receipts/${receipt.id}/transfer`, {
          receiverId,
          transferType: "endorsement",
          transactionHash: blockchainResult.transactionHash,
          note: transferNote
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Transfer failed");
        }
        
        return await response.json();
      } finally {
        setIsBlockchainProcessing(false);
      }
    },
    onSuccess: () => {
      toast({
        title: "Ownership Transferred",
        description: "The receipt ownership has been transferred successfully.",
      });
      onTransferComplete();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Receipt Ownership</DialogTitle>
          <DialogDescription>
            Transfer ownership of receipt #{receipt.receiptNumber} using blockchain verification
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="receiver-email">Receiver's Email</Label>
            <div className="flex gap-2">
              <Input
                id="receiver-email"
                placeholder="Enter receiver's email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                disabled={!!receiverId || isVerifying}
              />
              <Button 
                variant="secondary" 
                onClick={handleVerifyUser}
                disabled={!receiverEmail || !!receiverId || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </div>
          
          {receiverId && (
            <div className="space-y-2">
              <Label htmlFor="transfer-note">Transfer Note (Optional)</Label>
              <Textarea
                id="transfer-note"
                placeholder="Add a note about this transfer"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
              />
            </div>
          )}
          
          <div className="bg-muted p-3 rounded-md flex items-start gap-2">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Blockchain Secured Transfer</p>
              <p className="text-muted-foreground">
                This transfer will be recorded on the blockchain for enhanced security 
                and transparency. The receiver will be able to verify the authenticity
                of this receipt with its complete ownership history.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isBlockchainProcessing}>
            Cancel
          </Button>
          <Button
            onClick={() => transferMutation.mutate()}
            disabled={!receiverId || isBlockchainProcessing}
            className="gap-2"
          >
            {isBlockchainProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording on Blockchain
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Transfer Ownership
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}