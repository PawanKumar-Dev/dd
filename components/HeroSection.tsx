'use client';

import { ReactNode } from 'react';

interface HeroSectionProps {
  children: ReactNode;
  className?: string;
  background?: 'gradient' | 'solid' | 'image';
  variant?: 'primary' | 'secondary' | 'dark';
}

export default function HeroSection({
  children,
  className = '',
  background = 'gradient',
  variant = 'primary'
}: HeroSectionProps) {
  const backgroundClasses = {
    gradient: variant === 'primary'
      ? 'bg-gradient-to-r from-primary-600 to-primary-800'
      : variant === 'secondary'
        ? 'bg-gradient-to-r from-gray-600 to-gray-800'
        : 'bg-gradient-to-r from-gray-800 to-gray-900',
    solid: variant === 'primary'
      ? 'bg-primary-600'
      : variant === 'secondary'
        ? 'bg-gray-600'
        : 'bg-gray-800',
    image: 'bg-cover bg-center bg-no-repeat'
  };

  return (
    <section className={`${backgroundClasses[background]} text-white relative overflow-hidden pt-12 sm:pt-16 ${className}`}>
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16 relative">
        {children}
      </div>
    </section>
  );
}
