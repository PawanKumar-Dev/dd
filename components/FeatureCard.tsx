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
      <div className="bg-primary-100 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center mx-auto mb-2 sm:mb-3">
        <span className="text-primary-600">{icon}</span>
      </div>
      <h4 className="text-lg sm:text-xl font-semibold mb-2" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>{title}</h4>
      <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>{description}</p>
    </Card>
  );
}
