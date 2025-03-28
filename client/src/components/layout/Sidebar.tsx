import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Warehouse, FileText, Package, BadgeDollarSign, CreditCard, FileCheck, ExternalLink, User, Settings, LogOut } from 'lucide-react';

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
        <p className="text-xs font-medium uppercase text-gray-500 mb-2">Platforms</p>
        <ul className="mb-4">
          <li className="mb-2">
            <Link href="/dashboard" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/dashboard" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <div className="h-5 w-5 mr-3 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              Dashboard
            </Link>
          </li>
          
          <li className="mb-1">
            <div className="ml-2 mb-1">
              <h3 className="font-medium text-sm text-primary-600 flex items-center">
                <span className="w-2 h-5 bg-primary-500 rounded mr-2"></span>
                Green Channel
              </h3>
              <p className="text-[10px] text-muted-foreground ml-4 mb-1">TradeWiser Warehouses</p>
            </div>
            <Link href="/green-channel" className={cn(
              "flex items-center p-2 pl-7 rounded-md text-sm",
              location === "/green-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <Warehouse className="h-4 w-4 mr-2" />
              Browse Warehouses
            </Link>
            <Link href="/deposit" className={cn(
              "flex items-center p-2 pl-7 rounded-md text-sm",
              location === "/deposit" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <Package className="h-4 w-4 mr-2" />
              Deposit Commodity
            </Link>
          </li>
          
          <li className="mb-1">
            <div className="ml-2 mb-1 mt-3">
              <h3 className="font-medium text-sm text-orange-600 flex items-center">
                <span className="w-2 h-5 bg-orange-500 rounded mr-2"></span>
                Orange Channel
              </h3>
              <p className="text-[10px] text-muted-foreground ml-4 mb-1">External Warehouses</p>
            </div>
            <Link href="/orange-channel" className={cn(
              "flex items-center p-2 pl-7 rounded-md text-sm",
              location === "/orange-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Upload Receipts
            </Link>
          </li>
          
          <li className="mb-1">
            <div className="ml-2 mb-1 mt-3">
              <h3 className="font-medium text-sm text-red-600 flex items-center">
                <span className="w-2 h-5 bg-red-500 rounded mr-2"></span>
                Red Channel
              </h3>
              <p className="text-[10px] text-muted-foreground ml-4 mb-1">Self-Certified Storage</p>
            </div>
            <Link href="/red-channel" className={cn(
              "flex items-center p-2 pl-7 rounded-md text-sm",
              location === "/red-channel" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <FileCheck className="h-4 w-4 mr-2" />
              Self-Certification
            </Link>
          </li>
        </ul>
        
        <p className="text-xs font-medium uppercase text-gray-500 mb-2">My Assets</p>
        <ul>
          <li className="mb-2">
            <Link href="/receipts" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/receipts" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <FileText className="h-5 w-5 mr-3" />
              Warehouse Receipts
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/loans" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/loans" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <BadgeDollarSign className="h-5 w-5 mr-3" />
              Loans
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/payments" className={cn(
              "flex items-center p-2 rounded-md",
              location === "/payments" 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-gray-700 hover:bg-gray-100"
            )}>
              <CreditCard className="h-5 w-5 mr-3" />
              Payments
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
              <User className="h-5 w-5 mr-3" />
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
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Link>
          </li>
          <li className="mb-1">
            <Link href="/logout" className="flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100">
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
