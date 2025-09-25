import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import CreditWithdrawalForm from '@/components/credit/CreditWithdrawalForm';

const CreditWithdrawalPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50" data-testid="credit-withdrawal-page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Credit Line Withdrawal</h1>
            <p className="text-gray-600 mt-2">
              Access your available credit limit backed by warehouse receipt collateral
            </p>
          </div>
          
          <CreditWithdrawalForm />
        </div>
      </div>
    </MainLayout>
  );
};

export default CreditWithdrawalPage;