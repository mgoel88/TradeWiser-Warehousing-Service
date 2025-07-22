import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Upload } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function ImportReceiptsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a receipt file to upload",
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      const result = await response.json();
      
      toast({
        title: "Import successful!",
        description: `External receipt ${result.receipt.receiptNumber} has been imported via Orange Channel`,
      });
      
      setFile(null);
      setIsSuccess(true);
      
      // Reset the file input
      const fileInput = document.getElementById('receiptFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Show success details
      console.log('Import result:', result);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "There was a problem importing your receipt. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Import External Warehouse Receipts</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Upload Warehouse Receipt</CardTitle>
                <CardDescription>
                  Upload your external warehouse receipt to import it into the Orange Channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSuccess && (
                  <Alert className="mb-4 bg-orange-50 border-orange-200">
                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                    <AlertTitle className="text-orange-800">Import Complete</AlertTitle>
                    <AlertDescription className="text-orange-700">
                      Your external warehouse receipt has been successfully imported into the Orange Channel and is now available in your portfolio for trading or collateral purposes.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="mb-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      id="receiptFile"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                    <label 
                      htmlFor="receiptFile" 
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Upload className="h-12 w-12 text-gray-400 mb-2" />
                      <p className="text-lg font-medium">Click to select a file</p>
                      <p className="text-sm text-gray-500">
                        Support for PDF, JPG and PNG files
                      </p>
                    </label>
                  </div>
                </div>
                
                {file && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium">Selected file:</p>
                    <p className="text-sm text-gray-600">{file.name}</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleUpload} 
                  disabled={!file || uploading} 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Processing Import...
                    </>
                  ) : 'Import to Orange Channel'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>About Orange Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  The Orange Channel provides interoperability with other warehouse service providers, allowing you to import and manage external warehouse receipts.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <div className="mr-3 h-6 w-6 text-orange-600 flex items-center justify-center rounded-full bg-orange-100 font-medium">1</div>
                    <div>
                      <div className="font-medium text-gray-900">Upload Receipt Document</div>
                      <div className="text-gray-600">PDF, image, or data file from external warehouse</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 h-6 w-6 text-orange-600 flex items-center justify-center rounded-full bg-orange-100 font-medium">2</div>
                    <div>
                      <div className="font-medium text-gray-900">Automatic Data Extraction</div>
                      <div className="text-gray-600">AI extracts commodity details, quantities, and valuations</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 h-6 w-6 text-orange-600 flex items-center justify-center rounded-full bg-orange-100 font-medium">3</div>
                    <div>
                      <div className="font-medium text-gray-900">Integration & Verification</div>
                      <div className="text-gray-600">Receipt becomes available for financing and trading</div>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-xs text-blue-700 font-medium">
                    🔗 Interoperability Feature: This enables seamless integration with other warehouse management systems and agricultural finance platforms.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}