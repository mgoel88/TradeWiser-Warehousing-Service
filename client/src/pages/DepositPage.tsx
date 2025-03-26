import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/layout/MainLayout';
import DepositFlow from '@/components/deposit/DepositFlow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';
import { Warehouse } from '@shared/schema';

export default function DepositPage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Fetch warehouses
  const { data: warehouses, isLoading, error } = useQuery({
    queryKey: ['/api/warehouses'],
    queryFn: getQueryFn<Warehouse[]>({ on401: 'throw' }),
  });
  
  // Get user's location if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading warehouses...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (error) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Could not load warehouse information. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold mb-6">Deposit Commodity</h1>
        
        {warehouses && warehouses.length > 0 ? (
          <DepositFlow warehouses={warehouses} userLocation={userLocation} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Warehouses Available</CardTitle>
              <CardDescription>
                There are no warehouses available in the system. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}