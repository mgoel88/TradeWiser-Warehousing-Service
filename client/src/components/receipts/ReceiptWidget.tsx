import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, getStatusClass } from '@/lib/utils';
import { Link } from 'wouter';

export default function ReceiptWidget() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['/api/receipts'],
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-headings font-medium text-lg">Latest eWRs</h2>
          <Link href="/receipts" className="text-sm text-accent-600 hover:text-accent-700">
            View All
          </Link>
        </div>
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading receipts...</p>
        </div>
      </div>
    );
  }
  
  // Sort receipts by issued date (newest first) and take the latest 3
  const latestReceipts = receipts
    ? [...receipts]
        .sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime())
        .slice(0, 3)
    : [];
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-headings font-medium text-lg">Latest eWRs</h2>
        <Link href="/receipts" className="text-sm text-accent-600 hover:text-accent-700">
          View All
        </Link>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {latestReceipts.length > 0 ? (
            latestReceipts.map((receipt) => (
              <div key={receipt.id} className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{receipt.receiptNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {/* In a real app, we would join with commodity data */}
                      {receipt.commodityId ? `Commodity ID: ${receipt.commodityId}` : 'Unknown'} - {receipt.quantity} MT
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 ${getStatusClass(receipt.status)} rounded-full`}>
                    {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {/* In a real app, we would join with warehouse data */}
                  Warehouse ID: {receipt.warehouseId || 'Unknown'}
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="text-xs text-gray-500">Created: {formatDate(receipt.issuedDate)}</div>
                  <div className="text-xs text-gray-500">Value: {formatCurrency(receipt.valuation || 0)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-sm text-gray-500">
              No warehouse receipts found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
