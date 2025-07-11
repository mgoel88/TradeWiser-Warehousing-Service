
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FlowchartGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFlowchart = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/flowchart/generate');
      const data = await response.json();
      
      if (response.ok) {
        // Automatically download the file
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Flowchart Generated",
          description: "Your application flowchart has been downloaded successfully.",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate flowchart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Application Flowchart
        </CardTitle>
        <CardDescription>
          Generate a comprehensive PDF flowchart showing all application processes and workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>The flowchart includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Authentication and user management flow</li>
              <li>Storage and warehousing processes (Green/Orange channels)</li>
              <li>Lending and smart contract workflows</li>
              <li>Supply chain tracking and delivery management</li>
              <li>Risk management and analytics processes</li>
              <li>Payment and settlement flows</li>
            </ul>
          </div>
          
          <Button 
            onClick={generateFlowchart} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate & Download PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
