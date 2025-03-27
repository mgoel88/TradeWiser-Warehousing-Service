import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  if (!user) return null;

  // Get page title based on current location
  const getPageTitle = () => {
    switch(location) {
      case '/dashboard':
        return 'Dashboard';
      case '/warehouses':
        return 'Warehouses';
      case '/receipts':
        return 'Warehouse Receipts';
      case '/loans':
        return 'Loans';
      case '/payments':
        return 'Payments';
      case '/profile':
        return 'Profile';
      case '/settings':
        return 'Settings';
      case '/green-channel':
        return 'Green Channel';
      case '/orange-channel':
        return 'Orange Channel';
      case '/red-channel':
        return 'Red Channel';
      default:
        return 'TradeWiser';
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="md:hidden mr-2 text-gray-600" 
            aria-label="Open sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-headings font-medium">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center">
          <div className="relative">
            <button 
              className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border">
                <div className="px-4 py-2 border-b">
                  <h3 className="text-sm font-medium">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {/* Empty state if no notifications */}
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ml-3 relative">
            <div className="flex items-center">
              <img 
                className="h-8 w-8 rounded-full" 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=0D8ABC&color=fff`}
                alt={user.fullName}
              />
              <span className="ml-2 font-medium text-sm hidden md:block">{user.fullName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
