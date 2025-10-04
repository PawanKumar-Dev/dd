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
      <div className="bg-primary-100 rounded-full w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-3 sm:mb-4">
        <span className="text-primary-600">{icon}</span>
      </div>
      <h4 className="text-lg sm:text-xl font-semibold mb-2" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>{title}</h4>
      <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>{description}</p>
    </Card>
  );
}
