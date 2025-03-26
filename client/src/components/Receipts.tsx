import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate, getStatusClass } from "@/lib/utils";
import { WarehouseReceipt } from "@shared/schema";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Warehouse, FileText, Link as LinkIcon, ArrowUpDown, Upload } from "lucide-react";

export default function Receipts() {
  const [activeTab, setActiveTab] = useState("all");
  
  const { data: receipts, isLoading, error } = useQuery({
    queryKey: ['/api/receipts'],
  });
  
  // Filter receipts based on active tab
  const filteredReceipts = receipts
    ? receipts.filter((receipt: WarehouseReceipt) => {
        if (activeTab === "all") return true;
        if (activeTab === "green") return receipt.warehouseId === 1 || receipt.warehouseId === 3; // Simplified for demo
        if (activeTab === "orange") return receipt.warehouseId === 2; // Simplified for demo
        if (activeTab === "collateralized") return receipt.liens && Object.keys(receipt.liens).length > 0;
        return true;
      })
    : [];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Warehouse Receipts</h1>
        <p className="text-gray-600">Manage your electronic warehouse receipts (eWRs)</p>
      </div>
      
      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button className="bg-primary-500 hover:bg-primary-600">
          <Upload className="mr-2 h-4 w-4" />
          Upload External Receipt
        </Button>
        <Button variant="outline" className="border-accent-300 text-accent-600 hover:bg-accent-50">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Transfer Receipt
        </Button>
      </div>
      
      {/* Receipts Tabs */}
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Receipts</TabsTrigger>
          <TabsTrigger value="green">Green Channel</TabsTrigger>
          <TabsTrigger value="orange">Orange Channel</TabsTrigger>
          <TabsTrigger value="collateralized">Collateralized</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
              <p className="text-gray-500">Loading receipts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Failed to load receipts. Please try again later.
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <FileText size={40} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No receipts found</h3>
              <p className="text-gray-500 mb-4">You don't have any receipts in this category</p>
              <Button className="bg-primary-500 hover:bg-primary-600">Book Warehouse</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReceipts.map((receipt: WarehouseReceipt) => (
                <Card key={receipt.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{receipt.receiptNumber}</CardTitle>
                        <CardDescription>
                          Issued: {formatDate(receipt.issuedDate)}
                        </CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(receipt.status)}`}>
                        {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Warehouse size={16} className="text-gray-400" />
                        <span className="text-gray-500">Warehouse ID:</span>
                        <span className="font-medium">{receipt.warehouseId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-gray-500">Commodity ID:</span>
                        <span className="font-medium">{receipt.commodityId}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <LinkIcon size={16} className="text-gray-400" />
                        <span className="text-gray-500">Blockchain Hash:</span>
                        <span className="font-mono text-xs truncate">{receipt.blockchainHash?.substring(0, 10)}...</span>
                      </div>
                      <div className="pt-2 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Quantity:</span>
                        <span className="font-medium">{receipt.quantity} MT</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Valuation:</span>
                        <span className="font-medium">{formatCurrency(receipt.valuation || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Expires:</span>
                        <span className="font-medium">{formatDate(receipt.expiryDate)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1">View Details</Button>
                    {receipt.status === 'active' && (
                      <Button className="flex-1 bg-accent-500 hover:bg-accent-600">Use as Collateral</Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
