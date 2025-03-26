import { useQuery } from '@tanstack/react-query';
import { Commodity } from '@shared/schema';
import { formatCurrency, getStatusClass, getCommodityIconColor, getCommodityFirstLetter } from '@/lib/utils';

export default function CommoditiesTable() {
  const { data: commodities, isLoading } = useQuery({
    queryKey: ['/api/commodities'],
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-headings font-medium text-lg">Your Commodities</h2>
        <div className="flex">
          <button className="p-1 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="p-1 ml-2 text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading commodities...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commodity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">eWR ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commodities && commodities.length > 0 ? (
                  commodities.map((commodity: Commodity) => {
                    // Find the warehouse details for this commodity
                    const warehouse = { name: 'Unknown Warehouse', channelType: 'unknown' };
                    // In a real app, we would fetch warehouse details or join them in the API
                    
                    return (
                      <tr key={commodity.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-md ${getCommodityIconColor(commodity.name)} flex items-center justify-center`}>
                              <span className="text-primary-700 font-medium">{getCommodityFirstLetter(commodity.name)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{commodity.name}</div>
                              <div className="text-xs text-gray-500">
                                {commodity.gradeAssigned && `Grade ${commodity.gradeAssigned}, `}
                                {commodity.qualityParameters && commodity.qualityParameters.moisture && `${commodity.qualityParameters.moisture} moisture`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 mono">{commodity.quantity} {commodity.measurementUnit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{warehouse.name}</div>
                          <div className="text-xs text-gray-500">{commodity.channelType.charAt(0).toUpperCase() + commodity.channelType.slice(1)} Channel</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(commodity.status)}`}>
                            {commodity.status.charAt(0).toUpperCase() + commodity.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm mono">
                          {formatCurrency(commodity.valuation || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 mono">
                          {/* In a real app, we would show the eWR ID from the receipt */}
                          eWR-{10000 + commodity.id}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No commodities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{commodities?.length || 0}</span> of <span className="font-medium">{commodities?.length || 0}</span> commodities
            </div>
            <div className="flex-1 flex justify-end">
              <button disabled className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button disabled className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
