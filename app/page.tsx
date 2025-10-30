'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Shield, CreditCard, Globe, Star, Users, Clock, Smartphone, Headphones, Mail, Phone, MapPin, ArrowRight, CheckCircle, TrendingUp, Database, Server, Wifi, ChevronDown, TrendingDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import Section from '@/components/Section';
import FeatureCard from '@/components/FeatureCard';
import StatsCard from '@/components/StatsCard';
import DomainSearch from '@/components/DomainSearch';
import ClientOnly from '@/components/ClientOnly';
import Footer from '@/components/Footer';
import { SkeletonHero, SkeletonSection, SkeletonStats } from '@/components/skeletons';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

export default function HomePage() {
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
      <div className="min-h-screen" style={{ backgroundColor: 'var(--google-bg-secondary)' }}>
        <Navigation user={user} />
        
        {/* Hero Skeleton */}
        <SkeletonHero />
        
        {/* Service Description Skeleton */}
        <Section background="white" className="border-b-2 border-primary-100">
          <SkeletonSection title cards={4} columns={2} />
        </Section>
        
        {/* Features Skeleton */}
        <Section background="white">
          <SkeletonSection title cards={6} columns={3} />
        </Section>
        
        {/* Stats Skeleton */}
        <Section background="gray">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4 animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
            </div>
            <SkeletonStats />
          </div>
        </Section>
        
        {/* How It Works Skeleton */}
        <Section background="white">
          <SkeletonSection title cards={3} columns={3} />
        </Section>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--google-bg-secondary)' }}>
      <Navigation user={user} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-12 sm:pt-16"
      >
        <HeroSection
          background="image"
          backgroundImage="/domain-1.jpeg"
          overlayOpacity={0.9}
          className="min-h-[60vh] sm:min-h-[70vh] flex items-center py-8 sm:py-12"
        >
          <div className="text-center w-full px-2 sm:px-4">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 sm:p-3 border-2 border-white border-opacity-30">
                <Globe className="h-8 w-8 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-2xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-3 md:mb-4 drop-shadow-lg px-2 leading-tight" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
              Buy & Manage Your Domain Names
            </h1>
            <p className="text-sm sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-4 md:mb-6 text-white drop-shadow-md max-w-3xl mx-auto px-3 leading-snug" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
              Search, purchase, and manage domain names with complete DNS control
            </p>

            {/* Domain Search Feature */}
            <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-2 sm:p-2 border-2 border-white border-opacity-30 w-full max-w-full sm:max-w-6xl mx-auto shadow-xl">
              <DomainSearch className="mb-0 sm:mb-4" />
            </div>

          </div>
        </HeroSection>

        {/* Clear Service Description Section */}
        <Section background="white" className="border-b-2 border-primary-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
                Domain Registration & Management Services
              </h2>
              <p className="text-lg sm:text-xl text-gray-700 leading-relaxed px-4" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
                Excel Technologies is a professional <strong>domain name registration and management platform</strong> that helps individuals and businesses secure their online identity.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 px-4">
              <div className="bg-primary-50 rounded-lg p-6 border-l-4 border-primary-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                  Domain Buying
                </h3>
                <p className="text-gray-700">
                  Purchase new domain names from our extensive catalog of available domains across 100+ extensions including .com, .in, .org, .net, and more with instant registration.
                </p>
              </div>

              <div className="bg-primary-50 rounded-lg p-6 border-l-4 border-primary-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                  Domain Management
                </h3>
                <p className="text-gray-700">
                  Manage all your domains from a single dashboard - configure DNS settings, update nameservers, enable WHOIS privacy, transfer domains, and set up auto-renewal.
                </p>
              </div>

              <div className="bg-primary-50 rounded-lg p-6 border-l-4 border-primary-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                  DNS Configuration
                </h3>
                <p className="text-gray-700">
                  Full DNS management tools to connect your domain to web hosting, email services, and other platforms with A records, CNAME, MX records, and TXT records.
                </p>
              </div>

              <div className="bg-primary-50 rounded-lg p-6 border-l-4 border-primary-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary-600" />
                  Domain Renewals
                </h3>
                <p className="text-gray-700">
                  Keep your domains active with easy renewal options, automatic renewal settings, and timely expiration reminders to prevent domain loss.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section background="white">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-primary-100 rounded-full p-2 sm:p-3">
                <Star className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4" style={{ fontFamily: 'Google Sans, system-ui, sans-serif' }}>
              Complete Domain Services Platform
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4" style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}>
              From domain registration to full DNS management - we provide everything you need to establish and maintain your online presence with professional-grade tools and support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <FeatureCard
              icon={<Search className="h-8 w-8" />}
              title="Domain Registration"
              description="Search and register available domains instantly across .com, .in, .org, and 100+ TLDs with transparent pricing and real-time availability"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Domain Management"
              description="Complete control panel to manage your domains - update DNS records, configure nameservers, enable privacy protection, and renew domains"
            />
            <FeatureCard
              icon={<CreditCard className="h-8 w-8" />}
              title="Secure Purchase"
              description="Buy domains securely with Razorpay payment gateway - supports credit/debit cards, UPI, net banking, and digital wallets"
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="DNS & Hosting Setup"
              description="Advanced DNS management tools with intuitive interface - configure A records, CNAME, MX records, and connect your domain to any hosting"
            />
            <FeatureCard
              icon={<Headphones className="h-8 w-8" />}
              title="24/7 Expert Support"
              description="Get help anytime with our dedicated support team via email, phone, or chat for domain setup, transfers, and technical assistance"
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="Auto-Renewal Options"
              description="Never lose your domain - enable auto-renewal, get expiry reminders, and manage multiple domains from one dashboard"
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
              Trusted by thousands of customers across India
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
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
              How Our Domain Services Work
            </h3>
            <p className="text-xl text-gray-600">
              Simple, secure, and professional domain purchasing and management process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto -mt-2 mb-3 text-sm font-bold">1</div>
              <h4 className="text-xl font-semibold mb-2">Search & Select Domain</h4>
              <p className="text-gray-600">
                Use our domain search tool to find available domain names. Browse through multiple extensions (.com, .in, .org, etc.) with real-time availability and pricing
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-10 w-10 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto -mt-2 mb-3 text-sm font-bold">2</div>
              <h4 className="text-xl font-semibold mb-2">Purchase Securely</h4>
              <p className="text-gray-600">
                Complete your domain purchase through our secure Razorpay payment system. Accept all major payment methods including cards, UPI, and net banking
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-10 w-10 text-primary-600" />
              </div>
              <div className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto -mt-2 mb-3 text-sm font-bold">3</div>
              <h4 className="text-xl font-semibold mb-2">Manage & Configure</h4>
              <p className="text-gray-600">
                Access your domain dashboard to manage DNS settings, configure nameservers, enable privacy protection, set up email, and renew your domains
              </p>
            </div>
          </div>
        </Section>


        <Footer />
      </motion.div>
    </div>
  );
}