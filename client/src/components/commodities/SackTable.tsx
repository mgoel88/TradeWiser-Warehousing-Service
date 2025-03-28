import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreHorizontal, 
  Truck, 
  Clipboard, 
  ArrowRight, 
  UserCheck, 
  FileCheck, 
  QrCode, 
  AlertTriangle, 
  Loader2
} from "lucide-react";
import { formatDate } from '@/lib/utils';

interface CommoditySack {
  id: number;
  sackId: string;
  receiptId: number;
  warehouseId: number;
  ownerId: number;
  weight: number;
  measurementUnit: string;
  status: string;
  createdAt: string;
  lastUpdated: string;
  locationInWarehouse?: string | null;
  gradeAssigned?: string | null;
  blockchainHash?: string | null;
  qrCodeUrl?: string | null;
  isOwnerHidden?: boolean;
  // Enhanced with joins
  warehouseName?: string;
  ownerName?: string;
}

interface SackTableProps {
  sacks: CommoditySack[];
  receiptId: number;
  onSackUpdated?: () => void;
}

export function SackTable({ sacks, receiptId, onSackUpdated }: SackTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingSackId, setLoadingSackId] = useState<number | null>(null);
  
  // Function to copy sack ID to clipboard
  const copySackId = (sackId: string) => {
    navigator.clipboard.writeText(sackId);
    toast({
      title: "Copied to clipboard",
      description: `Sack ID: ${sackId}`,
      duration: 2000,
    });
  };
  
  // Function to handle sack movement action
  const handleSackMovement = async (sackId: number, movementType: string) => {
    setLoadingSackId(sackId);
    try {
      // Example movement - you would implement the proper payload for each movement type
      const payload = {
        sackId,
        movementType,
        // Other fields would depend on the movement type
        toWarehouseId: 0, // Example data, would be replaced with real values
        toLocationId: "",
        notes: "Moved via interface"
      };
      
      const response = await apiRequest("POST", `/api/commodity-sacks/${sackId}/transfer`, payload);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to move sack");
      }
      
      // Invalidate cache and notify
      queryClient.invalidateQueries({ queryKey: ['/api/commodity-sacks'] });
      
      toast({
        title: "Sack Moved",
        description: `Sack #${sackId} successfully transferred`,
      });
      
      if (onSackUpdated) {
        onSackUpdated();
      }
    } catch (error) {
      console.error("Error moving sack:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move sack",
        variant: "destructive",
      });
    } finally {
      setLoadingSackId(null);
    }
  };
  
  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default">{status}</Badge>;
      case 'in_transit':
        return <Badge variant="secondary">{status}</Badge>;
      case 'damaged':
        return <Badge variant="destructive">{status}</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (sacks.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">No Sacks Found</h3>
        <p className="mt-1 text-gray-500">
          There are no individual sacks created for this warehouse receipt yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sack ID</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sacks.map((sack) => (
            <TableRow key={sack.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  {sack.isOwnerHidden && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" title="Private ownership" />
                  )}
                  <span>{sack.sackId}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copySackId(sack.sackId)}
                  >
                    <Clipboard className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                {sack.weight} {sack.measurementUnit}
              </TableCell>
              <TableCell>
                {sack.gradeAssigned || "Ungraded"}
              </TableCell>
              <TableCell>
                {getStatusBadge(sack.status)}
              </TableCell>
              <TableCell>
                {formatDate(new Date(sack.createdAt))}
              </TableCell>
              <TableCell>
                {formatDate(new Date(sack.lastUpdated))}
              </TableCell>
              <TableCell className="text-right">
                {loadingSackId === sack.id ? (
                  <Button variant="ghost" size="sm" disabled>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.location.href = `/commodity-sacks/${sack.id}/details`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/commodity-sacks/${sack.id}/quality`}>
                        <FileCheck className="h-4 w-4 mr-2" />
                        Quality Assessment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => window.location.href = `/commodity-sacks/${sack.id}/transfer`}>
                        <Truck className="h-4 w-4 mr-2" />
                        Transfer Location
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.location.href = `/commodity-sacks/${sack.id}/transfer-ownership`}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Transfer Ownership
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Generate QR Code
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Generate QR Code</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will generate a unique QR code for this sack that can be printed and attached to the physical item. The QR code will link to the sack's verification page.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                              // This would be an API call to generate QR code
                              toast({
                                title: "Feature Coming Soon",
                                description: "QR code generation will be available in the next update.",
                              });
                            }}>
                              Generate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}