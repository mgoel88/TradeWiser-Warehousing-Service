import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface UploadedReceipt {
  id: number;
  receiptNumber: string;
  commodityName: string;
  quantity: string;
  valuation: string;
  status: string;
  externalSource: string;
  attachmentUrl?: string;
  createdAt: string;
}

export default function OrangeChannelPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for existing external receipts
  const { data: externalReceipts, isLoading: loadingReceipts } = useQuery<UploadedReceipt[]>({
    queryKey: ['/api/receipts/external'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/receipts/external');
      return await res.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "External Receipt Imported",
        description: `Successfully imported receipt ${data.receipt.receiptNumber}`,
      });
      setSelectedFile(null);
      setUploadNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['/api/receipts/external'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload PDF, JPEG, or PNG files only",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload files smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (uploadNotes.trim()) {
      formData.append('notes', uploadNotes.trim());
    }

    uploadMutation.mutate(formData);
  };

  const formatCurrency = (value: string) => {
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'expired': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orange Channel - External Receipts</h1>
        <p className="text-gray-600 mt-2">
          Import and manage warehouse receipts from external warehouses and trading partners
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-orange-600" />
            Import External Receipt
          </CardTitle>
          <CardDescription>
            Upload warehouse receipts, delivery orders, or quality certificates from external sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-file">Receipt Document</Label>
            <div className="flex items-center gap-4">
              <Input
                id="receipt-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Supported formats: PDF, JPEG, PNG (Max 10MB)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="upload-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="upload-notes"
              value={uploadNotes}
              onChange={(e) => setUploadNotes(e.target.value)}
              placeholder="Add any additional context or verification details..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadMutation.isPending}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {uploadMutation.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import External Receipt
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing External Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Imported External Receipts</CardTitle>
          <CardDescription>
            Manage your imported external warehouse receipts and trading documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReceipts ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading external receipts...</p>
            </div>
          ) : externalReceipts && externalReceipts.length > 0 ? (
            <div className="space-y-4">
              {externalReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <span className="font-medium">{receipt.receiptNumber}</span>
                        <span className={`px-2 py-1 text-xs rounded-md ${getStatusColor(receipt.status)}`}>
                          {receipt.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Commodity:</span> {receipt.commodityName}</p>
                        <p><span className="font-medium">Quantity:</span> {receipt.quantity} MT</p>
                        <p><span className="font-medium">Valuation:</span> {formatCurrency(receipt.valuation)}</p>
                        <p><span className="font-medium">Source:</span> {receipt.externalSource}</p>
                        <p><span className="font-medium">Imported:</span> {new Date(receipt.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {receipt.attachmentUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No external receipts imported yet</p>
              <p className="text-sm text-gray-400">
                Upload your first external warehouse receipt to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orange Channel Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">OCR Processing</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Data Extraction</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Blockchain Verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">File Upload Ready</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Multi-format Support</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Auto-valuation (₹50/kg)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Channel Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">External Warehouse Integration</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Cross-platform Interoperability</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Unified Receipt Management</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}