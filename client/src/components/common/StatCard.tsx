import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  change: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor: string;
  iconColor: string;
}

export default function StatCard({ title, value, icon, change, iconBgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-headings font-bold mono">{value}</p>
        </div>
        <div className={`rounded-full ${iconBgColor} p-3`}>
          <div className={`h-6 w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center text-sm">
        <span className={change.isPositive ? "text-success font-medium" : "text-warning font-medium"}>
          {change.value}
        </span>
        <span className="ml-1 text-gray-500">from last month</span>
      </div>
    </div>
  );
}
