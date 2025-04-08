import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  receiptId: number;
}

export function QRCodeGenerator({ receiptId }: QRCodeGeneratorProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery<{
    verificationUrl: string;
    verificationCode: string;
    receiptId: number;
  }>({
    queryKey: [`/api/receipts/${receiptId}/qr-code`],
    enabled: !!receiptId,
  });

  useEffect(() => {
    if (data?.verificationUrl) {
      generateQRCode(data.verificationUrl);
    }
  }, [data]);

  const generateQRCode = async (url: string) => {
    try {
      setIsGenerating(true);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "QR Code Generation Failed",
        description: "Unable to generate QR code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `receipt-${receiptId}-verification.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-2">Failed to generate verification code</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center">
          {qrDataUrl ? (
            <>
              <div className="mb-4 p-2 bg-white rounded-md border">
                <img
                  src={qrDataUrl}
                  alt="Receipt Verification QR Code"
                  className="mx-auto"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground mb-3">
                Scan this QR code to verify the receipt ownership and details
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={downloadQRCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isGenerating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}