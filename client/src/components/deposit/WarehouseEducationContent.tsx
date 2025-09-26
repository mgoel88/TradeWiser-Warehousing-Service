import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Thermometer, 
  Scale, 
  FlaskConical, 
  Camera, 
  FileCheck2, 
  ShieldCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WarehouseEducationContentProps {
  currentStage: string;
}

const WAREHOUSE_OPERATIONS = {
  'arrived_at_warehouse': {
    title: 'Arrival & Reception',
    icon: Building2,
    color: 'blue',
    duration: '15-30 minutes',
    description: 'Your commodity is being received and documented at the warehouse facility',
    processes: [
      { 
        icon: Scale, 
        name: 'Weight Verification', 
        detail: 'Commodity is weighed on certified scales to verify quantity accuracy' 
      },
      { 
        icon: FileCheck2, 
        name: 'Documentation Check', 
        detail: 'Transport documents and delivery notes are verified and recorded' 
      },
      { 
        icon: Camera, 
        name: 'Initial Photography', 
        detail: 'Photos taken for quality documentation and insurance purposes' 
      },
      { 
        icon: Users, 
        name: 'Staff Assignment', 
        detail: 'Quality control team assigned for your specific commodity batch' 
      }
    ],
    facilities: [
      'Certified weighbridge with digital recording',
      'CCTV monitoring of all receiving areas',
      'Temperature-controlled unloading bays',
      'Dedicated staff for commodity handling'
    ],
    timeline: 'Typically completed within 30 minutes of arrival'
  },
  'pre_cleaning': {
    title: 'Cleaning & Preparation',
    icon: ShieldCheck,
    color: 'orange',
    duration: '1-2 hours',
    description: 'Commodity undergoes cleaning and preparation for quality assessment',
    processes: [
      { 
        icon: Scale, 
        name: 'Foreign Matter Removal', 
        detail: 'Stones, dirt, and other foreign materials are mechanically separated' 
      },
      { 
        icon: FlaskConical, 
        name: 'Moisture Testing', 
        detail: 'Initial moisture content testing to determine storage requirements' 
      },
      { 
        icon: ShieldCheck, 
        name: 'Pest Inspection', 
        detail: 'Visual inspection for pest damage and contamination' 
      },
      { 
        icon: FileCheck2, 
        name: 'Batch Segregation', 
        detail: 'Commodity separated into uniform quality batches' 
      }
    ],
    facilities: [
      'Mechanical cleaning equipment (aspirators, screens)',
      'Moisture testing laboratories',
      'Separate storage bins for different quality grades',
      'Pest control monitoring systems'
    ],
    timeline: 'Process duration depends on commodity type and quantity'
  },
  'quality_assessment': {
    title: 'Quality Testing & Grading',
    icon: FlaskConical,
    color: 'green',
    duration: '2-4 hours',
    description: 'Comprehensive quality analysis and grade determination',
    processes: [
      { 
        icon: FlaskConical, 
        name: 'Laboratory Testing', 
        detail: 'Detailed analysis of protein, moisture, oil content, and other parameters' 
      },
      { 
        icon: Camera, 
        name: 'Visual Grading', 
        detail: 'Expert visual assessment for color, texture, and physical defects' 
      },
      { 
        icon: Scale, 
        name: 'Test Weight Analysis', 
        detail: 'Bulk density and hectoliter weight measurement' 
      },
      { 
        icon: FileCheck2, 
        name: 'Grade Certification', 
        detail: 'Official grade certificate issued based on testing results' 
      }
    ],
    facilities: [
      'Accredited testing laboratory (NABL certified)',
      'Modern analytical equipment (NIR, protein analyzers)',
      'Climate-controlled testing environment',
      'Digital record keeping and reporting systems'
    ],
    timeline: 'Results available within 4 hours of testing initiation'
  },
  'ewr_generation': {
    title: 'Receipt Generation',
    icon: FileCheck2,
    color: 'purple',
    duration: '5-10 minutes',
    description: 'Electronic Warehouse Receipt created and blockchain verified',
    processes: [
      { 
        icon: FileCheck2, 
        name: 'Data Compilation', 
        detail: 'All quality and quantity data compiled into receipt format' 
      },
      { 
        icon: ShieldCheck, 
        name: 'Digital Signing', 
        detail: 'Receipt digitally signed by authorized warehouse manager' 
      },
      { 
        icon: Camera, 
        name: 'Blockchain Recording', 
        detail: 'Receipt hash recorded on blockchain for immutable verification' 
      },
      { 
        icon: Users, 
        name: 'Notification Dispatch', 
        detail: 'SMS and email notifications sent to commodity owner' 
      }
    ],
    facilities: [
      'Secure digital signature infrastructure',
      'Blockchain integration systems',
      'Automated notification systems',
      '24/7 customer service support'
    ],
    timeline: 'Receipt available immediately upon completion'
  }
};

export default function WarehouseEducationContent({ currentStage }: WarehouseEducationContentProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([currentStage]));

  const toggleSection = (stage: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedSections(newExpanded);
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-gray-50 border-gray-200',
      orange: isActive ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-gray-50 border-gray-200',
      green: isActive ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200',
      purple: isActive ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-gray-50 border-gray-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getBadgeColor = (color: string, isActive: boolean): "default" | "destructive" | "secondary" | "outline" => {
    if (!isActive) return 'secondary';
    const colors: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      blue: 'default',
      orange: 'secondary',
      green: 'default',
      purple: 'default',
    };
    return colors[color] || 'default';
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
        <h2 className="font-semibold text-lg mb-2 flex items-center justify-center">
          <Building2 className="h-5 w-5 mr-2" />
          What's Happening at the Warehouse
        </h2>
        <p className="text-sm text-muted-foreground">
          Learn about the professional processes your commodity goes through at our certified storage facilities
        </p>
      </div>

      {Object.entries(WAREHOUSE_OPERATIONS).map(([stage, operation]) => {
        const isCurrentStage = stage === currentStage;
        const isExpanded = expandedSections.has(stage);
        const IconComponent = operation.icon;

        return (
          <Card 
            key={stage} 
            className={`transition-all duration-300 ${getColorClasses(operation.color, isCurrentStage)}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    isCurrentStage 
                      ? `bg-${operation.color}-100` 
                      : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-4 w-4 ${
                      isCurrentStage 
                        ? `text-${operation.color}-600` 
                        : 'text-gray-500'
                    }`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {operation.title}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Duration: {operation.duration}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isCurrentStage && (
                    <Badge 
                      variant={getBadgeColor(operation.color, true)}
                      className="text-xs animate-pulse"
                    >
                      <div className="h-2 w-2 rounded-full bg-current mr-1"></div>
                      ACTIVE
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(stage)}
                    className="h-7 w-7 p-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-4 animate-in slide-in-from-top duration-300">
                <p className="text-sm text-muted-foreground">
                  {operation.description}
                </p>

                <Separator />

                {/* Processes */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    Key Processes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {operation.processes.map((process) => (
                      <div key={process.name} className="flex items-start space-x-3 p-3 bg-white rounded border">
                        <process.icon className="h-4 w-4 mt-0.5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium text-xs">{process.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{process.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Facilities */}
                <div>
                  <h4 className="font-medium text-sm mb-3 flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Facility Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {operation.facilities.map((facility, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="bg-white p-3 rounded border">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Timeline</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {operation.timeline}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* General Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-dashed">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-blue-900 mb-2">
                Quality Assurance & Transparency
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• All warehouses are WDRA (Warehousing Development Regulatory Authority) registered</li>
                <li>• Quality testing follows AGMARK standards and FCI specifications</li>
                <li>• Real-time CCTV monitoring available 24/7 through customer portal</li>
                <li>• Insurance coverage included for stored commodities up to declared value</li>
                <li>• Climate-controlled storage maintains optimal conditions for your commodity</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}