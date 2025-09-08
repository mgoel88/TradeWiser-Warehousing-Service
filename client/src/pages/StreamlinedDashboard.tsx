import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ZerodhaPortfolioDashboard from '@/components/portfolio/ZerodhaPortfolioDashboard';

const StreamlinedDashboard = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Portfolio Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Monitor your agricultural commodity holdings and manage your positions
            </p>
          </div>
          
          <ZerodhaPortfolioDashboard />
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedDashboard;