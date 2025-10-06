'use client';

import { ReactNode } from 'react';
import Card from './Card';

interface StatsCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export default function StatsCard({
  icon,
  value,
  label,
  trend,
  trendValue,
  className = ''
}: StatsCardProps) {
  const trendClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <Card className={`text-center ${className}`}>
      <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
        <span className="text-primary-600">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      {trend && trendValue && (
        <div className={`text-xs ${trendClasses[trend]}`}>
          {trendIcons[trend]} {trendValue}
        </div>
      )}
    </Card>
  );
}
