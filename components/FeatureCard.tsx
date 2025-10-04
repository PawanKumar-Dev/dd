'use client';

import { ReactNode } from 'react';
import Card from './Card';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  hover?: boolean;
}

export default function FeatureCard({
  icon,
  title,
  description,
  className = '',
  hover = true
}: FeatureCardProps) {
  return (
    <Card hover={hover} className={`text-center ${className}`}>
      <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <span className="text-primary-600">{icon}</span>
      </div>
      <h4 className="text-xl font-semibold mb-2">{title}</h4>
      <p className="text-gray-600">{description}</p>
    </Card>
  );
}
