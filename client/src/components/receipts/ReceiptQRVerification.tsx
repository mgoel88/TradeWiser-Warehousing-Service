
import { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'wouter';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scan } from 'lucide-react';

export default function ReceiptQRVerification() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleScan = (result: any) => {
    if (result) {
      // Extract verification code from URL
      const url = result?.text;
      const verificationCode = url.split('/').pop();
      
      if (verificationCode) {
        setIsOpen(false);
        navigate(`/receipts/verify/${verificationCode}`);
      }
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Scan className="h-4 w-4 mr-2" />
        Scan Receipt QR
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Warehouse Receipt QR Code</DialogTitle>
          </DialogHeader>
          <div className="aspect-square overflow-hidden rounded-lg">
            <QrReader
              constraints={{ facingMode: 'environment' }}
              onResult={handleScan}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
