
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Shield, AlertTriangle, TrendingUp } from 'lucide-react';

interface RiskScore {
  score: number;
  factors: {
    commodityRisk: number;
    marketRisk: number;
    locationRisk: number;
    weatherRisk: number;
  };
  recommendations: string[];
}

export function RiskDashboard({ commodityId }: { commodityId: number }) {
  const { data: riskData } = useQuery({
    queryKey: ['risk', commodityId],
    queryFn: async () => {
      const res = await fetch(`/api/risk/score/${commodityId}`);
      return res.json();
    }
  });

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-green-500';
    if (score < 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Overall Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${getRiskColor(riskData?.score || 0)}`}>
            {Math.round((riskData?.score || 0) * 100)}%
          </div>
          <Progress value={(riskData?.score || 0) * 100} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk Factors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskData?.factors && Object.entries(riskData.factors).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`text-sm ${getRiskColor(value)}`}>{Math.round(value * 100)}%</span>
                </div>
                <Progress value={value * 100} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {riskData?.recommendations && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {riskData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
