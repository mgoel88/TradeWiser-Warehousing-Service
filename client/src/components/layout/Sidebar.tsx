import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-md bg-primary-500 flex items-center justify-center text-white">
            <span className="font-headings font-bold text-xl">TW</span>
          </div>
          <h1 className="ml-3 font-headings font-bold text-xl text-primary-500">TradeWiser</h1>
        </div>
      </div>
      
      <nav className="flex-grow p-4 overflow-y-auto">
        <p className="text-xs font-medium uppercase text-gray-500 mb-2">Main</p>
        <ul>
          <li className="mb-1">
            <Link href="/dashboard" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/dashboard" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/warehouses" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/warehouses" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Warehouses
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/receipts" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/receipts" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Receipts
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/deposit" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/deposit" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Deposit Commodity
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/loans" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/loans" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Loans
            </Link>
          </li>
        </ul>
        
        <p className="mt-6 text-xs font-medium uppercase text-gray-500 mb-2">Channels</p>
        <ul>
          <li className="mb-1">
            <Link href="/green-channel" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/green-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <span className="w-2 h-5 bg-primary-500 rounded mr-3"></span>
              Green Channel
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/orange-channel" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/orange-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <span className="w-2 h-5 bg-secondary-500 rounded mr-3"></span>
              Orange Channel
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/red-channel" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/red-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <span className="w-2 h-5 bg-red-500 rounded mr-3"></span>
              Red Channel
            </Link>
          </li>
        </ul>
        
        <p className="mt-6 text-xs font-medium uppercase text-gray-500 mb-2">Account</p>
        <ul>
          <li className="mb-1">
            <Link href="/profile" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/profile" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/settings" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/settings" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/logout" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
