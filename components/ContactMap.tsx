'use client';

import { MapPin, Navigation } from 'lucide-react';

interface ContactMapProps {
  className?: string;
}

export default function ContactMap({ className = '' }: ContactMapProps) {
  const companyAddress = "B9-54, Rohini, Sector-5, Delhi, India";
  const encodedAddress = encodeURIComponent(companyAddress);

  return (
    <div className={`w-full ${className}`}>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3">
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Us</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Visit our office in Delhi. We're located in the heart of Rohini, easily accessible by public transport.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        {/* Map Container */}
        <div className="relative h-96 w-full">
          <iframe
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWWgUfXz8z8z8&q=${encodedAddress}&zoom=15&maptype=roadmap`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Excel Technologies Office Location"
            className="w-full h-full"
          />

          {/* Map Overlay with Company Info */}
          <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                <Navigation className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Excel Technologies</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  B9-54, Rohini, Sector-5<br />
                  Delhi, India
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="p-6 bg-gray-50">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Office Address</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>B9-54, Rohini, Sector-5</p>
                <p>Delhi, India</p>
                <p className="text-xs text-gray-500 mt-3">
                  📍 Near Rohini Metro Station
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Business Hours</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
                <p className="text-xs text-gray-500 mt-3">
                  ⏰ IST (Indian Standard Time)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Navigation className="h-4 w-4" />
              <span>Get Directions</span>
            </a>
            <a
              href="tel:+917778889674"
              className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg text-center font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>📞</span>
              <span>Call Now</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
