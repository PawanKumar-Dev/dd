'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Shield, CreditCard, Globe, Star, Users, Clock, Smartphone, Headphones, Mail, Phone, MapPin, ArrowRight, CheckCircle, TrendingUp, Database, Server, Wifi, ChevronDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import Section from '@/components/Section';
import FeatureCard from '@/components/FeatureCard';
import StatsCard from '@/components/StatsCard';
import DomainSearch from '@/components/DomainSearch';
import ClientOnly from '@/components/ClientOnly';
import Footer from '@/components/Footer';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

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
        console.error('Error parsing user data:', error);
      }
    }
  }, []);


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--google-bg-secondary)' }}>
      <Navigation user={user} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-12 sm:pt-16"
      >
        <HeroSection>
          <div className="text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-white bg-opacity-20 rounded-full p-2 sm:p-3">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
              Professional Domain Management
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 text-primary-100 px-4" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
              Excel Technologies - Your trusted partner for domain solutions and digital excellence
            </p>

            {/* Domain Search Feature */}
            <DomainSearch className="mb-4 sm:mb-6" />

          </div>
        </HeroSection>


        <Section background="white">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-primary-100 rounded-full p-2 sm:p-3">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
              Why Choose Excel Technologies?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
              We provide comprehensive domain management solutions with cutting-edge technology
              and exceptional customer support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={<Search className="h-8 w-8" />}
              title="Domain Search"
              description="Search for available domains across multiple TLDs with real-time pricing"
            />
            <FeatureCard
              icon={<CreditCard className="h-8 w-8" />}
              title="Secure Payments"
              description="Safe and secure payment processing with Razorpay integration"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="DNS Management"
              description="Complete DNS management with easy-to-use interface"
            />
          </div>
        </Section>

        <Section background="gray">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-primary-100 rounded-full p-3">
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by thousands of customers worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <StatsCard
              icon={<Globe className="h-6 w-6" />}
              value="10,000+"
              label="Domains Managed"
              trend="up"
              trendValue="15% this month"
            />
            <StatsCard
              icon={<Users className="h-6 w-6" />}
              value="5,000+"
              label="Happy Customers"
              trend="up"
              trendValue="25% this month"
            />
            <StatsCard
              icon={<Shield className="h-6 w-6" />}
              value="99.9%"
              label="Uptime"
              trend="neutral"
              trendValue="Last 30 days"
            />
            <StatsCard
              icon={<Clock className="h-6 w-6" />}
              value="24/7"
              label="Support"
              trend="neutral"
              trendValue="Always available"
            />
          </div>
        </Section>

        <Section background="white">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-4">
                <Database className="h-10 w-10 text-primary-600" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Built with Modern Technology
            </h3>
            <p className="text-xl text-gray-600">
              Leveraging the latest technologies for optimal performance
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Server className="h-10 w-10 text-primary-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Live Domain Services</h4>
              <p className="text-gray-600">
                Real-time domain registration and management services
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-10 w-10 text-primary-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Secure Payments</h4>
              <p className="text-gray-600">
                Razorpay integration ensures secure and reliable payment processing
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-10 w-10 text-primary-600" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Cloud Infrastructure</h4>
              <p className="text-gray-600">
                MongoDB Atlas provides scalable and reliable database services
              </p>
            </div>
          </div>
        </Section>


        <Footer />
      </motion.div>
    </div>
  );
}