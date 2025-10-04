'use client';

import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'primary' | 'dark';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Section({
  children,
  className = '',
  background = 'white',
  padding = 'lg'
}: SectionProps) {
  const backgroundClasses = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary-50',
    dark: 'bg-gray-900 text-white'
  };

  const paddingClasses = {
    sm: 'py-6 sm:py-8',
    md: 'py-8 sm:py-12',
    lg: 'py-12 sm:py-16',
    xl: 'py-16 sm:py-20'
  };

  return (
    <section className={`${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
}
