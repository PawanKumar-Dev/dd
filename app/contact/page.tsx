'use client';

import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import Section from '@/components/Section';
import ContactForm from '@/components/ContactForm';
import ContactInfo from '@/components/ContactInfo';
import ContactMap from '@/components/ContactMap';
import Footer from '@/components/Footer';
import { SkeletonHero, SkeletonContact } from '@/components/skeletons';
import SkeletonBase from '@/components/skeletons/SkeletonBase';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function ContactPage() {
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
        
        {/* Contact Form and Info Skeleton */}
        <Section background="white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <SkeletonBase className="h-12 w-12 rounded-full" />
              </div>
              <SkeletonBase className="h-8 w-64 mx-auto mb-4" />
              <div className="space-y-2 max-w-3xl mx-auto">
                <SkeletonBase className="h-4 w-3/4 mx-auto" />
                <SkeletonBase className="h-4 w-2/3 mx-auto" />
              </div>
            </div>
            
            <SkeletonContact />
          </div>
        </Section>
        
        {/* Map Skeleton */}
        <Section background="gray">
          <div className="max-w-6xl mx-auto px-4">
            <SkeletonBase className="h-96 w-full rounded-lg" />
          </div>
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
        backgroundImage="/contact-us-hero.jpeg"
        overlayOpacity={0.8}
        className="min-h-[50vh] sm:min-h-[60vh] flex items-center py-6 sm:py-8"
      >
        <div className="text-center px-4">
          <div className="flex justify-center mb-3 sm:mb-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 sm:p-4 border border-white border-opacity-30">
              <Mail className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-3 sm:mb-6 drop-shadow-lg">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto drop-shadow-md px-2">
            Get in touch with our team. We're here to help with all your domain management needs.
          </p>
        </div>
      </HeroSection>

      <Section background="white" padding="md">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          <ContactInfo />
          <ContactForm />
        </div>
      </Section>

      {/* Map Section */}
      <Section background="gray" padding="md">
        <ContactMap />
      </Section>

      <Footer />
    </div>
  );
}