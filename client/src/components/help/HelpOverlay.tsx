import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, HelpCircle, ChevronLeft, ChevronRight, Lightbulb, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpStep {
  id: string;
  title: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  stage?: string;
  estimatedTime?: string;
  tips?: string[];
  warnings?: string[];
}

interface HelpOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage?: string;
  processType?: string;
}

const depositSteps: HelpStep[] = [
  {
    id: 'pickup_scheduled',
    title: 'Pickup Scheduling',
    description: 'Your commodity deposit request has been confirmed and pickup is being arranged.',
    details: [
      'A specialized agricultural transport vehicle will be assigned',
      'You will receive pickup location and timing details',
      'Ensure commodity is properly prepared for transport',
      'Keep necessary documentation ready'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '2-4 hours',
    tips: [
      'Prepare moisture samples if required for your commodity type',
      'Have quality certificates ready from previous storage',
      'Ensure access road is suitable for transport vehicles'
    ],
    warnings: [
      'Delays may occur due to weather conditions',
      'Additional quality checks may extend pickup time'
    ]
  },
  {
    id: 'pickup_assigned',
    title: 'Vehicle Assignment',
    description: 'A transport vehicle has been assigned and driver details are available.',
    details: [
      'Vehicle details and driver contact information provided',
      'Real-time tracking becomes available',
      'Estimated arrival time is calculated',
      'Direct communication with driver enabled'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '1-2 hours',
    tips: [
      'Contact driver directly for any special instructions',
      'Prepare weighing area if self-delivery is chosen',
      'Have identity documents ready for verification'
    ]
  },
  {
    id: 'pickup_in_progress',
    title: 'Pickup in Progress',
    description: 'The assigned vehicle is en route to your location for commodity pickup.',
    details: [
      'Vehicle is tracked in real-time during transit',
      'Driver will call upon arrival',
      'Initial quantity verification at pickup point',
      'Loading process with care handling protocols'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '30-60 minutes',
    tips: [
      'Be available at the specified pickup time',
      'Assist with loading if safe to do so',
      'Verify quantity counts with driver'
    ],
    warnings: [
      'Weather conditions may affect pickup timing',
      'Quality issues found during pickup may require discussion'
    ]
  },
  {
    id: 'arrived_at_warehouse',
    title: 'Warehouse Arrival',
    description: 'Your commodity has arrived at the designated warehouse facility.',
    details: [
      'Commodity is unloaded at secure warehouse dock',
      'Initial receipt and documentation process',
      'Batch identification tags are assigned',
      'Commodity moves to pre-cleaning area'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '45-90 minutes',
    tips: [
      'You will receive arrival confirmation notification',
      'Warehouse staff handle all unloading procedures',
      'Initial quality observations are recorded'
    ]
  },
  {
    id: 'pre_cleaning',
    title: 'Pre-cleaning & Processing',
    description: 'Initial cleaning and processing of your commodity to prepare for quality assessment.',
    details: [
      'Removal of foreign matter and debris',
      'Basic sorting and grading preparation',
      'Moisture content stabilization if needed',
      'Sample preparation for quality testing'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '2-4 hours',
    tips: [
      'Advanced cleaning improves final grading',
      'Multiple cleaning passes ensure better quality',
      'Specialized equipment handles different commodity types'
    ],
    warnings: [
      'High moisture content may extend processing time',
      'Excessive foreign matter may affect final grade'
    ]
  },
  {
    id: 'quality_assessment',
    title: 'Quality Assessment',
    description: 'Comprehensive quality parameters assessment using advanced testing methods.',
    details: [
      'Moisture content analysis using calibrated equipment',
      'Foreign matter percentage calculation',
      'Grain size and uniformity evaluation',
      'Visual AI scanning for defects and quality markers',
      'Laboratory testing for additional parameters',
      'Final quality grade determination'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '3-6 hours',
    tips: [
      'Multiple samples ensure accurate assessment',
      'AI technology provides consistent quality evaluation',
      'Results are compared with industry standards'
    ],
    warnings: [
      'Poor quality may result in lower grade classification',
      'Additional testing time required for borderline cases'
    ]
  },
  {
    id: 'pricing_calculated',
    title: 'Market Pricing',
    description: 'Current market pricing is calculated based on quality grade and market conditions.',
    details: [
      'Real-time market data integration',
      'Quality grade premium/discount application',
      'Location-based pricing adjustments',
      'Final valuation for warehouse receipt'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '15-30 minutes',
    tips: [
      'Pricing reflects current market conditions',
      'Higher quality grades receive premium pricing',
      'Pricing is locked in for warehouse receipt'
    ]
  },
  {
    id: 'ewr_generation',
    title: 'Electronic Warehouse Receipt Generation',
    description: 'Your electronic warehouse receipt (eWR) is being generated with blockchain verification.',
    details: [
      'Blockchain transaction creation for ownership proof',
      'Digital certificate generation with security features',
      'Smart contract deployment for future transactions',
      'Secure storage of all quality and quantity data',
      'Integration with lending and trading platforms'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '30-45 minutes',
    tips: [
      'eWR serves as legal proof of ownership',
      'Can be used as collateral for commodity financing',
      'Transferable through secure blockchain transactions',
      'All quality parameters permanently recorded'
    ],
    warnings: [
      'Blockchain network congestion may extend generation time',
      'Ensure secure storage of eWR access credentials'
    ]
  },
  {
    id: 'deposit_overview',
    title: 'Commodity Deposit Process Overview',
    description: 'Get started with depositing your agricultural commodities in our secure warehouse network.',
    details: [
      'Secure storage with advanced monitoring systems',
      'Professional quality assessment and grading',
      'Real-time tracking throughout the entire process',
      'Blockchain-verified electronic warehouse receipts',
      'Access to commodity financing and trading platforms'
    ],
    icon: <HelpCircle className="h-5 w-5" />,
    estimatedTime: '1-3 days (full process)',
    tips: [
      'Ensure you have proper documentation ready',
      'Choose warehouses close to your location to reduce transport costs',
      'Higher quality commodities receive better pricing and financing terms',
      'Consider market timing for optimal commodity pricing'
    ]
  }
];

export default function HelpOverlay({ isOpen, onClose, currentStage, processType = 'deposit' }: HelpOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSteps] = useState(depositSteps);

  useEffect(() => {
    if (currentStage && isOpen) {
      const stageIndex = activeSteps.findIndex(step => step.id === currentStage);
      if (stageIndex !== -1) {
        setCurrentStepIndex(stageIndex);
      }
    }
  }, [currentStage, isOpen, activeSteps]);

  if (!isOpen) return null;

  const currentStep = activeSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              {currentStep.icon}
            </div>
            <div>
              <CardTitle className="text-xl">{currentStep.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Step {currentStepIndex + 1} of {activeSteps.length}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / activeSteps.length) * 100}%` }}
            />
          </div>
          
          {/* Current stage indicator */}
          {currentStage === currentStep.id && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Current Stage
            </Badge>
          )}
          
          {/* Estimated time */}
          {currentStep.estimatedTime && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Estimated time: {currentStep.estimatedTime}</span>
            </div>
          )}
          
          {/* Description */}
          <p className="text-base leading-relaxed">{currentStep.description}</p>
          
          {/* Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              What Happens
            </h4>
            <ul className="space-y-2">
              {currentStep.details.map((detail, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Tips */}
          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-green-700 flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Helpful Tips</span>
              </h4>
              <ul className="space-y-2">
                {currentStep.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-green-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Warnings */}
          {currentStep.warnings && currentStep.warnings.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-amber-700 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span>Important Notes</span>
              </h4>
              <ul className="space-y-2">
                {currentStep.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-amber-800">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={isFirstStep}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentStepIndex + 1} / {activeSteps.length}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentStepIndex(Math.min(activeSteps.length - 1, currentStepIndex + 1))}
              disabled={isLastStep}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Need additional help? Contact our support team for personalized assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}