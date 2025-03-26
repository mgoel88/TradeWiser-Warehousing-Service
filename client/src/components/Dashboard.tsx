import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StatCard from "@/components/common/StatCard";
import ActionButtons from "@/components/common/ActionButtons";
import WarehouseMap from "@/components/warehouse/WarehouseMap";
import WarehouseList from "@/components/warehouse/WarehouseList";
import CommoditiesTable from "@/components/commodities/CommoditiesTable";
import LoanWidget from "@/components/loans/LoanWidget";
import ReceiptWidget from "@/components/receipts/ReceiptWidget";
import ProcessStatus from "@/components/process/ProcessStatus";
import { Warehouse } from "@shared/schema";
import { Package, CreditCard, Warehouse as WarehouseIcon, FileText } from "lucide-react";

export default function Dashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Get user's location
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  });

  // Fetch statistics data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      // In a real app, this would be fetched from an API
      // For now we'll use static data to match the design
      return {
        totalCommodities: {
          value: "4,250 MT",
          change: "+12.5%",
          isPositive: true
        },
        activeLoans: {
          value: "₹1.2 Cr",
          change: "+8.3%",
          isPositive: true
        },
        warehouseUsage: {
          value: "72%",
          change: "+3.2%",
          isPositive: true
        },
        activeEWRs: {
          value: "248",
          change: "+5.7%",
          isPositive: true
        }
      };
    }
  });

  const handleSelectWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
  };

  return (
    <div>
      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          // Loading skeleton for stats
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))
        ) : (
          // Actual stats cards
          <>
            <StatCard
              title="Total Commodities"
              value={stats?.totalCommodities.value || "0 MT"}
              icon={<Package />}
              change={{
                value: stats?.totalCommodities.change || "0%",
                isPositive: stats?.totalCommodities.isPositive || false
              }}
              iconBgColor="bg-primary-50"
              iconColor="text-primary-500"
            />
            
            <StatCard
              title="Active Loans"
              value={stats?.activeLoans.value || "₹0"}
              icon={<CreditCard />}
              change={{
                value: stats?.activeLoans.change || "0%",
                isPositive: stats?.activeLoans.isPositive || false
              }}
              iconBgColor="bg-accent-50"
              iconColor="text-accent-500"
            />
            
            <StatCard
              title="Warehouse Usage"
              value={stats?.warehouseUsage.value || "0%"}
              icon={<WarehouseIcon />}
              change={{
                value: stats?.warehouseUsage.change || "0%",
                isPositive: stats?.warehouseUsage.isPositive || false
              }}
              iconBgColor="bg-secondary-50"
              iconColor="text-secondary-500"
            />
            
            <StatCard
              title="Active eWRs"
              value={stats?.activeEWRs.value || "0"}
              icon={<FileText />}
              change={{
                value: stats?.activeEWRs.change || "0%",
                isPositive: stats?.activeEWRs.isPositive || false
              }}
              iconBgColor="bg-green-50"
              iconColor="text-green-500"
            />
          </>
        )}
      </div>

      {/* Action Buttons */}
      <ActionButtons />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Map and Commodities) */}
        <div className="lg:col-span-2">
          {/* Warehouse Map */}
          <WarehouseMap onSelectWarehouse={handleSelectWarehouse} />
          
          {/* Warehouse List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b">
              <h2 className="font-headings font-medium text-lg">Nearby Warehouses</h2>
            </div>
            <WarehouseList 
              selectedWarehouse={selectedWarehouse}
              onSelect={handleSelectWarehouse}
              userLocation={userLocation}
            />
          </div>
          
          {/* Commodities Table */}
          <CommoditiesTable />
        </div>

        {/* Right Column (Widgets) */}
        <div>
          {/* Loan Widget */}
          <LoanWidget />
          
          {/* Receipt Widget */}
          <ReceiptWidget />
          
          {/* Process Status */}
          <ProcessStatus />
        </div>
      </div>
    </div>
  );
}
