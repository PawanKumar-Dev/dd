'use client';

import { Mail, Phone, MapPin } from 'lucide-react';
import Card from './Card';

interface ContactInfoProps {
  className?: string;
}

export default function ContactInfo({ className = '' }: ContactInfoProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h3>
        <p className="text-gray-600 mb-8">
          Have questions about our domain management services? We'd love to hear from you.
          Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="flex items-start">
          <div className="bg-primary-100 rounded-full p-3 mr-4">
            <Phone className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Call Us</h4>
            <p className="text-gray-600 mb-1">+91-777-888-9674</p>
            <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM IST</p>
          </div>
        </Card>

        <Card className="flex items-start">
          <div className="bg-primary-100 rounded-full p-3 mr-4">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Email Us</h4>
            <p className="text-gray-600 mb-1">sales@exceltechnologies.in</p>
            <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
          </div>
        </Card>

        <Card className="flex items-start">
          <div className="bg-primary-100 rounded-full p-3 mr-4">
            <MapPin className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-1">Visit Us</h4>
            <p className="text-gray-600 mb-1">B9-54, Rohini, Sector-5</p>
            <p className="text-sm text-gray-500">Delhi, India</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
