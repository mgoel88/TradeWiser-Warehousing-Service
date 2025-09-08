import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import StreamlinedDepositForm from '@/components/deposit/StreamlinedDepositForm';

const NewDepositPage = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StreamlinedDepositForm />
        </div>
      </div>
    </MainLayout>
  );
};

export default NewDepositPage;