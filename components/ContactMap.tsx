'use client';

import { MapPin, Navigation } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ContactMapProps {
  className?: string;
}

export default function ContactMap({ className = '' }: ContactMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Company coordinates for Rohini, Delhi (approximate location)
  const companyCoords = [28.7406, 77.0884]; // Latitude, Longitude for Rohini, Delhi
  const companyAddress = "B9-54, Rohini, Sector-5, Delhi, India";
  const encodedAddress = encodeURIComponent(companyAddress);

  useEffect(() => {
    // Dynamically import Leaflet only on client side
    const loadMap = async () => {
      if (typeof window === 'undefined' || !mapRef.current) return;

      try {
        // Import Leaflet dynamically
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix for default markers in Leaflet with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map instance
        const map = L.map(mapRef.current).setView(companyCoords, 15);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add custom marker
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              background: #3B82F6;
              width: 30px;
              height: 30px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              border: 3px solid white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                transform: rotate(45deg);
                color: white;
                font-size: 16px;
                font-weight: bold;
              ">E</div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        });

        // Add marker to map
        const marker = L.marker(companyCoords, { icon: customIcon }).addTo(map);

        // Add popup to marker
        marker.bindPopup(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1F2937;">Excel Technologies</h3>
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
              B9-54, Rohini, Sector-5<br>
              Delhi, India
            </p>
            <a href="https://www.openstreetmap.org/directions?engine=osrm_car&route=${companyCoords[0]},${companyCoords[1]}" 
               target="_blank" 
               style="color: #3B82F6; text-decoration: none; font-size: 14px; font-weight: 500;">
              Get Directions →
            </a>
          </div>
        `);

        // Store map instance for cleanup
        mapInstanceRef.current = map;

      } catch (error) {
        console.error('Error loading map:', error);
        // Fallback to static map if Leaflet fails to load
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f3f4f6;
              color: #6b7280;
              font-size: 14px;
            ">
              <div style="text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                <div>Map loading...</div>
              </div>
            </div>
          `;
        }
      }
    };

    loadMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
          <div
            ref={mapRef}
            className="w-full h-full"
            style={{ minHeight: '384px' }}
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
                  href={`https://www.openstreetmap.org/directions?engine=osrm_car&route=${companyCoords[0]},${companyCoords[1]}`}
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
      </div>
    </div>
  );
}
