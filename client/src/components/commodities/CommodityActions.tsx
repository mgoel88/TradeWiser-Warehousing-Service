import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Commodity, User, Warehouse } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, ArrowRightLeft, LogOut, Send, Truck, Users } from "lucide-react";

// Withdrawal schema
const withdrawalSchema = z.object({
  quantity: z.string()
    .nonempty("Quantity is required")
    .refine((val) => !isNaN(parseFloat(val)), "Quantity must be a number")
    .refine((val) => parseFloat(val) > 0, "Quantity must be greater than 0"),
});

// Transfer ownership schema
const transferOwnershipSchema = z.object({
  newOwnerId: z.string()
    .nonempty("New owner ID is required")
    .refine((val) => !isNaN(parseInt(val)), "Must be a valid user ID"),
});

// Transfer warehouse schema
const transferWarehouseSchema = z.object({
  newWarehouseId: z.string()
    .nonempty("New warehouse ID is required")
    .refine((val) => !isNaN(parseInt(val)), "Must be a valid warehouse ID"),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;
type TransferOwnershipFormValues = z.infer<typeof transferOwnershipSchema>;
type TransferWarehouseFormValues = z.infer<typeof transferWarehouseSchema>;

type CommodityActionsProps = {
  commodity: Commodity;
  users?: User[];
  warehouses?: Warehouse[];
  onActionComplete?: () => void;
};

export default function CommodityActions({ commodity, users = [], warehouses = [], onActionComplete }: CommodityActionsProps) {
  const { user } = useAuth();
  const [activeDialog, setActiveDialog] = useState<'withdraw' | 'transferOwnership' | 'transferWarehouse' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Only show green channel options for green channel commodities
  const showGreenChannelOptions = commodity.channelType === 'green' && commodity.status === 'active';
  
  // Withdrawal form
  const withdrawalForm = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      quantity: '',
    },
  });
  
  // Transfer ownership form
  const transferOwnershipForm = useForm<TransferOwnershipFormValues>({
    resolver: zodResolver(transferOwnershipSchema),
    defaultValues: {
      newOwnerId: '',
    },
  });
  
  // Transfer warehouse form
  const transferWarehouseForm = useForm<TransferWarehouseFormValues>({
    resolver: zodResolver(transferWarehouseSchema),
    defaultValues: {
      newWarehouseId: '',
    },
  });
  
  const handleWithdraw = async (data: WithdrawalFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest(`/api/commodities/${commodity.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Withdrawal Successful",
          description: result.message || `Successfully withdrawn ${data.quantity} ${commodity.measurementUnit}`,
        });
        
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Withdrawal Failed",
          description: error.message || "Failed to withdraw commodity",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setActiveDialog(null);
      withdrawalForm.reset();
    }
  };
  
  const handleTransferOwnership = async (data: TransferOwnershipFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest(`/api/commodities/${commodity.id}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Ownership Transfer Successful",
          description: result.message || "Successfully transferred ownership",
        });
        
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Ownership Transfer Failed",
          description: error.message || "Failed to transfer ownership",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setActiveDialog(null);
      transferOwnershipForm.reset();
    }
  };
  
  const handleTransferWarehouse = async (data: TransferWarehouseFormValues) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest(`/api/commodities/${commodity.id}/transfer-warehouse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Warehouse Transfer Initiated",
          description: result.message || "Successfully initiated transfer to new warehouse",
        });
        
        if (onActionComplete) {
          onActionComplete();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Warehouse Transfer Failed",
          description: error.message || "Failed to transfer to new warehouse",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setActiveDialog(null);
      transferWarehouseForm.reset();
    }
  };
  
  const getWarehouseName = (id: number | null) => {
    if (!id) return "Unknown";
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : "Unknown";
  };
  
  if (!showGreenChannelOptions) {
    return (
      <div className="flex flex-col space-y-2 my-4">
        <div className="flex items-center p-3 text-sm bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertTriangle size={18} className="text-yellow-500 mr-2" />
          <span>
            {commodity.status !== 'active' ? 
              `This commodity is currently in ${commodity.status} status and cannot be modified.` :
              `Non-green channel commodities require manual processing. Please contact customer support.`
            }
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 my-4">
      <h3 className="text-lg font-semibold mb-2">Green Channel Operations</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Withdraw Commodity Button & Dialog */}
        <Dialog open={activeDialog === 'withdraw'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => setActiveDialog('withdraw')}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Commodity</DialogTitle>
              <DialogDescription>
                Available quantity: {commodity.quantity} {commodity.measurementUnit}
              </DialogDescription>
            </DialogHeader>
            <Form {...withdrawalForm}>
              <form onSubmit={withdrawalForm.handleSubmit(handleWithdraw)} className="space-y-4">
                <FormField
                  control={withdrawalForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to withdraw</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input {...field} type="number" min="0" step="0.01" max={parseFloat(commodity.quantity.toString())} />
                          <span className="ml-2">{commodity.measurementUnit}</span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Value: {formatCurrency(parseFloat(field.value || '0') * (parseFloat(commodity.valuation?.toString() || '0') / parseFloat(commodity.quantity.toString())))}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveDialog(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Confirm Withdrawal"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Transfer Ownership Button & Dialog */}
        <Dialog open={activeDialog === 'transferOwnership'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => setActiveDialog('transferOwnership')}
            >
              <Users className="mr-2 h-4 w-4" />
              Transfer Ownership
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Commodity Ownership</DialogTitle>
              <DialogDescription>
                Transfer {commodity.name} ({commodity.quantity} {commodity.measurementUnit}) to another user
              </DialogDescription>
            </DialogHeader>
            <Form {...transferOwnershipForm}>
              <form onSubmit={transferOwnershipForm.handleSubmit(handleTransferOwnership)} className="space-y-4">
                <FormField
                  control={transferOwnershipForm.control}
                  name="newOwnerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Owner</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select new owner" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.length > 0 ? (
                              users
                                .filter(u => u.id !== user?.id) // Filter out current user
                                .map(u => (
                                  <SelectItem key={u.id} value={u.id.toString()}>
                                    {u.fullName} ({u.username})
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="" disabled>No users available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        All related warehouse receipts will also be transferred
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveDialog(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Transfer Ownership"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Transfer Warehouse Button & Dialog */}
        <Dialog open={activeDialog === 'transferWarehouse'} onOpenChange={(open) => !open && setActiveDialog(null)}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center justify-center" 
              onClick={() => setActiveDialog('transferWarehouse')}
            >
              <Truck className="mr-2 h-4 w-4" />
              Transfer Warehouse
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer to Another Warehouse</DialogTitle>
              <DialogDescription>
                Transfer {commodity.name} from {getWarehouseName(commodity.warehouseId)} to another warehouse
              </DialogDescription>
            </DialogHeader>
            <Form {...transferWarehouseForm}>
              <form onSubmit={transferWarehouseForm.handleSubmit(handleTransferWarehouse)} className="space-y-4">
                <FormField
                  control={transferWarehouseForm.control}
                  name="newWarehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination Warehouse</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.length > 0 ? (
                              warehouses
                                .filter(w => w.id !== commodity.warehouseId) // Filter out current warehouse
                                .map(w => (
                                  <SelectItem key={w.id} value={w.id.toString()}>
                                    {w.name} ({w.city}, {w.state})
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="" disabled>No warehouses available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        This will initiate a physical transfer of goods
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setActiveDialog(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Transfer to Warehouse"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}