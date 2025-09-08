import React from 'react';
import { useParams } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import DepositTracker from '@/components/deposit/DepositTracker';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function TrackDepositPage() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Deposit ID</h1>
          <p className="text-gray-600 mb-6">The deposit tracking URL is missing a valid ID.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  const depositId = parseInt(id, 10);
  
  if (isNaN(depositId)) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Deposit ID</h1>
          <p className="text-gray-600 mb-6">The deposit ID must be a valid number.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Return to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Track Deposit #{depositId}</h1>
        </div>
        
        <DepositTracker depositId={depositId} />
      </div>
    </MainLayout>
  );
}