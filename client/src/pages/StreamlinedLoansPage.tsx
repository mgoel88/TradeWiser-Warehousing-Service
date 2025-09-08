import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StreamlinedLoanApplication from '@/components/loans/StreamlinedLoanApplication';

const StreamlinedLoansPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Commodity-backed Loans</h1>
            <p className="text-gray-600 mt-2">
              Get instant loans using your warehouse receipts as collateral
            </p>
          </div>
          
          <StreamlinedLoanApplication />
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedLoansPage;