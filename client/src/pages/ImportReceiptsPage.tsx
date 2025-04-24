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
        throw new Error('Upload failed');
      }
      
      const result = await response.json();
      
      toast({
        title: "Upload successful",
        description: "Your receipt has been successfully uploaded",
      });
      
      setFile(null);
      setIsSuccess(true);
      
      // Reset the file input
      const fileInput = document.getElementById('receiptFile') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was a problem uploading your receipt. Please try again.",
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
                  <Alert className="mb-4 bg-green-50">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Upload Complete</AlertTitle>
                    <AlertDescription>
                      Your receipt has been successfully uploaded and is being processed.
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
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                      Uploading...
                    </>
                  ) : 'Upload Receipt'}
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
                  The Orange Channel allows you to import and manage warehouse receipts from external sources.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="mr-2 h-5 w-5 text-orange-500 flex items-center justify-center rounded-full bg-orange-100">1</div>
                    <span>Upload your warehouse receipt document</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 h-5 w-5 text-orange-500 flex items-center justify-center rounded-full bg-orange-100">2</div>
                    <span>Our system extracts and verifies the key information</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 h-5 w-5 text-orange-500 flex items-center justify-center rounded-full bg-orange-100">3</div>
                    <span>Receipt is imported into your account and becomes available for trading or collateral</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}