import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SackHistory } from '@/components/commodities/SackHistory';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle,
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Download, 
  ExternalLink, 
  Loader2, 
  Warehouse, 
  Package, 
  Tag, 
  User, 
  Link as LinkIcon, 
  QrCode,
  ArrowRight as RightArrow
} from 'lucide-react';

interface Owner {
  id: number;
  fullName: string;
  username: string;
}

interface Warehouse {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
}

export default function SackDetailPage() {
  const [, params] = useRoute('/commodity-sacks/:id/details');
  const sackId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [showQrCode, setShowQrCode] = useState(false);

  // Fetch the sack details
  const { 
    data: sack, 
    isLoading: isLoadingSack, 
    error: sackError 
  } = useQuery({
    queryKey: ['/api/commodity-sacks', sackId],
    queryFn: () => 
      fetch(`/api/commodity-sacks/${sackId}`)
        .then(res => res.json()),
    enabled: !!sackId,
  });
  
  // Fetch owner details
  const { 
    data: owner,
    isLoading: isLoadingOwner
  } = useQuery({
    queryKey: ['/api/users', sack?.ownerId],
    queryFn: () => 
      fetch(`/api/users/${sack.ownerId}`)
        .then(res => res.json()),
    enabled: !!sack?.ownerId,
  });
  
  // Fetch warehouse details
  const { 
    data: warehouse,
    isLoading: isLoadingWarehouse
  } = useQuery({
    queryKey: ['/api/warehouses', sack?.warehouseId],
    queryFn: () => 
      fetch(`/api/warehouses/${sack.warehouseId}`)
        .then(res => res.json()),
    enabled: !!sack?.warehouseId,
  });
  
  // Fetch movement history
  const { 
    data: movements, 
    isLoading: isLoadingMovements 
  } = useQuery({
    queryKey: ['/api/commodity-sacks', sackId, 'movements'],
    queryFn: () => 
      fetch(`/api/commodity-sacks/${sackId}/movements`)
        .then(res => res.json()),
    enabled: !!sackId,
  });
  
  // Fetch quality assessment history
  const { 
    data: qualityAssessments, 
    isLoading: isLoadingQuality 
  } = useQuery({
    queryKey: ['/api/commodity-sacks', sackId, 'quality-history'],
    queryFn: () => 
      fetch(`/api/commodity-sacks/${sackId}/quality-history`)
        .then(res => res.json()),
    enabled: !!sackId,
  });

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Copied!", 
      description: "Text copied to clipboard"
    });
  };

  if (isLoadingSack) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading commodity sack details...</span>
        </div>
      </div>
    );
  }

  if (sackError) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load commodity sack details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the data. Please try again.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!sack) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Commodity Sack Not Found</CardTitle>
            <CardDescription>
              The commodity sack you're looking for doesn't exist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>The sack may have been deleted or you may have followed an invalid link.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'withdrawn':
        return 'destructive';
      case 'transferred':
        return 'warning';
      case 'damaged':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Commodity Sack Details
            </h1>
            <p className="text-muted-foreground">
              ID: {sack.sackId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(sack.status) as any} className="text-base font-normal px-3 py-1">
              {sack.status}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowQrCode(!showQrCode)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              {showQrCode ? "Hide" : "Show"} QR Code
            </Button>
          </div>
        </div>
      </div>

      {showQrCode && (
        <Card className="mb-6">
          <CardContent className="pt-6 flex flex-col items-center">
            {sack.qrCodeUrl ? (
              <>
                <img 
                  src={sack.qrCodeUrl} 
                  alt="Sack QR Code" 
                  className="h-48 w-48 object-contain mb-2"
                />
                <p className="text-sm text-muted-foreground mb-2">
                  Scan to verify this commodity sack
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(sack.qrCodeUrl!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <QrCode className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No QR code available</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto">
                  This sack doesn't have a QR code generated yet. 
                  Generate one to enable physical tracking.
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    // This would be an API call to generate a QR code
                    toast({
                      title: "Feature Coming Soon",
                      description: "QR code generation will be available in the next update.",
                    });
                  }}
                >
                  Generate QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Sack ID</dt>
                <dd className="font-medium flex items-center justify-between">
                  <span>{sack.sackId}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2"
                    onClick={() => copyToClipboard(sack.sackId)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Weight</dt>
                <dd className="font-medium">
                  {sack.weight} {sack.measurementUnit}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Grade</dt>
                <dd className="font-medium">
                  {sack.gradeAssigned || "Not graded"}
                </dd>
              </div>
              {sack.locationInWarehouse && (
                <div>
                  <dt className="text-gray-500">Location in Warehouse</dt>
                  <dd className="font-medium">
                    {sack.locationInWarehouse}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="font-medium">
                  {new Date(sack.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="font-medium">
                  {new Date(sack.lastUpdated).toLocaleDateString()}
                </dd>
              </div>
              {sack.lastInspectionDate && (
                <div>
                  <dt className="text-gray-500">Last Inspection</dt>
                  <dd className="font-medium">
                    {new Date(sack.lastInspectionDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {sack.isOwnerHidden && (
                <div className="pt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Owner information is private
                  </Badge>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Location & Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="flex items-center text-gray-500 mb-1">
                  <Warehouse className="h-4 w-4 mr-1" />
                  Warehouse
                </dt>
                {isLoadingWarehouse ? (
                  <dd className="animate-pulse h-5 bg-gray-200 rounded w-3/4"></dd>
                ) : warehouse ? (
                  <dd>
                    <p className="font-medium">{warehouse.name}</p>
                    <p className="text-xs text-gray-500">
                      {warehouse.address}, {warehouse.city}, {warehouse.state}
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs"
                      onClick={() => window.location.href = `/warehouses/${warehouse.id}`}
                    >
                      View Warehouse <RightArrow className="h-3 w-3 ml-1" />
                    </Button>
                  </dd>
                ) : (
                  <dd className="font-medium">Warehouse #{sack.warehouseId}</dd>
                )}
              </div>
              
              <div>
                <dt className="flex items-center text-gray-500 mb-1">
                  <User className="h-4 w-4 mr-1" />
                  Owner
                </dt>
                {sack.isOwnerHidden ? (
                  <dd className="font-medium text-gray-500 italic">
                    [Private]
                  </dd>
                ) : isLoadingOwner ? (
                  <dd className="animate-pulse h-5 bg-gray-200 rounded w-3/4"></dd>
                ) : owner ? (
                  <dd>
                    <p className="font-medium">{owner.fullName}</p>
                    <p className="text-xs text-gray-500">@{owner.username}</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-xs"
                      onClick={() => window.location.href = `/users/${owner.id}`}
                    >
                      View Profile <RightArrow className="h-3 w-3 ml-1" />
                    </Button>
                  </dd>
                ) : (
                  <dd className="font-medium">User #{sack.ownerId}</dd>
                )}
              </div>
              
              <div>
                <dt className="flex items-center text-gray-500 mb-1">
                  <Tag className="h-4 w-4 mr-1" />
                  Parent Receipt
                </dt>
                <dd>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto"
                    onClick={() => window.location.href = `/receipt/${sack.receiptId}/sacks`}
                  >
                    View Receipt #{sack.receiptId} <RightArrow className="h-3 w-3 ml-1" />
                  </Button>
                </dd>
              </div>
              
              {sack.blockchainHash && (
                <div className="pt-2">
                  <dt className="flex items-center text-gray-500 mb-1">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Blockchain Hash
                  </dt>
                  <dd className="flex items-center justify-between font-mono text-xs">
                    <span className="truncate" title={sack.blockchainHash}>
                      {sack.blockchainHash}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => copyToClipboard(sack.blockchainHash!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            {sack.qualityParameters && Object.keys(sack.qualityParameters).length > 0 ? (
              <dl className="space-y-2 text-sm">
                {Object.entries(sack.qualityParameters).map(([key, value]: [string, any]) => (
                  <div key={key}>
                    <dt className="text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </dt>
                    <dd className="font-medium">
                      {typeof value === 'object' 
                        ? `${value.value} ${value.unit || ''}`
                        : value
                      }
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-center py-6">
                <Package className="h-10 w-10 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium">No quality data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This sack does not have quality parameters recorded yet.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = `/commodity-sacks/${sack.id}/quality`}
                >
                  Perform Quality Assessment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="my-8">
        <SackHistory 
          sackId={sack.id}
          movementHistory={movements || []}
          qualityHistory={qualityAssessments || []}
          isLoading={isLoadingMovements || isLoadingQuality}
        />
      </div>
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline"
            onClick={() => window.location.href = `/commodity-sacks/${sack.id}/transfer-ownership`}
          >
            Transfer Ownership
          </Button>
          <Button 
            variant="default"
            onClick={() => window.location.href = `/commodity-sacks/${sack.id}/quality`}
          >
            Quality Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}