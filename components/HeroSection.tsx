'use client';

import { ReactNode } from 'react';

interface HeroSectionProps {
  children: ReactNode;
  className?: string;
  background?: 'gradient' | 'solid' | 'image';
  variant?: 'primary' | 'secondary' | 'dark';
  backgroundImage?: string;
  overlayOpacity?: number;
}

export default function HeroSection({
  children,
  className = '',
  background = 'gradient',
  variant = 'primary',
  backgroundImage,
  overlayOpacity = 0.6
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

  const backgroundStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {};

  return (
    <section
      className={`${backgroundClasses[background]} text-white relative overflow-hidden pt-12 sm:pt-16 ${className}`}
      style={backgroundStyle}
    >
      {/* Blue overlay for better text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: variant === 'primary'
            ? `linear-gradient(135deg, rgba(30, 64, 175, ${overlayOpacity}) 0%, rgba(29, 78, 216, ${overlayOpacity}) 100%)`
            : variant === 'secondary'
              ? `linear-gradient(135deg, rgba(75, 85, 99, ${overlayOpacity}) 0%, rgba(31, 41, 55, ${overlayOpacity}) 100%)`
              : `linear-gradient(135deg, rgba(31, 41, 55, ${overlayOpacity}) 0%, rgba(17, 24, 39, ${overlayOpacity}) 100%)`
        }}
      ></div>

      {/* Subtle pattern overlay for texture */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)`
      }}></div>

      <div className="max-w-[120rem] mx-auto px-1 sm:px-2 lg:px-3 py-8 sm:py-12 lg:py-16 relative z-10">
        {children}
      </div>
    </section>
  );
}
