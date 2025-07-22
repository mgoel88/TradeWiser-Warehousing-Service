import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  FileX, 
  Clock, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingDown,
  Shield,
  Zap,
  FileCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DisputedReceipt {
  id: number;
  receiptNumber: string;
  commodityName: string;
  quantity: string;
  valuation: string;
  disputeReason: string;
  disputeType: 'quality' | 'quantity' | 'valuation' | 'authenticity' | 'legal';
  status: 'disputed' | 'under_review' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

const disputeTypes = {
  quality: 'Quality Issues',
  quantity: 'Quantity Discrepancy',
  valuation: 'Valuation Dispute',
  authenticity: 'Authenticity Concerns',
  legal: 'Legal Issues'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const statusColors = {
  disputed: 'bg-red-100 text-red-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-gray-100 text-gray-800'
};

export default function RedChannelPage() {
  const [disputeForm, setDisputeForm] = useState({
    receiptNumber: '',
    disputeType: '',
    priority: 'medium',
    description: '',
    evidence: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for disputed receipts
  const { data: disputedReceipts, isLoading } = useQuery<DisputedReceipt[]>({
    queryKey: ['/api/receipts/disputed'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/receipts/disputed');
      return await res.json();
    }
  });

  // Submit dispute mutation
  const submitDisputeMutation = useMutation({
    mutationFn: async (disputeData: any) => {
      const res = await apiRequest('POST', '/api/receipts/dispute', disputeData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Dispute Filed",
        description: "Your dispute has been submitted for review",
      });
      setDisputeForm({
        receiptNumber: '',
        disputeType: '',
        priority: 'medium',
        description: '',
        evidence: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/receipts/disputed'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Dispute Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitDispute = () => {
    if (!disputeForm.receiptNumber || !disputeForm.disputeType || !disputeForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    submitDisputeMutation.mutate(disputeForm);
  };

  const formatCurrency = (value: string) => {
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disputed': return <AlertTriangle className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const mockStats = {
    totalDisputes: disputedReceipts?.length || 0,
    underReview: disputedReceipts?.filter(r => r.status === 'under_review').length || 0,
    resolved: disputedReceipts?.filter(r => r.status === 'resolved').length || 0,
    avgResolutionTime: '3.2 days'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Red Channel - Dispute Management</h1>
        <p className="text-gray-600 mt-2">
          Manage disputed warehouse receipts and resolve quality, quantity, or authenticity issues
        </p>
      </div>

      {/* Alert for Red Channel */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Red Channel Notice:</strong> All receipts in this channel require immediate attention due to quality concerns, disputes, or regulatory issues.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                <p className="text-2xl font-bold text-red-600">{mockStats.totalDisputes}</p>
              </div>
              <FileX className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-600">{mockStats.underReview}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{mockStats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{mockStats.avgResolutionTime}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File New Dispute */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            File New Dispute
          </CardTitle>
          <CardDescription>
            Report issues with warehouse receipts that require investigation and resolution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receipt-number">Receipt Number *</Label>
              <Input
                id="receipt-number"
                value={disputeForm.receiptNumber}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                placeholder="Enter receipt number to dispute"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-type">Dispute Type *</Label>
              <Select
                value={disputeForm.disputeType}
                onValueChange={(value) => setDisputeForm(prev => ({ ...prev, disputeType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dispute type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(disputeTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select
              value={disputeForm.priority}
              onValueChange={(value) => setDisputeForm(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="critical">Critical Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Dispute Description *</Label>
            <Textarea
              id="description"
              value={disputeForm.description}
              onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed description of the issue..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Supporting Evidence</Label>
            <Textarea
              id="evidence"
              value={disputeForm.evidence}
              onChange={(e) => setDisputeForm(prev => ({ ...prev, evidence: e.target.value }))}
              placeholder="List any supporting documents, witness statements, or evidence..."
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmitDispute}
            disabled={submitDisputeMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {submitDisputeMutation.isPending ? (
              <>Processing...</>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                File Dispute
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Disputes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Disputes</CardTitle>
          <CardDescription>
            Monitor and track the status of your filed disputes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading disputes...</p>
            </div>
          ) : disputedReceipts && disputedReceipts.length > 0 ? (
            <div className="space-y-4">
              {disputedReceipts.map((dispute) => (
                <div
                  key={dispute.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(dispute.status)}
                        <span className="font-medium">{dispute.receiptNumber}</span>
                        <Badge className={statusColors[dispute.status as keyof typeof statusColors]}>
                          {dispute.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={priorityColors[dispute.priority as keyof typeof priorityColors]}>
                          {dispute.priority} priority
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">Type:</span> {disputeTypes[dispute.disputeType as keyof typeof disputeTypes]}</p>
                        <p><span className="font-medium">Commodity:</span> {dispute.commodityName}</p>
                        <p><span className="font-medium">Quantity:</span> {dispute.quantity} MT</p>
                        <p><span className="font-medium">Valuation:</span> {formatCurrency(dispute.valuation)}</p>
                        <p><span className="font-medium">Filed:</span> {new Date(dispute.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-gray-100 p-3 rounded-md">
                        <p className="text-sm"><span className="font-medium">Issue:</span> {dispute.disputeReason}</p>
                      </div>
                      {dispute.resolutionNote && (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Resolution:</span> {dispute.resolutionNote}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <FileCheck className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      {dispute.status === 'under_review' && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {dispute.status === 'under_review' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Resolution Progress</span>
                        <span>65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No disputes filed yet</p>
              <p className="text-sm text-gray-400">
                File your first dispute if you encounter any issues with warehouse receipts
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Red Channel Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dispute Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Automated Filing System</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Priority-based Processing</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm">Evidence Management</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Assurance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Independent Review Panel</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Third-party Verification</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm">Blockchain Audit Trail</span>
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
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Fast Track Resolution</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Legal Support Access</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Compensation Processing</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}