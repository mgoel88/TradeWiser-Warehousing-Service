import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarehouseReceipt, Process } from "@shared/schema";

const withdrawalSchema = z.object({
  withdrawalType: z.enum(["full", "partial"]),
  quantity: z.string().optional().refine(
    (val) => !val || parseFloat(val) > 0, 
    { 
      message: "Quantity must be greater than 0",
    }
  ),
});

type FormValues = z.infer<typeof withdrawalSchema>;

interface WithdrawalDialogProps {
  receipt: WarehouseReceipt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWithdrawalInitiated: (process: Process) => void;
}

export function WithdrawalDialog({ 
  receipt, 
  open, 
  onOpenChange, 
  onWithdrawalInitiated 
}: WithdrawalDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      withdrawalType: "full",
      quantity: "",
    },
  });

  const watchWithdrawalType = form.watch("withdrawalType");

  async function onSubmit(data: FormValues) {
    setError(null);
    setIsSubmitting(true);

    try {
      // Prepare the payload
      const payload: { 
        quantity?: string 
      } = {};

      // Add quantity for partial withdrawal
      if (data.withdrawalType === "partial" && data.quantity) {
        payload.quantity = data.quantity;
        
        // Validate that partial quantity is less than available quantity
        const availableQuantity = parseFloat(receipt.quantity);
        const requestedQuantity = parseFloat(data.quantity);
        
        if (requestedQuantity >= availableQuantity) {
          setError(`Partial withdrawal quantity (${requestedQuantity}) must be less than the total quantity (${availableQuantity})`);
          setIsSubmitting(false);
          return;
        }
      }

      // Make API request to initiate withdrawal
      const response = await apiRequest(
        "POST",
        `/api/receipts/${receipt.id}/withdraw`,
        payload
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to initiate withdrawal");
      }

      const responseData = await response.json();

      // Call the success callback with the created process
      onWithdrawalInitiated(responseData.process);

      // Show success toast
      toast({
        title: "Withdrawal Initiated",
        description: "Your commodity withdrawal process has been started.",
      });

    } catch (err) {
      console.error("Error initiating withdrawal:", err);
      setError(err instanceof Error ? err.message : "Failed to initiate withdrawal");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to initiate withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Withdraw Commodity</DialogTitle>
          <DialogDescription>
            Initiate a withdrawal process for your warehouse receipt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label>Receipt Details</Label>
                <div className="rounded-md border p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-muted-foreground">Receipt Number:</div>
                      <div className="font-medium">{receipt.receiptNumber}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Commodity:</div>
                      <div className="font-medium">{receipt.commodityName || "Not specified"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Quantity:</div>
                      <div className="font-medium">{receipt.quantity} MT</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Warehouse:</div>
                      <div className="font-medium">{receipt.warehouseName || "Not specified"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="withdrawalType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Withdrawal Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="full" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Full Withdrawal (entire quantity)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="partial" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Partial Withdrawal (specify quantity)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchWithdrawalType === "partial" && (
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Quantity (MT)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={Number(receipt.quantity) - 0.01}
                          placeholder="Enter quantity to withdraw"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must be less than the total quantity of {receipt.quantity} MT.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Initiate Withdrawal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}