import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CalendarClock, BanknoteIcon, FileText } from 'lucide-react';

export default function ActionButtons() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleButtonClick = (action: string) => {
    setIsLoading(action);
    
    // Simulate loading state for buttons
    setTimeout(() => {
      setIsLoading(null);
      
      // Navigate based on action
      switch (action) {
        case 'book-warehouse':
          navigate('/warehouses');
          break;
        case 'apply-loan':
          navigate('/loans');
          break;
        case 'upload-receipt':
          navigate('/receipts');
          break;
      }
    }, 1000);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-3 md:gap-4">
        <Button
          onClick={() => handleButtonClick('book-warehouse')}
          disabled={isLoading !== null}
          className="bg-primary-500 hover:bg-primary-600"
        >
          {isLoading === 'book-warehouse' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <CalendarClock className="mr-2 h-5 w-5" />
              Book Warehouse
            </>
          )}
        </Button>
        
        <Button
          onClick={() => handleButtonClick('apply-loan')}
          disabled={isLoading !== null}
          variant="outline"
          className="text-accent-600 border-accent-300 hover:bg-accent-50"
        >
          {isLoading === 'apply-loan' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-accent-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <BanknoteIcon className="mr-2 h-5 w-5" />
              Apply for Loan
            </>
          )}
        </Button>
        
        <Button
          onClick={() => handleButtonClick('upload-receipt')}
          disabled={isLoading !== null}
          variant="outline"
          className="text-secondary-600 border-secondary-300 hover:bg-secondary-50"
        >
          {isLoading === 'upload-receipt' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-secondary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Upload Receipt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
