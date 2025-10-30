'use client';

import { useState, useEffect } from 'react';
import { Award, Shield, Globe, CheckCircle, Target, Lightbulb, Users, TrendingDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import Section from '@/components/Section';
import FeatureCard from '@/components/FeatureCard';
import StatsCard from '@/components/StatsCard';
import Footer from '@/components/Footer';
import { SkeletonHero, SkeletonSection, SkeletonStats } from '@/components/skeletons';
import SkeletonBase from '@/components/skeletons/SkeletonBase';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function AboutPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookieValue('token') || localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        // Error parsing user data
      }
    }

    // Simulate loading time for smooth skeleton transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation user={user} />
        
        {/* Hero Skeleton */}
        <SkeletonHero />
        
        {/* Mission Skeleton */}
        <Section background="white">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-4">
              <SkeletonBase className="h-16 w-16 rounded-full" />
            </div>
            <SkeletonBase className="h-8 w-64 mx-auto" />
            <div className="space-y-3">
              <SkeletonBase className="h-4 w-full" />
              <SkeletonBase className="h-4 w-5/6 mx-auto" />
              <SkeletonBase className="h-4 w-4/6 mx-auto" />
            </div>
          </div>
        </Section>
        
        {/* Values Skeleton */}
        <Section background="gray">
          <SkeletonSection title cards={3} columns={3} />
        </Section>
        
        {/* Stats Skeleton */}
        <Section background="white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
            </div>
            <SkeletonStats />
          </div>
        </Section>
        
        {/* Why Choose Us Skeleton */}
        <Section background="gray">
          <SkeletonSection title cards={6} columns={3} />
        </Section>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation user={user} />

      <HeroSection
        variant="secondary"
        background="image"
        backgroundImage="/about-us-hero.jpg"
        overlayOpacity={0.8}
        className="min-h-[50vh] sm:min-h-[60vh] flex items-center py-6 sm:py-8"
      >
        <div className="text-center px-4">
          <div className="flex justify-center mb-3 sm:mb-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 sm:p-4 border border-white border-opacity-30">
              <Award className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-3 sm:mb-6 drop-shadow-lg">
            About Excel Technologies
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto drop-shadow-md px-2">
            Leading the way in domain management solutions with innovation, security, and exceptional service.
          </p>
        </div>
      </HeroSection>

      <Section background="white" padding="md">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Our Story
          </h2>
          <p className="text-lg text-gray-600 mb-4 sm:mb-8">
            Excel Technologies was founded with a simple mission: to make domain management
            simple, secure, and accessible for businesses of all sizes. We recognized the
            need for a comprehensive platform that integrates seamlessly with industry-leading
            services while providing an intuitive user experience.
          </p>
          <p className="text-lg text-gray-600">
            Today, we're proud to serve thousands of customers across India, helping them
            manage their digital presence with confidence and ease.
          </p>
        </div>
      </Section>

      <Section background="gray" padding="md">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Our Mission & Vision
          </h2>
          <p className="text-xl text-gray-600">
            Driving innovation in domain management
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Our Mission</h3>
            <p className="text-lg text-gray-600">
              To provide cutting-edge domain management solutions that empower businesses
              to establish and maintain their digital presence with confidence, security,
              and ease of use.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Lightbulb className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Our Vision</h3>
            <p className="text-lg text-gray-600">
              To become the global leader in domain management technology, setting new
              standards for security, reliability, and customer satisfaction in the
              digital infrastructure space.
            </p>
          </div>
        </div>
      </Section>

      <Section background="white" padding="md">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            What Sets Us Apart
          </h2>
          <p className="text-xl text-gray-600">
            Key features that make us the preferred choice
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          <FeatureCard
            icon={<TrendingDown className="h-8 w-8" />}
            title="Best Domain Prices"
            description="Competitive pricing with transparent costs, no hidden fees, and special offers for bulk registrations"
          />
          <FeatureCard
            icon={<Globe className="h-8 w-8" />}
            title="Domain Integration"
            description="Seamless integration with domain services for comprehensive domain operations in India"
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Expert Support"
            description="24/7 customer support from our team of domain management experts"
          />
        </div>
      </Section>



      <Footer />
    </div>
  );
}