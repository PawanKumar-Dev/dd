'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-gray-200'
  };

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow duration-300' : '';

  return (
    <div className={`rounded-lg ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}
